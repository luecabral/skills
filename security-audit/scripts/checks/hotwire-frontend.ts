import { join } from 'node:path';
import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { fileExists, globFiles, grepInFiles, readFileContent } from '../utils.js';

export async function check(projectRoot: string, _context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];

  const stimulusControllerFiles = await globFiles(projectRoot, [
    'app/javascript/controllers/**/*.js',
    'app/javascript/controllers/**/*.ts',
    'app/frontend/controllers/**/*.js',
    'app/frontend/controllers/**/*.ts',
  ]);
  const turboRefs = await globFiles(projectRoot, [
    'app/views/**/*.erb',
    'app/views/**/*.haml',
    'app/javascript/**/*.js',
    'app/javascript/**/*.ts',
  ]);
  const turboUsage = await grepInFiles(turboRefs, /turbo|data-turbo|Turbo\.|turbo_stream/i);

  items.push({
    id: 'T1',
    description: 'Uso de Turbo/Stimulus identificado',
    status: turboUsage.length > 0 || stimulusControllerFiles.length > 0 ? 'pass' : 'warn',
    severity: 'medium',
    detail:
      turboUsage.length > 0 || stimulusControllerFiles.length > 0
        ? `Turbo/Stimulus detectado (refs: ${turboUsage.length}, controllers: ${stimulusControllerFiles.length})`
        : 'Nao foram encontrados sinais claros de Hotwire na estrutura analisada',
    remediation: 'Mantenha controllers Stimulus pequenos e valide fluxos Turbo mutantes',
  });

  const layoutPath = join(projectRoot, 'app', 'views', 'layouts', 'application.html.erb');
  const layoutSrc = await readFileContent(layoutPath);
  const csrfTags = Boolean(layoutSrc && /csrf_meta_tags/i.test(layoutSrc));
  items.push({
    id: 'T2',
    description: 'csrf_meta_tags presente no layout principal',
    status: csrfTags ? 'pass' : 'fail',
    severity: 'critical',
    file: (await fileExists(layoutPath)) ? layoutPath : undefined,
    detail: csrfTags
      ? 'csrf_meta_tags encontrado no layout principal'
      : 'csrf_meta_tags nao encontrado no layout principal',
    remediation: 'Inclua csrf_meta_tags no layout base para proteger requests mutantes',
  });

  const innerHtmlWrites = await grepInFiles(stimulusControllerFiles, /\.innerHTML\s*=|insertAdjacentHTML\(/i);
  items.push({
    id: 'T3',
    description: 'Evitar innerHTML/insertAdjacentHTML com conteudo nao confiavel',
    status: innerHtmlWrites.length > 0 ? 'warn' : 'pass',
    severity: 'high',
    file: innerHtmlWrites[0]?.file,
    detail: innerHtmlWrites.length > 0
      ? `${innerHtmlWrites.length} escrita(s) de HTML dinamico detectada(s)`
      : 'Nenhum padrao arriscado de escrita HTML dinamica detectado',
    remediation: 'Prefira textContent e sanitize antes de renderizar HTML dinamico',
  });

  const viewFiles = await globFiles(projectRoot, ['app/views/**/*.erb', 'app/views/**/*.haml']);
  const unsafeViewHelpers = await grepInFiles(viewFiles, /\b(raw\s*\(|html_safe)\b/);
  items.push({
    id: 'T4',
    description: 'Evitar raw/html_safe em templates Hotwire',
    status: unsafeViewHelpers.length > 0 ? 'fail' : 'pass',
    severity: 'high',
    file: unsafeViewHelpers[0]?.file,
    detail: unsafeViewHelpers.length > 0
      ? `${unsafeViewHelpers.length} uso(s) de raw/html_safe em views detectado(s)`
      : 'Nenhum uso de raw/html_safe detectado em views',
    remediation: 'Use escape padrao do template ou sanitize para conteudo confiavel limitado',
  });

  const turboMethodLinks = await grepInFiles(viewFiles, /data:\s*\{[^}]*turbo_method|data-turbo-method/i);
  const authzHints = await grepInFiles(viewFiles, /policy\(|authorize|can\?|current_user/i);
  items.push({
    id: 'T5',
    description: 'Acoes mutantes via Turbo com sinais de controle de acesso',
    status: turboMethodLinks.length === 0 ? 'warn' : authzHints.length > 0 ? 'pass' : 'warn',
    severity: 'medium',
    detail:
      turboMethodLinks.length === 0
        ? 'Nao foram encontradas acoes mutantes via Turbo para validar'
        : authzHints.length > 0
          ? `Acoes Turbo mutantes detectadas com ${authzHints.length} indicio(s) de authz em views`
          : 'Acoes mutantes via Turbo detectadas sem indicios de authz nas views',
    remediation: 'Confirme autorizacao no backend para toda acao mutante iniciada por Turbo',
  });

  return {
    id: 'T',
    name: 'Hotwire Frontend Security',
    items,
  };
}
