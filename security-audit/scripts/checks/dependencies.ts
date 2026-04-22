import { join } from 'node:path';
import { execSync } from 'node:child_process';
import type { CategoryResult, CheckContext, CheckItem, PackageManager } from '../types.js';
import { fileExists, globFiles, grepInFiles } from '../utils.js';

interface AuditVulnerabilitySummary {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  total: number;
}

interface NpmLikeAuditResult {
  metadata?: {
    vulnerabilities?: {
      critical?: number;
      high?: number;
      moderate?: number;
      low?: number;
      info?: number;
      total?: number;
    };
  };
  vulnerabilities?: Record<string, unknown>;
  advisories?: Record<string, { severity?: string }>;
  data?: {
    vulnerabilities?: {
      critical?: number;
      high?: number;
      moderate?: number;
      low?: number;
      info?: number;
      total?: number;
    };
  };
}

function safeParseJson(input: string): unknown | null {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function fromAdvisories(advisories?: Record<string, { severity?: string }>): AuditVulnerabilitySummary | null {
  if (!advisories) return null;
  let critical = 0;
  let high = 0;
  let moderate = 0;
  let low = 0;
  for (const advisory of Object.values(advisories)) {
    if (advisory.severity === 'critical') critical++;
    if (advisory.severity === 'high') high++;
    if (advisory.severity === 'moderate') moderate++;
    if (advisory.severity === 'low') low++;
  }
  const total = critical + high + moderate + low;
  return total > 0 ? { critical, high, moderate, low, total } : null;
}

function parseAuditSummary(raw: string): AuditVulnerabilitySummary | null {
  const parsed = safeParseJson(raw);
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as NpmLikeAuditResult;
    const vulns =
      obj.metadata?.vulnerabilities ||
      obj.data?.vulnerabilities;
    if (vulns) {
      return {
        critical: vulns.critical ?? 0,
        high: vulns.high ?? 0,
        moderate: vulns.moderate ?? 0,
        low: vulns.low ?? 0,
        total: vulns.total ?? (vulns.critical ?? 0) + (vulns.high ?? 0) + (vulns.moderate ?? 0) + (vulns.low ?? 0),
      };
    }
    const fromAdv = fromAdvisories(obj.advisories);
    if (fromAdv) return fromAdv;
  }

  // Yarn classic can emit NDJSON lines.
  let best: AuditVulnerabilitySummary | null = null;
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const lineObj = safeParseJson(trimmed);
    if (!lineObj || typeof lineObj !== 'object') continue;
    const asRecord = lineObj as Record<string, unknown>;

    if (asRecord.type === 'auditSummary' && typeof asRecord.data === 'object' && asRecord.data) {
      const data = asRecord.data as NpmLikeAuditResult;
      const vulns = data.metadata?.vulnerabilities || data.data?.vulnerabilities || data.vulnerabilities;
      if (vulns && typeof vulns === 'object') {
        const summary: AuditVulnerabilitySummary = {
          critical: Number((vulns as Record<string, unknown>).critical ?? 0),
          high: Number((vulns as Record<string, unknown>).high ?? 0),
          moderate: Number((vulns as Record<string, unknown>).moderate ?? 0),
          low: Number((vulns as Record<string, unknown>).low ?? 0),
          total: Number((vulns as Record<string, unknown>).total ?? 0),
        };
        best = !best || summary.total > best.total ? summary : best;
      }
    }
  }

  return best;
}

function commandsForPackageManager(pm: PackageManager): string[] {
  if (pm === 'pnpm') return ['pnpm audit --audit-level high --json', 'npm audit --audit-level=high --json'];
  if (pm === 'yarn') {
    return [
      'yarn npm audit --all --recursive --json',
      'yarn audit --level high --json',
      'npm audit --audit-level=high --json',
    ];
  }
  if (pm === 'npm') return ['npm audit --audit-level=high --json'];
  return [
    'npm audit --audit-level=high --json',
    'pnpm audit --audit-level high --json',
    'yarn npm audit --all --recursive --json',
    'yarn audit --level high --json',
  ];
}

