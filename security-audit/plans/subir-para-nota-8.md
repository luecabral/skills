# Plano — subir a skill `security-audit` de 7.5 → 8

## Contexto

Depois dos fixes R1–R5 (top-5 do audit), a skill está em ~7.5. Três gaps concretos impedem chegar a 8:

1. **Fixtures rasas.** As "vulnerable" disparam só R4/R5. Cenários para E1–E4 (eval/exec/SQL), H1/H5/H6 (secrets), N4 (console sensível), S4 (Sidekiq arg), A5 (auth ausente) estão silenciosamente não-exercitados. Resultado: mudança em qualquer um desses checks passa verde nos snapshots.
2. **Parser Ruby não detecta `eval`/`exec`.** Fixture `rails-vulnerable` tem `eval(params[:code])` mas o check E1 só olha TS/JS via `ts-morph`. Falso-negativo crítico.
3. **`dependencies.ts` não consulta DBs externas.** Só confia em `npm audit` (DB da npm) e `bundle-audit` (RubySec). Faltam CVEs que chegam antes no GitHub Advisory Database — OSV.dev agrega tudo.

Efeito combinado: o score "passou" pode esconder regressões reais. O objetivo deste plano é fechar esses três gaps em ordem de dependência.

**Decisões confirmadas com o usuário:**
- Dependencies ganha integração OSV.dev (não AST — a exploração mostrou que AST não agrega aqui).
- Fix de `eval`/`exec` Ruby via Prism entra no escopo (pré-requisito para fixtures Ruby exercitarem E1–E3).
- Mecanismo de *expectations* é **complementar** aos snapshots — dois níveis de defesa.
- Migração AST em access-control limita-se ao A5; A1–A4/A6/A7 seguem regex (SQL migrations e nomes de teste são bem servidos por regex).

---

## Ordem

```
Fase A → Fixtures vulneráveis reais + expectations + Ruby eval     (pré-requisito)
Fase B → AST para A5 em access-control                              (precisa da fase A)
Fase C → OSV.dev em dependencies                                    (paralela à B)
```

Fase A antes das outras porque sem fixtures que disparem os checks críticos, B e C migram/adicionam código sem safety net — exatamente o problema que os snapshots deveriam prevenir.

---

## Fase A — Fixtures vulneráveis reais + expectations + eval Ruby

### A1. Detecção de `eval`/`exec` em Ruby via Prism

**Arquivo tocado:** [scripts/checks/injection.ts](/Users/eriko.sodre/Documents/projects/claude-skills/security-audit/scripts/checks/injection.ts)

Reusar o padrão de `rails-stack.ts` (que já usa `findRubyCalls` + `parseRuby` + `lineFromOffset` do `scripts/ast.ts`):

- Abrir `.rb` dentro de `app/`, `lib/`, `config/` da fixture Rails
- `findRubyCalls(ast, ['eval', 'instance_eval', 'class_eval', 'module_eval'])` → E1
- `findRubyCalls(ast, ['exec', 'system', '`', 'Kernel.exec', 'IO.popen'])` com arg sendo string interpolada → E3
- Gerar `Match { file, line, text }` usando helpers existentes

**Funções a reusar** (todas em `scripts/ast.ts`):
- `parseRuby(file, context)` — AST cacheada por mtime
- `findRubyCalls(ast, names[])` — busca CallNode
- `lineFromOffset(content, offset)` — linha a partir de `location.startOffset`
- `nodeText(content, node)` — texto do nó

### A2. Expandir fixtures vulneráveis

**Arquivos novos em `test-projects/nextjs-vulnerable/`:**
- `app/api/admin/route.ts` — rota sem `getSession`/`auth()` (dispara A5)
- `lib/db.ts` — `pool.query(\`SELECT * FROM users WHERE id=${userId}\`)` (E4)
- `lib/eval-bad.ts` — `eval(req.body.code)` + `new Function(req.body.fn)` (E1, E2)
- `lib/exec-bad.ts` — `execSync(\`git log ${branch}\`)` (E3)
- `lib/secrets-bad.ts` — `const API_KEY = 'sk_live_abc123...'` (H1)
- `app/components/Login.tsx` — `localStorage.setItem('token', jwt)` (H6)
- `.env.local` — `NEXT_PUBLIC_API_SECRET=sk_xxx` (H5)
- `app/api/users/route.ts` — `console.log('password:', pwd)` (N4)

