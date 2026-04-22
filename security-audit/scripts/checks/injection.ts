import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { globFiles, grepInFiles } from '../utils.js';

export async function check(projectRoot: string, context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];

  const [allTsFiles, serverFiles] = await Promise.all([
    globFiles(projectRoot, ['**/*.ts', '**/*.tsx'], context),
    globFiles(projectRoot, [
      'app/api/**/*.ts',
      'pages/api/**/*.ts',
      'src/app/api/**/*.ts',
      'src/pages/api/**/*.ts',
      'lib/**/*.ts',
      'server/**/*.ts',
      'src/lib/**/*.ts',
    ], context)
  ]);

  // E1 — Detecção de eval() com variáveis (anti-pattern)
  // E2 — Detecção de new Function() (anti-pattern)
  // E3 — exec/execSync com interpolação de variáveis (anti-pattern)
  // E4 — Template literals em queries SQL (anti-pattern)
  // E5 — Uso de cliente/ORM com queries parametrizadas
  const [
    evalMatches,
    newFunctionMatches,
    execMatches,
    execWithInterpolation,
    sqlTemplateMatchesRaw,
    parameterizedClientMatches,
    rawSqlMatches
  ] = await Promise.all([
    grepInFiles(allTsFiles, /\beval\s*\(/, context),
    grepInFiles(allTsFiles, /new\s+Function\s*\(/, context),
    grepInFiles(serverFiles, /\bexec\s*\(|execSync\s*\(/, context),
    grepInFiles(serverFiles, /exec\s*\(`[^`]*\$\{|execSync\s*\(`[^`]*\$\{/, context),
    grepInFiles(serverFiles, /`[^`]*SELECT[^`]*\$\{|`[^`]*INSERT[^`]*\$\{|`[^`]*UPDATE[^`]*\$\{|`[^`]*DELETE[^`]*\$\{/i, context),
    grepInFiles(serverFiles, /\.from\(|supabase\.\w+\(|rpc\(|prisma\.|knex\(|drizzle|sequelize|mongoose|query\([^`]*\$\d+/i, context),
    grepInFiles(serverFiles, /\.query\s*\(`|pg\.query|pool\.query/i, context)
  ]);
  items.push({
    id: 'E1',
    description: 'Nunca eval() com input do usuário',
    status: evalMatches.length > 0 ? 'fail' : 'pass',
    severity: 'critical',
    detail: evalMatches.length > 0
      ? `${evalMatches.length} uso(s) de eval() encontrado(s) — verifique se input do usuário é passado`
      : 'Nenhum uso de eval() detectado',
    file: evalMatches[0]?.file,
    remediation: 'Remova eval(). Se necessário, use alternativas seguras como JSON.parse() para dados ou funções nomeadas',
  });

  // E2 — Detecção de new Function() (anti-pattern)
  items.push({
    id: 'E2',
    description: 'Nunca new Function() com input do usuário',
    status: newFunctionMatches.length > 0 ? 'fail' : 'pass',
    severity: 'critical',
    detail: newFunctionMatches.length > 0
      ? `${newFunctionMatches.length} uso(s) de new Function() encontrado(s)`
      : 'Nenhum uso de new Function() detectado',
    file: newFunctionMatches[0]?.file,
    remediation: 'Substitua new Function() por lógica explícita. new Function() executa código arbitrário.',
  });

  // E3 — exec/execSync com interpolação de variáveis (anti-pattern)
  items.push({
    id: 'E3',
    description: 'Nunca interpolar input em comandos shell (exec/execSync)',
    status: execWithInterpolation.length > 0 ? 'fail' : execMatches.length > 0 ? 'warn' : 'pass',
    severity: 'critical',
    detail: execWithInterpolation.length > 0
      ? `${execWithInterpolation.length} exec/execSync com template literal encontrado(s) — risco de command injection`
      : execMatches.length > 0
        ? `${execMatches.length} uso(s) de exec/execSync encontrado(s) — verifique se usa input do usuário`
        : 'Nenhum uso de exec/execSync detectado',
    file: (execWithInterpolation[0] || execMatches[0])?.file,
    remediation: 'Use spawn() com array de argumentos ou bibliotecas que escapam automaticamente os argumentos',
  });

  // E4 — Template literals em queries SQL (anti-pattern)
  // Filter out false positives: Supabase RPC calls, comments, log messages
  const sqlTemplateMatches = sqlTemplateMatchesRaw.filter((m) => {
    // Supabase client operations (safe - parameterized)
    if (/\.from\(|\.rpc\(|supabase\./i.test(m.text)) return false;
    // Log/console messages
    if (/console\.|logger\.|log\(/i.test(m.text)) return false;
    // Comments
    if (/^\s*(\/\/|\/\*|\*)/.test(m.text)) return false;
    return true;
  });
  items.push({
    id: 'E4',
    description: 'Queries SQL sem interpolação de template literals',
    status: sqlTemplateMatches.length > 0 ? 'fail' : 'pass',
    severity: 'critical',
    detail: sqlTemplateMatches.length > 0
      ? `${sqlTemplateMatches.length} query(ies) SQL com interpolação detectada(s) — risco de SQL injection`
      : 'Nenhuma interpolação em queries SQL detectada',
    file: sqlTemplateMatches[0]?.file,
    remediation: 'Use queries parametrizadas com placeholders (ex: $1, $2) ou APIs de ORM/query builder seguras',
  });

  // E5 — Uso de cliente/ORM com queries parametrizadas
  items.push({
    id: 'E5',
    description: 'Queries parametrizadas (ORM/query builder/driver seguro)',
    status: parameterizedClientMatches.length > 0 ? 'pass' : rawSqlMatches.length > 0 ? 'warn' : 'warn',
    severity: 'critical',
    detail: parameterizedClientMatches.length > 0
      ? `${parameterizedClientMatches.length} uso(s) de cliente/ORM com padrão de parametrização encontrado(s)`
      : rawSqlMatches.length > 0
        ? `${rawSqlMatches.length} query(ies) SQL raw encontrada(s) — verifique parametrização`
        : 'Nenhuma query de banco de dados detectada',
    remediation: 'Use ORM/query builder seguro ou queries parametrizadas com placeholders (ex: $1, $2), nunca concatenação direta',
  });

  return {
    id: 'E',
    name: 'Injection (SQL, Command, SSTI)',
    items,
  };
}
