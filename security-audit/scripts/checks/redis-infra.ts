import { join } from 'node:path';
import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { fileExists, globFiles, grepInFiles, readFileContent } from '../utils.js';

export async function check(projectRoot: string, _context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];

  const rubyInfraFiles = await globFiles(projectRoot, [
    'config/**/*.rb',
    'app/**/*.rb',
    'lib/**/*.rb',
  ]);
  const redisRefs = await grepInFiles(rubyInfraFiles, /Redis\.new|redis|REDIS_URL|Sidekiq\.configure/i);
  items.push({
    id: 'Q1',
    description: 'Uso de Redis identificado na aplicacao',
    status: redisRefs.length > 0 ? 'pass' : 'warn',
    severity: 'high',
    detail: redisRefs.length > 0
      ? `${redisRefs.length} referencia(s) a Redis detectada(s)`
      : 'Nao foram encontradas referencias claras a Redis no codigo',
    remediation: 'Centralize configuracao de Redis e audite pontos de acesso ao cache/pubsub',
  });

  const envFiles = await globFiles(projectRoot, ['.env', '.env.*', 'config/**/*.yml', 'config/**/*.yaml']);
  const secureRedisUrl = await grepInFiles(envFiles, /rediss:\/\/|REDIS_URL=.*:.*@/i);
  items.push({
    id: 'Q2',
    description: 'Conexao Redis com autenticacao/TLS',
    status: secureRedisUrl.length > 0 ? 'pass' : 'warn',
    severity: 'high',
    detail: secureRedisUrl.length > 0
      ? 'Sinais de conexao segura para Redis encontrados'
      : 'Nao foram encontrados sinais claros de TLS/autenticacao para Redis',
    remediation: 'Use REDIS_URL com autenticacao e prefira rediss:// em ambientes externos',
  });

  const redisConfigPath = join(projectRoot, 'config', 'initializers', 'redis.rb');
  const redisConfigSrc = await readFileContent(redisConfigPath);
  const hasNamespace = Boolean(redisConfigSrc && /namespace\s*:/i.test(redisConfigSrc));
  items.push({
    id: 'Q3',
    description: 'Namespace de chaves Redis para isolamento',
    status: hasNamespace ? 'pass' : 'warn',
    severity: 'medium',
    file: (await fileExists(redisConfigPath)) ? redisConfigPath : undefined,
    detail: hasNamespace
      ? 'Namespace de chaves Redis detectado'
      : 'Namespace nao detectado no inicializador Redis',
    remediation: 'Defina namespace para evitar colisao de chaves entre ambientes/apps',
  });

  const ttlPatterns = await grepInFiles(rubyInfraFiles, /expires_in:|setex|expire\(|write\(.+expires_in:/i);
  items.push({
    id: 'Q4',
    description: 'TTL para entradas de cache Redis',
    status: ttlPatterns.length > 0 ? 'pass' : 'warn',
    severity: 'medium',
    detail: ttlPatterns.length > 0
      ? `${ttlPatterns.length} uso(s) de TTL detectado(s)`
      : 'Nenhum padrao explicito de TTL detectado para chaves de cache',
    remediation: 'Aplique expires_in/TTL para evitar dados stale e crescimento indefinido',
  });

  const sensitiveCacheWrites = await grepInFiles(
    rubyInfraFiles,
    /Rails\.cache\.write|redis\.set|Redis\.new.*set/i,
  );
  const sensitiveKeywords = sensitiveCacheWrites.filter((m) => /password|token|secret|credential|auth/i.test(m.text));
  items.push({
    id: 'Q5',
    description: 'Sem armazenamento de segredos sensiveis em cache Redis',
    status: sensitiveKeywords.length > 0 ? 'fail' : 'pass',
    severity: 'critical',
    file: sensitiveKeywords[0]?.file,
    line: sensitiveKeywords[0]?.line,
    detail: sensitiveKeywords.length > 0
      ? `${sensitiveKeywords.length} escrita(s) de cache com palavra sensivel detectada(s)`
      : 'Nenhum padrao obvio de cache de segredos detectado',
    remediation: 'Nao armazene secrets/tokens em cache; prefira vaults/cripto e tempo de vida minimo',
  });

  return {
    id: 'Q',
    name: 'Redis & Cache Security',
    items,
  };
}
