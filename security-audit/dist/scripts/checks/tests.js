import { globFiles, grepInFiles } from '../utils.js';
export async function check(projectRoot, _context) {
    const items = [];
    const testFiles = await globFiles(projectRoot, [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '__tests__/**/*.ts',
        '__tests__/**/*.tsx',
        'tests/**/*.ts',
        'tests/**/*.tsx',
        'e2e/**/*.ts',
        'e2e/**/*.spec.ts',
    ]);
    // M1 — Testes de isolamento cross-tenant / cross-workspace
    const crossTenantTests = await grepInFiles(testFiles, /cross.workspace|cross.tenant|isolation|cross_workspace|crossWorkspace/i);
    items.push({
        id: 'M1',
        description: 'Testes de isolamento cross-tenant',
        status: crossTenantTests.length > 0 ? 'pass' : 'fail',
        severity: 'high',
        detail: crossTenantTests.length > 0
            ? `${crossTenantTests.length} teste(s) de isolamento cross-tenant encontrado(s)`
            : 'Nenhum teste de isolamento cross-tenant encontrado',
        remediation: 'Adicione testes que tentam acessar recursos de outro tenant e esperam 403/404',
    });
    // M2 — Testes de escalada de privilégio
    // Also check filenames for privilege escalation test files
    const privilegeTestsByName = testFiles.filter((f) => /privilege|escalation|escalada/i.test(f));
    const privilegeTests = [
        ...privilegeTestsByName.map((f) => ({ file: f, line: 0, text: 'filename match' })),
        ...(await grepInFiles(testFiles, /privilege.escalation|escalation|unauthorized.*access|should.*return.*403|403.*forbidden|access.*denied|NÃO pode|não.*permitido/i)),
    ];
    items.push({
        id: 'M2',
        description: 'Testes de escalada de privilégio',
        status: privilegeTests.length > 0 ? 'pass' : 'fail',
        severity: 'high',
        detail: privilegeTests.length > 0
            ? `${privilegeTests.length} teste(s) de escalada de privilégio encontrado(s)`
            : 'Nenhum teste de escalada de privilégio encontrado',
        remediation: 'Adicione testes que tentam ações não autorizadas e verificam que retornam 403',
    });
    // M3 — Testes de validação de senha
    const passwordTests = await grepInFiles(testFiles, /password.*test|test.*password|senha.*test|test.*senha|weak.*password|strong.*password|zxcvbn/i);
    items.push({
        id: 'M3',
        description: 'Testes de validação de senha',
        status: passwordTests.length > 0 ? 'pass' : 'warn',
        severity: 'medium',
        detail: passwordTests.length > 0
            ? `${passwordTests.length} teste(s) de senha encontrado(s)`
            : 'Nenhum teste de política de senha encontrado',
        remediation: 'Adicione testes para senhas fracas, comuns e com comprimento insuficiente',
    });
    // M4 — Testes de rate limiting
    const rateLimitTests = await grepInFiles(testFiles, /rate.limit|rateLimit|too.many.requests|429|throttle/i);
    items.push({
        id: 'M4',
        description: 'Testes de rate limiting',
        status: rateLimitTests.length > 0 ? 'pass' : 'warn',
        severity: 'medium',
        detail: rateLimitTests.length > 0
            ? `${rateLimitTests.length} teste(s) de rate limiting encontrado(s)`
            : 'Nenhum teste de rate limiting encontrado',
        remediation: 'Adicione testes que simulam excesso de requisições e verificam resposta 429',
    });
    // M5 — Testes de criptografia
    const cryptoTests = await grepInFiles(testFiles, /crypt|encrypt|decrypt|argon2|hash.*password|password.*hash|kdf|cipher/i);
    items.push({
        id: 'M5',
        description: 'Testes de criptografia/decriptografia',
        status: cryptoTests.length > 0 ? 'pass' : 'warn',
        severity: 'medium',
        detail: cryptoTests.length > 0
            ? `${cryptoTests.length} teste(s) de criptografia encontrado(s)`
            : 'Nenhum teste de criptografia encontrado',
        remediation: 'Adicione testes para encrypt/decrypt, derivação de chave e integridade criptográfica',
    });
    // M6 — Testes de CSRF
    const csrfTests = await grepInFiles(testFiles, /csrf|cross.site.request|origin.*check|forged.*request/i);
    items.push({
        id: 'M6',
        description: 'Testes de proteção CSRF',
        status: csrfTests.length > 0 ? 'pass' : 'warn',
        severity: 'medium',
        detail: csrfTests.length > 0
            ? `${csrfTests.length} teste(s) de CSRF encontrado(s)`
            : 'Nenhum teste de CSRF encontrado',
        remediation: 'Adicione testes que enviam requisições sem origin válida e verificam rejeição',
    });
    // M7 — Testes de RLS (Row Level Security)
    const rlsTests = await grepInFiles(testFiles, /\brls\b|row.level.security|policy.*test|test.*policy/i);
    items.push({
        id: 'M7',
        description: 'Testes de RLS (Row Level Security)',
        status: rlsTests.length > 0 ? 'pass' : 'warn',
        severity: 'high',
        detail: rlsTests.length > 0
            ? `${rlsTests.length} teste(s) de RLS encontrado(s)`
            : 'Nenhum teste específico de RLS encontrado',
        remediation: 'Adicione testes que verificam que RLS impede acesso a dados de outros usuários',
    });
    // M8 — Total de arquivos de teste
    items.push({
        id: 'M8',
        description: 'Suíte de testes de segurança existente',
        status: testFiles.length >= 5 ? 'pass' : testFiles.length > 0 ? 'warn' : 'fail',
        severity: 'medium',
        detail: `${testFiles.length} arquivo(s) de teste encontrado(s)`,
        remediation: 'Mantenha cobertura de testes para os controles de segurança críticos',
    });
    return {
        id: 'M',
        name: 'Security Tests',
        items,
    };
}
