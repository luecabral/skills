import type { AuditReport, CheckItem, Severity, CheckStatus, AuditHistoryEntry } from './types.js';
import { SEVERITY_EMOJI, STATUS_EMOJI } from './types.js';

// ANSI color codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';
const BG_RED = '\x1b[41m';

function colorForSeverity(severity: Severity): string {
  switch (severity) {
    case 'critical': return RED;
    case 'high': return YELLOW;
    case 'medium': return CYAN;
    case 'low': return BLUE;
  }
}

function colorForStatus(status: CheckStatus): string {
  switch (status) {
    case 'pass': return GREEN;
    case 'fail': return RED;
    case 'warn': return YELLOW;
    case 'skip': return DIM;
  }
}

function scoreColor(percentage: number): string {
  if (percentage >= 80) return GREEN;
  if (percentage >= 60) return YELLOW;
  return RED;
}

const LINE = '═'.repeat(55);
const DASH = '─'.repeat(55);

function formatScopeLabel(scope?: string): string {
  if (scope === 'stack-specific') return `${DIM}[stack-specific]${RESET}`;
  if (scope === 'generic') return `${DIM}[generic]${RESET}`;
  return '';
}

function formatLayerLabel(layer?: string): string {
  if (!layer) return '';
  return `${DIM}[${layer}]${RESET}`;
}

function formatTrend(report: AuditReport, lastAudit: AuditHistoryEntry | null): string {
  if (!lastAudit) return '';

  const diff = report.coverage.percentage - (lastAudit.coverage?.percentage ?? lastAudit.score.percentage);
  const sign = diff >= 0 ? '+' : '';
  const trendColor = diff >= 0 ? GREEN : RED;
  const trendArrow = diff >= 0 ? '📈' : '📉';
  const lastDate = new Date(lastAudit.timestamp).toLocaleDateString('pt-BR');

  const prevPassed = lastAudit.coverage?.passed ?? lastAudit.score.passed;
  const currPassed = report.coverage.passed;
  const newPasses = currPassed - prevPassed;
  const newFails = lastAudit.criticalFailures.length - report.criticalFailures.length;

  let out = `\n  ${trendArrow} ${BOLD}Tendência:${RESET} ${trendColor}${sign}${diff.toFixed(1)}%${RESET} de cobertura desde última auditoria (${lastDate})\n`;

  if (newPasses > 0) {
    out += `     ${GREEN}Novos ✅: ${newPasses} item(s) corrigido(s)${RESET}\n`;
  }
  if (newFails < 0) {
    out += `     ${RED}Regressões: ${Math.abs(newFails)} item(s) crítico(s) a mais${RESET}\n`;
  }
  if (newPasses === 0 && newFails >= 0) {
    out += `     ${DIM}Sem mudanças significativas${RESET}\n`;
  }

  return out;
}