**Arquivos novos em `test-projects/rails-vulnerable/`:**
- `app/controllers/posts_controller.rb` — `User.where("name = '#{params[:q]}'")` (E4 Rails), sem `before_action :authenticate` (P equivalente)
- `app/workers/bad_worker.rb` — `UserWorker.perform_async(password)` (S4)
- `config/initializers/cache.rb` — `Rails.cache.write("user_token_#{id}", token)` (Q5)
- `app/controllers/sessions_controller.rb` — `flash[:error] = "User not found"` (N5 enumeração)

### A3. Mecanismo de expectations

**Arquivo novo:** `security-audit/test/expectations/<fixture>.json`

Schema (uma entrada por fixture):
```json
{
  "fixture": "nextjs-vulnerable",
  "mustFail": ["E1", "E2", "E3", "E4", "H1", "H5", "H6", "N4", "A5"],
  "mustPass": [],
  "mustWarn": []
}
```

**Arquivo tocado:** [test/run-fixtures.ts](/Users/eriko.sodre/Documents/projects/claude-skills/security-audit/test/run-fixtures.ts)

Após o report gerado, ANTES de comparar snapshot:
1. Carregar `expectations/<fixture>.json` se existir
2. Para cada ID em `mustFail`, achar o `CheckItem` e verificar `status === 'fail'`; reportar mismatch com mensagem explícita (ex: `❌ nextjs-vulnerable: E1 deveria falhar mas status=pass`)
3. Falhar teste se qualquer expectation violada (sem tocar snapshot)
4. Expectations rodam ANTES do snapshot comparison — se a fixture deixa de exercitar um check, teste falha antes mesmo de o snapshot ser comparado

### A4. Atualizar snapshots

Após expandir fixtures, rodar `npm test` uma vez para atualizar os 5 `.json` em `test/snapshots/`. Revisar diff para garantir que mudanças são só adições de `file`/`line`/status esperados.

**Critério de aceite da Fase A:**
- `test/expectations/nextjs-vulnerable.json` lista ≥9 `mustFail`; todos passam
- `test/expectations/rails-vulnerable.json` lista ≥6 `mustFail` incluindo E1 (eval Ruby); todos passam
- Remover qualquer `mustFail` da fixture faz `npm test` falhar com mensagem clara

---

## Fase B — AST para A5 em access-control

**Arquivo tocado:** [scripts/checks/access-control.ts:123-127](/Users/eriko.sodre/Documents/projects/claude-skills/security-audit/scripts/checks/access-control.ts)

### Problema atual

A5 usa regex `/getUser|getSession|auth\(\)|verifyToken|checkPermission|requireAuth|withAuth|authenticatedUser/i` em route handlers. Comentários (`// withAuth middleware`) e strings contam como match. FP clássico: handler sem auth passa porque algum comentário menciona `getSession`.

### Solução

Replicar padrão de `injection.ts` (linhas 60–85):

1. Para cada arquivo em `app/api/**`, `pages/api/**`, `src/app/api/**`, `src/pages/api/**`: `parseTypeScript(file, context)`
2. `sourceFile.forEachDescendant` procurando `CallExpression` onde o nome é um dos auth helpers (usar `getCallName` já definido em `injection.ts`)
3. Property access também (`supabase.auth.getSession()` → `getSession`)
4. Se não encontrar nenhuma call real, marcar a rota como sem-auth

**Funções a reusar:**
- `parseTypeScript` (scripts/ast.ts)
- `getCallName` — copiar de injection.ts para scripts/ast.ts (refactor pequeno: extrair para helper compartilhado) ou duplicar local

A1–A4, A6, A7 permanecem regex (SQL migrations e nomes de teste).

**Critério de aceite:** adicionar fixture controlada com `// const user = await getSession()` em comentário — A5 marca como fail (antes marcava pass). Fixture com chamada real continua pass.

---

## Fase C — OSV.dev em dependencies

### Novo helper

**Arquivo novo:** `security-audit/scripts/osv.ts`

Exporta:
```typescript
export interface OsvVuln {
  id: string;          // CVE-YYYY-NNNN ou GHSA-xxxx
  severity: Severity;  // mapeado de CVSS
  summary: string;
  fixedIn?: string;
}

export async function queryOsv(
  ecosystem: 'npm' | 'RubyGems',
  packageName: string,
  version: string,
  context?: CheckContext
): Promise<OsvVuln[]>;

export async function queryOsvBatch(
  ecosystem: 'npm' | 'RubyGems',
  packages: { name: string; version: string }[],
  context?: CheckContext
): Promise<Map<string, OsvVuln[]>>;
```

**Implementação:**
- `POST https://api.osv.dev/v1/querybatch` com array de packages (até 1000 por request)
- Timeout 10s por batch
- Rate-limit conservador: 1 batch por run (batches de 100)
- **Fail-open:** erro de rede → retorna Map vazio, não quebra auditoria
- **Cache:** `memory/{hash}/osv-cache.json` com TTL 24h por `{ecosystem}:{package}:{version}`
- Mapear severity: CVSS ≥9 → critical, 7–8.9 → high, 4–6.9 → medium, <4 → low

