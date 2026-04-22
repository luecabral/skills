import type { AuditModule, CheckContext } from '../types.js';

import { check as checkAccessControl } from '../checks/access-control.js';
import { check as checkAuthSession } from '../checks/auth-session.js';
import { check as checkValidation } from '../checks/validation.js';
import { check as checkClientSide } from '../checks/client-side.js';
import { check as checkInjection } from '../checks/injection.js';
import { check as checkFiles } from '../checks/files.js';
import { check as checkSecretsCrypto } from '../checks/secrets-crypto.js';
import { check as checkHardening } from '../checks/hardening.js';
import { check as checkDependencies } from '../checks/dependencies.js';
import { check as checkTests } from '../checks/tests.js';
import { check as checkErrorHandling } from '../checks/error-handling.js';
import { check as checkRailsStack } from '../checks/rails-stack.js';
import { check as checkPostgresRails } from '../checks/postgres-rails.js';
import { check as checkRedisInfra } from '../checks/redis-infra.js';
import { check as checkSidekiqInfra } from '../checks/sidekiq-infra.js';
import { check as checkHotwireFrontend } from '../checks/hotwire-frontend.js';

type ModuleCheckFn = (projectRoot: string, context: CheckContext) => ReturnType<typeof checkAuthSession>;

function moduleFromCheck(params: {
  id: string;
  name: string;
  layer: AuditModule['layer'];
  scope: AuditModule['scope'];
  supports?: AuditModule['supports'];
  runCheck: ModuleCheckFn;
}): AuditModule {
  return {
    id: params.id,
    name: params.name,
    layer: params.layer,
    scope: params.scope,
    supports: params.supports || (() => true),
    run: async (context) => params.runCheck(context.projectRoot, context),
  };
}

export const AUDIT_MODULES: AuditModule[] = [
  {
    id: 'custom-rules',
    name: 'Regras Customizadas',
    layer: 'core',
    scope: 'generic',
    supports: () => true,
    run: async (context) => {
      const { runCustomRules } = await import('../rules-loader.js');
      const result = await runCustomRules(context.projectRoot, context);
      return result ? [result] : [];
    },
  },
  {
    id: 'manual-checklist',
    name: 'Verificações Manuais',
    layer: 'core',
    scope: 'generic',
    supports: () => true,
    run: async (context) => {
      const { check } = await import('../checks/manual-checklist.js');
      return check(context.projectRoot, context);
    },
  },
  moduleFromCheck({
    id: 'core-auth-session',
    name: 'Core Auth & Session',
    layer: 'core',
    scope: 'generic',
    runCheck: checkAuthSession,
  }),
  moduleFromCheck({
    id: 'core-validation',
    name: 'Core Validation',
    layer: 'core',
    scope: 'generic',
    runCheck: checkValidation,
  }),
  moduleFromCheck({
    id: 'core-client',
    name: 'Core Client Security',
    layer: 'core',
    scope: 'generic',
    runCheck: checkClientSide,
  }),
  moduleFromCheck({
    id: 'core-injection',
    name: 'Core Injection',
    layer: 'core',
    scope: 'generic',
    runCheck: checkInjection,
  }),
  moduleFromCheck({
    id: 'core-files',
    name: 'Core Files & Misconfig',
    layer: 'core',
    scope: 'generic',
    runCheck: checkFiles,
  }),
  moduleFromCheck({
    id: 'core-secrets',
    name: 'Core Secrets & Crypto',
    layer: 'core',
    scope: 'generic',
    runCheck: checkSecretsCrypto,
  }),
  moduleFromCheck({
    id: 'core-hardening',
    name: 'Core Hardening',
    layer: 'core',
    scope: 'generic',
    runCheck: checkHardening,
  }),
  moduleFromCheck({
    id: 'core-dependencies',
    name: 'Core Dependencies',
    layer: 'core',
    scope: 'generic',
    runCheck: checkDependencies,
  }),
  moduleFromCheck({
    id: 'core-tests',
    name: 'Core Security Tests',
    layer: 'core',
    scope: 'generic',
    runCheck: checkTests,
  }),
  moduleFromCheck({
    id: 'core-error-handling',
    name: 'Core Error Handling',
    layer: 'core',
    scope: 'generic',
    runCheck: checkErrorHandling,
  }),
  moduleFromCheck({
    id: 'data-postgres-supabase',
    name: 'Postgres Supabase Access Control',
    layer: 'data',
    scope: 'stack-specific',
    supports: (context) => context.stack.services.supabase,
    runCheck: checkAccessControl,
  }),
  moduleFromCheck({
    id: 'stack-rails',
    name: 'Rails Stack Security',
    layer: 'stack',
    scope: 'stack-specific',
    supports: (context) => context.stack.frameworks.rails,
    runCheck: checkRailsStack,
  }),
  moduleFromCheck({
    id: 'data-postgres-rails',
    name: 'Postgres Rails Data Layer',
    layer: 'data',
    scope: 'stack-specific',
    supports: (context) => context.stack.frameworks.rails && context.stack.services.postgres,
    runCheck: checkPostgresRails,
  }),
  moduleFromCheck({
    id: 'infra-redis',
    name: 'Redis Infrastructure',
    layer: 'infra',
    scope: 'stack-specific',
    supports: (context) => context.stack.services.redis,
    runCheck: checkRedisInfra,
  }),
  moduleFromCheck({
    id: 'infra-sidekiq',
    name: 'Sidekiq Infrastructure',
    layer: 'infra',
    scope: 'stack-specific',
    supports: (context) => context.stack.services.sidekiq,
    runCheck: checkSidekiqInfra,
  }),
  moduleFromCheck({
    id: 'frontend-hotwire',
    name: 'Hotwire Frontend Security',
    layer: 'frontend',
    scope: 'stack-specific',
    supports: (context) => context.stack.frameworks.hotwire,
    runCheck: checkHotwireFrontend,
  }),
];
