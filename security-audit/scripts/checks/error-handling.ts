import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { globFiles, grepInFiles } from '../utils.js';

export async function check(projectRoot: string, context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];

  // Fase de glob: allTsFiles e serverFiles em paralelo
  const [allTsFiles, serverFiles] = await Promise.all([
    globFiles(projectRoot, ['**/*.ts', '**/*.tsx'], context),
    globFiles(projectRoot, [
      'app/api/**/*.ts',
      'pages/api/**/*.ts',
      'src/app/api/**/*.ts',
      'lib/**/*.ts',
      'server/**/*.ts',
      'src/lib/**/*.ts',
    ], context),
  ]);

  // N1 — todos os greps/globs de N1 em paralelo
  const [errorCatalogMatches, errorFileMatches, errorDocFiles] = await Promise.all([
    grepInFiles(allTsFiles, /ERROR_MESSAGES|ERROR_CODES|errorCatalog|AppError|ApiError|createError|errorMessages\s*=/i, context),
    globFiles(projectRoot, [
      '**/errors.ts',
      '**/error.ts',
      '**/errors/index.ts',
      '**/constants/errors.ts',
      '**/lib/errors.ts',
    ], context),
    globFiles(projectRoot, [
      '**/ERROR_MESSAGES.md',
      '**/error-messages.md',
      '**/errors.md',
      'docs/**/error*.md',
    ], context),
  ]);
  const hasErrorCatalog = errorCatalogMatches.length > 0 || errorFileMatches.length > 0 || errorDocFiles.length > 0;
  items.push({
    id: 'N1',
    description: 'Catálogo centralizado de erros',
    status: hasErrorCatalog ? 'pass' : 'warn',
    severity: 'medium',
    detail: hasErrorCatalog
      ? `Catálogo de erros encontrado (${errorCatalogMatches.length} referência(s) + ${errorFileMatches.length} arquivo(s))`
      : 'Nenhum catálogo centralizado de erros detectado',
    remediation: 'Crie um arquivo errors.ts com ERROR_MESSAGES centralizado para garantir mensagens genéricas e consistentes',
  });

  // N2–N6: todos os greps em paralelo (dependem apenas de serverFiles já pronto)
  const [
    stackTraceMatches,
    stackInResponse,
    genericErrorResponses,
    specificErrorInResponse,
    consoleSensitiveMatches,
    authErrorEnumeration,
    consoleLogCount,
  ] = await Promise.all([
    grepInFiles(serverFiles, /\.stack|error\.stack|err\.stack|stack.*trace/i, context),
    grepInFiles(serverFiles, /json\s*\(\s*\{[^}]*stack|Response.*stack|NextResponse.*stack/i, context),
    grepInFiles(serverFiles, /Internal server error|Something went wrong|An error occurred|Erro interno|Algo deu errado/i, context),
    grepInFiles(serverFiles, /json\s*\(\s*\{[^}]*message.*error\.(message|name)|NextResponse.*error\.(message|stack)/i, context),
    grepInFiles(serverFiles, /console\.(log|error|warn|info)\s*\([^)]*(?:password|token|secret|key|auth|credential|private|senha|chave)/i, context),
    grepInFiles(serverFiles, /user.*not.*found|email.*not.*found|usuário.*não.*existe|email.*não.*cadastrado|account.*not.*found/i, context),
    grepInFiles(serverFiles, /console\.(log|debug)/i, context),
  ]);

  // N2 — Stack traces expostos em route handlers
  items.push({
    id: 'N2',
    description: 'Sem stack traces em produção (não expostos na resposta)',
    status: stackInResponse.length > 0 ? 'fail' : stackTraceMatches.length > 0 ? 'warn' : 'pass',
    severity: 'critical',
    detail: stackInResponse.length > 0
      ? `${stackInResponse.length} stack trace(s) sendo enviado(s) na resposta HTTP`
      : stackTraceMatches.length > 0
        ? `${stackTraceMatches.length} referência(s) a .stack — verifique se são enviados na resposta`
        : 'Nenhum stack trace exposto na resposta detectado',
    file: (stackInResponse[0] || stackTraceMatches[0])?.file,
    remediation: 'Em produção, log o erro internamente e retorne apenas mensagem genérica ao cliente',
  });

  // N3 — Respostas genéricas de erro (não expõem detalhes internos)
  items.push({
    id: 'N3',
    description: 'Respostas genéricas de erro para o usuário',
    status: specificErrorInResponse.length > 0 ? 'fail'
      : genericErrorResponses.length > 0 ? 'pass' : 'warn',
    severity: 'high',
    detail: specificErrorInResponse.length > 0
      ? `${specificErrorInResponse.length} resposta(s) que expõe(m) detalhes de erro interno`
      : genericErrorResponses.length > 0
        ? `${genericErrorResponses.length} resposta(s) com mensagem genérica encontrada(s)`
        : 'Não foi possível verificar padrão de respostas de erro',
    remediation: 'Retorne sempre mensagens genéricas ao cliente. Log o erro real internamente com ID de correlação.',
  });

  // N4 — console.log com dados sensíveis
  items.push({
    id: 'N4',
    description: 'NUNCA logar secrets/tokens/PII em console',
    status: consoleSensitiveMatches.length > 0 ? 'fail' : 'pass',
    severity: 'critical',
    detail: consoleSensitiveMatches.length > 0
      ? `${consoleSensitiveMatches.length} log(s) com possível dado sensível detectado(s)`
      : 'Nenhum log com dados sensíveis detectado',
    file: consoleSensitiveMatches[0]?.file,
    line: consoleSensitiveMatches[0]?.line,
    remediation: 'Nunca logue passwords, tokens, ou chaves. Use IDs de correlação para rastrear sem expor dados.',
  });

  // N5 — Auth errors sem enumeração de usuários
  items.push({
    id: 'N5',
    description: 'Auth errors não revelam se usuário existe (anti-enumeração)',
    status: authErrorEnumeration.length > 0 ? 'fail' : 'pass',
    severity: 'high',
    detail: authErrorEnumeration.length > 0
      ? `${authErrorEnumeration.length} mensagem(ns) que pode(m) revelar existência de usuário`
      : 'Nenhuma mensagem de erro que revele existência de usuário detectada',
    file: authErrorEnumeration[0]?.file,
    line: authErrorEnumeration[0]?.line,
    remediation: 'Use sempre "Email ou senha inválidos" em erros de autenticação, nunca indique se o email existe',
  });

  // N6 — Console limpo em produção (sem console.log excessivo)
  items.push({
    id: 'N6',
    description: 'Console limpo em produção (logs estruturados)',
    status: consoleLogCount.length === 0 ? 'pass'
      : consoleLogCount.length < 10 ? 'warn' : 'warn',
    severity: 'low',
    detail: `${consoleLogCount.length} console.log/debug encontrado(s) em arquivos de servidor`,
    remediation: 'Use logger estruturado (pino, winston) em vez de console.log. Evite logs verbosos em produção.',
  });

  return {
    id: 'N',
    name: 'Error Handling & Logging',
    items,
  };
}