export function formatTerminal(report: AuditReport, lastAudit: AuditHistoryEntry | null): string {
  const lines: string[] = [];

  lines.push(`\n${BOLD}${LINE}${RESET}`);
  lines.push(`${BOLD}  RELATÓRIO DE AUDITORIA DE SEGURANÇA${RESET}`);
  lines.push(`${DIM}  ${report.projectName} — ${new Date(report.timestamp).toLocaleString('pt-BR')}${RESET}`);
  lines.push(
    `${DIM}  Stack: eco=${report.stack.ecosystem}, pm=${report.stack.packageManager}, rails=${report.stack.frameworks.rails ? 'sim' : 'não'}, nextjs=${report.stack.frameworks.nextjs ? 'sim' : 'não'}, postgres=${report.stack.services.postgres ? 'sim' : 'não'}, redis=${report.stack.services.redis ? 'sim' : 'não'}, sidekiq=${report.stack.services.sidekiq ? 'sim' : 'não'}, hotwire=${report.stack.frameworks.hotwire ? 'sim' : 'não'}${RESET}`,
  );
  const executedModules = report.modules.filter((m) => m.status === 'executed').length;
  const skippedModules = report.modules.filter((m) => m.status === 'skipped').length;
  lines.push(`${DIM}  Módulos: ${executedModules} executado(s), ${skippedModules} pulado(s)${RESET}`);
  lines.push(`${BOLD}${LINE}${RESET}\n`);

  // Categories
  for (const category of report.categories) {
    const passed = category.items.filter((i) => i.status === 'pass').length;
    const total = category.items.filter((i) => i.status !== 'skip').length;
    const categoryScore = total > 0 ? `${passed}/${total}` : 'N/A';
    const categoryColor = passed === total ? GREEN : passed / total >= 0.7 ? YELLOW : RED;

    lines.push(
      `${BOLD}${category.id}. ${category.name}${RESET} ${formatLayerLabel(category.layer)} ${formatScopeLabel(category.scope)}  ${categoryColor}${categoryScore}${RESET}`,
    );
    lines.push(DASH);

    for (const item of category.items) {
      const statusIcon = STATUS_EMOJI[item.status];
      const sevIcon = SEVERITY_EMOJI[item.severity];
      const statusColor = colorForStatus(item.status);
      const sevColor = colorForSeverity(item.severity);
      const itemScopeLabel = item.scope && item.scope !== category.scope ? ` ${formatScopeLabel(item.scope)}` : '';

      lines.push(
        `  ${statusIcon} ${sevIcon} ${statusColor}${item.description}${RESET}${itemScopeLabel}`,
      );

      if (item.detail && item.status !== 'pass') {
        lines.push(`     ${DIM}${item.detail}${RESET}`);
      }
      if (item.file) {
        lines.push(`     ${DIM}${item.file}${RESET}`);
      }
    }

    lines.push('');
  }

  // Score
  const { passed, total, percentage } = report.coverage;
  const { breakdown, gate } = report;
  const scoreCol = scoreColor(percentage);
  const gateIcon = gate === 'pass' ? '✅' : '❌';
  const gateColor = gate === 'pass' ? GREEN : RED;

  lines.push(`${BOLD}${LINE}${RESET}`);
  lines.push(`${BOLD}  GATE DE SEGURANÇA (--fail-on=${report.failOn}): ${gateColor}${gateIcon} ${gate.toUpperCase()}${RESET}`);
  lines.push(`${BOLD}  COBERTURA:         ${scoreCol}${passed}/${total} itens (${percentage.toFixed(1)}%)${RESET}`);
  lines.push('');

  const bd = breakdown;
  lines.push(`  ${SEVERITY_EMOJI.critical} Críticos: ${RED}${bd.critical.passed}/${bd.critical.total}${RESET}${bd.critical.passed < bd.critical.total ? ` ${RED}(${bd.critical.total - bd.critical.passed} faltando!)${RESET}` : ''}`);
  lines.push(`  ${SEVERITY_EMOJI.high} Altos:    ${YELLOW}${bd.high.passed}/${bd.high.total}${RESET}${bd.high.passed < bd.high.total ? ` ${YELLOW}(${bd.high.total - bd.high.passed} faltando)${RESET}` : ''}`);
  lines.push(`  ${SEVERITY_EMOJI.medium} Médios:   ${CYAN}${bd.medium.passed}/${bd.medium.total}${RESET}${bd.medium.passed < bd.medium.total ? ` ${CYAN}(${bd.medium.total - bd.medium.passed} faltando)${RESET}` : ''}`);
  lines.push(`  ${SEVERITY_EMOJI.low} Baixos:   ${BLUE}${bd.low.passed}/${bd.low.total}${RESET}${bd.low.passed < bd.low.total ? ` ${BLUE}(${bd.low.total - bd.low.passed} faltando)${RESET}` : ''}`);

  // Trend
  const trendSection = formatTrend(report, lastAudit);
  if (trendSection) lines.push(trendSection);

  const skippedDetails = report.modules.filter((m) => m.status === 'skipped');
  if (skippedDetails.length > 0) {
    lines.push(`\n  ${DIM}Módulos pulados por contexto:${RESET}`);
    for (const module of skippedDetails) {
      lines.push(`  ${DIM}- ${module.id} (${module.reason || 'não aplicável'})${RESET}`);
    }
  }

  // Critical failures
  if (report.criticalFailures.length > 0) {
    lines.push(`\n  ${RED}${BOLD}⚠️  ITENS CRÍTICOS FALTANTES:${RESET}`);
    report.criticalFailures.forEach((item, i) => {
      lines.push(`  ${i + 1}. [${item.id}] ${SEVERITY_EMOJI[item.severity]} ${RED}${item.description}${RESET}`);
      if (item.detail) {
        lines.push(`     ${DIM}${item.detail}${RESET}`);
      }
      if (item.remediation) {
        lines.push(`     ${YELLOW}💡 ${item.remediation}${RESET}`);
      }
    });
  }
  if ((report.highFailures || []).length > 0) {
    lines.push(`\n  ${YELLOW}${BOLD}⚠️  ITENS ALTOS FALTANTES:${RESET}`);
    report.highFailures!.forEach((item, i) => {
      lines.push(`  ${i + 1}. [${item.id}] ${SEVERITY_EMOJI[item.severity]} ${YELLOW}${item.description}${RESET}`);
      if (item.detail) {
        lines.push(`     ${DIM}${item.detail}${RESET}`);
      }
      if (item.remediation) {
        lines.push(`     ${YELLOW}💡 ${item.remediation}${RESET}`);
      }
    });
  }

  lines.push(`\n${BOLD}${LINE}${RESET}\n`);

  return lines.join('\n');
}

export function formatNAItems(naItems: Array<{ id: string; reason: string; author: string; date: string }>): string {
  if (naItems.length === 0) return '';
  const lines: string[] = [`\n  ${DIM}Itens N/A (configurados pelo time):${RESET}`];
  for (const item of naItems) {
    lines.push(`  ${DIM}- [${item.id}] ${item.reason} — @${item.author}, ${item.date}${RESET}`);
  }
  return lines.join('\n') + '\n';
}

export function formatJson(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatSarif(report: AuditReport): string {
  const rules: any[] = [];
  const results: any[] = [];
  const ruleIds = new Set<string>();

  for (const category of report.categories) {
    for (const item of category.items) {
      if (!ruleIds.has(item.id)) {
        ruleIds.add(item.id);
        rules.push({
          id: item.id,
          shortDescription: { text: item.description },
          fullDescription: { text: item.remediation || item.description },
          properties: {
            category: category.name,
            severity: item.severity
          }
        });
      }

      if (item.status === 'fail') {
        let level = 'warning';
        if (item.severity === 'critical' || item.severity === 'high') {
          level = 'error';
        } else if (item.severity === 'low') {
          level = 'note';
        }

        const physicalLocation: {
          artifactLocation: { uri: string };
          region?: { startLine: number };
        } | null = item.file
          ? {
              artifactLocation: { uri: item.file },
              ...(item.line ? { region: { startLine: item.line } } : {}),
            }
          : null;

        results.push({
          ruleId: item.id,
          level,
          message: { text: item.detail || item.description },
          locations: physicalLocation ? [{ physicalLocation }] : []
        });
      }
    }
  }

  const sarif = {
    version: '2.1.0',
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'Claude Security Audit',
            informationUri: 'https://github.com/erikosodre/claude-skills',
            rules
          }
        },
        results
      }
    ]
  };

  return JSON.stringify(sarif, null, 2);
}
