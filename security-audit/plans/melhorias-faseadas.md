# Plano faseado — melhorias na skill `security-audit`

## Contexto

A skill `security-audit` (16 módulos, ~98 checks, todos baseados em regex + grep) já tem arquitetura modular sólida, detecção de stack, memória por projeto e histórico. O que limita hoje é: (a) falso-positivo inerente ao regex, (b) score agregado que esconde criticidade, (c) verificações manuais (F/J/K/O) que ficam esquecidas, (d) ausência de fixtures — refatorar qualquer regex quebra silenciosamente, (e) integração rasa com CI. Este plano organiza as 9 melhorias discutidas em 6 fases ordenadas por dependência e risco. **Remediation permanece textual — não há geração de patches** (preferência registrada em memória).

## Ordem das fases

Ajustei a ordem de ROI original para colocar **fixtures antes de AST**: sem baseline de testes, migrar regex → AST regride silenciosamente.

```
Fase 0 → Fundação de testes          (item 4)
Fase 1 → Honestidade de score e CI   (itens 3, 6, 8)
Fase 2 → Performance                 (item 5)
Fase 3 → Config e UX manual          (itens 9, 2)
Fase 4 → Precisão via AST            (item 1)
Fase 5 → Regras declarativas         (item 7)
```

---

## Fase 0 — Fundação de testes (item 4)

**Objetivo:** ter baseline antes de tocar em qualquer check.

**Escopo:**
- Criar `security-audit/test-projects/` com mini-projetos fixture por stack:
  - `rails-vulnerable/` e `rails-secure/` (cobre R, P, Q, S, T)
  - `nextjs-vulnerable/` e `nextjs-secure/` (cobre core + Supabase)
  - `ruby-only-no-rails/` (validar detecção negativa)
- Criar `security-audit/test/run-fixtures.ts`: executa `runAuditModules()` contra cada fixture e compara JSON de saída com snapshot em `test/snapshots/<fixture>.json`.
- Script `npm test` na raiz da skill (ou `bun test`) rodando a suíte.
- CI workflow mínimo em `.github/workflows/security-audit-test.yml` rodando a suíte no push.

**Arquivos novos:**
- `security-audit/test-projects/**`
- `security-audit/test/run-fixtures.ts`
- `security-audit/test/snapshots/*.json`

**Arquivos tocados:**
- `security-audit/package.json` (adicionar script `test`)

**Critério de aceite:** `npm test` verde; alterar um regex qualquer em `scripts/checks/*.ts` quebra um snapshot específico.

---

## Fase 1 — Honestidade de score e integração CI (itens 3, 6, 8)

**Objetivo:** score deixa de enganar; skill vira gate utilizável em CI.

**Escopo:**

### 1a. Score honesto (item 3) — [scripts/index.ts:173-188](security-audit/scripts/index.ts:173)
- Separar duas métricas no `AuditReport`:
  - `gate: 'pass' | 'fail'` = zero itens `fail` com severity `critical`.
  - `coverage.percentage` = `pass / (total - skip)` dos aplicáveis.
- Atualizar `SeverityBreakdown` e `AuditHistoryEntry` para gravar ambos. Entradas antigas do `history.json` seguem válidas (campos opcionais).
- Atualizar `formatTerminal()` em [scripts/reporter.ts:83-175](security-audit/scripts/reporter.ts:83) para mostrar gate (✅/❌) em destaque e cobertura separada; tendência plota as duas linhas.

### 1b. SARIF + exit code por severidade (item 6) — [scripts/reporter.ts](security-audit/scripts/reporter.ts), [scripts/index.ts:25-71](security-audit/scripts/index.ts:25)
- Nova função `formatSarif(report): string` em `reporter.ts` seguindo schema SARIF 2.1.0 (rules = CheckItem.id, results = failures, level mapeado de severity).
- Nova flag `--sarif` (mutuamente exclusiva com `--json`).
- Nova flag `--fail-on=<critical|high|medium|low>` (default `critical`) controlando exit code. Substitui a regra atual hardcoded em [index.ts:218](security-audit/scripts/index.ts:218).

### 1c. Sanity-check de detecção de stack (item 8) — [scripts/stack.ts](security-audit/scripts/stack.ts)
- Após `detectStack()`, rodar heurística: se `Gemfile` existe mas `frameworks.rails === false`, OU `package.json` existe mas nenhum framework JS detectou, emitir warning no terminal (não falha) convidando o usuário a reportar.
- Adicionar seção "Stack Detection" no output: mostra o que foi detectado E o que foi conscientemente ignorado, para dar visibilidade.

**Arquivos tocados:**
- `security-audit/scripts/types.ts` (adicionar `gate`, `coverage`)
- `security-audit/scripts/index.ts` (parseArgs, cálculo, exit)
- `security-audit/scripts/reporter.ts` (terminal + sarif)
- `security-audit/scripts/stack.ts` (sanity)
- `security-audit/SKILL.md` e `README.md` (documentar flags novas)

