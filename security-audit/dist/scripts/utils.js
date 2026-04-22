import { readFile, access, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
export async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export async function readFileContent(filePath, context) {
    if (context?.io?.cachedRead) {
        return context.io.cachedRead(filePath);
    }
    try {
        return await readFile(filePath, 'utf-8');
    }
    catch {
        return null;
    }
}
export async function grepInFile(filePath, pattern, context) {
    const content = await readFileContent(filePath, context);
    if (!content)
        return [];
    const results = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
            results.push({ line: i + 1, text: lines[i].trim() });
        }
    }
    return results;
}
export async function grepInFiles(files, pattern, context) {
    const results = [];
    for (const file of files) {
        const matches = await grepInFile(file, pattern, context);
        for (const match of matches) {
            results.push({ file, ...match });
        }
    }
    return results;
}
export async function globFiles(rootDir, patterns, context) {
    if (context?.io?.cachedGlob) {
        return context.io.cachedGlob(patterns);
    }
    const results = [];
    async function walkDir(dir) {
        try {
            const entries = await readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dir, entry.name);
                if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git')
                    continue;
                if (entry.isDirectory()) {
                    await walkDir(fullPath);
                }
                else if (entry.isFile()) {
                    const relPath = relative(rootDir, fullPath);
                    for (const pattern of patterns) {
                        if (matchGlob(relPath, pattern)) {
                            results.push(fullPath);
                            break;
                        }
                    }
                }
            }
        }
        catch {
            // Skip inaccessible directories
        }
    }
    await walkDir(rootDir);
    return results;
}
function matchGlob(filePath, pattern) {
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
export async function findProjectRoot(startDir) {
    let dir = startDir;
    const rootMarkers = [
        'package.json',
        'pnpm-lock.yaml',
        'yarn.lock',
        'package-lock.json',
        'Gemfile',
        'Gemfile.lock',
        'pyproject.toml',
        'go.mod',
        'Cargo.toml',
        '.git',
    ];
    while (true) {
        for (const marker of rootMarkers) {
            if (await fileExists(join(dir, marker)))
                return dir;
        }
        const parent = dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return startDir;
}
export async function readJsonFile(filePath) {
    const content = await readFileContent(filePath);
    if (!content)
        return null;
    try {
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
export async function countMatches(files, pattern, context) {
    let count = 0;
    for (const file of files) {
        const matches = await grepInFile(file, pattern, context);
        count += matches.length;
    }
    return count;
}
export async function fileContains(filePath, pattern, context) {
    const content = await readFileContent(filePath, context);
    if (!content)
        return false;
    return pattern.test(content);
}
export async function getDirectoryFiles(dir, extension) {
    try {
        const entries = await readdir(dir, { withFileTypes: true });
        return entries
            .filter((e) => e.isFile() && (!extension || e.name.endsWith(extension)))
            .map((e) => join(dir, e.name));
    }
    catch {
        return [];
    }
}
