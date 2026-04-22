function normalizeCategories(module, categories) {
    const list = Array.isArray(categories) ? categories : [categories];
    return list.map((category) => ({
        ...category,
        layer: category.layer || module.layer,
        scope: category.scope || module.scope,
        moduleId: category.moduleId || module.id,
    }));
}
export async function runAuditModules(modules, context) {
    const execution = [];
    const executable = [];
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
    const categoryGroups = await Promise.all(executable.map(async (module) => normalizeCategories(module, await module.run(context))));
    return {
        categories: categoryGroups.flat(),
        modules: execution,
    };
}
