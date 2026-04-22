import { join } from 'node:path';
import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { fileExists, globFiles, grepInFiles, fileContains, readFileContent } from '../utils.js';

export async function check(projectRoot: string, context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];
  const isNextProject = context?.stack.frameworks.nextjs ?? false;

  const allTsFiles = await globFiles(projectRoot, ['**/*.ts', '**/*.tsx']);
  const serverFiles = await globFiles(projectRoot, [
    'app/api/**/*.ts',
    'pages/api/**/*.ts',
    'src/app/api/**/*.ts',
    'lib/**/*.ts',
    'server/**/*.ts',
  ]);

  // G1 — Validação de UUID/path antes de operações de storage
  const storageOpFiles = await grepInFiles(serverFiles, /storage|upload|download|\.from\(['"].*bucket/i);
  const pathValidationBeforeStorage = await grepInFiles(
    serverFiles,
    /uuid.*valid|valid.*uuid|z\.string\(\)\.uuid|isUUID|validatePath|sanitizePath/i,
  );
  items.push({
    id: 'G1',
    description: 'Validação de path/UUID antes de operações de storage',
    status:
      storageOpFiles.length === 0
        ? 'warn'
        : pathValidationBeforeStorage.length > 0
          ? 'pass'
          : 'fail',
    severity: 'high',
    detail:
      storageOpFiles.length === 0
        ? 'Nenhuma operação de storage encontrada'
        : pathValidationBeforeStorage.length > 0
          ? 'Validação de path/UUID antes de storage encontrada'
          : 'Operações de storage sem validação explícita de path/UUID detectadas',
    remediation: 'Valide UUIDs e caminhos antes de qualquer operação de storage para prevenir path traversal',
  });

  // G2 — Prevenção de path traversal
  const dotdotInPathsRaw = await grepInFiles(serverFiles, /\.\.\//);
  // Filter out import statements and require paths (not security concerns)
  const dotdotInPaths = dotdotInPathsRaw.filter((m) => {
    if (/^\s*(import\s|from\s+['"]|require\s*\()/.test(m.text)) return false;
    if (/^\s*(\/\/|\/\*|\*)/.test(m.text)) return false;
    return true;
  });
  items.push({
    id: 'G2',
    description: 'Prevenção de path traversal',
    status: dotdotInPaths.length > 0 ? 'warn' : 'pass',
    severity: 'critical',
    detail: dotdotInPaths.length > 0
      ? `${dotdotInPaths.length} ocorrência(s) de '../' em paths — verifique se é input controlado pelo usuário`
      : 'Nenhum padrão de path traversal detectado',
    remediation: 'Use path.resolve() e valide que o resultado está dentro do diretório permitido',
  });

  // G3 — Whitelist de tipos de arquivo em uploads
  const uploadHandlers = await grepInFiles(serverFiles, /upload|multer|formData|file\.type|mimetype/i);
  const fileTypeValidation = await grepInFiles(
    serverFiles,
    /allowedTypes|allowedMimetypes|whitelist.*type|type.*whitelist|\.includes\(.*mime|file\.type.*===|mimetype.*startsWith/i,
  );
  items.push({
    id: 'G3',
    description: 'Whitelist de extensões/tipos para upload',
    status:
      uploadHandlers.length === 0
        ? 'warn'
        : fileTypeValidation.length > 0
          ? 'pass'
          : 'fail',
    severity: 'high',
    detail:
      uploadHandlers.length === 0
        ? 'Nenhum handler de upload encontrado'
        : fileTypeValidation.length > 0
          ? 'Validação de tipo de arquivo encontrada'
          : 'Handlers de upload sem validação de tipo detectados',
    remediation: 'Use uma whitelist explícita de MIME types e extensões permitidas. Rejeite todo o resto.',
  });

  // G4 — Limite de tamanho de arquivo
  const fileSizeValidation = await grepInFiles(
    serverFiles,
    /maxSize|max_size|MAX_SIZE|file\.size|fileSize|size.*limit|limit.*size/i,
  );
  items.push({
    id: 'G4',
    description: 'Limite de tamanho de arquivo em uploads',
    status: uploadHandlers.length === 0 ? 'warn' : fileSizeValidation.length > 0 ? 'pass' : 'fail',
    severity: 'medium',
    detail:
      uploadHandlers.length === 0
        ? 'Nenhum handler de upload encontrado'
        : fileSizeValidation.length > 0
          ? 'Limite de tamanho de arquivo encontrado'
          : 'Nenhum limite de tamanho de arquivo detectado',
    remediation: 'Configure um limite de tamanho máximo para uploads (ex: 10MB) e rejeite arquivos maiores',
  });

  // G5 — .gitignore com .env
  const gitignorePath = join(projectRoot, '.gitignore');
  const gitignoreContent = await readFileContent(gitignorePath);
  const gitignoreHasEnv = gitignoreContent
    ? /^\.env$/m.test(gitignoreContent) ||
      /^\.env\.local$/m.test(gitignoreContent) ||
      /^\.env\*$/m.test(gitignoreContent) ||
      /^\.env\.\*$/m.test(gitignoreContent)
    : false;
  items.push({
    id: 'G5',
    description: '.gitignore inclui .env e .env.local',
    status: !gitignoreContent ? 'fail' : gitignoreHasEnv ? 'pass' : 'fail',
    severity: 'critical',
    file: gitignorePath,
    detail: !gitignoreContent
      ? '.gitignore não encontrado'
      : gitignoreHasEnv
        ? '.env e .env.local estão no .gitignore'
        : '.env ou .env.local NÃO estão no .gitignore',
    remediation: 'Adicione .env, .env.local, .env.*.local ao .gitignore imediatamente',
  });

  // G6 — Source maps desabilitados em produção
  const nextConfigFiles = await globFiles(projectRoot, ['next.config.ts', 'next.config.js', 'next.config.mjs']);
  const sourceMapConfig = await grepInFiles(
    nextConfigFiles,
    /productionBrowserSourceMaps|sourceMaps|source.?map/i,
  );
  const sourceMapsDisabled = await grepInFiles(
    nextConfigFiles,
    /productionBrowserSourceMaps\s*:\s*false|sourceMaps.*false/i,
  );
  items.push({
    id: 'G6',
    description: 'Source maps desabilitados em produção (Next.js)',
    scope: 'stack-specific',
    status:
      !isNextProject
        ? 'skip'
        : nextConfigFiles.length === 0
        ? 'warn'
        : sourceMapsDisabled.length > 0
          ? 'pass'
          : sourceMapConfig.length > 0
            ? 'warn'
            : 'warn',
    severity: 'medium',
    detail:
      !isNextProject
        ? 'Check específico para Next.js — não aplicável neste stack'
        : nextConfigFiles.length === 0
        ? 'next.config não encontrado'
        : sourceMapsDisabled.length > 0
          ? 'Source maps desabilitados em produção'
          : 'Configuração de source maps não encontrada — verifique se estão desabilitados',
    remediation: !isNextProject
      ? undefined
      : 'Configure productionBrowserSourceMaps: false em next.config para não expor código fonte em produção',
  });

  return {
    id: 'G',
    name: 'Files & Misconfigurations',
    items,
  };
}
