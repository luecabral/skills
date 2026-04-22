import { readFile, access, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readFileContent(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export async function grepInFile(filePath: string, pattern: RegExp): Promise<{ line: number; text: string }[]> {
  const content = await readFileContent(filePath);
  if (!content) return [];

  const results: { line: number; text: string }[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      results.push({ line: i + 1, text: lines[i].trim() });
    }
  }
  return results;
}

export async function grepInFiles(
  files: string[],
  pattern: RegExp,
): Promise<{ file: string; line: number; text: string }[]> {
  const results: { file: string; line: number; text: string }[] = [];
  for (const file of files) {
    const matches = await grepInFile(file, pattern);
    for (const match of matches) {
      results.push({ file, ...match });
    }
  }
  return results;
}

export async function globFiles(rootDir: string, patterns: string[]): Promise<string[]> {
  const results: string[] = [];

  async function walkDir(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;

        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else if (entry.isFile()) {
          const relPath = relative(rootDir, fullPath);
          for (const pattern of patterns) {
            if (matchGlob(relPath, pattern)) {
              results.push(fullPath);
              break;
            }
          }
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  await walkDir(rootDir);
  return results;
}

function matchGlob(filePath: string, pattern: string): boolean {
  // Normalize pattern: **/ at the start or /**/ in the middle should also match zero directories
  const regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*\//g, '<<GLOBSTAR_SLASH>>')
    .replace(/\*\*/g, '<<GLOBSTAR>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<GLOBSTAR_SLASH>>/g, '(.+/)?')
    .replace(/<<GLOBSTAR>>/g, '.*');
  return new RegExp(`^${regexStr}$`).test(filePath);
}

export async function findProjectRoot(startDir: string): Promise<string> {
  let dir = startDir;
  const rootMarkers = [
    'package.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'package-lock.json',
    'pyproject.toml',
    'go.mod',
    'Cargo.toml',
    '.git',
  ];

  while (true) {
    for (const marker of rootMarkers) {
      if (await fileExists(join(dir, marker))) return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  const content = await readFileContent(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function countMatches(files: string[], pattern: RegExp): Promise<number> {
  let count = 0;
  for (const file of files) {
    const matches = await grepInFile(file, pattern);
    count += matches.length;
  }
  return count;
}

export async function fileContains(filePath: string, pattern: RegExp): Promise<boolean> {
  const content = await readFileContent(filePath);
  if (!content) return false;
  return pattern.test(content);
}

export async function getDirectoryFiles(dir: string, extension?: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && (!extension || e.name.endsWith(extension)))
      .map((e) => join(dir, e.name));
  } catch {
    return [];
  }
}
