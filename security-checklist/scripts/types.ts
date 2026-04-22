export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip';
export type CheckScope = 'generic' | 'stack-specific';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'unknown';

export interface StackProfile {
  ecosystem: 'node' | 'unknown';
  packageManager: PackageManager;
  frameworks: {
    nextjs: boolean;
    express: boolean;
  };
  services: {
    supabase: boolean;
  };
}

export interface CheckContext {
  projectRoot: string;
  stack: StackProfile;
}

export interface CheckItem {
  id: string;
  description: string;
  status: CheckStatus;
  severity: Severity;
  scope?: CheckScope;
  file?: string;
  detail?: string;
  remediation?: string;
}

export interface CategoryResult {
  id: string;
  name: string;
  scope?: CheckScope;
  items: CheckItem[];
}

export interface SeverityBreakdown {
  critical: { passed: number; total: number };
  high: { passed: number; total: number };
  medium: { passed: number; total: number };
  low: { passed: number; total: number };
}

export interface AuditReport {
  timestamp: string;
  projectName: string;
  projectRoot: string;
  stack: StackProfile;
  categories: CategoryResult[];
  score: { passed: number; total: number; percentage: number };
  breakdown: SeverityBreakdown;
  criticalFailures: CheckItem[];
}

export interface ExcludedItem {
  itemId: string;
  reason: string;
  author: string;
  date: string;
}

export interface ProjectConfig {
  name: string;
  type: string;
  sensitiveData: boolean;
  isPublic: boolean;
  excludedItems: ExcludedItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditHistoryEntry {
  timestamp: string;
  score: { passed: number; total: number; percentage: number };
  breakdown: SeverityBreakdown;
  criticalFailures: string[];
}

export interface AuditHistory {
  entries: AuditHistoryEntry[];
}

export const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: '\u{1F534}',
  high: '\u{1F7E0}',
  medium: '\u{1F7E1}',
  low: '\u{1F535}',
};

export const STATUS_EMOJI: Record<CheckStatus, string> = {
  pass: '\u2705',
  fail: '\u274C',
  warn: '\u26A0\uFE0F',
  skip: '\u23ED\uFE0F',
};
