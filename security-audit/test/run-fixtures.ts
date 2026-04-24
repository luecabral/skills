import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { detectStack } from '../scripts/stack.js';
import { runAuditModules } from '../scripts/runtime.js';
import { AUDIT_MODULES } from '../scripts/modules/index.js';
import type { CheckContext, CategoryResult, CheckStatus } from '../scripts/types.js';

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

process.env.SECURITY_AUDIT_OSV_MOCK_FILE ||= join(SECURITY_AUDIT_ROOT, 'test', 'osv-fixture.json');

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
  const context: CheckContext = { projectRoot, stack };

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

async function main() {
  const updateSnapshots = process.argv.includes('--update');
  let allPassed = true;

  for (const fixture of FIXTURES) {
    const { snapshotOk, expectationsOk } = await runFixture(fixture, updateSnapshots);
    if (!snapshotOk || !expectationsOk) {
      allPassed = false;
    }
  }

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
