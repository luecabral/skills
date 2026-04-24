import { join } from 'node:path';
import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { fileExists, globFiles, grepInFiles, readFileContent } from '../utils.js';
import { findRubyCalls, parseRuby } from '../ast.js';

interface RubyMatch {
  file: string;
  line: number;
  text: string;
}

function lineFromOffset(content: string, offset: number): number {
  return content.slice(0, Math.max(0, offset)).split('\n').length;
}

function nodeText(content: string, node: { location?: { startOffset?: number; length?: number } }): string {
  const startOffset = node.location?.startOffset;
  const length = node.location?.length;
  if (typeof startOffset !== 'number' || typeof length !== 'number') return '';
  return content.slice(startOffset, startOffset + length).trim();
}

function isStringNode(node: any): boolean {
  return Boolean(node && node.type === 'StringNode');
}

function containsParamsNode(node: any): boolean {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'CallNode' && node.name === 'params') return true;
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        if (containsParamsNode(child)) return true;
      }
      continue;
    }
    if (value && typeof value === 'object' && containsParamsNode(value)) return true;
  }
  return false;
}

export async function check(projectRoot: string, context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];

  const applicationController = join(projectRoot, 'app', 'controllers', 'application_controller.rb');
  const hasApplicationController = await fileExists(applicationController);
  const applicationControllerContent = hasApplicationController ? await readFileContent(applicationController, context) : null;

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

  const controllerFiles = await globFiles(projectRoot, ['app/controllers/**/*.rb'], context);
  const rbFiles = await globFiles(projectRoot, ['app/**/*.rb', 'lib/**/*.rb'], context);

  const [strongParamsUsage, authGuards] = await Promise.all([
    grepInFiles(controllerFiles, /\.require\s*\(|\.permit\s*\(/, context),
    grepInFiles(controllerFiles, /before_action\s+:(authenticate_|require_|authorize_|set_current_|verify_)/i, context),
  ]);

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

  const unsafeHtml: RubyMatch[] = [];
  for (const file of rbFiles) {
    const content = await readFileContent(file, context);
    if (!content) continue;
    const ast = await parseRuby(file, context);
    if (!ast) continue;

    const calls = findRubyCalls(ast, ['html_safe', 'raw']);
    for (const call of calls) {
      if (call.name === 'html_safe' && isStringNode(call.receiver)) {
        continue;
      }
      if (call.name === 'raw') {
        const firstArg = call.arguments?.arguments?.[0];
        if (isStringNode(firstArg)) {
          continue;
        }
      }

      unsafeHtml.push({
        file,
        line: lineFromOffset(content, call.location?.startOffset ?? 0),
        text: nodeText(content, call),
      });
    }
  }

  items.push({
    id: 'R4',
    description: 'Evitar html_safe/raw com conteudo dinamico',
    status: unsafeHtml.length > 0 ? 'fail' : 'pass',
    severity: 'high',
    file: unsafeHtml[0]?.file,
    line: unsafeHtml[0]?.line,
    detail: unsafeHtml.length > 0
      ? `${unsafeHtml.length} uso(s) de html_safe/raw detectado(s)`
      : 'Nenhum uso de html_safe/raw detectado',
    remediation: 'Evite html_safe/raw; prefira escape padrao e sanitize quando necessario',
  });

  const redirectRisk: RubyMatch[] = [];
  for (const file of controllerFiles) {
    const content = await readFileContent(file, context);
    if (!content) continue;
    const ast = await parseRuby(file, context);
    if (!ast) continue;

    const calls = findRubyCalls(ast, ['redirect_to']);
    for (const call of calls) {
      const firstArg = call.arguments?.arguments?.[0];
      if (!firstArg) continue;

      if (isStringNode(firstArg)) {
        continue;
      }

      if (firstArg.type === 'CallNode' && typeof firstArg.name === 'string' && /_url$/i.test(firstArg.name)) {
        continue;
      }

      if (containsParamsNode(firstArg) || firstArg.type !== 'StringNode') {
        redirectRisk.push({
          file,
          line: lineFromOffset(content, call.location?.startOffset ?? 0),
          text: nodeText(content, call),
        });
      }
    }
  }

  items.push({
    id: 'R5',
    description: 'Sem open redirect com redirect_to baseado em input',
    status: redirectRisk.length > 0 ? 'warn' : 'pass',
    severity: 'high',
    file: redirectRisk[0]?.file,
    line: redirectRisk[0]?.line,
    detail: redirectRisk.length > 0
      ? `${redirectRisk.length} possiveis redirect_to com input dinamico detectados`
      : 'Nenhum padrao obvio de open redirect detectado',
    remediation: 'Valide destino de redirect com allowlist antes de chamar redirect_to',
  });

  const productionConfig = join(projectRoot, 'config', 'environments', 'production.rb');
  const productionSrc = await readFileContent(productionConfig, context);
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