**Critério de aceite:** `--fail-on=high` falha se há high não resolvido; `--sarif` valida contra schema SARIF oficial; fixture Rails sem `Gemfile` detectado corretamente não dispara warning, mas fixture onde Gemfile existe e Rails não é detectado dispara.

---

## Fase 2 — Performance (item 5)

**Objetivo:** execução mais rápida sem mudar semântica.

**Escopo:**

### 2a. Paralelização intra-módulo — [scripts/runtime.ts:54](security-audit/scripts/runtime.ts:54)
- Hoje `Promise.all` paraleliza entre módulos. Dentro de cada check, os vários `grepInFiles()`/`globFiles()` rodam sequenciais. Reescrever os 3–5 checks mais pesados (`access-control.ts`, `dependencies.ts`, `injection.ts`) para usar `Promise.all` entre blocos independentes.

### 2b. Cache de IO — [scripts/utils.ts](security-audit/scripts/utils.ts)
- Criar `CheckContext.io` com cache por run:
  - `cachedGlob(patterns[])` memoriza resultado (chave = patterns ordenados).
  - `cachedRead(path)` memoriza `readFileContent`.
- Passar via `CheckContext` (já existe em `types.ts`). Checks existentes migram gradualmente; utils livres continuam funcionando.
- Cache descartado ao fim da run (não persiste).

### 2c. Compilação ahead-of-time — `security-audit/package.json`, `security-audit/SKILL.md`
- Adicionar `build` script (`tsc` → `dist/`).
- SKILL.md passa a invocar `node dist/index.js` quando `dist/` existe; fallback `npx tsx scripts/index.ts` em dev.
- Publicar `dist/` versionado no repo (skill é distribuída como-é, sem build step do usuário).

**Arquivos tocados:**
- `security-audit/scripts/runtime.ts`
- `security-audit/scripts/utils.ts`
- `security-audit/scripts/types.ts` (estender `CheckContext`)
- `security-audit/scripts/checks/{access-control,dependencies,injection}.ts`
- `security-audit/package.json`
- `security-audit/tsconfig.json` (se não existir)
- `security-audit/SKILL.md`

**Critério de aceite:** tempo de run em fixture `rails-secure` cai ≥40% medido com `time`; fixture snapshots (Fase 0) permanecem idênticos.

---

## Fase 3 — Config versionada + Checklist interativo (itens 9, 2)

**Objetivo:** projetos ganham config no próprio repo e os F/J/K/O deixam de ser esquecidos.

### 3a. Config versionada (item 9) — [scripts/memory.ts](security-audit/scripts/memory.ts)
- Nova função `loadProjectConfig(projectRoot)` lê `<projectRoot>/.security-audit.json` se existir. Faz merge com a config de `memory/{hash}/config.json`, priorizando a do repo.
- Campos typicamente versionados: `name`, `type`, `sensitiveData`, `isPublic`, `excludedItems` compartilhados do time.
- Campos que ficam em `memory/` (local): histórico, ignores pessoais não compartilhados.
- Documentar em `SKILL.md` e `README.md` qual arquivo usar quando.

### 3b. Checklist interativo F/J/K/O (item 2) — [scripts/index.ts](security-audit/scripts/index.ts), novo módulo
- Novo arquivo `scripts/checks/manual-checklist.ts` exportando `check()` padrão, porém em vez de grep:
  - Lê `memory/{hash}/manual-answers.json`.
  - Para cada item manual (F, J, K, O) com resposta ausente ou vencida (>90 dias), emite `status: 'warn'` com `detail` explicando a pergunta a responder.
  - Itens com resposta fresca e `answered: 'na' | 'pass'` viram `skip`/`pass`.
- Nova flag CLI `--answer-manual`: modo wizard interativo (usa `readline`) que pergunta cada item vencido e grava `manual-answers.json`.
- Registrar o módulo em [scripts/modules/index.ts](security-audit/scripts/modules/index.ts) como `generic`, `layer: 'core'`.
- Remover responsabilidade de "mencione ao usuário" do SKILL.md — agora é automatizado.

**Arquivos novos:**
- `security-audit/scripts/checks/manual-checklist.ts`

**Arquivos tocados:**
- `security-audit/scripts/memory.ts`
- `security-audit/scripts/modules/index.ts`
- `security-audit/scripts/index.ts` (flag `--answer-manual`)
- `security-audit/scripts/types.ts` (tipo `ManualAnswer`)
- `security-audit/SKILL.md`, `README.md`, `SECURITY_CHECKLIST.md` (atualizar fluxo)

**Critério de aceite:** rodar a skill em fixture nova → F/J/K/O aparecem como `warn` com prompt claro; `--answer-manual` guia o usuário e grava JSON; re-run em <90 dias não pergunta de novo.

---

## Fase 4 — Precisão via AST (item 1)

**Objetivo:** eliminar falso-positivo dos checks mais ruidosos. **Pré-requisito: Fase 0** (fixtures protegem a migração).

**Escopo:**
- Adicionar dependências: `ts-morph` (TS/JS) e `@ruby/prism` (Ruby). Lazy-load — só carrega se o check for rodar.
- Criar helpers em novo arquivo `scripts/ast.ts`:
  - `parseTypeScript(filePath)` → `ts.SourceFile` com cache por path+mtime.
  - `parseRuby(filePath)` → AST Prism com cache.
  - `findCalls(ast, name)`, `findStringLiterals(ast)`, etc. — utilitários de query.
