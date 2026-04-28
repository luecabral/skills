import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { detectStack } from '../scripts/stack.js';
import { runAuditModules } from '../scripts/runtime.js';
import { AUDIT_MODULES } from '../scripts/modules/index.js';
import { globFiles } from '../scripts/utils.js';
import { getProjectMemoryDir } from '../scripts/memory.js';
import { getManualAnswersPath, saveManualAnswers } from '../scripts/checks/manual-checklist.js';
import type { AuditReport, CheckContext, CategoryResult, CheckStatus } from '../scripts/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// When this file runs from `dist/test/`, paths must resolve back to the project root
// where `test-projects/` and `test/expectations/` actually live. The source tree
// pattern (running via tsx) is `test/run-fixtures.ts` → __dirname = `<root>/test/`.
const SECURITY_AUDIT_ROOT = __dirname.includes(`${sep}dist${sep}`)
  ? resolve(__dirname, '../..')
  : resolve(__dirname, '..');
const FIXTURES_DIR = join(SECURITY_AUDIT_ROOT, 'test-projects');
const SNAPSHOTS_DIR = join(SECURITY_AUDIT_ROOT, 'test', 'snapshots');
const EXPECTATIONS_DIR = join(SECURITY_AUDIT_ROOT, 'test', 'expectations');
const DIST_CLI = join(SECURITY_AUDIT_ROOT, 'dist', 'scripts', 'index.js');

process.env.SECURITY_AUDIT_OSV_MOCK_FILE ||= join(SECURITY_AUDIT_ROOT, 'test', 'osv-fixture.json');
process.env.SECURITY_AUDIT_SKIP_EXTERNAL_AUDITS ||= '1';

const FIXTURES = [
  'rails-vulnerable',
  'rails-secure',
  'nextjs-vulnerable',
  'nextjs-secure',
  'ruby-only-no-rails'
];

interface Expectations {
  fixture: string;
  mustFail?: string[];
  mustPass?: string[];
  mustWarn?: string[];
}

function createCachedContext(projectRoot: string, stack: Awaited<ReturnType<typeof detectStack>>): CheckContext {
  const globCache = new Map<string, string[]>();
  const readCache = new Map<string, string | null>();
  return {
    projectRoot,
    stack,
    io: {
      cachedGlob: async (rootDir, patterns) => {
        const key = `${resolve(rootDir)}::${patterns.slice().sort().join('|')}`;
        const cached = globCache.get(key);
        if (cached) return cached;
        const result = await globFiles(rootDir, patterns);
        globCache.set(key, result);
        return result;
      },
      cachedRead: async (path) => {
        if (readCache.has(path)) return readCache.get(path)!;
        const { readFileContent } = await import('../scripts/utils.js');
        const result = await readFileContent(path);
        readCache.set(path, result);
        return result;
      },
    },
  };
}

function indexItemsById(categories: CategoryResult[]): Map<string, { status: CheckStatus; description: string }> {
  const map = new Map<string, { status: CheckStatus; description: string }>();
  for (const cat of categories) {
    for (const item of cat.items) {
      map.set(item.id, { status: item.status, description: item.description });
    }
  }
  return map;
}

function checkExpectations(fixtureName: string, categories: CategoryResult[]): string[] {
  const expectationsPath = join(EXPECTATIONS_DIR, `${fixtureName}.json`);
  if (!existsSync(expectationsPath)) return [];

  const exp = JSON.parse(readFileSync(expectationsPath, 'utf-8')) as Expectations;
  const items = indexItemsById(categories);
  const violations: string[] = [];

  const verify = (ids: string[] | undefined, expected: CheckStatus, label: string) => {
    if (!ids) return;
    for (const id of ids) {
      const item = items.get(id);
      if (!item) {
        violations.push(`   • [${id}] expected ${label} but check did not run (skip or absent)`);
        continue;
      }
      if (item.status !== expected) {
        violations.push(
          `   • [${id}] ${item.description.slice(0, 60)} → expected ${label}, got ${item.status}`,
        );
      }
    }
  };

  verify(exp.mustFail, 'fail', 'fail');
  verify(exp.mustPass, 'pass', 'pass');
  verify(exp.mustWarn, 'warn', 'warn');

  return violations;
}

