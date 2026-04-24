import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { CheckContext, Severity } from './types.js';
import { getProjectMemoryDir } from './memory.js';
import { fileExists } from './utils.js';

export interface OsvVuln {
  id: string;
  severity: Severity;
  summary: string;
  fixedIn?: string;
}

type OsvEcosystem = 'npm' | 'RubyGems';

interface OsvPackage {
  name: string;
  version: string;
}

interface OsvCacheEntry {
  timestamp: number;
  vulns: OsvVuln[];
}

interface OsvCache {
  entries: Record<string, OsvCacheEntry>;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const OSV_BATCH_SIZE = 100;

function cacheKey(ecosystem: OsvEcosystem, pkg: OsvPackage): string {
  return `${ecosystem}:${pkg.name}:${pkg.version}`;
}

function cachePath(projectRoot: string): string {
  return join(getProjectMemoryDir(projectRoot), 'osv-cache.json');
}

function severityFromScore(score: number): Severity {
  if (score >= 9) return 'critical';
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function severityRank(severity: Severity): number {
  if (severity === 'critical') return 4;
  if (severity === 'high') return 3;
  if (severity === 'medium') return 2;
  return 1;
}

function severityFromOsv(vuln: any): Severity {
  const cvss = vuln?.severity
    ?.map((entry: any) => Number(String(entry?.score || '').match(/\d+(?:\.\d+)?/)?.[0]))
    .filter((score: number) => Number.isFinite(score));
  if (cvss?.length) {
    return severityFromScore(Math.max(...cvss));
  }

  const databaseSpecificSeverity = String(vuln?.database_specific?.severity || '').toLowerCase();
  if (databaseSpecificSeverity === 'critical') return 'critical';
  if (databaseSpecificSeverity === 'high') return 'high';
  if (databaseSpecificSeverity === 'medium' || databaseSpecificSeverity === 'moderate') return 'medium';
  return 'low';
}

function fixedVersionFromOsv(vuln: any): string | undefined {
  for (const affected of vuln?.affected || []) {
    for (const range of affected?.ranges || []) {
      for (const event of range?.events || []) {
        if (typeof event?.fixed === 'string') return event.fixed;
      }
    }
  }
  return undefined;
}

function normalizeVuln(vuln: any): OsvVuln {
  return {
    id: String(vuln?.id || vuln?.aliases?.[0] || 'OSV-UNKNOWN'),
    severity: severityFromOsv(vuln),
    summary: String(vuln?.summary || vuln?.details || 'Vulnerabilidade conhecida'),
    fixedIn: fixedVersionFromOsv(vuln),
  };
}

async function loadCache(projectRoot: string): Promise<OsvCache> {
  const path = cachePath(projectRoot);
  if (!(await fileExists(path))) return { entries: {} };
  try {
    return JSON.parse(await readFile(path, 'utf-8')) as OsvCache;
  } catch {
    return { entries: {} };
  }
}

async function saveCache(projectRoot: string, cache: OsvCache): Promise<void> {
  const path = cachePath(projectRoot);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(cache, null, 2), 'utf-8');
}

async function loadMockResponse(): Promise<Record<string, OsvVuln[]> | null> {
  const mockPath = process.env.SECURITY_AUDIT_OSV_MOCK_FILE;
  if (!mockPath) return null;
  try {
    return JSON.parse(await readFile(mockPath, 'utf-8')) as Record<string, OsvVuln[]>;
  } catch {
    return {};
  }
}

export async function queryOsv(
  ecosystem: OsvEcosystem,
  packageName: string,
  version: string,
  context?: CheckContext,
): Promise<OsvVuln[]> {
  const result = await queryOsvBatch(ecosystem, [{ name: packageName, version }], context);
  return result.get(packageName) || [];
}

export async function queryOsvBatch(
  ecosystem: OsvEcosystem,
  packages: OsvPackage[],
  context?: CheckContext,
): Promise<Map<string, OsvVuln[]>> {
  const result = new Map<string, OsvVuln[]>();
  if (packages.length === 0) return result;

  const projectRoot = context?.projectRoot || process.cwd();
  const now = Date.now();
  const cache = await loadCache(projectRoot);
  const mock = await loadMockResponse();
  const missing: OsvPackage[] = [];

  for (const pkg of packages) {
    const key = cacheKey(ecosystem, pkg);
    const cached = cache.entries[key];
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      result.set(pkg.name, cached.vulns);
      continue;
    }
    missing.push(pkg);
  }

  if (missing.length === 0) return result;

  if (mock) {
    for (const pkg of missing) {
      const key = cacheKey(ecosystem, pkg);
      const vulns = mock[key] || [];
      cache.entries[key] = { timestamp: now, vulns };
      result.set(pkg.name, vulns);
    }
    await saveCache(projectRoot, cache);
    return result;
  }

  if (process.env.NO_NETWORK === '1') {
    return result;
  }

  try {
    const batch = missing.slice(0, OSV_BATCH_SIZE);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch('https://api.osv.dev/v1/querybatch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        queries: batch.map((pkg) => ({
          package: { ecosystem, name: pkg.name },
          version: pkg.version,
        })),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return result;

    const body = await response.json() as { results?: { vulns?: any[] }[] };
    for (let i = 0; i < batch.length; i++) {
      const pkg = batch[i];
      const vulns = (body.results?.[i]?.vulns || [])
        .map(normalizeVuln)
        .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
      cache.entries[cacheKey(ecosystem, pkg)] = { timestamp: now, vulns };
      result.set(pkg.name, vulns);
    }
    await saveCache(projectRoot, cache);
  } catch {
    return result;
  }

  return result;
}

export function packageIdentityHash(ecosystem: OsvEcosystem, pkg: OsvPackage): string {
  return createHash('sha256').update(cacheKey(ecosystem, pkg)).digest('hex').slice(0, 12);
}
