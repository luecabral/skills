import type {
  AuditModule,
  CategoryResult,
  CheckContext,
  ModuleExecution,
} from './types.js';

export interface ModuleRunResult {
  categories: CategoryResult[];
  modules: ModuleExecution[];
}

function normalizeCategories(
  module: AuditModule,
  categories: CategoryResult | CategoryResult[],
): CategoryResult[] {
  const list = Array.isArray(categories) ? categories : [categories];
  return list.map((category) => ({
    ...category,
    layer: category.layer || module.layer,
    scope: category.scope || module.scope,
    moduleId: category.moduleId || module.id,
  }));
}

export async function runAuditModules(modules: AuditModule[], context: CheckContext): Promise<ModuleRunResult> {
  const execution: ModuleExecution[] = [];
  const executable: AuditModule[] = [];

  for (const module of modules) {
    const supported = await module.supports(context);
    if (!supported) {
      execution.push({
        id: module.id,
        name: module.name,
        layer: module.layer,
        scope: module.scope,
        status: 'skipped',
        reason: 'stack/context nao aplicavel',
      });
      continue;
    }

    execution.push({
      id: module.id,
      name: module.name,
      layer: module.layer,
      scope: module.scope,
      status: 'executed',
    });
    executable.push(module);
  }

  const settled = await Promise.allSettled(
    executable.map(async (module) => {
      const result = await module.run(context);
      return { module, result };
    }),
  );

  const categoryGroups: CategoryResult[][] = [];
  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i];
    const module = executable[i];
    if (outcome.status === 'fulfilled') {
      categoryGroups.push(normalizeCategories(module, outcome.value.result));
    } else {
      // Módulo crashou: emite categoria sintética com erro, não derruba a auditoria
      const errorMsg = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
      const entry = execution.find((e) => e.id === module.id);
      if (entry) {
        entry.status = 'skipped';
        entry.reason = `erro na execução: ${errorMsg}`;
      }
      categoryGroups.push([
        {
          id: module.id,
          name: module.name,
          layer: module.layer,
          scope: module.scope,
          moduleId: module.id,
          items: [
            {
              id: `${module.id}-error`,
              description: `Módulo ${module.name} falhou durante execução`,
              status: 'warn',
              severity: 'high',
              detail: errorMsg,
              remediation: 'Inspecione o stack trace do módulo; pode indicar arquivo corrompido ou bug no check',
            },
          ],
        },
      ]);
    }
  }

  return {
    categories: categoryGroups.flat(),
    modules: execution,
  };
}
