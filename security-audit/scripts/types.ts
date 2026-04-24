export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip';
export type CheckScope = 'generic' | 'stack-specific';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'unknown';
export type ModuleLayer = 'core' | 'data' | 'infra' | 'stack' | 'frontend';
export type Ecosystem = 'node' | 'ruby' | 'mixed' | 'unknown';

export interface StackProfile {
  ecosystem: Ecosystem;
  packageManager: PackageManager;
  frameworks: {
    nextjs: boolean;
    express: boolean;
    rails: boolean;
    hotwire: boolean;
  };
  services: {
    supabase: boolean;
    postgres: boolean;
    redis: boolean;
    sidekiq: boolean;
  };
  tooling: {
    tailwind: boolean;
    esbuild: boolean;
  };
  languages: {
    ruby: boolean;
    node: boolean;
  };
  warnings: string[];
}

export interface CheckContext {
  projectRoot: string;
  stack: StackProfile;
  io?: {
    cachedGlob: (patterns: string[]) => Promise<string[]>;
    cachedRead: (path: string) => Promise<string | null>;
  };
}

export interface AuditModule {
  id: string;
  name: string;
  layer: ModuleLayer;
  scope: CheckScope;
  supports: (context: CheckContext) => boolean | Promise<boolean>;
  run: (context: CheckContext) => Promise<CategoryResult | CategoryResult[]>;
}

export interface ModuleExecution {
  id: string;
  name: string;
  layer: ModuleLayer;
  scope: CheckScope;
  status: 'executed' | 'skipped';
  reason?: string;
}

export interface CheckItem {
  id: string;
  description: string;
  status: CheckStatus;
  severity: Severity;
  scope?: CheckScope;
  file?: string;
  line?: number;
  detail?: string;
  remediation?: string;
}

export interface CategoryResult {
  id: string;
  name: string;
  layer?: ModuleLayer;
  scope?: CheckScope;
  moduleId?: string;
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
  modules: ModuleExecution[];
  categories: CategoryResult[];
  gate: 'pass' | 'fail';
  coverage: { passed: number; total: number; percentage: number };
  score: { passed: number; total: number; percentage: number };
  breakdown: SeverityBreakdown;
  criticalFailures: CheckItem[];
  highFailures?: CheckItem[];
}

export interface ExcludedItem {
  itemId: string;
  reason: string;
  author: string;
  date: string;
}

export interface CustomRule {
  id: string;
  description: string;
  severity: Severity;
  glob: string;
  pattern?: string;
  ast?: boolean;
  expect: 'absent' | 'present';
  remediation?: string;
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
  gate?: 'pass' | 'fail';
  coverage?: { passed: number; total: number; percentage: number };
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