async function runFixture(fixtureName: string, updateSnapshots: boolean): Promise<{ snapshotOk: boolean; expectationsOk: boolean }> {
  const projectRoot = join(FIXTURES_DIR, fixtureName);
  const snapshotPath = join(SNAPSHOTS_DIR, `${fixtureName}.json`);

  const stack = await detectStack(projectRoot);
  const context = createCachedContext(projectRoot, stack);

  const moduleRun = await runAuditModules(AUDIT_MODULES, context);

  // Clean up paths to make snapshots deterministic
  const cleanCategories = moduleRun.categories.map(cat => ({
    ...cat,
    items: cat.items.map(item => ({
      ...item,
      detail: item.detail?.replace(new RegExp(projectRoot, 'g'), '<PROJECT_ROOT>'),
      file: item.file?.replace(new RegExp(projectRoot, 'g'), '<PROJECT_ROOT>')
    }))
  }));

  // Expectations validation runs BEFORE snapshot comparison so silently-passing
  // checks fail loudly even if snapshots were regenerated.
  const violations = checkExpectations(fixtureName, cleanCategories);
  let expectationsOk = true;
  if (violations.length > 0) {
    expectationsOk = false;
    console.error(`❌ Expectations failed for ${fixtureName}:`);
    for (const v of violations) console.error(v);
  }

  const result = {
    stack,
    categories: cleanCategories
  };

  const resultJson = JSON.stringify(result, null, 2);

  if (updateSnapshots || !existsSync(snapshotPath)) {
    if (!existsSync(SNAPSHOTS_DIR)) {
      mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    }
    writeFileSync(snapshotPath, resultJson, 'utf-8');
    console.log(`✅ Snapshot updated for ${fixtureName}`);
    return { snapshotOk: true, expectationsOk };
  }

  const snapshotJson = readFileSync(snapshotPath, 'utf-8');
  if (resultJson !== snapshotJson) {
    console.error(`❌ Snapshot mismatch for ${fixtureName}`);
    writeFileSync(snapshotPath + '.actual', resultJson, 'utf-8');
    console.error(`   See ${snapshotPath}.actual for details`);
    return { snapshotOk: false, expectationsOk };
  }

  if (expectationsOk) {
    console.log(`✅ ${fixtureName} (snapshot + expectations)`);
  } else {
    console.log(`⚠️  ${fixtureName} (snapshot OK, expectations FAILED)`);
  }
  return { snapshotOk: true, expectationsOk };
}

