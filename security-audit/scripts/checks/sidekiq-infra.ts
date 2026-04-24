import { join } from 'node:path';
import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { fileExists, globFiles, grepInFiles, readFileContent } from '../utils.js';

export async function check(projectRoot: string, _context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];

  const workerFiles = await globFiles(projectRoot, [
    'app/workers/**/*.rb',
    'app/jobs/**/*.rb',
    'lib/**/*.rb',
  ]);
  const sidekiqConfig = join(projectRoot, 'config', 'sidekiq.yml');
  const hasSidekiqConfig = await fileExists(sidekiqConfig);

  items.push({
    id: 'S1',
    description: 'Workers Sidekiq/Jobs versionados',
    status: workerFiles.length > 0 ? 'pass' : 'warn',
    severity: 'high',
    detail: `${workerFiles.length} arquivo(s) de worker/job encontrado(s)`,
    remediation: 'Centralize jobs em app/workers ou app/jobs e versione regras de execucao',
  });

  const retryConfig = await grepInFiles(workerFiles, /sidekiq_options\s+.*retry:\s*(\d+|true|false)/i);
  items.push({
    id: 'S2',
    description: 'Configuracao explicita de retry em workers',
    status: workerFiles.length === 0 ? 'warn' : retryConfig.length > 0 ? 'pass' : 'warn',
    severity: 'medium',
    detail:
      workerFiles.length === 0
        ? 'Sem workers para validar retry'
        : retryConfig.length > 0
          ? `${retryConfig.length} configuracao(oes) de retry detectada(s)`
          : 'Nenhuma configuracao explicita de retry detectada',
    remediation: 'Defina retry por worker e trate falhas permanentes com dead queue/alerta',
  });

  const idempotencyHints = await grepInFiles(
    workerFiles,
    /idempot|dedup|unique_job|sidekiq-unique-jobs|lock:\s*:until_executed/i,
  );
  items.push({
    id: 'S3',
    description: 'Sinais de idempotencia/deduplicacao em jobs',
    status: workerFiles.length === 0 ? 'warn' : idempotencyHints.length > 0 ? 'pass' : 'warn',
    severity: 'high',
    detail:
      workerFiles.length === 0
        ? 'Sem workers para validar idempotencia'
        : idempotencyHints.length > 0
          ? `${idempotencyHints.length} indicio(s) de idempotencia/dedup detectado(s)`
          : 'Nao foram encontrados indicios claros de idempotencia/deduplicacao',
    remediation: 'Implemente idempotencia por chave de negocio ou deduplicacao de jobs criticos',
  });

  const sensitiveArgs = await grepInFiles(
    workerFiles,
    /perform_async\(|perform_later\(|set\(.+perform_async/i,
  );
  const riskyArgs = sensitiveArgs.filter((m) => /password|token|secret|credential|auth/i.test(m.text));
  items.push({
    id: 'S4',
    description: 'Sem argumentos sensiveis em enfileiramento de jobs',
    status: riskyArgs.length > 0 ? 'fail' : 'pass',
    severity: 'critical',
    file: riskyArgs[0]?.file,
    line: riskyArgs[0]?.line,
    detail: riskyArgs.length > 0
      ? `${riskyArgs.length} enfileiramento(s) com argumento potencialmente sensivel`
      : 'Nenhum argumento sensivel obvio detectado no enfileiramento',
    remediation: 'Passe IDs e recupere dados sensiveis no worker, evitando payload secreto na fila',
  });

  const sidekiqConfigSrc = hasSidekiqConfig ? await readFileContent(sidekiqConfig) : null;
  const hasQueues = Boolean(sidekiqConfigSrc && /queues:\s*$/im.test(sidekiqConfigSrc));
  items.push({
    id: 'S5',
    description: 'Filas Sidekiq configuradas explicitamente',
    status: hasQueues ? 'pass' : 'warn',
    severity: 'medium',
    file: hasSidekiqConfig ? sidekiqConfig : undefined,
    detail: hasQueues
      ? 'Configuracao de filas encontrada em config/sidekiq.yml'
      : 'Filas explicitas nao detectadas em config/sidekiq.yml',
    remediation: 'Defina filas e prioridades para separar workloads criticos de baixa prioridade',
  });

  return {
    id: 'S',
    name: 'Sidekiq Async Security',
    items,
  };
}