- Migrar **apenas os checks com maior falso-positivo** nesta fase:
  - [scripts/checks/injection.ts](security-audit/scripts/checks/injection.ts): E1 (`eval`), E2 (`new Function`), E3 (`exec`), E4 (SQL templates) — distinguir uso real vs string estática vs comentário vs log.
  - [scripts/checks/secrets-crypto.ts](security-audit/scripts/checks/secrets-crypto.ts): H1 (hardcoded secrets), H5 (`NEXT_PUBLIC_` com valor suspeito), H6 (`localStorage` com token).
  - [scripts/checks/rails-stack.ts](security-audit/scripts/checks/rails-stack.ts): R4 (`html_safe`/`raw` — só alertar se input dinâmico), R5 (`redirect_to` — excluir `*_url` helpers).
- Demais checks seguem regex (não compensa migrar onde o regex já funciona bem).

**Arquivos novos:**
- `security-audit/scripts/ast.ts`

**Arquivos tocados:**
- `security-audit/scripts/checks/injection.ts`
- `security-audit/scripts/checks/secrets-crypto.ts`
- `security-audit/scripts/checks/rails-stack.ts`
- `security-audit/package.json` (deps)

**Critério de aceite:** fixture vulnerável sinaliza os mesmos itens de antes; fixture segura que antes tinha falso-positivo em R4 (`"foo".html_safe`) ou E4 (SQL em comentário) agora passa limpa. Snapshots atualizados com review humano.

---

## Fase 5 — Regras declarativas YAML (item 7)

**Objetivo:** usuário adiciona regra simples sem forkar a skill.

**Escopo:**
- Novo loader `scripts/rules-loader.ts`: lê `<projectRoot>/.security-audit.rules.yaml` no começo da run.
- Schema YAML mínimo (validado com Zod):
  ```yaml
  rules:
    - id: CUSTOM-1
      description: "Sem console.log em server code"
      severity: medium
      glob: "app/api/**/*.ts"
      pattern: "console\\.log"
      expect: absent  # ou "present"
      remediation: "Use logger estruturado"
  ```
- Regras viram um módulo adicional no `AUDIT_MODULES`, scope `custom`, layer `custom`.
- Runtime AST já existe da Fase 4: regra com `ast: true` roda via `ast.ts`; sem isso, regex.
- Documentar com exemplo em `README.md`.

**Arquivos novos:**
- `security-audit/scripts/rules-loader.ts`

**Arquivos tocados:**
- `security-audit/scripts/modules/index.ts` (registrar módulo custom)
- `security-audit/scripts/types.ts` (tipo `CustomRule`)
- `security-audit/README.md`

**Critério de aceite:** fixture com `.security-audit.rules.yaml` contendo 2 regras (uma pass, uma fail) é detectada e aparece no relatório como categoria `CUSTOM`.

---

## Verificação end-to-end

Ao fim de cada fase:

1. `cd security-audit && npm test` (suíte de fixtures criada na Fase 0).
2. Run manual em projeto real:
   ```bash
   npx tsx security-audit/scripts/index.ts /path/to/real-project
   npx tsx security-audit/scripts/index.ts /path/to/real-project --json
   npx tsx security-audit/scripts/index.ts /path/to/real-project --sarif  # a partir da Fase 1
   ```
3. Comparar histórico antes/depois: `cat security-audit/memory/<hash>/history.json` — nenhuma regressão silenciosa de score entre duas runs da mesma revisão.
4. A partir da Fase 2, medir tempo com `time` em fixture grande.
5. Confirmar no terminal que warning de detecção de stack aparece/some conforme esperado.

## Arquivos críticos (referência rápida)

- [scripts/index.ts](security-audit/scripts/index.ts) — CLI, orquestração, cálculo de score/exit
- [scripts/runtime.ts](security-audit/scripts/runtime.ts) — execução paralela entre módulos
- [scripts/types.ts](security-audit/scripts/types.ts) — `CheckItem`, `CategoryResult`, `AuditReport`, `CheckContext`
- [scripts/modules/index.ts](security-audit/scripts/modules/index.ts) — registro dos 16 módulos
- [scripts/checks/*.ts](security-audit/scripts/checks/) — 98 checks agrupados por categoria
- [scripts/stack.ts](security-audit/scripts/stack.ts) — detecção de stack (file-marker based)
- [scripts/memory.ts](security-audit/scripts/memory.ts) — config + history por hash de path
- [scripts/reporter.ts](security-audit/scripts/reporter.ts) — formatTerminal / formatJson
- [scripts/utils.ts](security-audit/scripts/utils.ts) — grep/glob/fileExists/readFileContent

## Fora de escopo (decidido)

- Geração automática de patches/diffs de correção. Remediation permanece textual.
- Reescrita dos 98 checks em AST — só os mais ruidosos (Fase 4).
- Publicação como pacote npm — skill continua sendo consumida via path local.