async function runSmokeTests(): Promise<boolean> {
  let ok = true;

  const cacheRoot = mkdtempSync(join(tmpdir(), 'security-audit-cache-'));
  const firstRoot = join(cacheRoot, 'first');
  const secondRoot = join(cacheRoot, 'second');
  mkdirSync(firstRoot, { recursive: true });
  mkdirSync(secondRoot, { recursive: true });
  writeFileSync(join(firstRoot, 'same.sql'), 'select 1;', 'utf-8');
  writeFileSync(join(secondRoot, 'same.sql'), 'select 2;', 'utf-8');
  const migrationRoot = join(cacheRoot, 'supabase', 'migrations');
  const workflowRoot = join(cacheRoot, '.github', 'workflows');
  mkdirSync(migrationRoot, { recursive: true });
  mkdirSync(workflowRoot, { recursive: true });
  writeFileSync(join(cacheRoot, 'outside.sql'), 'select outside;', 'utf-8');
  writeFileSync(join(migrationRoot, 'inside.sql'), 'select inside;', 'utf-8');
  writeFileSync(join(cacheRoot, 'outside.yml'), 'name: outside\n', 'utf-8');
  writeFileSync(join(workflowRoot, 'audit.yml'), 'name: audit\n', 'utf-8');

  const stack = await detectStack(cacheRoot);
  const context = createCachedContext(cacheRoot, stack);
  const firstFiles = await globFiles(firstRoot, ['**/*.sql'], context);
  const secondFiles = await globFiles(secondRoot, ['**/*.sql'], context);
  const migrationFiles = await globFiles(migrationRoot, ['**/*.sql'], context);
  const workflowFiles = await globFiles(workflowRoot, ['**/*.yml', '**/*.yaml'], context);
  if (firstFiles.length !== 1 || secondFiles.length !== 1 || firstFiles[0] === secondFiles[0]) {
    ok = false;
    console.error('❌ cachedGlob reused results across different root directories');
  } else if (
    migrationFiles.length !== 1 ||
    !migrationFiles[0].endsWith('inside.sql') ||
    workflowFiles.length !== 1 ||
    !workflowFiles[0].endsWith('audit.yml')
  ) {
    ok = false;
    console.error('❌ cachedGlob did not preserve Supabase migration or workflow roots');
  } else {
    console.log('✅ cachedGlob root isolation');
  }

  const manualRoot = mkdtempSync(join(tmpdir(), 'security-audit-manual-'));
  await saveManualAnswers(manualRoot, [{ itemId: 'K1', answered: 'na', date: new Date().toISOString() }]);
  const expectedManualPath = join(getProjectMemoryDir(manualRoot), 'manual-answers.json');
  const actualManualPath = getManualAnswersPath(manualRoot);
  if (actualManualPath !== expectedManualPath || !existsSync(expectedManualPath)) {
    ok = false;
    console.error(`❌ manual answers path mismatch: expected ${expectedManualPath}, got ${actualManualPath}`);
  } else {
    console.log('✅ manual answers path uses shared project memory');
  }

  const invalidRulesRoot = mkdtempSync(join(tmpdir(), 'security-audit-rules-'));
  writeFileSync(
    join(invalidRulesRoot, '.security-audit.rules.yaml'),
    'rules:\n  - id: BROKEN\n    severity: high\n    glob: "**/*.ts"\n    expect: absent\n',
    'utf-8',
  );
  const invalidRulesStack = await detectStack(invalidRulesRoot);
  const invalidRulesRun = await runAuditModules(AUDIT_MODULES, createCachedContext(invalidRulesRoot, invalidRulesStack));
  const invalidRulesItem = invalidRulesRun.categories
    .flatMap((category) => category.items)
    .find((item) => item.id === 'CUSTOM-RULES-INVALID');
  if (invalidRulesItem?.status !== 'fail') {
    ok = false;
    console.error('❌ invalid custom rules did not produce a failing audit item');
  } else {
    console.log('✅ invalid custom rules are audit-visible');
  }

  const cliRoot = mkdtempSync(join(tmpdir(), 'security-audit-cli-'));
  writeFileSync(
    join(cliRoot, '.security-audit.rules.yaml'),
    'rules:\n  - id: CLI-HIGH\n    description: "High gate smoke"\n    severity: high\n    glob: "missing.txt"\n    expect: present\n',
    'utf-8',
  );
  const cli = spawnSync(process.execPath, [DIST_CLI, cliRoot, '--json', '--fail-on=high'], {
    encoding: 'utf-8',
  });
  const cliReport = cli.stdout ? JSON.parse(cli.stdout) as AuditReport : null;
  if (cli.status !== 1 || cliReport?.gate !== 'fail' || cliReport.failOn !== 'high') {
    ok = false;
    console.error(`❌ --fail-on=high mismatch: status=${cli.status}, gate=${cliReport?.gate}, failOn=${cliReport?.failOn}`);
  } else {
    console.log('✅ --fail-on=high matches exit code and JSON gate');
  }

  return ok;
}

async function main() {
  const updateSnapshots = process.argv.includes('--update');
  let allPassed = true;

  for (const fixture of FIXTURES) {
    const { snapshotOk, expectationsOk } = await runFixture(fixture, updateSnapshots);
    if (!snapshotOk || !expectationsOk) {
      allPassed = false;
    }
  }

  if (!(await runSmokeTests())) {
    allPassed = false;
  }

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