### Integração em dependencies.ts

**Arquivo tocado:** [scripts/checks/dependencies.ts](/Users/eriko.sodre/Documents/projects/claude-skills/security-audit/scripts/checks/dependencies.ts)

- Resolver deps de `package-lock.json` (JSON.parse, campo `packages`) ou `Gemfile.lock` (parser simples de `GEM > specs:`)
- Chamar `queryOsvBatch` apenas se houver ao menos 1 lockfile
- Adicionar novo CheckItem L6:
  - `description`: 'Dependências sem CVEs conhecidos (OSV.dev)'
  - `severity`: 'critical'
  - `status`: `fail` se OSV retornar crit/high; `warn` se só medium/low; `pass` se limpo; `skip` se API inacessível
  - `detail`: lista top 3 CVEs (`pacote@versão: CVE-ID (severity) — fixed in X.Y.Z`)
  - `remediation`: "Atualize `<pacote>` para `>=<fixedVersion>` ou verifique workaround documentado no advisory"

### Fixture de prova

Adicionar a `test-projects/nextjs-vulnerable/package-lock.json` uma dependência propositalmente antiga com CVE conhecido (ex: `lodash@4.17.11` que tem CVE-2019-10744) para validar que L6 falha.

**Expectation:** `"L6": "fail"` em `expectations/nextjs-vulnerable.json`.

**Fail-open test:** `test-projects/nextjs-secure/package-lock.json` sem deps vulneráveis conhecidos → L6 pass.

**Critério de aceite:**
- Cache OSV criado em `memory/{hash}/osv-cache.json` na primeira run; segunda run não faz HTTP
- Rede indisponível (ex: `NO_NETWORK=1 npm test`) → L6 status `skip`, auditoria completa
- Fixture vulnerable com lodash antigo dispara L6 fail com CVE-2019-10744 no detail

---

## Verificação end-to-end

1. `cd security-audit && npm test` — todas as 5 fixtures passam, expectations validadas
2. Alterar temporariamente regex de E1 em `injection.ts` para `/never_match_this/` → teste da fase A deve falhar com mensagem clara "E1 deveria falhar em nextjs-vulnerable mas status=pass"
3. Adicionar comentário `// getSession()` em rota da fixture segura → A5 deve continuar pass (porque é comentário, AST ignora)
4. Bloquear rede (`NO_NETWORK=1` ou offline) → L6 vira skip, resto da auditoria completa
5. Run em projeto real (ex: `~/projects/bstech-admin`) — comparar tempo antes/depois; tempo adicional esperado ≤ 2s na primeira run (OSV batch), ~0s nas subsequentes (cache)

---

## Arquivos críticos (referência rápida)

**Fase A:**
- [scripts/checks/injection.ts](/Users/eriko.sodre/Documents/projects/claude-skills/security-audit/scripts/checks/injection.ts) — adicionar detecção Ruby
- [scripts/ast.ts](/Users/eriko.sodre/Documents/projects/claude-skills/security-audit/scripts/ast.ts) — já tem `parseRuby`, `findRubyCalls`
- [test/run-fixtures.ts](/Users/eriko.sodre/Documents/projects/claude-skills/security-audit/test/run-fixtures.ts) — lógica de expectations
- `test-projects/{nextjs,rails}-vulnerable/**` — novos arquivos
- `test/expectations/*.json` — novo diretório
- `test/snapshots/*.json` — regerados

**Fase B:**
- [scripts/checks/access-control.ts](/Users/eriko.sodre/Documents/projects/claude-skills/security-audit/scripts/checks/access-control.ts) — A5 migrado
- [scripts/ast.ts](/Users/eriko.sodre/Documents/projects/claude-skills/security-audit/scripts/ast.ts) — possível export de `getCallName`

**Fase C:**
- `security-audit/scripts/osv.ts` — novo
- [scripts/checks/dependencies.ts](/Users/eriko.sodre/Documents/projects/claude-skills/security-audit/scripts/checks/dependencies.ts) — novo CheckItem L6
- [scripts/memory.ts](/Users/eriko.sodre/Documents/projects/claude-skills/security-audit/scripts/memory.ts) — cache OSV

## Fora de escopo

- i18n do output (decidido: nota 9)
- Modo incremental (rodar só em arquivos alterados desde último commit) — nota 9
- Migrar os outros 13 checks para AST — nota 9
- Geração de patches — permanente fora (preferência registrada)
