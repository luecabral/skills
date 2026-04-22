import { stat } from 'node:fs/promises';
import { readFileContent } from './utils.js';
// Lazy loaded dependencies
let tsMorph = null;
let rubyPrism = null;
// Caches
const tsCache = new Map();
const rubyCache = new Map();
let tsProject = null;
let rubyParseFn = null;
async function getTsProject() {
    if (!tsProject) {
        if (!tsMorph) {
            tsMorph = await import('ts-morph');
        }
        tsProject = new tsMorph.Project({ useInMemoryFileSystem: true });
    }
    return tsProject;
}
export async function parseTypeScript(filePath, context) {
    try {
        const fileStat = await stat(filePath);
        const mtime = fileStat.mtimeMs;
        const cached = tsCache.get(filePath);
        if (cached && cached.mtime === mtime) {
            return cached.sourceFile;
        }
        const content = await readFileContent(filePath, context);
        if (!content)
            return null;
        const project = await getTsProject();
        const sourceFile = project.createSourceFile(filePath, content, { overwrite: true });
        tsCache.set(filePath, { mtime, sourceFile });
        return sourceFile;
    }
    catch {
        return null;
    }
}
export async function parseRuby(filePath, context) {
    try {
        const fileStat = await stat(filePath);
        const mtime = fileStat.mtimeMs;
        const cached = rubyCache.get(filePath);
        if (cached && cached.mtime === mtime) {
            return cached.ast;
        }
        const content = await readFileContent(filePath, context);
        if (!content)
            return null;
        if (!rubyParseFn) {
            if (!rubyPrism) {
                rubyPrism = await import('@ruby/prism');
            }
            rubyParseFn = await rubyPrism.loadPrism();
        }
        const ast = rubyParseFn(content);
        rubyCache.set(filePath, { mtime, ast });
        return ast;
    }
    catch {
        return null;
    }
}
// Helper to find function calls in TS
export function findTsCalls(sourceFile, functionNames) {
    if (!tsMorph)
        return [];
    const calls = [];
    sourceFile.forEachDescendant(node => {
        if (tsMorph.Node.isCallExpression(node)) {
            const expression = node.getExpression();
            let name = '';
            if (tsMorph.Node.isIdentifier(expression)) {
                name = expression.getText();
            }
            else if (tsMorph.Node.isPropertyAccessExpression(expression)) {
                name = expression.getName();
            }
            if (functionNames.includes(name)) {
                calls.push(node);
            }
        }
    });
    return calls;
}
// Helper to find string literals in TS
export function findTsStringLiterals(sourceFile) {
    if (!tsMorph)
        return [];
    const literals = [];
    sourceFile.forEachDescendant(node => {
        if (tsMorph.Node.isStringLiteral(node)) {
            literals.push(node);
        }
    });
    return literals;
}
// Helper to find method calls in Ruby
export function findRubyCalls(ast, methodNames) {
    const calls = [];
    function walk(node) {
        if (!node)
            return;
        if (node.type === 'CallNode' && methodNames.includes(node.name)) {
            calls.push(node);
        }
        for (const key in node) {
            if (node[key] && typeof node[key] === 'object') {
                if (Array.isArray(node[key])) {
                    node[key].forEach(walk);
                }
                else {
                    walk(node[key]);
                }
            }
        }
    }
    walk(ast.value);
    return calls;
}
