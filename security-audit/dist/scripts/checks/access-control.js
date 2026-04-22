import { join } from 'node:path';
import { fileExists, globFiles, grepInFiles, } from '../utils.js';
export async function check(projectRoot, context) {
    const items = [];
    const migrationDir = join(projectRoot, 'supabase', 'migrations');
    const migrationFiles = (await fileExists(migrationDir))
        ? await globFiles(migrationDir, ['**/*.sql'], context)
        : [];
    // A1 — RLS habilitado em todas as tabelas
    // A2 — Funções SECURITY DEFINER
    // A3 — CREATE POLICY com WITH CHECK
    // A4 — Controle de acesso por coluna (column-level security)
    // A7 — Views ou funções RPC para limitar colunas expostas
    const [rlsMatches, secDefMatches, policyMatches, withCheckMatches, columnSecMatches, columnAccessMatches, viewMatches, rpcMatches] = await Promise.all([
        grepInFiles(migrationFiles, /ENABLE ROW LEVEL SECURITY/i, context),
        grepInFiles(migrationFiles, /SECURITY DEFINER/i, context),
        grepInFiles(migrationFiles, /CREATE POLICY/i, context),
        grepInFiles(migrationFiles, /WITH CHECK/i, context),
        grepInFiles(migrationFiles, /GRANT\s+(SELECT\s*\([^)]+\)|UPDATE\s*\([^)]+\))/i, context),
        grepInFiles(migrationFiles, /current_workspace_id|has_vault_access|has_\w+_access/i, context),
        grepInFiles(migrationFiles, /CREATE\s+(OR REPLACE\s+)?VIEW/i, context),
        grepInFiles(migrationFiles, /CREATE\s+(OR REPLACE\s+)?FUNCTION/i, context)
    ]);
    if (migrationFiles.length === 0) {
        items.push({
            id: 'A1',
            description: 'RLS habilitado em todas as tabelas',
            status: 'warn',
            severity: 'critical',
            detail: 'Nenhuma migration SQL encontrada em supabase/migrations/',
        });
    }
    else if (rlsMatches.length === 0) {
        items.push({
            id: 'A1',
            description: 'RLS habilitado em todas as tabelas',
            status: 'fail',
            severity: 'critical',
            detail: 'ENABLE ROW LEVEL SECURITY não encontrado nas migrations',
            remediation: 'Adicione `ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY;` para cada tabela',
        });
    }
    else {
        items.push({
            id: 'A1',
            description: 'RLS habilitado em todas as tabelas',
            status: 'pass',
            severity: 'critical',
            detail: `${rlsMatches.length} ocorrência(s) de ENABLE ROW LEVEL SECURITY encontrada(s)`,
        });
    }
    items.push({
        id: 'A2',
        description: 'Funções SECURITY DEFINER para lógica sensível',
        status: secDefMatches.length > 0 ? 'pass' : 'warn',
        severity: 'critical',
        detail: secDefMatches.length > 0
            ? `${secDefMatches.length} função(ões) SECURITY DEFINER encontrada(s)`
            : 'Nenhuma função SECURITY DEFINER encontrada — verifique se a lógica sensível usa SECURITY DEFINER',
        remediation: 'Use SECURITY DEFINER em funções que precisam de privilégios elevados',
    });
    if (policyMatches.length === 0) {
        items.push({
            id: 'A3',
            description: 'Políticas separadas por operação com WITH CHECK',
            status: 'fail',
            severity: 'critical',
            detail: 'Nenhuma CREATE POLICY encontrada nas migrations',
            remediation: 'Crie policies RLS para SELECT, INSERT, UPDATE, DELETE em cada tabela',
        });
    }
    else {
        items.push({
            id: 'A3',
            description: 'Políticas separadas por operação com WITH CHECK',
            status: withCheckMatches.length > 0 ? 'pass' : 'warn',
            severity: 'critical',
            detail: `${policyMatches.length} política(s) encontrada(s), ${withCheckMatches.length} com WITH CHECK`,
            remediation: 'Adicione WITH CHECK às políticas INSERT/UPDATE para validar dados na escrita',
        });
    }
    const hasColumnAccess = columnSecMatches.length > 0 || columnAccessMatches.length > 0;
    items.push({
        id: 'A4',
        description: 'Controle de acesso por coluna para dados sensíveis',
        status: hasColumnAccess ? 'pass' : 'warn',
        severity: 'high',
        detail: hasColumnAccess
            ? 'Controle de acesso por coluna ou funções de acesso encontradas'
            : 'Nenhum controle de acesso por coluna detectado — verifique manualmente se colunas sensíveis estão protegidas',
        remediation: 'Use GRANT SELECT (col1, col2) ou SECURITY DEFINER para limitar acesso a colunas sensíveis',
    });
    // A5 — Autorização por role nos route handlers
    const routeFiles = await globFiles(projectRoot, [
        'app/api/**/*.ts',
        'app/api/**/*.tsx',
        'pages/api/**/*.ts',
        'src/app/api/**/*.ts',
        'src/pages/api/**/*.ts',
    ], context);
    const authCheckMatches = await grepInFiles(routeFiles, /getUser|getSession|auth\(\)|verifyToken|checkPermission|requireAuth|withAuth|authenticatedUser/i, context);
    items.push({
        id: 'A5',
        description: 'Autorização por role antes de qualquer operação',
        status: routeFiles.length === 0 ? 'warn' : authCheckMatches.length > 0 ? 'pass' : 'fail',
        severity: 'critical',
        detail: routeFiles.length === 0
            ? 'Nenhum route handler encontrado'
            : `${authCheckMatches.length} verificação(ões) de auth encontrada(s) em ${routeFiles.length} route(s)`,
        remediation: 'Verifique autenticação/autorização no início de cada route handler',
    });
    // A6 — Testes de isolamento cross-tenant / cross-workspace
    const testFiles = await globFiles(projectRoot, [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '__tests__/**/*.ts',
    ], context);
    const crossTenantTests = await grepInFiles(testFiles, /cross.workspace|cross.tenant|isolation|privilege.escalation|other.user|outro.usu/i, context);
    items.push({
        id: 'A6',
        description: 'Testes de isolamento cross-tenant com cenários IDOR',
        status: crossTenantTests.length > 0 ? 'pass' : 'fail',
        severity: 'high',
        detail: crossTenantTests.length > 0
            ? `${crossTenantTests.length} teste(s) de isolamento encontrado(s)`
            : 'Nenhum teste de isolamento cross-tenant encontrado',
        remediation: 'Adicione testes que tentam acessar recursos de outro tenant e esperam 403/404',
    });
    items.push({
        id: 'A7',
        description: 'Views ou funções RPC para limitar colunas expostas',
        status: viewMatches.length > 0 || rpcMatches.length > 0 ? 'pass' : 'warn',
        severity: 'medium',
        detail: `${viewMatches.length} view(s) e ${rpcMatches.length} função(ões) RPC encontrada(s)`,
        remediation: 'Use views ou funções RPC para expor apenas as colunas necessárias ao cliente',
    });
    return {
        id: 'A',
        name: 'Access Control (BOLA/IDOR) — Supabase/Postgres',
        items,
    };
}
