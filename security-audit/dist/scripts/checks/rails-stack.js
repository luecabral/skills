import { join } from 'node:path';
import { fileExists, globFiles, grepInFiles, readFileContent } from '../utils.js';
export async function check(projectRoot, context) {
    const items = [];
    const applicationController = join(projectRoot, 'app', 'controllers', 'application_controller.rb');
    const hasApplicationController = await fileExists(applicationController);
    const applicationControllerContent = hasApplicationController ? await readFileContent(applicationController, context) : null;
    const csrfEnabled = Boolean(applicationControllerContent &&
        /protect_from_forgery|verify_authenticity_token|forgery_protection/i.test(applicationControllerContent));
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
    const [strongParamsUsage, authGuards, unsafeHtmlRaw, redirectRiskRaw] = await Promise.all([
        grepInFiles(controllerFiles, /\.require\s*\(|\.permit\s*\(/, context),
        grepInFiles(controllerFiles, /before_action\s+:(authenticate_|require_|authorize_|set_current_|verify_)/i, context),
        grepInFiles(rbFiles, /\b(html_safe|raw\s*\()/, context),
        grepInFiles(controllerFiles, /redirect_to\s+params\[|redirect_to\s+.*\burl\b/i, context)
    ]);
    items.push({
        id: 'R2',
        description: 'Uso de strong parameters nos controllers',
        status: controllerFiles.length === 0 ? 'warn' : strongParamsUsage.length > 0 ? 'pass' : 'fail',
        severity: 'critical',
        detail: controllerFiles.length === 0
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
        detail: controllerFiles.length === 0
            ? 'Nenhum controller Rails encontrado'
            : authGuards.length > 0
                ? `${authGuards.length} guardas before_action encontrados`
                : 'Nao foram encontrados guardas before_action claros de authz/authn',
        remediation: 'Aplique before_action para autenticar e autorizar antes de acoes sensiveis',
    });
    // Filter out safe usages of html_safe/raw (e.g. static strings)
    const unsafeHtml = unsafeHtmlRaw.filter(m => {
        // If it's a static string like "foo".html_safe, it's safe
        if (/['"][^'"]*['"]\.html_safe/.test(m.text))
            return false;
        return true;
    });
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
    // Filter out safe usages of redirect_to (e.g. *_url helpers)
    const redirectRisk = redirectRiskRaw.filter(m => {
        // If it's a *_url helper, it's safe
        if (/redirect_to\s+[a-z0-9_]+_url\b/i.test(m.text))
            return false;
        return true;
    });
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
    const productionSrc = await readFileContent(productionConfig, context);
    const secureCookies = Boolean(productionSrc &&
        /force_ssl\s*=\s*true|session_store|cookies\.same_site_protection|ssl_options/i.test(productionSrc));
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
