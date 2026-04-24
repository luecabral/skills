import { stat } from 'node:fs/promises';
import { readFileContent } from './utils.js';

// Lazy loaded dependencies
let tsMorph: typeof import('ts-morph') | null = null;
let rubyPrism: typeof import('@ruby/prism') | null = null;

// Caches
const tsCache = new Map<string, { mtime: number; sourceFile: import('ts-morph').SourceFile }>();
const rubyCache = new Map<string, { mtime: number; ast: any }>();

let tsProject: import('ts-morph').Project | null = null;
let rubyParseFn: ((source: string) => any) | null = null;

async function getTsProject() {
  if (!tsProject) {
    if (!tsMorph) {
      tsMorph = await import('ts-morph');
    }
    tsProject = new tsMorph.Project({ useInMemoryFileSystem: true });
  }
  return tsProject;
}

export async function parseTypeScript(filePath: string, context?: { io?: { cachedRead: (path: string) => Promise<string | null> } }) {
  try {
    const fileStat = await stat(filePath);
    const mtime = fileStat.mtimeMs;

    const cached = tsCache.get(filePath);
    if (cached && cached.mtime === mtime) {
      return cached.sourceFile;
    }

    const content = await readFileContent(filePath, context);
    if (!content) return null;

    const project = await getTsProject();
    const sourceFile = project.createSourceFile(filePath, content, { overwrite: true });
    
    tsCache.set(filePath, { mtime, sourceFile });
    return sourceFile;
  } catch {
    return null;
  }
}

export async function parseRuby(filePath: string, context?: { io?: { cachedRead: (path: string) => Promise<string | null> } }) {
  try {
    const fileStat = await stat(filePath);
    const mtime = fileStat.mtimeMs;

    const cached = rubyCache.get(filePath);
    if (cached && cached.mtime === mtime) {
      return cached.ast;
    }

    const content = await readFileContent(filePath, context);
    if (!content) return null;

    if (!rubyParseFn) {
      if (!rubyPrism) {
        rubyPrism = await import('@ruby/prism');
      }
      rubyParseFn = await rubyPrism.loadPrism();
    }

    const ast = rubyParseFn(content);
    rubyCache.set(filePath, { mtime, ast });
    return ast;
  } catch {
    return null;
  }
}

// Helper to find function calls in TS
export function findTsCalls(sourceFile: import('ts-morph').SourceFile, functionNames: string[]) {
  if (!tsMorph) return [];
  const calls: import('ts-morph').CallExpression[] = [];
  
  sourceFile.forEachDescendant(node => {
    if (tsMorph!.Node.isCallExpression(node)) {
      const expression = node.getExpression();
      let name = '';
      
      if (tsMorph!.Node.isIdentifier(expression)) {
        name = expression.getText();
      } else if (tsMorph!.Node.isPropertyAccessExpression(expression)) {
        name = expression.getName();
      }
      
      if (functionNames.includes(name)) {
        calls.push(node);
      }
    }
  });
  
  return calls;
}

export function findTsCallExpressions(sourceFile: import('ts-morph').SourceFile) {
  if (!tsMorph) return [];
  const calls: import('ts-morph').CallExpression[] = [];

  sourceFile.forEachDescendant((node) => {
    if (tsMorph!.Node.isCallExpression(node)) {
      calls.push(node);
    }
  });

  return calls;
}

// Helper to find string literals in TS
export function findTsStringLiterals(sourceFile: import('ts-morph').SourceFile) {
  if (!tsMorph) return [];
  const literals: import('ts-morph').StringLiteral[] = [];
  
  sourceFile.forEachDescendant(node => {
    if (tsMorph!.Node.isStringLiteral(node)) {
      literals.push(node);
    }
  });
  
  return literals;
}

// Helper to find method calls in Ruby
export function findRubyCalls(ast: any, methodNames: string[]) {
  const calls: any[] = [];
  
  function walk(node: any) {
    if (!node) return;
    
    if (node.type === 'CallNode' && methodNames.includes(node.name)) {
      calls.push(node);
    }
    
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          node[key].forEach(walk);
        } else {
          walk(node[key]);
        }
      }
    }
  }
  
  walk(ast.value);
  return calls;
}
