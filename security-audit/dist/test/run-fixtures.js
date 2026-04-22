import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { detectStack } from '../scripts/stack.js';
import { runAuditModules } from '../scripts/runtime.js';
import { AUDIT_MODULES } from '../scripts/modules/index.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '../test-projects');
const SNAPSHOTS_DIR = join(__dirname, 'snapshots');
const FIXTURES = [
    'rails-vulnerable',
    'rails-secure',
    'nextjs-vulnerable',
    'nextjs-secure',
    'ruby-only-no-rails'
];
async function runFixture(fixtureName, updateSnapshots) {
    const projectRoot = join(FIXTURES_DIR, fixtureName);
    const snapshotPath = join(SNAPSHOTS_DIR, `${fixtureName}.json`);
    const stack = await detectStack(projectRoot);
    const context = { projectRoot, stack };
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
        return true;
    }
    const snapshotJson = readFileSync(snapshotPath, 'utf-8');
    if (resultJson !== snapshotJson) {
        console.error(`❌ Snapshot mismatch for ${fixtureName}`);
        // Write actual output for debugging
        writeFileSync(snapshotPath + '.actual', resultJson, 'utf-8');
        console.error(`   See ${snapshotPath}.actual for details`);
        return false;
    }
    console.log(`✅ Snapshot matches for ${fixtureName}`);
    return true;
}
async function main() {
    const updateSnapshots = process.argv.includes('--update');
    let allPassed = true;
    for (const fixture of FIXTURES) {
        const passed = await runFixture(fixture, updateSnapshots);
        if (!passed) {
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
