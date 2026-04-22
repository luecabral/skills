#!/usr/bin/env node
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AuditReport,
  CategoryResult,
  CheckContext,
  CheckItem,
  CheckScope,
  SeverityBreakdown,
  Severity,
  StackProfile,
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

// Import all checks
import { check as checkAccessControl } from './checks/access-control.js';
import { check as checkAuthSession } from './checks/auth-session.js';
import { check as checkValidation } from './checks/validation.js';
import { check as checkClientSide } from './checks/client-side.js';
import { check as checkInjection } from './checks/injection.js';
import { check as checkFiles } from './checks/files.js';
import { check as checkSecretsCrypto } from './checks/secrets-crypto.js';
import { check as checkHardening } from './checks/hardening.js';
import { check as checkDependencies } from './checks/dependencies.js';
import { check as checkTests } from './checks/tests.js';
import { check as checkErrorHandling } from './checks/error-handling.js';

type CheckRunner = (projectRoot: string, context: CheckContext) => Promise<CategoryResult>;

interface CheckRegistration {
  scope: CheckScope;
  run: CheckRunner;
  shouldRun?: (stack: StackProfile) => boolean;
}

const GENERIC_CHECKS: CheckRegistration[] = [
  { scope: 'generic', run: (projectRoot, context) => checkAuthSession(projectRoot, context) },
  { scope: 'generic', run: (projectRoot, context) => checkValidation(projectRoot, context) },
  { scope: 'generic', run: (projectRoot, context) => checkClientSide(projectRoot, context) },
  { scope: 'generic', run: (projectRoot, context) => checkInjection(projectRoot, context) },
  { scope: 'generic', run: (projectRoot, context) => checkFiles(projectRoot, context) },
  { scope: 'generic', run: (projectRoot, context) => checkSecretsCrypto(projectRoot, context) },
  { scope: 'generic', run: (projectRoot, context) => checkHardening(projectRoot, context) },
  { scope: 'generic', run: (projectRoot, context) => checkDependencies(projectRoot, context) },
  { scope: 'generic', run: (projectRoot, context) => checkTests(projectRoot, context) },
  { scope: 'generic', run: (projectRoot, context) => checkErrorHandling(projectRoot, context) },
];

const STACK_SPECIFIC_CHECKS: CheckRegistration[] = [
  {
    scope: 'stack-specific',
    run: (projectRoot, context) => checkAccessControl(projectRoot, context),
    shouldRun: (stack) => stack.services.supabase,
  },
];

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
      `Stack detectado: ecosystem=${stack.ecosystem}, pm=${stack.packageManager}, nextjs=${stack.frameworks.nextjs ? 'sim' : 'não'}, supabase=${stack.services.supabase ? 'sim' : 'não'}`,
    );
    console.log('Executando checks de segurança...\n');
  }

  // Run generic + stack-specific checks in parallel
  const checkPlan = [...GENERIC_CHECKS, ...STACK_SPECIFIC_CHECKS].filter((check) =>
    check.shouldRun ? check.shouldRun(stack) : true,
  );

  let categoryResults: CategoryResult[];
  try {
    categoryResults = await Promise.all(
      checkPlan.map(async (check) => {
        const result = await check.run(projectRoot, context);
        return { ...result, scope: check.scope };
      }),
    );
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
