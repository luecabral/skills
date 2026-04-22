import { join } from 'node:path';
import type { PackageManager, StackProfile } from './types.js';
import { fileExists, globFiles, readFileContent, readJsonFile } from './utils.js';

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

function hasGem(gemfile: string | null, gemName: string): boolean {
  if (!gemfile) return false;
  const pattern = new RegExp(`^\\s*gem\\s+['"]${gemName}['"]`, 'm');
  return pattern.test(gemfile);
}

function detectEcosystem(hasNode: boolean, hasRuby: boolean): StackProfile['ecosystem'] {
  if (hasNode && hasRuby) return 'mixed';
  if (hasNode) return 'node';
  if (hasRuby) return 'ruby';
  return 'unknown';
}

export async function detectStack(projectRoot: string): Promise<StackProfile> {
  const packageJsonPath = join(projectRoot, 'package.json');
  const packageJson = (await readJsonFile<PackageJsonLike>(packageJsonPath)) || null;
  const gemfilePath = join(projectRoot, 'Gemfile');
  const gemfile = await readFileContent(gemfilePath);
  const databaseYml = await readFileContent(join(projectRoot, 'config', 'database.yml'));

  const hasPackageJson = await fileExists(packageJsonPath);
  const hasGemfile = await fileExists(gemfilePath);
  const hasRailsAppFile = await fileExists(join(projectRoot, 'config', 'application.rb'));
  const hasGemLock = await fileExists(join(projectRoot, 'Gemfile.lock'));
  const hasRuby = hasGemfile || hasGemLock || hasRailsAppFile;
  const hasNode = hasPackageJson;
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
  const hasRailsGem = hasGem(gemfile, 'rails');
  const hasRails = hasRailsGem || hasRailsAppFile;

  const hasSupabaseConfig = await fileExists(join(projectRoot, 'supabase', 'config.toml'));
  const hasSupabaseMigrations = await fileExists(join(projectRoot, 'supabase', 'migrations'));
  const hasSupabaseDeps =
    hasDependency(packageJson, '@supabase/supabase-js') || hasDependency(packageJson, '@supabase/ssr');
  const hasSupabase = hasSupabaseConfig || hasSupabaseMigrations || hasSupabaseDeps;

  const hasPostgresGem = hasGem(gemfile, 'pg');
  const hasPostgresAdapter = Boolean(databaseYml && /adapter:\s*postgresql/i.test(databaseYml));
  const hasPostgres = hasSupabase || hasPostgresGem || hasPostgresAdapter;

  const hasRedisGem = hasGem(gemfile, 'redis') || hasGem(gemfile, 'redis-rails');
  const hasRedisConfig = await fileExists(join(projectRoot, 'config', 'redis.yml'));
  const hasRedisInitializer = await fileExists(join(projectRoot, 'config', 'initializers', 'redis.rb'));
  const hasRedis = hasRedisGem || hasRedisConfig || hasRedisInitializer;

  const hasSidekiqGem = hasGem(gemfile, 'sidekiq');
  const hasSidekiqConfig = await fileExists(join(projectRoot, 'config', 'sidekiq.yml'));
  const hasSidekiq = hasSidekiqGem || hasSidekiqConfig;

  const hasTurboGem = hasGem(gemfile, 'turbo-rails');
  const hasStimulusGem = hasGem(gemfile, 'stimulus-rails');
  const hasStimulusControllers = await fileExists(join(projectRoot, 'app', 'javascript', 'controllers'));
  const hasHotwire = hasTurboGem || hasStimulusGem || hasStimulusControllers;

  const hasTailwindNode = hasDependency(packageJson, 'tailwindcss');
  const hasTailwindGem = hasGem(gemfile, 'tailwindcss-rails');
  const hasTailwindConfig =
    (await fileExists(join(projectRoot, 'tailwind.config.js'))) ||
    (await fileExists(join(projectRoot, 'tailwind.config.cjs'))) ||
    (await fileExists(join(projectRoot, 'tailwind.config.ts')));
  const hasTailwind = hasTailwindNode || hasTailwindGem || hasTailwindConfig;

  const hasEsbuildDep = hasDependency(packageJson, 'esbuild');
  const hasEsbuildConfig =
    (await fileExists(join(projectRoot, 'esbuild.config.js'))) ||
    (await fileExists(join(projectRoot, 'esbuild.config.mjs'))) ||
    (await fileExists(join(projectRoot, 'config', 'esbuild.js')));
  const hasEsbuild = hasEsbuildDep || hasEsbuildConfig;

  const warnings: string[] = [];
  if (hasGemfile && !hasRails) {
    warnings.push('Gemfile detectado, mas Rails não foi identificado. Se este for um projeto Rails, por favor reporte.');
  }
  if (hasPackageJson && !hasNextjs && !hasExpress) {
    warnings.push('package.json detectado, mas nenhum framework JS conhecido (Next.js, Express) foi identificado. Se estiver usando outro framework, por favor reporte.');
  }

  return {
    ecosystem: detectEcosystem(hasNode, hasRuby),
    packageManager,
    frameworks: {
      nextjs: hasNextjs,
      express: hasExpress,
      rails: hasRails,
      hotwire: hasHotwire,
    },
    services: {
      supabase: hasSupabase,
      postgres: hasPostgres,
      redis: hasRedis,
      sidekiq: hasSidekiq,
    },
    tooling: {
      tailwind: hasTailwind,
      esbuild: hasEsbuild,
    },
    languages: {
      ruby: hasRuby,
      node: hasNode,
    },
    warnings,
  };
}
