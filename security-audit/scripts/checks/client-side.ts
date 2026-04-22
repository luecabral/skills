import { join } from 'node:path';
import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { fileExists, readFileContent, grepInFiles, globFiles } from '../utils.js';

export async function check(projectRoot: string, _context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];

  // Candidate files for security headers
  const middlewarePath = join(projectRoot, 'middleware.ts');
  const middlewareSrcPath = join(projectRoot, 'src', 'middleware.ts');
  const proxyPath = join(projectRoot, 'proxy.ts');
  const proxySrcPath = join(projectRoot, 'src', 'proxy.ts');
  const nextConfigPath = join(projectRoot, 'next.config.ts');
  const nextConfigJsPath = join(projectRoot, 'next.config.js');
  const nextConfigMjsPath = join(projectRoot, 'next.config.mjs');

  const headerFiles: string[] = [];
  for (const f of [middlewarePath, middlewareSrcPath, proxyPath, proxySrcPath, nextConfigPath, nextConfigJsPath, nextConfigMjsPath]) {
    if (await fileExists(f)) headerFiles.push(f);
  }

  // D1 — CSP em middleware/next.config
  const cspMatches = await grepInFiles(headerFiles, /Content-Security-Policy|contentSecurityPolicy/i);
  items.push({
    id: 'D1',
    description: 'CSP com diretivas restritivas configurada',
    status: cspMatches.length > 0 ? 'pass' : 'fail',
    severity: 'high',
    detail: cspMatches.length > 0
      ? `Content-Security-Policy encontrado em ${cspMatches.length} arquivo(s)`
      : 'Content-Security-Policy não encontrado nos pontos de configuração analisados',
    remediation: 'Configure CSP na camada de entrega de headers (middleware/gateway/framework) com diretivas restritivas',
  });

  // D2 — Sem unsafe-inline no CSP
  const unsafeInlineMatches = await grepInFiles(headerFiles, /unsafe-inline/i);
  items.push({
    id: 'D2',
    description: 'Evitar unsafe-inline no CSP (preferir nonces/hashes)',
    status: unsafeInlineMatches.length > 0 ? 'warn' : cspMatches.length > 0 ? 'pass' : 'warn',
    severity: 'medium',
    detail: unsafeInlineMatches.length > 0
      ? `'unsafe-inline' encontrado em ${unsafeInlineMatches.length} lugar(es) — considere usar nonces`
      : cspMatches.length > 0
        ? 'Nenhum unsafe-inline detectado no CSP'
        : 'CSP não encontrado — não é possível verificar unsafe-inline',
    remediation: 'Substitua unsafe-inline por nonces (gerados por request) ou hashes de scripts/estilos específicos',
  });

  // D3 — X-Frame-Options
  const xFrameMatches = await grepInFiles(headerFiles, /X-Frame-Options|xFrameOptions/i);
  items.push({
    id: 'D3',
    description: 'X-Frame-Options: DENY configurado',
    status: xFrameMatches.length > 0 ? 'pass' : 'fail',
    severity: 'high',
    detail: xFrameMatches.length > 0
      ? 'X-Frame-Options encontrado'
      : 'X-Frame-Options não configurado',
    remediation: 'Adicione o header X-Frame-Options: DENY para prevenir clickjacking',
  });

  // D4 — X-Content-Type-Options
  const xContentTypeMatches = await grepInFiles(headerFiles, /X-Content-Type-Options|nosniff/i);
  items.push({
    id: 'D4',
    description: 'X-Content-Type-Options: nosniff configurado',
    status: xContentTypeMatches.length > 0 ? 'pass' : 'fail',
    severity: 'medium',
    detail: xContentTypeMatches.length > 0
      ? 'X-Content-Type-Options: nosniff encontrado'
      : 'X-Content-Type-Options não configurado',
    remediation: 'Adicione X-Content-Type-Options: nosniff para prevenir MIME sniffing',
  });

  // D5 — Referrer-Policy
  const referrerPolicyMatches = await grepInFiles(headerFiles, /Referrer-Policy|referrerPolicy/i);
  items.push({
    id: 'D5',
    description: 'Referrer-Policy: strict-origin-when-cross-origin',
    status: referrerPolicyMatches.length > 0 ? 'pass' : 'warn',
    severity: 'medium',
    detail: referrerPolicyMatches.length > 0
      ? 'Referrer-Policy encontrado'
      : 'Referrer-Policy não configurado',
    remediation: 'Configure Referrer-Policy: strict-origin-when-cross-origin para limitar informações de referrer',
  });

  // D6 — Permissions-Policy
  const permissionsPolicyMatches = await grepInFiles(
    headerFiles,
    /Permissions-Policy|permissionsPolicy|Feature-Policy/i,
  );
  items.push({
    id: 'D6',
    description: 'Permissions-Policy (camera, mic, geolocation desabilitados)',
    status: permissionsPolicyMatches.length > 0 ? 'pass' : 'warn',
    severity: 'medium',
    detail: permissionsPolicyMatches.length > 0
      ? 'Permissions-Policy encontrado'
      : 'Permissions-Policy não configurado',
    remediation: 'Configure Permissions-Policy: camera=(), microphone=(), geolocation=() para desabilitar features não usadas',
  });

  // D7 — CSRF: verificação de origin em middleware
  const csrfOriginMatches = await grepInFiles(
    headerFiles,
    /request\.headers\.get\(['"]origin|origin.*===|checkOrigin|validateOrigin|csrf/i,
  );
  const allMiddlewareFiles = headerFiles.filter(f => f.includes('middleware'));
  const csrfInMiddleware = await grepInFiles(allMiddlewareFiles, /origin|csrf/i);
  items.push({
    id: 'D7',
    description: 'Proteção CSRF (validação de origin)',
    status: csrfOriginMatches.length > 0 ? 'pass' : csrfInMiddleware.length > 0 ? 'warn' : 'fail',
    severity: 'critical',
    detail: csrfOriginMatches.length > 0
      ? `Verificação de origin para CSRF encontrada em ${csrfOriginMatches.length} lugar(es)`
      : 'Nenhuma verificação de origin para CSRF detectada',
    remediation: 'Verifique o header Origin nas requisições mutantes (POST, PUT, DELETE, PATCH)',
  });

  // D8 — Sanitização XSS
  const allTsFiles = await globFiles(projectRoot, ['**/*.ts', '**/*.tsx']);
  const sanitizeMatches = await grepInFiles(
    allTsFiles,
    /DOMPurify|sanitize|xss|escapeHtml|dangerouslySetInnerHTML.*sanitize/i,
  );
  const dangerousHtml = await grepInFiles(allTsFiles, /dangerouslySetInnerHTML/i);
  const xssRisk = dangerousHtml.length > 0 && sanitizeMatches.length === 0;
  items.push({
    id: 'D8',
    description: 'Sanitização de output contra XSS',
    status: xssRisk ? 'fail' : dangerousHtml.length > 0 ? 'warn' : 'pass',
    severity: 'critical',
    detail: dangerousHtml.length > 0
      ? `${dangerousHtml.length} uso(s) de dangerouslySetInnerHTML detectado(s)${sanitizeMatches.length > 0 ? ' com sanitização' : ' SEM sanitização'}`
      : 'Nenhum dangerouslySetInnerHTML detectado',
    remediation: 'Use DOMPurify.sanitize() antes de qualquer dangerouslySetInnerHTML com conteúdo dinâmico',
  });

  return {
    id: 'D',
    name: 'Client-Side Attacks (XSS, CSRF, Open Redirect)',
    items,
  };
}
