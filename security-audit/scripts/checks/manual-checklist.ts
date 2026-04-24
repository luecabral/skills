import { join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { CategoryResult, CheckContext, CheckItem } from '../types.js';
import { getProjectMemoryDir } from '../memory.js';
import { fileExists } from '../utils.js';

export interface ManualAnswer {
  itemId: string;
  answered: 'pass' | 'fail' | 'na';
  detail?: string;
  date: string;
}

const MANUAL_CHECKS = [
  {
    id: 'F1',
    description: 'SSRF: Validação de URLs fornecidas pelo usuário',
    severity: 'critical' as const,
    question: 'O sistema faz requisições HTTP para URLs fornecidas pelo usuário? Se sim, elas são validadas contra IPs internos/locais?',
    remediation: 'Use uma allowlist de domínios ou bloqueie resolução para IPs privados (10.0.0.0/8, 127.0.0.0/8, etc)'
  },
  {
    id: 'J1',
    description: 'Insecure Deserialization: Dados não confiáveis',
    severity: 'critical' as const,
    question: 'O sistema desserializa dados complexos (YAML, Pickle, Marshal, objetos Java) vindos do usuário?',
    remediation: 'Use formatos seguros como JSON. Se precisar desserializar formatos complexos, use safe_load ou valide a assinatura antes.'
  },
  {
    id: 'K1',
    description: 'LLM: Proteção contra Prompt Injection',
    severity: 'high' as const,
    question: 'O sistema envia input do usuário diretamente para modelos de IA (LLMs)?',
    remediation: 'Separe instruções de dados (system vs user messages), use delimitadores claros e valide a saída do modelo.'
  },
  {
    id: 'O1',
    description: 'Processos: Plano de Resposta a Incidentes',
    severity: 'medium' as const,
    question: 'Existe um plano documentado de como agir em caso de vazamento de dados ou invasão?',
    remediation: 'Crie um documento simples com contatos de emergência, passos para isolamento e comunicação.'
  }
];

export function getManualAnswersPath(projectRoot: string): string {
  return join(getProjectMemoryDir(projectRoot), 'manual-answers.json');
}

export async function loadManualAnswers(projectRoot: string): Promise<ManualAnswer[]> {
  const path = getManualAnswersPath(projectRoot);
  if (!(await fileExists(path))) return [];
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as ManualAnswer[];
  } catch {
    return [];
  }
}

export async function saveManualAnswers(projectRoot: string, answers: ManualAnswer[]): Promise<void> {
  const path = getManualAnswersPath(projectRoot);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(answers, null, 2), 'utf-8');
}

export async function check(projectRoot: string, _context?: CheckContext): Promise<CategoryResult> {
  const items: CheckItem[] = [];
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
