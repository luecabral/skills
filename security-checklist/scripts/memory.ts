import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { ProjectConfig, AuditHistory, AuditHistoryEntry, AuditReport, ExcludedItem } from './types.js';
import { fileExists } from './utils.js';

const SKILL_DIR = dirname(dirname(new URL(import.meta.url).pathname));
const MEMORY_DIR = join(SKILL_DIR, 'memory');

export function getProjectHash(projectRoot: string): string {
  return createHash('sha256').update(projectRoot).digest('hex').slice(0, 12);
}

function getProjectMemoryDir(projectRoot: string): string {
  return join(MEMORY_DIR, getProjectHash(projectRoot));
}

function getConfigPath(projectRoot: string): string {
  return join(getProjectMemoryDir(projectRoot), 'config.json');
}

function getHistoryPath(projectRoot: string): string {
  return join(getProjectMemoryDir(projectRoot), 'history.json');
}

export async function loadConfig(projectRoot: string): Promise<ProjectConfig | null> {
  const configPath = getConfigPath(projectRoot);
  if (!(await fileExists(configPath))) return null;
  try {
    const content = await readFile(configPath, 'utf-8');
    return JSON.parse(content) as ProjectConfig;
  } catch {
    return null;
  }
}

export async function saveConfig(projectRoot: string, config: ProjectConfig): Promise<void> {
  const configPath = getConfigPath(projectRoot);
  await mkdir(dirname(configPath), { recursive: true });
  config.updatedAt = new Date().toISOString();
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function createDefaultConfig(projectRoot: string): ProjectConfig {
  const name = projectRoot.split('/').pop() || 'unknown';
  return {
    name,
    type: 'web-app',
    sensitiveData: true,
    isPublic: true,
    excludedItems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function loadHistory(projectRoot: string): Promise<AuditHistory> {
  const historyPath = getHistoryPath(projectRoot);
  if (!(await fileExists(historyPath))) return { entries: [] };
  try {
    const content = await readFile(historyPath, 'utf-8');
    return JSON.parse(content) as AuditHistory;
  } catch {
    return { entries: [] };
  }
}

export async function saveAuditResult(projectRoot: string, report: AuditReport): Promise<void> {
  const history = await loadHistory(projectRoot);

  const entry: AuditHistoryEntry = {
    timestamp: report.timestamp,
    score: report.score,
    breakdown: report.breakdown,
    criticalFailures: report.criticalFailures.map((item) => `[${item.id}] ${item.description}`),
  };

  history.entries.push(entry);

  // Keep last 50 entries
  if (history.entries.length > 50) {
    history.entries = history.entries.slice(-50);
  }

  const historyPath = getHistoryPath(projectRoot);
  await mkdir(dirname(historyPath), { recursive: true });
  await writeFile(historyPath, JSON.stringify(history, null, 2), 'utf-8');
}

export async function getLastAudit(projectRoot: string): Promise<AuditHistoryEntry | null> {
  const history = await loadHistory(projectRoot);
  if (history.entries.length === 0) return null;
  return history.entries[history.entries.length - 1];
}

export async function markItemAsNA(
  projectRoot: string,
  itemId: string,
  reason: string,
  author: string,
): Promise<void> {
  const config = (await loadConfig(projectRoot)) || createDefaultConfig(projectRoot);

  // Remove existing exclusion for this item if any
  config.excludedItems = config.excludedItems.filter((e) => e.itemId !== itemId);

  const exclusion: ExcludedItem = {
    itemId,
    reason,
    author,
    date: new Date().toISOString().split('T')[0],
  };

  config.excludedItems.push(exclusion);
  await saveConfig(projectRoot, config);
}

export async function isItemExcluded(config: ProjectConfig | null, itemId: string): Promise<boolean> {
  if (!config) return false;
  return config.excludedItems.some((e) => e.itemId === itemId);
}
