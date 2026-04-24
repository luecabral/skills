import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { globFiles, grepInFiles } from '../utils.js';
import { parseTypeScript } from '../ast.js';
import { Node, SyntaxKind, type Expression } from 'ts-morph';

interface Match {
  file: string;
  line: number;
  text: string;
}

function getCallName(expression: Expression): string {
  if (Node.isIdentifier(expression)) return expression.getText();
  if (Node.isPropertyAccessExpression(expression)) return expression.getName();
  return '';
}

function isSqlLike(text: string): boolean {
  return /\b(select|insert|update|delete)\b/i.test(text);
}

function isLoggingContext(node: Node): boolean {
  const call = node.getFirstAncestorByKind(SyntaxKind.CallExpression);
  if (!call) return false;
  const callee = call.getExpression().getText();
  return /^(console|logger)\./i.test(callee) || /\blog\(/i.test(callee);
}

export async function check(projectRoot: string, context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];

  const [allTsFiles, serverFiles] = await Promise.all([
    globFiles(projectRoot, ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'], context),
    globFiles(projectRoot, [
      'app/api/**/*.ts',
      'app/api/**/*.js',
      'pages/api/**/*.ts',
      'pages/api/**/*.js',
      'src/app/api/**/*.ts',
      'src/app/api/**/*.js',
      'src/pages/api/**/*.ts',
      'src/pages/api/**/*.js',
      'lib/**/*.ts',
      'lib/**/*.js',
      'server/**/*.ts',
      'server/**/*.js',
      'src/lib/**/*.ts',
      'src/lib/**/*.js',
    ], context)
  ]);

  const evalMatches: Match[] = [];
  const newFunctionMatches: Match[] = [];
  const execMatches: Match[] = [];
  const execWithInterpolation: Match[] = [];
  const sqlTemplateMatches: Match[] = [];

  const serverFileSet = new Set(serverFiles);
  for (const file of allTsFiles) {
    const sourceFile = await parseTypeScript(file, context);
    if (!sourceFile) continue;

    sourceFile.forEachDescendant((node) => {
      if (Node.isCallExpression(node)) {
        const expression = node.getExpression();
        const callName = getCallName(expression);
        const callText = node.getText();
        const line = node.getStartLineNumber();
        const isServerFile = serverFileSet.has(file);

        if (callName === 'eval') {
          evalMatches.push({ file, line, text: callText });
        }

        if (isServerFile && (callName === 'exec' || callName === 'execSync')) {
          execMatches.push({ file, line, text: callText });
          const firstArg = node.getArguments()[0];
          if (firstArg && Node.isTemplateExpression(firstArg) && firstArg.getTemplateSpans().length > 0) {
            execWithInterpolation.push({ file, line, text: callText });
          }
        }
      }

      if (Node.isNewExpression(node) && node.getExpression().getText() === 'Function') {
        newFunctionMatches.push({
          file,
          line: node.getStartLineNumber(),
          text: node.getText(),
        });
      }

      if (!serverFileSet.has(file)) return;
      if (!Node.isTemplateExpression(node)) return;
      if (node.getTemplateSpans().length === 0) return;
      if (isLoggingContext(node)) return;
      const text = node.getText();
      if (!isSqlLike(text)) return;
      sqlTemplateMatches.push({
        file,
        line: node.getStartLineNumber(),
        text,
      });
    });
  }

  const [parameterizedClientMatches, rawSqlMatches] = await Promise.all([
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
    line: evalMatches[0]?.line,
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
    line: newFunctionMatches[0]?.line,
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
    line: (execWithInterpolation[0] || execMatches[0])?.line,
    remediation: 'Use spawn() com array de argumentos ou bibliotecas que escapam automaticamente os argumentos',
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
    line: sqlTemplateMatches[0]?.line,
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
