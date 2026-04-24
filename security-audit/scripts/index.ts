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
import { formatTerminal, formatJson, formatSarif, formatNAItems } from './reporter.js';
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
  sarif: boolean;
  failOn: Severity;
  configure: boolean;
  answerManual: boolean;
  error?: string;
  projectRoot?: string;
  na?: { itemId: string; reason: string; author: string };
} {
  const args = argv.slice(2);
  let json = false;
  let sarif = false;
  let failOn: Severity = 'critical';
  let configure = false;
  let answerManual = false;
  let projectRoot: string | undefined;
  let na: { itemId: string; reason: string; author: string } | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--sarif') {
      sarif = true;
      continue;
    }
    if (arg.startsWith('--fail-on=')) {
      const val = arg.split('=')[1] as Severity;
      if (['critical', 'high', 'medium', 'low'].includes(val)) {
        failOn = val;
      }
      continue;
    }
    if (arg === '--configure') {
      configure = true;
      continue;
    }
    if (arg === '--answer-manual') {
      answerManual = true;
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

  if (json && sarif) {
    return {
      json,
      sarif,
      failOn,
      configure,
      answerManual,
      projectRoot,
      na,
      error: 'As flags --json e --sarif são mutuamente exclusivas. Use apenas uma por execução.',
    };
  }

  return { json, sarif, failOn, configure, answerManual, projectRoot, na };
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
  const { json, sarif, failOn, configure, answerManual, projectRoot: rootArg, na, error } = parseArgs(process.argv);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const cwd = process.cwd();
  const projectRoot = rootArg
    ? (rootArg.startsWith('/') ? rootArg : join(cwd, rootArg))
    : await findProjectRoot(cwd);

  // Handle --answer-manual
  if (answerManual) {
    const { loadManualAnswers, saveManualAnswers } = await import('./checks/manual-checklist.js');
    const readline = await import('node:readline/promises');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    const answers = await loadManualAnswers(projectRoot);
    const now = new Date();
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    
    // We need to import MANUAL_CHECKS from the module, but it's not exported.
    // Let's just run the check to get the items that need answering.
    const { check } = await import('./checks/manual-checklist.js');
    const result = await check(projectRoot);
    const pendingItems = result.items.filter(i => i.status === 'warn');
    
    if (pendingItems.length === 0) {
      console.log('✅ Todas as verificações manuais estão em dia!');
      rl.close();
      process.exit(0);
    }
    
    console.log(`\n📝 Encontradas ${pendingItems.length} verificações manuais pendentes ou vencidas.\n`);
    
    for (const item of pendingItems) {
      console.log(`\n${item.description}`);
      console.log(`Detalhe: ${item.detail}`);
      
      let answered: 'pass' | 'fail' | 'na' | null = null;
      while (!answered) {
        const response = await rl.question('Status (pass/fail/na): ');
        const normalized = response.trim().toLowerCase();
        if (['pass', 'fail', 'na'].includes(normalized)) {
          answered = normalized as 'pass' | 'fail' | 'na';
        } else {
          console.log('Resposta inválida. Use pass, fail ou na.');
        }
      }
      
      const detail = await rl.question('Detalhes/Observações (opcional): ');
      
      const existingIndex = answers.findIndex(a => a.itemId === item.id);
      const newAnswer = {
        itemId: item.id,
        answered,
        detail: detail.trim() || undefined,
        date: now.toISOString()
      };
      
      if (existingIndex >= 0) {
        answers[existingIndex] = newAnswer;
      } else {
        answers.push(newAnswer);
      }
    }
    
    await saveManualAnswers(projectRoot, answers);
    console.log('\n✅ Respostas salvas com sucesso!');
    rl.close();
    process.exit(0);
  }

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
  
  // Initialize IO cache for this run
  const globCache = new Map<string, string[]>();
  const readCache = new Map<string, string | null>();
  
  const context: CheckContext = { 
    projectRoot, 
    stack,
    io: {
      cachedGlob: async (patterns: string[]) => {
        const key = patterns.slice().sort().join('|');
        if (globCache.has(key)) return globCache.get(key)!;
        const { globFiles } = await import('./utils.js');
        const result = await globFiles(projectRoot, patterns);
        globCache.set(key, result);
        return result;
      },
      cachedRead: async (path: string) => {
        if (readCache.has(path)) return readCache.get(path)!;
        const { readFileContent } = await import('./utils.js');
        const result = await readFileContent(path);
        readCache.set(path, result);
        return result;
      }
    }
  };

  if (!json && !sarif) {
    console.log(`\nAnalisando: ${projectRoot}`);
    console.log(
      `Stack detectado: eco=${stack.ecosystem}, pm=${stack.packageManager}, rails=${stack.frameworks.rails ? 'sim' : 'não'}, next=${stack.frameworks.nextjs ? 'sim' : 'não'}, postgres=${stack.services.postgres ? 'sim' : 'não'}, redis=${stack.services.redis ? 'sim' : 'não'}, sidekiq=${stack.services.sidekiq ? 'sim' : 'não'}`,
    );
    if (stack.warnings.length > 0) {
      console.log('\n⚠️  Avisos de Detecção de Stack:');
      for (const warning of stack.warnings) {
        console.log(`   - ${warning}`);
      }
    }
    console.log('\nExecutando checks de segurança...\n');
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
  const coverage = { ...score };

  const breakdown = calculateBreakdown(scorableItems);

  const criticalFailures = scorableItems.filter((i) => i.status === 'fail' && i.severity === 'critical');
  const highFailures = scorableItems.filter((i) => i.status === 'fail' && i.severity === 'high');
  
  const gate = scorableItems.some(i => i.status === 'fail' && i.severity === 'critical') ? 'fail' : 'pass';

  const projectName = config.name || projectRoot.split('/').pop() || 'unknown';

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    projectName,
    projectRoot,
    stack,
    modules: moduleExecution,
    categories: filteredCategories,
    gate,
    coverage,
    score,
    breakdown,
    criticalFailures,
    highFailures,
  };

  // Save result to history
  await saveAuditResult(projectRoot, report);

  // Output
  if (json) {
    console.log(formatJson(report));
  } else if (sarif) {
    console.log(formatSarif(report));
  } else {
    console.log(formatTerminal(report, lastAudit));
    if (naItems.length > 0) {
      console.log(formatNAItems(naItems));
    }
  }

  // Exit with error code if failures exist based on --fail-on
  const severityLevels = { critical: 4, high: 3, medium: 2, low: 1 };
  const failOnLevel = severityLevels[failOn];
  
  const hasFailures = scorableItems.some(
    (i) => i.status === 'fail' && severityLevels[i.severity] >= failOnLevel
  );

  process.exit(hasFailures ? 1 : 0);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
