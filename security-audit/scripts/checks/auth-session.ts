import { join } from 'node:path';
import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import {
  fileExists,
  globFiles,
  grepInFiles,
  fileContains,
  readJsonFile,
} from '../utils.js';

export async function check(projectRoot: string, context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];
  const isNextProject = context?.stack.frameworks.nextjs ?? false;
  const usesSupabase = context?.stack.services.supabase ?? false;

  const routeFiles = await globFiles(projectRoot, [
    'app/api/**/*.ts',
    'app/api/**/*.tsx',
    'pages/api/**/*.ts',
    'src/app/api/**/*.ts',
    'src/pages/api/**/*.ts',
  ]);

  const allTsFiles = await globFiles(projectRoot, ['**/*.ts', '**/*.tsx']);

  // B1 — Rate limiting dual-layer (IP + identifier)
  const rateLimitMatches = await grepInFiles(
    routeFiles,
    /rate.?limit|rateLimit|rateLimiter|upstash|redis.*rate/i,
  );
  items.push({
    id: 'B1',
    description: 'Rate limiting dual-layer (IP + identifier + por conta)',
    status: routeFiles.length === 0 ? 'warn' : rateLimitMatches.length > 0 ? 'pass' : 'fail',
    severity: 'critical',
    detail:
      routeFiles.length === 0
        ? 'Nenhum endpoint HTTP detectado no padrão analisado'
        : rateLimitMatches.length > 0
        ? `Rate limiting encontrado em ${rateLimitMatches.length} arquivo(s)`
        : 'Nenhuma implementação de rate limiting encontrada nos route handlers',
    remediation: 'Implemente rate limiting por IP e por identificador de conta em endpoints de auth',
  });

  // B2 — Rate limiting por endpoint
  const perEndpointRL = await grepInFiles(routeFiles, /rate.?limit/i);
  items.push({
    id: 'B2',
    description: 'Rate limiting por endpoint',
    status:
      routeFiles.length === 0 ? 'warn' : perEndpointRL.length >= 2 ? 'pass' : perEndpointRL.length === 1 ? 'warn' : 'fail',
    severity: 'high',
    detail:
      routeFiles.length === 0
        ? 'Nenhum endpoint HTTP detectado no padrão analisado'
        : perEndpointRL.length > 0
        ? `Rate limiting encontrado em ${perEndpointRL.length} rota(s)`
        : 'Rate limiting ausente nos endpoints',
    remediation: 'Configure rate limiting diferenciado por endpoint (login, signup, API)',
  });

  // B3 — Política de senha forte (zxcvbn)
  const pkg = await readJsonFile<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
    join(projectRoot, 'package.json'),
  );
  const hasZxcvbn =
    (pkg?.dependencies && 'zxcvbn' in pkg.dependencies) ||
    (pkg?.devDependencies && 'zxcvbn' in pkg.devDependencies) ||
    (await grepInFiles(allTsFiles, /zxcvbn|password.strength|passwordStrength/i)).length > 0;
  items.push({
    id: 'B3',
    description: 'Política de senha forte (comprimento, complexidade, zxcvbn)',
    status: hasZxcvbn ? 'pass' : 'warn',
    severity: 'high',
    detail: hasZxcvbn
      ? 'Verificação de força de senha (zxcvbn ou similar) encontrada'
      : 'Nenhuma verificação de força de senha detectada',
    remediation: 'Use zxcvbn para avaliar força de senha e bloqueie senhas fracas (score < 3)',
  });

  // B4 — Middleware/proxy com checagem de auth (Next.js 16+ usa proxy.ts)
  const middlewarePath = join(projectRoot, 'middleware.ts');
  const middlewareSrcPath = join(projectRoot, 'src', 'middleware.ts');
  const proxyPath = join(projectRoot, 'proxy.ts');
  const proxySrcPath = join(projectRoot, 'src', 'proxy.ts');
  const hasMiddleware =
    (await fileExists(middlewarePath)) || (await fileExists(middlewareSrcPath)) ||
    (await fileExists(proxyPath)) || (await fileExists(proxySrcPath));
  const middlewareFile = (await fileExists(middlewarePath))
    ? middlewarePath
    : (await fileExists(proxyPath))
      ? proxyPath
      : (await fileExists(proxySrcPath))
        ? proxySrcPath
        : middlewareSrcPath;
  const middlewareHasAuth =
    hasMiddleware &&
    (await fileContains(middlewareFile, /getUser|getSession|auth\(|supabase|verifyToken|jwt/i));
  items.push({
    id: 'B4',
    description: 'Proteção de rotas autenticadas no middleware (Next.js)',
    scope: 'stack-specific',
    status: !isNextProject ? 'skip' : !hasMiddleware ? 'fail' : middlewareHasAuth ? 'pass' : 'warn',
    severity: 'critical',
    file: hasMiddleware ? middlewareFile : undefined,
    detail: !isNextProject
      ? 'Check específico para Next.js — não aplicável neste stack'
      : !hasMiddleware
      ? 'middleware.ts não encontrado'
      : middlewareHasAuth
        ? 'Middleware com verificação de autenticação encontrado'
        : 'Middleware existe mas não parece verificar autenticação',
    remediation: !isNextProject
      ? undefined
      : 'Configure middleware.ts para verificar sessão e redirecionar usuários não autenticados',
  });

  // B5 — Separação de clientes (service client vs anon client)
  const serviceClientMatches = await grepInFiles(
    allTsFiles,
    /createServiceClient|service_role|supabaseAdmin|createAdminClient/i,
  );
  const anonClientMatches = await grepInFiles(
    allTsFiles,
    /createClient|createBrowserClient|createServerClient/i,
  );
  items.push({
    id: 'B5',
    description: 'Separação de clientes Supabase (anon key vs service role)',
    scope: 'stack-specific',
    status:
      !usesSupabase
        ? 'skip'
        : serviceClientMatches.length > 0 && anonClientMatches.length > 0
        ? 'pass'
        : serviceClientMatches.length === 0
          ? 'warn'
          : 'pass',
    severity: 'high',
    detail:
      !usesSupabase
        ? 'Check específico para Supabase — não aplicável neste stack'
        : `${serviceClientMatches.length} uso(s) de service client e ${anonClientMatches.length} de anon client`,
    remediation: !usesSupabase
      ? undefined
      : 'Mantenha createServiceClient (service_role) separado de createClient (anon), use service_role apenas no servidor',
  });

  // B6 — Cookie flags seguros (HttpOnly, Secure, SameSite)
  // Check for Supabase SSR pattern (cookies are managed by Supabase SSR library with secure defaults)
  const supabaseSsrMatches = await grepInFiles(
    allTsFiles,
    /@supabase\/ssr|createServerClient|createBrowserClient/i,
  );
  const cookieFiles = await globFiles(projectRoot, ['**/*.ts', '**/*.tsx']);
  const httpOnlyMatches = await grepInFiles(cookieFiles, /httpOnly\s*:\s*true|HttpOnly/i);
  const secureMatches = await grepInFiles(cookieFiles, /secure\s*:\s*true|Secure/);
  const sameSiteMatches = await grepInFiles(cookieFiles, /sameSite\s*:\s*['"]?(strict|lax)|SameSite/i);
  const usesSupabaseSsr = usesSupabase && supabaseSsrMatches.length > 0;
  const cookieFlagsOk =
    usesSupabaseSsr ||
    (httpOnlyMatches.length > 0 && secureMatches.length > 0 && sameSiteMatches.length > 0);
  items.push({
    id: 'B6',
    description: 'Cookies com flags seguros (HttpOnly, Secure, SameSite)',
    status: cookieFlagsOk ? 'pass' : httpOnlyMatches.length > 0 ? 'warn' : 'fail',
    severity: 'high',
    detail: usesSupabaseSsr
      ? `Supabase SSR detectado — cookies gerenciados com flags seguros por padrão`
      : [
          `HttpOnly: ${httpOnlyMatches.length > 0 ? 'encontrado' : 'AUSENTE'}`,
          `Secure: ${secureMatches.length > 0 ? 'encontrado' : 'AUSENTE'}`,
          `SameSite: ${sameSiteMatches.length > 0 ? 'encontrado' : 'AUSENTE'}`,
        ].join(', '),
    remediation: 'Configure cookies com httpOnly: true, secure: true, sameSite: "strict"',
  });

  // B7 — Prevenção de enumeração de usuários
  const authErrorMatches = await grepInFiles(
    routeFiles,
    /user.not.found|email.not.found|email.*not.*exist|usuário.*não.*encontrado/i,
  );
  const genericAuthError = await grepInFiles(
    routeFiles,
    /Invalid credentials|Credenciais inválidas|email.*or.*password|email.*ou.*senha/i,
  );
  items.push({
    id: 'B7',
    description: 'Prevenção de enumeração de usuários',
    status: authErrorMatches.length > 0 ? 'fail' : genericAuthError.length > 0 ? 'pass' : 'warn',
    severity: 'medium',
    detail:
      authErrorMatches.length > 0
        ? `${authErrorMatches.length} mensagem(ns) que pode(m) revelar se usuário existe`
        : genericAuthError.length > 0
          ? 'Mensagens de erro genéricas encontradas para auth'
          : 'Não foi possível verificar mensagens de erro de autenticação',
    remediation: 'Use sempre "Email ou senha inválidos" — nunca indique se o email existe ou não',
  });

  return {
    id: 'B',
    name: 'Authentication & Session Management',
    items,
  };
}
