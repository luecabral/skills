import { join } from 'node:path';
import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { fileExists, globFiles, grepInFiles, readJsonFile } from '../utils.js';

export async function check(projectRoot: string, context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];

  const allTsFiles = await globFiles(projectRoot, ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'], context);
  // Exclude node_modules (already excluded in globFiles), but also test files for secret detection
  const sourceFiles = allTsFiles.filter(
    (f) => !f.includes('.test.') && !f.includes('.spec.') && !f.includes('__tests__'),
  );

  // H1 — Secrets hardcoded (regex para API keys, tokens, passwords)
  const hardcodedSecretPatterns = [
    // sk_, pk_, Bearer tokens inline (not process.env references)
    /['"`](sk|pk|api|token|secret|key)[-_][A-Za-z0-9]{16,}['"`]/i,
    // AWS/GCP style
    /AKIA[0-9A-Z]{16}/,
    // GitHub tokens
    /ghp_[A-Za-z0-9]{36}/,
    // Supabase service role (long JWT hardcoded)
    /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{50,}/,
  ];

  // Filter out common false positives
  const isLikelyFalsePositive = (text: string): boolean => {
    // process.env references
    if (/process\.env/.test(text)) return true;
    // import/require statements
    if (/import\s|require\(/.test(text)) return true;
    // DB operations with onConflict/conflict resolution
    if (/onConflict|upsert|\.from\(/.test(text)) return true;
    // Type annotations
    if (/:\s*(string|number|boolean|Record|Partial)/.test(text)) return true;
    return false;
  };

  let hardcodedFound = false;
  let hardcodedFile: string | undefined;
  let hardcodedDetail = '';

  for (const pattern of hardcodedSecretPatterns) {
    const matches = await grepInFiles(sourceFiles, pattern, context);
    const realMatches = matches.filter((m) => !isLikelyFalsePositive(m.text));
    if (realMatches.length > 0) {
      hardcodedFound = true;
      hardcodedFile = realMatches[0].file;
      hardcodedDetail = `Possível secret hardcoded encontrado em ${realMatches[0].file}:${realMatches[0].line}`;
      break;
    }
  }

  items.push({
    id: 'H1',
    description: 'Sem credenciais hardcoded no código-fonte',
    status: hardcodedFound ? 'fail' : 'pass',
    severity: 'critical',
    file: hardcodedFile,
    detail: hardcodedFound
      ? hardcodedDetail
      : 'Nenhum padrão de secret hardcoded detectado',
    remediation: 'Mova todos os secrets para variáveis de ambiente e use process.env.NOME_DA_CHAVE',
  });

  // H2 — .env.example existe como template
  const envExamplePath = join(projectRoot, '.env.example');
  const envLocalExamplePath = join(projectRoot, '.env.local.example');
  const hasEnvExample = (await fileExists(envExamplePath)) || (await fileExists(envLocalExamplePath));
  items.push({
    id: 'H2',
    description: '.env.example como template para variáveis de ambiente',
    status: hasEnvExample ? 'pass' : 'warn',
    severity: 'high',
    detail: hasEnvExample
      ? '.env.example encontrado'
      : '.env.example não encontrado — outros devs podem não saber quais variáveis são necessárias',
    remediation: 'Crie .env.example com todas as variáveis necessárias (sem valores reais)',
  });

  // H3 — memzero / limpeza de memória sensível
  // H4 — argon2 / Argon2id como KDF
  // H5 — NEXT_PUBLIC_ com valores que parecem secrets
  // H6 — localStorage com dados sensíveis
  const [
    memzeroMatches,
    argon2InCode,
    hasWeakHash,
    nextPublicSecretsRaw,
    envFiles,
    localStorageSecrets
  ] = await Promise.all([
    grepInFiles(allTsFiles, /memzero|sodium\.memzero|fill\(0\)|pagehide.*clear|clearTimeout.*crypto|wipe.*key|zeroMemory/i, context),
    grepInFiles(allTsFiles, /argon2|Argon2id|argon2id/i, context),
    grepInFiles(allTsFiles, /\.createHash\(['"]md5['"]|\.createHash\(['"]sha1['"]\)|bcrypt(?!js)/i, context),
    grepInFiles(allTsFiles, /NEXT_PUBLIC_.*(?:SECRET|KEY|TOKEN|PASSWORD|PRIVATE)/i, context),
    globFiles(projectRoot, ['.env', '.env.local', '.env.production', '.env.development'], context),
    grepInFiles(allTsFiles, /localStorage\.(setItem|getItem)\s*\(\s*['"].*(?:token|key|secret|password|auth)/i, context)
  ]);

  items.push({
    id: 'H3',
    description: 'Limpeza de memória após uso de dados sensíveis (memzero)',
    status: memzeroMatches.length > 0 ? 'pass' : 'warn',
    severity: 'high',
    detail: memzeroMatches.length > 0
      ? `${memzeroMatches.length} uso(s) de limpeza de memória encontrado(s)`
      : 'Nenhuma limpeza de memória explícita detectada — verifique se chaves criptográficas são limpas após uso',
    remediation: 'Zere buffers com chaves após uso: key.fill(0) ou use sodium.memzero() da libsodium',
  });

  const pkg = await readJsonFile<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
    join(projectRoot, 'package.json'),
  );
  const hasArgon2Pkg =
    (pkg?.dependencies && ('argon2' in pkg.dependencies || 'argon2id' in pkg.dependencies)) ||
    (pkg?.devDependencies && ('argon2' in pkg.devDependencies));
  const hasArgon2 = hasArgon2Pkg || argon2InCode.length > 0;
  items.push({
    id: 'H4',
    description: 'KDF robusto (Argon2id) para derivação de chaves/senhas',
    status: hasArgon2 ? 'pass' : hasWeakHash.length > 0 ? 'fail' : 'warn',
    severity: 'high',
    detail: hasArgon2
      ? 'Argon2/Argon2id encontrado'
      : hasWeakHash.length > 0
        ? `Hash fraco detectado (MD5/SHA1/bcrypt sem id) — use Argon2id`
        : 'Argon2id não detectado — verifique se está usando KDF robusto para senhas',
    remediation: 'Use argon2id para derivar chaves de senhas: `await argon2.hash(password, { type: argon2.argon2id })`',
  });

  // Known safe NEXT_PUBLIC_ vars (Supabase anon key and URL are designed to be public)
  const safeNextPublicPatterns = /NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|NEXT_PUBLIC_SITE_URL|NEXT_PUBLIC_APP_URL/i;

  const nextPublicSecrets = nextPublicSecretsRaw.filter((m) => !safeNextPublicPatterns.test(m.text));
  const nextPublicInEnv = (await grepInFiles(envFiles, /^NEXT_PUBLIC_.*(?:SECRET|KEY|TOKEN|PASS)/im, context))
    .filter((m) => !safeNextPublicPatterns.test(m.text));
  items.push({
    id: 'H5',
    description: 'API keys nunca em variáveis NEXT_PUBLIC_',
    status: nextPublicSecrets.length > 0 || nextPublicInEnv.length > 0 ? 'fail' : 'pass',
    severity: 'critical',
    detail:
      nextPublicSecrets.length > 0 || nextPublicInEnv.length > 0
        ? `Possível secret em variável NEXT_PUBLIC_ detectado`
        : 'Nenhuma variável NEXT_PUBLIC_ com padrão de secret detectada',
    remediation: 'Variáveis NEXT_PUBLIC_ são expostas ao browser. Use variáveis sem NEXT_PUBLIC_ para secrets.',
  });

  items.push({
    id: 'H6',
    description: 'Secrets nunca em localStorage/sessionStorage',
    status: localStorageSecrets.length > 0 ? 'fail' : 'pass',
    severity: 'critical',
    detail: localStorageSecrets.length > 0
      ? `${localStorageSecrets.length} armazenamento de dado sensível em localStorage detectado`
      : 'Nenhum armazenamento de secret em localStorage detectado',
    file: localStorageSecrets[0]?.file,
    remediation: 'Use httpOnly cookies para tokens. localStorage é acessível via XSS.',
  });

  return {
    id: 'H',
    name: 'Secrets & Cryptography',
    items,
  };
}
