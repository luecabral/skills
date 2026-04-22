import { join } from 'node:path';
import { fileExists, globFiles, grepInFiles } from '../utils.js';
export async function check(projectRoot, _context) {
    const items = [];
    // Candidate files for security headers and config
    const middlewarePath = join(projectRoot, 'middleware.ts');
    const middlewareSrcPath = join(projectRoot, 'src', 'middleware.ts');
    const proxyPath = join(projectRoot, 'proxy.ts');
    const proxySrcPath = join(projectRoot, 'src', 'proxy.ts');
    const nextConfigFiles = await globFiles(projectRoot, [
        'next.config.ts',
        'next.config.js',
        'next.config.mjs',
    ]);
    const headerConfigFiles = [];
    for (const f of [middlewarePath, middlewareSrcPath, proxyPath, proxySrcPath, ...nextConfigFiles]) {
        if (await fileExists(f))
            headerConfigFiles.push(f);
    }
    const allServerFiles = await globFiles(projectRoot, [
        'app/api/**/*.ts',
        'pages/api/**/*.ts',
        'src/app/api/**/*.ts',
        'lib/**/*.ts',
        'server/**/*.ts',
        'middleware.ts',
        'src/middleware.ts',
        'proxy.ts',
        'src/proxy.ts',
        ...nextConfigFiles,
    ]);
    // I1 — CORS não usa wildcard (*)
    const corsWildcard = await grepInFiles(allServerFiles, /Access-Control-Allow-Origin.*\*|cors\s*\(\s*\)|origin\s*:\s*['"]\*['"]/i);
    const corsSpecific = await grepInFiles(allServerFiles, /Access-Control-Allow-Origin|cors\s*\(\s*\{|allowedOrigins|corsOptions/i);
    items.push({
        id: 'I1',
        description: 'CORS configurado com origins específicas (nunca *)',
        status: corsWildcard.length > 0 ? 'fail' : corsSpecific.length > 0 ? 'pass' : 'warn',
        severity: 'high',
        file: corsWildcard[0]?.file,
        detail: corsWildcard.length > 0
            ? `CORS com wildcard (*) detectado em ${corsWildcard.length} lugar(es)`
            : corsSpecific.length > 0
                ? 'CORS configurado com origins específicas'
                : 'Configuração CORS não detectada — verifique manualmente',
        remediation: 'Configure CORS com lista explícita de origens: Access-Control-Allow-Origin: https://seu-dominio.com',
    });
    // I2 — HSTS (Strict-Transport-Security)
    const hstsMatches = await grepInFiles(headerConfigFiles, /Strict-Transport-Security|strictTransportSecurity|HSTS/i);
    items.push({
        id: 'I2',
        description: 'TLS/HTTPS obrigatório (HSTS configurado)',
        status: hstsMatches.length > 0 ? 'pass' : 'fail',
        severity: 'high',
        detail: hstsMatches.length > 0
            ? 'Strict-Transport-Security encontrado'
            : 'HSTS (Strict-Transport-Security) não configurado',
        remediation: 'Adicione: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    });
    // I3 — X-Powered-By removido
    const xPoweredByRemoval = await grepInFiles([...headerConfigFiles, ...allServerFiles], /x-powered-by.*false|poweredByHeader.*false|removeHeader.*x-powered-by|headers.*x-powered-by/i);
    const xPoweredByInNextConfig = await grepInFiles(nextConfigFiles, /poweredByHeader\s*:\s*false/i);
    items.push({
        id: 'I3',
        description: 'X-Powered-By removido da resposta',
        status: xPoweredByRemoval.length > 0 || xPoweredByInNextConfig.length > 0 ? 'pass' : 'warn',
        severity: 'low',
        detail: xPoweredByRemoval.length > 0 || xPoweredByInNextConfig.length > 0
            ? 'Remoção de X-Powered-By encontrada'
            : 'X-Powered-By pode estar exposto — verifique a resposta do servidor',
        remediation: 'Desative/remova o header X-Powered-By na configuração do servidor/framework',
    });
    // I4 — Rate limit global + por endpoint
    const rateLimitGlobal = await grepInFiles(allServerFiles, /rate.?limit|rateLimit|rateLimiter|upstash.*redis/i);
    const rateLimitConfig = await grepInFiles(allServerFiles, /max\s*:\s*\d+|limit\s*:\s*\d+|windowMs|window\s*:\s*\d+/i);
    items.push({
        id: 'I4',
        description: 'Rate limit global + por endpoint configurado',
        status: rateLimitGlobal.length > 0 && rateLimitConfig.length > 0 ? 'pass'
            : rateLimitGlobal.length > 0 ? 'warn' : 'fail',
        severity: 'high',
        detail: rateLimitGlobal.length > 0
            ? `Rate limiting encontrado (${rateLimitGlobal.length} ocorrência(s))${rateLimitConfig.length > 0 ? ' com configuração de limites' : ' — verifique se os limites estão configurados'}`
            : 'Nenhum rate limiting detectado',
        remediation: 'Configure rate limiting global no middleware e limites específicos por endpoint sensível',
    });
    return {
        id: 'I',
        name: 'Hardening & API Governance',
        items,
    };
}
