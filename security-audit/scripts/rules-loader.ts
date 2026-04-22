import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import type { CategoryResult, CheckContext, CheckItem, Severity } from './types.js';
import { fileExists, readFileContent, globFiles, grepInFiles } from './utils.js';
import { parseTypeScript, findTsCalls, findTsStringLiterals } from './ast.js';

const RuleSchema = z.object({
  id: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  glob: z.string(),
  pattern: z.string().optional(),
  ast: z.boolean().optional(),
  expect: z.enum(['absent', 'present']),
  remediation: z.string().optional(),
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
      for (const file of files) {
        if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js') && !file.endsWith('.jsx')) {
          continue;
        }
        
        const sourceFile = await parseTypeScript(file, context);
        if (!sourceFile) continue;

        if (rule.pattern) {
          // If pattern is provided, look for function calls with that name
          const calls = findTsCalls(sourceFile, [rule.pattern]);
          for (const call of calls) {
            matches.push({
              file,
              line: call.getStartLineNumber(),
              text: call.getText()
            });
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