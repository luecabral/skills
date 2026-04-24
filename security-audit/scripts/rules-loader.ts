import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import type { CategoryResult, CheckContext, CheckItem, Severity } from './types.js';
import { fileExists, readFileContent, globFiles, grepInFiles } from './utils.js';
import { parseTypeScript, findTsCallExpressions } from './ast.js';

const RuleSchema = z
  .object({
    id: z.string(),
    description: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    glob: z.string(),
    pattern: z.string().optional(),
    ast: z.boolean().optional(),
    expect: z.enum(['absent', 'present']),
    remediation: z.string().optional(),
  })
  .refine((rule) => rule.pattern !== undefined || rule.ast !== true, {
    message: 'Regras com ast: true exigem um pattern regex para buscar nos nós',
  })
  .refine(
    (rule) => {
      if (!rule.pattern) return true;
      try {
        new RegExp(rule.pattern);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'pattern não é uma expressão regular válida' },
  )
  .refine((rule) => !rule.glob.includes('..'), {
    message: 'glob pattern não pode conter ".." (escape de path não permitido)',
  });

const RulesFileSchema = z.object({
  rules: z.array(RuleSchema),
});

export type CustomRule = z.infer<typeof RuleSchema>;

export async function loadCustomRules(projectRoot: string): Promise<CustomRule[]> {
  const rulesPath = join(projectRoot, '.security-audit.rules.yaml');
  if (!(await fileExists(rulesPath))) return [];

  try {
    const content = await readFileContent(rulesPath);
    if (!content) return [];

    const parsed = parse(content);
    const validated = RulesFileSchema.parse(parsed);
    return validated.rules;
  } catch (err) {
    console.error(`Erro ao carregar regras customizadas em ${rulesPath}:`, err);
    return [];
  }
}

export async function runCustomRules(projectRoot: string, context?: CheckContext): Promise<CategoryResult | null> {
  const rules = await loadCustomRules(projectRoot);
  if (rules.length === 0) return null;

  const items: CheckItem[] = [];

  for (const rule of rules) {
    const files = await globFiles(projectRoot, [rule.glob], context);
    
    if (files.length === 0) {
      items.push({
        id: rule.id,
        description: rule.description,
        status: rule.expect === 'absent' ? 'pass' : 'fail',
        severity: rule.severity as Severity,
        detail: `Nenhum arquivo encontrado para o padrão ${rule.glob}`,
        remediation: rule.remediation,
      });
      continue;
    }

    let matches: { file: string; line: number; text: string }[] = [];

    if (rule.ast) {
      // AST-based check (currently only supports TS/JS)
      const patternRegex = rule.pattern ? new RegExp(rule.pattern) : null;
      for (const file of files) {
        if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js') && !file.endsWith('.jsx')) {
          continue;
        }
        
        const sourceFile = await parseTypeScript(file, context);
        if (!sourceFile) continue;

        if (patternRegex) {
          const calls = findTsCallExpressions(sourceFile);
          for (const call of calls) {
            const calleeText = call.getExpression().getText();
            const callText = call.getText();
            if (patternRegex.test(calleeText) || patternRegex.test(callText)) {
              matches.push({
                file,
                line: call.getStartLineNumber(),
                text: callText
              });
            }
          }
        }
      }
    } else if (rule.pattern) {
      // Regex-based check
      const regex = new RegExp(rule.pattern);
      matches = await grepInFiles(files, regex, context);
    }

    const hasMatches = matches.length > 0;
    const passed = rule.expect === 'absent' ? !hasMatches : hasMatches;

    items.push({
      id: rule.id,
      description: rule.description,
      status: passed ? 'pass' : 'fail',
      severity: rule.severity as Severity,
      file: matches[0]?.file,
      detail: hasMatches
        ? `${matches.length} ocorrência(s) encontrada(s)`
        : 'Nenhuma ocorrência encontrada',
      remediation: rule.remediation,
    });
  }

  return {
    id: 'CUSTOM',
    name: 'Regras Customizadas',
    items,
  };
}
