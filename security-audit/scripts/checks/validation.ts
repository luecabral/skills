import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { globFiles, grepInFiles } from '../utils.js';

export async function check(projectRoot: string, context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];

  const [routeFiles, allTsFiles] = await Promise.all([
    globFiles(projectRoot, [
      'app/api/**/*.ts',
      'app/api/**/*.tsx',
      'pages/api/**/*.ts',
      'src/app/api/**/*.ts',
      'src/pages/api/**/*.ts',
      'app/**/actions.ts',
      'app/**/actions.tsx',
      'src/app/**/actions.ts',
    ], context),
    globFiles(projectRoot, ['**/*.ts', '**/*.tsx'], context),
  ]);

  // C1 + C2 em paralelo (ambos buscam em routeFiles)
  const [zodImportMatches, parseMatches] = await Promise.all([
    grepInFiles(routeFiles, /from ['"]zod['"]|import.*\bz\b.*from|z\.object|z\.string|z\.number/i, context),
    grepInFiles(routeFiles, /\.parse\(|\.safeParse\(/, context),
  ]);

  // C1 — Importações de Zod em route handlers e server actions
  items.push({
    id: 'C1',
    description: 'Validação com schemas (Zod) em todos os endpoints',
    status: routeFiles.length === 0 ? 'warn' : zodImportMatches.length > 0 ? 'pass' : 'fail',
    severity: 'critical',
    detail:
      routeFiles.length === 0
        ? 'Nenhum route handler encontrado'
        : `Zod encontrado em ${zodImportMatches.length} de ${routeFiles.length} arquivo(s) de rota`,
    remediation: 'Importe e use Zod para validar todos os inputs de entrada nos route handlers',
  });

  // C2 — Uso de .parse() ou .safeParse() nos endpoints
  items.push({
    id: 'C2',
    description: 'Validação server-side com .parse() ou .safeParse()',
    status: parseMatches.length > 0 ? 'pass' : routeFiles.length === 0 ? 'warn' : 'fail',
    severity: 'critical',
    detail:
      parseMatches.length > 0
        ? `${parseMatches.length} chamada(s) de .parse()/.safeParse() encontrada(s)`
        : 'Nenhuma chamada .parse() ou .safeParse() encontrada nos endpoints',
    remediation: 'Use schema.safeParse(input) para validar e tratar erros de validação adequadamente',
  });

  // C3 — Validação de UUID com regex (dois greps em paralelo)
  const [uuidValidationMatches, uuidRegexLiteral] = await Promise.all([
    grepInFiles(allTsFiles, /[0-9a-f]{8}-[0-9a-f]{4}.*regex|uuid.*regex|regex.*uuid|z\.string\(\)\.uuid|isUUID|validate.*uuid|uuid.*valid/i, context),
    grepInFiles(allTsFiles, /\/\^?\[0-9a-f\]|\/\^[0-9a-fA-F]{8}|['"]\^?[0-9a-f]{8}-/i, context),
  ]);
  const hasUuidValidation = uuidValidationMatches.length > 0 || uuidRegexLiteral.length > 0;
  items.push({
    id: 'C3',
    description: 'Validação de UUID/IDs com regex estrito',
    status: hasUuidValidation ? 'pass' : 'warn',
    severity: 'high',
    detail: hasUuidValidation
      ? 'Validação de UUID encontrada'
      : 'Nenhuma validação explícita de UUID detectada — verifique se IDs são validados antes de consultas',
    remediation: 'Use z.string().uuid() do Zod ou regex /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/ para validar UUIDs',
  });

  // C4 — Validação apenas no cliente (anti-pattern)
  const clientOnlyValidation = await grepInFiles(
    await globFiles(projectRoot, ['app/**/*.tsx', 'components/**/*.tsx', 'src/**/*.tsx'], context),
    /onSubmit.*validate|handleSubmit.*validate|client.side.*valid/i,
    context,
  );
  const serverValidation = parseMatches.length + zodImportMatches.length;
  items.push({
    id: 'C4',
    description: 'Nunca confiar em valores do client para lógica de negócio',
    status: serverValidation > 0 ? 'pass' : clientOnlyValidation.length > 0 ? 'warn' : 'warn',
    severity: 'critical',
    detail:
      serverValidation > 0
        ? `Validação server-side presente (${serverValidation} ocorrência(s))`
        : 'Validação server-side não detectada — certifique-se de validar no servidor, não apenas no cliente',
    remediation: 'Toda validação de negócio deve ocorrer no servidor. Validação client-side é apenas UX.',
  });

  return {
    id: 'C',
    name: 'Business Logic & Validation',
    items,
  };
}