function remediationForPackageManager(pm: PackageManager): string {
  if (pm === 'pnpm') return 'Execute `pnpm audit --audit-level high` e `pnpm audit --fix` (ou aplique updates manuais)';
  if (pm === 'yarn') return 'Execute `yarn npm audit` (Berry) ou `yarn audit` (Classic) e atualize dependências vulneráveis';
  return 'Execute `npm audit` e `npm audit fix`, ou atualize manualmente as dependências vulneráveis';
}

function parseAuditFromCommandOutput(output: string): AuditVulnerabilitySummary | null {
  const parsed = parseAuditSummary(output);
  if (parsed) return parsed;
  return null;
}

export async function check(projectRoot: string, context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];
  const packageManager = context?.stack.packageManager ?? 'unknown';
  const hasRuby = context?.stack.languages.ruby ?? false;

  // L1 — lockfile existe
  const lockfilePath = join(projectRoot, 'package-lock.json');
  const yarnLockPath = join(projectRoot, 'yarn.lock');
  const pnpmLockPath = join(projectRoot, 'pnpm-lock.yaml');
  const gemLockPath = join(projectRoot, 'Gemfile.lock');
  const hasLockfile =
    (await fileExists(lockfilePath)) ||
    (await fileExists(yarnLockPath)) ||
    (await fileExists(pnpmLockPath)) ||
    (await fileExists(gemLockPath));
  const lockfileFile = (await fileExists(lockfilePath))
    ? lockfilePath
    : (await fileExists(yarnLockPath))
      ? yarnLockPath
      : (await fileExists(gemLockPath))
        ? gemLockPath
      : pnpmLockPath;
  items.push({
    id: 'L1',
    description: 'Lockfile commitado (package-lock.json / yarn.lock / pnpm-lock.yaml / Gemfile.lock)',
    status: hasLockfile ? 'pass' : 'fail',
    severity: 'medium',
    file: hasLockfile ? lockfileFile : undefined,
    detail: hasLockfile
      ? 'Lockfile encontrado'
      : 'Nenhum lockfile encontrado — sem garantia de versões reproduzíveis',
    remediation: 'Faça commit do lockfile do gerenciador em uso para garantir builds reproduzíveis',
  });

  const hasPackageJson = await fileExists(join(projectRoot, 'package.json'));

  // L2 — auditoria de dependências (npm/pnpm/yarn)
  let auditStatus: 'pass' | 'fail' | 'warn' = 'warn';
  let auditDetail = 'Auditoria de dependências não executada';
  let auditRemediation: string | undefined;
  let usedCommand: string | undefined;

  if (!hasPackageJson) {
    auditStatus = 'warn';
    auditDetail = 'package.json não encontrado — check L2 se aplica apenas a projetos Node.js';
  } else {
    const commands = commandsForPackageManager(packageManager);
    for (const command of commands) {
      try {
        const output = execSync(command, {
          cwd: projectRoot,
          timeout: 45000,
          stdio: ['pipe', 'pipe', 'pipe'],
        }).toString();
        const summary = parseAuditFromCommandOutput(output);
        if (!summary) {
          usedCommand = command;
          auditStatus = 'warn';
          auditDetail = `Comando executado (${command}), mas sem resumo estruturado de vulnerabilidades`;
          auditRemediation = remediationForPackageManager(packageManager);
          break;
        }

        usedCommand = command;
        if (summary.critical > 0 || summary.high > 0) {
          auditStatus = 'fail';
          auditDetail =
            `${summary.critical} vulnerabilidade(s) crítica(s) e ${summary.high} alta(s) encontrada(s) ` +
            `(total: ${summary.total})`;
          auditRemediation = remediationForPackageManager(packageManager);
        } else if (summary.total > 0) {
          auditStatus = 'warn';
          auditDetail = `${summary.total} vulnerabilidade(s) de severidade baixa/média encontrada(s)`;
        } else {
          auditStatus = 'pass';
          auditDetail = 'Nenhuma vulnerabilidade high/critical encontrada';
        }
        break;
      } catch (err) {
        const stderr = (err as { stderr?: Buffer }).stderr?.toString() || '';
        const stdout = (err as { stdout?: Buffer }).stdout?.toString() || '';
        const combinedOutput = [stdout, stderr].filter(Boolean).join('\n');
        const summary = parseAuditFromCommandOutput(combinedOutput);
        if (summary) {
          usedCommand = command;
          if (summary.critical > 0 || summary.high > 0) {
            auditStatus = 'fail';
            auditDetail =
              `${summary.critical} vulnerabilidade(s) crítica(s) e ${summary.high} alta(s) encontrada(s) ` +
              `(total: ${summary.total})`;
            auditRemediation = remediationForPackageManager(packageManager);
          } else if (summary.total > 0) {
            auditStatus = 'warn';
            auditDetail = `${summary.total} vulnerabilidade(s) de severidade baixa/média encontrada(s)`;
          } else {
            auditStatus = 'pass';
            auditDetail = 'Nenhuma vulnerabilidade high/critical encontrada';
          }
          break;
        }

        if (/command not found|not recognized|ENOENT/i.test(combinedOutput)) {
          continue;
        }

        usedCommand = command;
        auditStatus = 'warn';
        auditDetail = `Não foi possível executar auditoria com "${command}"`;
        auditRemediation = remediationForPackageManager(packageManager);
        break;
      }
    }

    if (!usedCommand && auditStatus === 'warn') {
      auditDetail = 'Nenhum comando de auditoria compatível foi executado no ambiente atual';
      auditRemediation = remediationForPackageManager(packageManager);
    }
  }

  items.push({
    id: 'L2',
    description: 'Auditoria de dependências sem vulnerabilidades high/critical',
    status: auditStatus,
    severity: 'high',
    detail: usedCommand ? `${auditDetail} (comando: ${usedCommand})` : auditDetail,
    remediation: auditRemediation,
  });

  // L5 — Auditoria de gems (Ruby/Bundler)
  if (hasRuby) {
    let rubyAuditStatus: 'pass' | 'fail' | 'warn' = 'warn';
    let rubyAuditDetail = 'bundle-audit nao executado';
    let rubyAuditRemediation =
      'Execute `bundle-audit check --update` (ou `bundle exec bundle-audit check --update`) e aplique os upgrades recomendados';
    let rubyCommandUsed: string | undefined;

    const rubyCommands = [
      'bundle exec bundle-audit check --update',
      'bundle-audit check --update',
    ];

    for (const command of rubyCommands) {
      try {
        const output = execSync(command, {
          cwd: projectRoot,
          timeout: 45000,
          stdio: ['pipe', 'pipe', 'pipe'],
        }).toString();
        rubyCommandUsed = command;
        if (/No vulnerabilities found/i.test(output)) {
          rubyAuditStatus = 'pass';
          rubyAuditDetail = 'bundle-audit executado sem vulnerabilidades conhecidas';
        } else if (/Name:\s+\S+|Vulnerabilities found/i.test(output)) {
          rubyAuditStatus = 'fail';
          rubyAuditDetail = 'bundle-audit encontrou vulnerabilidades em gems';
        } else {
          rubyAuditStatus = 'warn';
          rubyAuditDetail = 'bundle-audit executado, mas sem parse claro do resultado';
        }
        break;
      } catch (err) {
        const stderr = (err as { stderr?: Buffer }).stderr?.toString() || '';
        const stdout = (err as { stdout?: Buffer }).stdout?.toString() || '';
        const combined = [stdout, stderr].filter(Boolean).join('\n');

        if (/No vulnerabilities found/i.test(combined)) {
          rubyCommandUsed = command;
          rubyAuditStatus = 'pass';
          rubyAuditDetail = 'bundle-audit executado sem vulnerabilidades conhecidas';
          break;
        }
        if (/Name:\s+\S+|Vulnerabilities found|Insecure Source URI/i.test(combined)) {
          rubyCommandUsed = command;
          rubyAuditStatus = 'fail';
          rubyAuditDetail = 'bundle-audit encontrou vulnerabilidades em gems';
          break;
        }
        if (/command not found|not recognized|ENOENT/i.test(combined)) {
          continue;
        }

        rubyCommandUsed = command;
        rubyAuditStatus = 'warn';
        rubyAuditDetail = `Nao foi possivel executar "${command}"`;
        break;
      }
    }

    if (!rubyCommandUsed && rubyAuditStatus === 'warn') {
      rubyAuditDetail = 'Nenhum comando bundle-audit compativel foi executado no ambiente atual';
    }

    items.push({
      id: 'L5',
      description: 'Auditoria de gems (Ruby) sem vulnerabilidades conhecidas',
      status: rubyAuditStatus,
      severity: 'high',
      detail: rubyCommandUsed ? `${rubyAuditDetail} (comando: ${rubyCommandUsed})` : rubyAuditDetail,
      remediation: rubyAuditRemediation,
      scope: 'stack-specific',
    });
  } else {
    items.push({
      id: 'L5',
      description: 'Auditoria de gems (Ruby) sem vulnerabilidades conhecidas',
      status: 'skip',
      severity: 'high',
      detail: 'Check especifico para stack Ruby/Rails',
      scope: 'stack-specific',
    });
  }

  // L3 — GitHub workflow de auditoria
  const workflowDir = join(projectRoot, '.github', 'workflows');
  if (await fileExists(workflowDir)) {
    const workflowFiles = await globFiles(workflowDir, ['**/*.yml', '**/*.yaml'], context);
    const [auditWorkflow, cronSchedule] = await Promise.all([
      grepInFiles(
        workflowFiles,
        /npm audit|pnpm audit|yarn audit|bundle-audit|brakeman|audit.*dependencies|snyk|dependabot/i,
        context
      ),
      grepInFiles(workflowFiles, /schedule:|cron:/i, context)
    ]);
    
    items.push({
      id: 'L3',
      description: 'Auditoria automatizada em workflow CI/CD',
      status: auditWorkflow.length > 0 ? 'pass' : 'warn',
      severity: 'high',
      detail: auditWorkflow.length > 0
        ? `Auditoria de dependências encontrada em ${auditWorkflow.length} workflow(s)`
        : 'Nenhum workflow de auditoria de dependências encontrado',
      remediation: 'Adicione auditoria de dependências ao workflow de CI para bloquear PRs com vulnerabilidades high/critical',
    });

    // L4 — Auditoria agendada (cron)
    items.push({
      id: 'L4',
      description: 'Auditoria semanal agendada (cron no workflow)',
      status: cronSchedule.length > 0 ? 'pass' : 'warn',
      severity: 'medium',
      detail: cronSchedule.length > 0
        ? `${cronSchedule.length} workflow(s) com schedule/cron encontrado(s)`
        : 'Nenhum workflow com auditoria agendada encontrado',
      remediation: 'Configure um workflow com schedule: cron para auditar dependências semanalmente',
    });
  } else {
    items.push({
      id: 'L3',
      description: 'Auditoria automatizada em workflow CI/CD',
      status: 'warn',
      severity: 'high',
      detail: 'Diretório .github/workflows não encontrado',
      remediation: 'Crie um workflow de CI com auditoria de dependências (npm/pnpm/yarn audit)',
    });
    items.push({
      id: 'L4',
      description: 'Auditoria semanal agendada (cron no workflow)',
      status: 'warn',
      severity: 'medium',
      detail: 'Diretório .github/workflows não encontrado',
      remediation: 'Configure workflow agendado para auditoria semanal de dependências',
    });
  }

  return {
    id: 'L',
    name: 'CI/CD & Dependencies',
    items,
  };
}
