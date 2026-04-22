import { join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { getProjectHash } from '../memory.js';
import { fileExists } from '../utils.js';
const MANUAL_CHECKS = [
    {
        id: 'F1',
        description: 'SSRF: Validação de URLs fornecidas pelo usuário',
        severity: 'critical',
        question: 'O sistema faz requisições HTTP para URLs fornecidas pelo usuário? Se sim, elas são validadas contra IPs internos/locais?',
        remediation: 'Use uma allowlist de domínios ou bloqueie resolução para IPs privados (10.0.0.0/8, 127.0.0.0/8, etc)'
    },
    {
        id: 'J1',
        description: 'Insecure Deserialization: Dados não confiáveis',
        severity: 'critical',
        question: 'O sistema desserializa dados complexos (YAML, Pickle, Marshal, objetos Java) vindos do usuário?',
        remediation: 'Use formatos seguros como JSON. Se precisar desserializar formatos complexos, use safe_load ou valide a assinatura antes.'
    },
    {
        id: 'K1',
        description: 'LLM: Proteção contra Prompt Injection',
        severity: 'high',
        question: 'O sistema envia input do usuário diretamente para modelos de IA (LLMs)?',
        remediation: 'Separe instruções de dados (system vs user messages), use delimitadores claros e valide a saída do modelo.'
    },
    {
        id: 'O1',
        description: 'Processos: Plano de Resposta a Incidentes',
        severity: 'medium',
        question: 'Existe um plano documentado de como agir em caso de vazamento de dados ou invasão?',
        remediation: 'Crie um documento simples com contatos de emergência, passos para isolamento e comunicação.'
    }
];
async function getAnswersPath(projectRoot) {
    const hash = getProjectHash(projectRoot);
    const url = new URL(import.meta.url);
    const skillDir = dirname(dirname(dirname(url.pathname)));
    return join(skillDir, 'memory', hash, 'manual-answers.json');
}
export async function loadManualAnswers(projectRoot) {
    const path = await getAnswersPath(projectRoot);
    if (!(await fileExists(path)))
        return [];
    try {
        const content = await readFile(path, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return [];
    }
}
export async function saveManualAnswers(projectRoot, answers) {
    const path = await getAnswersPath(projectRoot);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(answers, null, 2), 'utf-8');
}
export async function check(projectRoot, _context) {
    const items = [];
    const answers = await loadManualAnswers(projectRoot);
    const now = new Date();
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    for (const check of MANUAL_CHECKS) {
        const answer = answers.find(a => a.itemId === check.id);
        if (!answer) {
            items.push({
                id: check.id,
                description: check.description,
                status: 'warn',
                severity: check.severity,
                detail: `Pendente: ${check.question} (Use --answer-manual para responder)`,
                remediation: check.remediation
            });
            continue;
        }
        const answerDate = new Date(answer.date);
        const isExpired = (now.getTime() - answerDate.getTime()) > NINETY_DAYS_MS;
        if (isExpired) {
            items.push({
                id: check.id,
                description: check.description,
                status: 'warn',
                severity: check.severity,
                detail: `Resposta vencida (>90 dias): ${check.question} (Use --answer-manual para atualizar)`,
                remediation: check.remediation
            });
            continue;
        }
        items.push({
            id: check.id,
            description: check.description,
            status: answer.answered === 'na' ? 'skip' : answer.answered,
            severity: check.severity,
            detail: answer.detail || `Respondido em ${answerDate.toLocaleDateString('pt-BR')}`,
            remediation: answer.answered === 'fail' ? check.remediation : undefined
        });
    }
    return {
        id: 'MANUAL',
        name: 'Verificações Manuais (SSRF, Deserialization, LLM, Processos)',
        items,
    };
}
