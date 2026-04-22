#!/usr/bin/env node
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AuditReport,
  CategoryResult,
  CheckContext,
  CheckItem,
  SeverityBreakdown,
  Severity,
} from './types.js';
import { findProjectRoot } from './utils.js';
import {
  loadConfig,
  createDefaultConfig,
  saveAuditResult,
  getLastAudit,
  isItemExcluded,
} from './memory.js';
import { formatTerminal, formatJson, formatNAItems } from './reporter.js';
import { detectStack } from './stack.js';
import { runAuditModules } from './runtime.js';
import { AUDIT_MODULES } from './modules/index.js';

function getSelfCommand(): string {
  const scriptPath = process.argv[1] || fileURLToPath(import.meta.url);
  const relativePath = relative(process.cwd(), scriptPath);
  const displayPath = relativePath && !relativePath.startsWith('..') ? relativePath : scriptPath;
  const escapedPath = displayPath.includes(' ') ? `"${displayPath}"` : displayPath;
  return `npx tsx ${escapedPath}`;
}

function parseArgs(argv: string[]): {
  json: boolean;
  configure: boolean;
  projectRoot?: string;
  na?: { itemId: string; reason: string; author: string };
} {
  const args = argv.slice(2);
  let json = false;
  let configure = false;
  let projectRoot: string | undefined;
  let na: { itemId: string; reason: string; author: string } | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--configure') {
      configure = true;
      continue;
    }
    if (arg === '--na') {
      const itemId = args[i + 1];
      const reason = args[i + 2] || 'N/A';
      const author = args[i + 3] || 'unknown';
      if (itemId) {
        na = { itemId, reason, author };
      }
      i += 3;
      continue;
    }
    if (!arg.startsWith('--') && !projectRoot) {
      projectRoot = arg;
    }
  }

  return { json, configure, projectRoot, na };
}

function calculateBreakdown(items: CheckItem[]): SeverityBreakdown {
  const severities: Severity[] = ['critical', 'high', 'medium', 'low'];
  const breakdown: SeverityBreakdown = {
    critical: { passed: 0, total: 0 },
    high: { passed: 0, total: 0 },
    medium: { passed: 0, total: 0 },
    low: { passed: 0, total: 0 },
  };

  for (const item of items) {
    if (item.status === 'skip') continue;
    breakdown[item.severity].total++;
    if (item.status === 'pass') {
      breakdown[item.severity].passed++;
    }
  }

  return breakdown;
}

async function configureScan(projectRoot: string): Promise<void> {
  const selfCommand = getSelfCommand();
  const config = (await loadConfig(projectRoot)) || createDefaultConfig(projectRoot);
  console.log('\nConfiguração atual:');
  console.log(JSON.stringify(config, null, 2));
  console.log('\nPara marcar um item como N/A, use:');
  console.log(`  ${selfCommand} --na <ID> "<motivo>" "<autor>"`);
  console.log('\nExemplo:');
  console.log(`  ${selfCommand} --na K1 "Sem IA no projeto" "eriko"`);
}

async function main(): Promise<void> {
  const { json, configure, projectRoot: rootArg, na } = parseArgs(process.argv);

  const cwd = process.cwd();
  const projectRoot = rootArg
    ? (rootArg.startsWith('/') ? rootArg : join(cwd, rootArg))
    : await findProjectRoot(cwd);

  // Handle --configure
  if (configure) {
    await configureScan(projectRoot);
    process.exit(0);
  }

  // Handle --na <id> <reason> <author>
  if (na) {
    const { markItemAsNA } = await import('./memory.js');
    await markItemAsNA(projectRoot, na.itemId, na.reason, na.author);
    console.log(`Item ${na.itemId} marcado como N/A: "${na.reason}" por @${na.author}`);
    process.exit(0);
  }

  // Load config and history
  const config = (await loadConfig(projectRoot)) || createDefaultConfig(projectRoot);
  const lastAudit = await getLastAudit(projectRoot);
  const stack = await detectStack(projectRoot);
  const context: CheckContext = { projectRoot, stack };

  if (!json) {
    console.log(`\nAnalisando: ${projectRoot}`);
    console.log(
      `Stack detectado: eco=${stack.ecosystem}, pm=${stack.packageManager}, rails=${stack.frameworks.rails ? 'sim' : 'não'}, next=${stack.frameworks.nextjs ? 'sim' : 'não'}, postgres=${stack.services.postgres ? 'sim' : 'não'}, redis=${stack.services.redis ? 'sim' : 'não'}, sidekiq=${stack.services.sidekiq ? 'sim' : 'não'}`,
    );
    console.log('Executando checks de segurança...\n');
  }

  let moduleExecution: AuditReport['modules'] = [];
  let categoryResults: CategoryResult[];
  try {
    const moduleRun = await runAuditModules(AUDIT_MODULES, context);
    categoryResults = moduleRun.categories;
    moduleExecution = moduleRun.modules;
  } catch (err) {
    console.error('Erro ao executar checks:', err);
    process.exit(1);
  }

  // Filter N/A items and collect them
  const naItems: Array<{ id: string; reason: string; author: string; date: string }> = [];
  const filteredCategories: CategoryResult[] = [];

  for (const category of categoryResults) {
    const filteredItems = [];
    for (const item of category.items) {
      const excluded = await isItemExcluded(config, item.id);
      if (excluded) {
        const exclusion = config.excludedItems.find((e) => e.itemId === item.id);
        if (exclusion) {
          naItems.push({ id: item.id, reason: exclusion.reason, author: exclusion.author, date: exclusion.date });
        }
        // Mark as skip
        filteredItems.push({ ...item, status: 'skip' as const });
      } else {
        filteredItems.push(item);
      }
    }
    filteredCategories.push({ ...category, items: filteredItems });
  }

  // Calculate score (exclude skipped items)
  const allItems = filteredCategories.flatMap((c) => c.items);
  const scorableItems = allItems.filter((i) => i.status !== 'skip');
  const passedItems = scorableItems.filter((i) => i.status === 'pass');
  const score = {
    passed: passedItems.length,
    total: scorableItems.length,
    percentage: scorableItems.length > 0 ? (passedItems.length / scorableItems.length) * 100 : 0,
  };

  const breakdown = calculateBreakdown(scorableItems);

  // Critical failures: fail items with critical or high severity
  const criticalFailures = scorableItems.filter(
    (i) => i.status === 'fail' && (i.severity === 'critical' || i.severity === 'high'),
  );

  const projectName = config.name || projectRoot.split('/').pop() || 'unknown';

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    projectName,
    projectRoot,
    stack,
    modules: moduleExecution,
    categories: filteredCategories,
    score,
    breakdown,
    criticalFailures,
  };

  // Save result to history
  await saveAuditResult(projectRoot, report);

  // Output
  if (json) {
    console.log(formatJson(report));
  } else {
    console.log(formatTerminal(report, lastAudit));
    if (naItems.length > 0) {
      console.log(formatNAItems(naItems));
    }
  }

  // Exit with error code if critical failures exist
  process.exit(criticalFailures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
