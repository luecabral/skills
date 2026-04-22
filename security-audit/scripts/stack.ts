import { join } from 'node:path';
import type { PackageManager, StackProfile } from './types.js';
import { fileExists, globFiles, readJsonFile } from './utils.js';

interface PackageJsonLike {
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function hasDependency(pkg: PackageJsonLike | null, name: string): boolean {
  if (!pkg) return false;
  return Boolean(
    (pkg.dependencies && name in pkg.dependencies) ||
      (pkg.devDependencies && name in pkg.devDependencies),
  );
}

function parsePackageManager(packageManager?: string): PackageManager {
  if (!packageManager) return 'unknown';
  if (packageManager.startsWith('pnpm@')) return 'pnpm';
  if (packageManager.startsWith('yarn@')) return 'yarn';
  if (packageManager.startsWith('npm@')) return 'npm';
  return 'unknown';
}

export async function detectStack(projectRoot: string): Promise<StackProfile> {
  const packageJsonPath = join(projectRoot, 'package.json');
  const packageJson = (await readJsonFile<PackageJsonLike>(packageJsonPath)) || null;

  const hasPackageJson = await fileExists(packageJsonPath);
  const hasPnpmLock = await fileExists(join(projectRoot, 'pnpm-lock.yaml'));
  const hasYarnLock = await fileExists(join(projectRoot, 'yarn.lock'));
  const hasNpmLock = await fileExists(join(projectRoot, 'package-lock.json'));

  let packageManager = parsePackageManager(packageJson?.packageManager);
  if (packageManager === 'unknown') {
    if (hasPnpmLock) packageManager = 'pnpm';
    else if (hasYarnLock) packageManager = 'yarn';
    else if (hasNpmLock || hasPackageJson) packageManager = 'npm';
  }

  const nextConfigFiles = await globFiles(projectRoot, [
    'next.config.ts',
    'next.config.js',
    'next.config.mjs',
  ]);
  const hasNextRouting = (await globFiles(projectRoot, ['app/**/page.tsx', 'src/app/**/page.tsx'])).length > 0;
  const hasNextjs =
    hasDependency(packageJson, 'next') || nextConfigFiles.length > 0 || hasNextRouting;

  const hasExpress = hasDependency(packageJson, 'express');

  const hasSupabaseConfig = await fileExists(join(projectRoot, 'supabase', 'config.toml'));
  const hasSupabaseMigrations = await fileExists(join(projectRoot, 'supabase', 'migrations'));
  const hasSupabaseDeps =
    hasDependency(packageJson, '@supabase/supabase-js') || hasDependency(packageJson, '@supabase/ssr');
  const hasSupabase = hasSupabaseConfig || hasSupabaseMigrations || hasSupabaseDeps;

  return {
    ecosystem: hasPackageJson ? 'node' : 'unknown',
    packageManager,
    frameworks: {
      nextjs: hasNextjs,
      express: hasExpress,
    },
    services: {
      supabase: hasSupabase,
    },
  };
}
