import { join } from 'node:path';
import { fileExists, globFiles, grepInFiles, readFileContent } from '../utils.js';
export async function check(projectRoot, _context) {
    const items = [];
    const databaseYmlPath = join(projectRoot, 'config', 'database.yml');
    const databaseYml = await readFileContent(databaseYmlPath);
    const postgresAdapter = Boolean(databaseYml && /adapter:\s*postgresql/i.test(databaseYml));
    items.push({
        id: 'P1',
        description: 'Adapter PostgreSQL configurado no Rails',
        status: postgresAdapter ? 'pass' : 'warn',
        severity: 'high',
        file: (await fileExists(databaseYmlPath)) ? databaseYmlPath : undefined,
        detail: postgresAdapter
            ? 'adapter: postgresql encontrado em config/database.yml'
            : 'Adapter postgresql nao detectado em config/database.yml',
        remediation: 'Verifique o adapter do banco por ambiente em config/database.yml',
    });
    const migrationFiles = await globFiles(projectRoot, ['db/migrate/*.rb', 'db/migrate/**/*.rb']);
    items.push({
        id: 'P2',
        description: 'Migrations versionadas para evolucao de schema',
        status: migrationFiles.length > 0 ? 'pass' : 'fail',
        severity: 'high',
        detail: `${migrationFiles.length} migration(s) encontrada(s)`,
        remediation: 'Garanta migrations versionadas e revisadas para alteracoes de schema',
    });
    const fkUsage = await grepInFiles(migrationFiles, /add_foreign_key|foreign_key:\s*true|t\.references\s+.*foreign_key/i);
    items.push({
        id: 'P3',
        description: 'Uso de foreign keys no schema',
        status: migrationFiles.length === 0 ? 'warn' : fkUsage.length > 0 ? 'pass' : 'warn',
        severity: 'high',
        detail: migrationFiles.length === 0
            ? 'Sem migrations para validar foreign keys'
            : fkUsage.length > 0
                ? `${fkUsage.length} ocorrencia(s) de foreign key detectadas`
                : 'Nao foram encontradas foreign keys explicitas nas migrations',
        remediation: 'Adicione foreign keys para preservar integridade referencial no banco',
    });
    const uniqueIndexes = await grepInFiles(migrationFiles, /add_index\s+.*unique:\s*true|t\.index\s+.*unique:\s*true/i);
    items.push({
        id: 'P4',
        description: 'Indices unicos para evitar duplicacao indevida',
        status: migrationFiles.length === 0 ? 'warn' : uniqueIndexes.length > 0 ? 'pass' : 'warn',
        severity: 'medium',
        detail: migrationFiles.length === 0
            ? 'Sem migrations para validar indices'
            : uniqueIndexes.length > 0
                ? `${uniqueIndexes.length} indice(s) unicos detectados`
                : 'Nenhum indice unico detectado nas migrations analisadas',
        remediation: 'Crie indices unicos para chaves naturais e constraints de negocio criticas',
    });
    const transactionalCodeFiles = await globFiles(projectRoot, [
        'app/services/**/*.rb',
        'app/models/**/*.rb',
        'app/jobs/**/*.rb',
        'lib/**/*.rb',
    ]);
    const transactionUsage = await grepInFiles(transactionalCodeFiles, /ActiveRecord::Base\.transaction|\.transaction\s+do/);
    items.push({
        id: 'P5',
        description: 'Uso de transacoes em fluxos criticos',
        status: transactionUsage.length > 0 ? 'pass' : 'warn',
        severity: 'high',
        detail: transactionUsage.length > 0
            ? `${transactionUsage.length} uso(s) de transacao detectado(s)`
            : 'Nenhuma transacao explicita detectada em services/models/jobs',
        remediation: 'Use transacoes em operacoes multi-escrita para evitar inconsistencias',
    });
    return {
        id: 'P',
        name: 'PostgreSQL for Rails',
        items,
    };
}
