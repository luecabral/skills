import { join } from 'node:path';
import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { fileExists, globFiles, grepInFiles, readFileContent } from '../utils.js';

export async function check(projectRoot: string, _context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];

  const applicationController = join(projectRoot, 'app', 'controllers', 'application_controller.rb');
  const hasApplicationController = await fileExists(applicationController);
  const applicationControllerContent = hasApplicationController ? await readFileContent(applicationController) : null;

  const csrfEnabled = Boolean(
    applicationControllerContent &&
      /protect_from_forgery|verify_authenticity_token|forgery_protection/i.test(applicationControllerContent),
  );
  items.push({
    id: 'R1',
    description: 'Protecao CSRF ativa no Rails',
    status: csrfEnabled ? 'pass' : 'fail',
    severity: 'critical',
    file: hasApplicationController ? applicationController : undefined,
    detail: csrfEnabled
      ? 'Protecao CSRF detectada no controller base'
      : 'Nao foi encontrada protecao CSRF explicita no controller base',
    remediation: 'Ative protect_from_forgery/verify_authenticity_token no ApplicationController',
  });

  const controllerFiles = await globFiles(projectRoot, ['app/controllers/**/*.rb']);
  const strongParamsUsage = await grepInFiles(controllerFiles, /\.require\s*\(|\.permit\s*\(/);
  items.push({
    id: 'R2',
    description: 'Uso de strong parameters nos controllers',
    status: controllerFiles.length === 0 ? 'warn' : strongParamsUsage.length > 0 ? 'pass' : 'fail',
    severity: 'critical',
    detail:
      controllerFiles.length === 0
        ? 'Nenhum controller Rails encontrado'
        : strongParamsUsage.length > 0
          ? `Strong parameters encontrados em ${strongParamsUsage.length} ocorrencia(s)`
          : 'Nao foram encontrados .require/.permit nos controllers',
    remediation: 'Use params.require(...).permit(...) para todos os inputs mutaveis',
  });

  const authGuards = await grepInFiles(
    controllerFiles,
    /before_action\s+:(authenticate_|require_|authorize_|set_current_|verify_)/i,
  );
  items.push({
    id: 'R3',
    description: 'Guardas de autenticacao/autorizacao por before_action',
    status: controllerFiles.length === 0 ? 'warn' : authGuards.length > 0 ? 'pass' : 'warn',
    severity: 'high',
    detail:
      controllerFiles.length === 0
        ? 'Nenhum controller Rails encontrado'
        : authGuards.length > 0
          ? `${authGuards.length} guardas before_action encontrados`
          : 'Nao foram encontrados guardas before_action claros de authz/authn',
    remediation: 'Aplique before_action para autenticar e autorizar antes de acoes sensiveis',
  });

  const rbFiles = await globFiles(projectRoot, ['app/**/*.rb', 'lib/**/*.rb']);
  const unsafeHtml = await grepInFiles(rbFiles, /\b(html_safe|raw\s*\()/);
  items.push({
    id: 'R4',
    description: 'Evitar html_safe/raw com conteudo dinamico',
    status: unsafeHtml.length > 0 ? 'fail' : 'pass',
    severity: 'high',
    file: unsafeHtml[0]?.file,
    detail: unsafeHtml.length > 0
      ? `${unsafeHtml.length} uso(s) de html_safe/raw detectado(s)`
      : 'Nenhum uso de html_safe/raw detectado',
    remediation: 'Evite html_safe/raw; prefira escape padrao e sanitize quando necessario',
  });

  const redirectRisk = await grepInFiles(controllerFiles, /redirect_to\s+params\[|redirect_to\s+.*\burl\b/i);
  items.push({
    id: 'R5',
    description: 'Sem open redirect com redirect_to baseado em input',
    status: redirectRisk.length > 0 ? 'warn' : 'pass',
    severity: 'high',
    file: redirectRisk[0]?.file,
    detail: redirectRisk.length > 0
      ? `${redirectRisk.length} possiveis redirect_to com input dinamico detectados`
      : 'Nenhum padrao obvio de open redirect detectado',
    remediation: 'Valide destino de redirect com allowlist antes de chamar redirect_to',
  });

  const productionConfig = join(projectRoot, 'config', 'environments', 'production.rb');
  const productionSrc = await readFileContent(productionConfig);
  const secureCookies = Boolean(
    productionSrc &&
      /force_ssl\s*=\s*true|session_store|cookies\.same_site_protection|ssl_options/i.test(productionSrc),
  );
  items.push({
    id: 'R6',
    description: 'Configuracao segura de cookies/sessao em producao',
    status: secureCookies ? 'pass' : 'warn',
    severity: 'high',
    file: (await fileExists(productionConfig)) ? productionConfig : undefined,
    detail: secureCookies
      ? 'Sinais de configuracao segura de sessao/cookies detectados'
      : 'Nao foram encontrados sinais claros de hardening de cookies/sessao em production.rb',
    remediation: 'Ative force_ssl e configure cookie store com SameSite e flags seguras em producao',
  });

  return {
    id: 'R',
    name: 'Rails Stack Security',
    items,
  };
}
