---
name: ralph-loop-parallel
description: Versão experimental do ralph-loop que paraleliza issues independentes via
subagentes em worktrees isolados. Ativa quando o usuário diz "roda o ralph paralelo",
"executa o loop paralelo", "começa o ralph paralelo" ou "ralph-loop-parallel". Requer
plano com campo depends_on por issue; sem isso, delega ao ralph-loop sequencial.
---

# Ralph Loop Parallel (experimental)

Variante paralela do `ralph-loop`. Issues sem dependência entre si rodam em **ondas**,
cada uma num subagente isolado em worktree próprio. Após cada onda, o orquestrador
integra as branches via `merge --no-ff` na branch base da feature.

**Diferenças em relação ao `ralph-loop` original**:
- Trabalha sempre em modo "branch única" (uma branch da feature recebe tudo no final)
- Cada issue gera uma branch efêmera durante o desenvolvimento, descartada após merge
- Paraleliza issues independentes via subagentes em worktrees
- Só tem modo Loop — para fix, use o `ralph-loop` original

---

## Pré-requisitos

`.plans/plan.md` deve ter:
- Campo `Branch:` no topo definindo a branch base da feature
- Cada issue com campo opcional `depends_on: [<ids>]`

Exemplo:

```md
Branch: feat/projeto-x

- [ ] 1. Setup do schema de DB
  depends_on: []
- [ ] 2. Endpoint /users
  depends_on: [1]
- [ ] 3. Endpoint /products
  depends_on: [1]
- [ ] 4. Frontend de listagem
  depends_on: [2, 3]
```

Se **nenhuma** issue tem `depends_on`, anuncia:
"Plano sem dependências marcadas — delegando ao ralph-loop sequencial."
E invoca a skill `ralph-loop`.

---

## Passo 1 — Ler plano e computar ondas

Leia `.plans/plan.md`. Para cada issue com checkbox `[ ]`, monte o grafo de dependências
a partir do campo `depends_on`. Issues já marcadas `[x]` contam como "resolvidas".

Compute ondas via topological sort:
- **Onda N** = conjunto de issues cujos `depends_on` estão todos em ondas anteriores ou
  já marcados `[x]`.

Anuncie:
```
Plano: N issues pendentes em K ondas
Onda 1: [#1]
Onda 2: [#2, #3]
Onda 3: [#4]
Iniciando ralph-loop-parallel.
```

---

## Passo 2 — Loop por onda

Para cada onda em sequência:

### 2.1 — Spawn paralelo
Numa **única mensagem**, dispare um `Agent(isolation: "worktree", ...)` por issue da onda.

**Limite**: máx. 5 subagentes paralelos. Se a onda tiver mais de 5 issues, divida em
sub-ondas de até 5 cada (executadas em sequência, com integração entre elas).

Prompt do subagente (template, preencher os campos):

```
Você é um subagente do ralph-loop-parallel trabalhando na issue #<id>: <título>.

Contexto da issue:
<descrição completa copiada do plano>

Branch base (já está no worktree): <branch da feature>
Branch a criar para esta issue: feat/issue-<id>-<slug>

Tarefas:
1. Crie e faça checkout da branch `feat/issue-<id>-<slug>` a partir do HEAD atual
2. Invoque a skill `tdd` no escopo desta issue (respeite o limite de 2 ciclos)
3. Quando os testes passarem, invoque `smart-commit`
4. NÃO abra PR. NÃO faça push. O orquestrador faz isso ao final.

Retorne EXATAMENTE neste formato, uma chave por linha:
STATUS: ok
BRANCH: feat/issue-<id>-<slug>
SUMMARY: <resumo curto em uma linha>

Ou, se falhar:
STATUS: failed: <motivo curto>

Se a issue for ambígua, retorne:
STATUS: failed: ambígua: <o que precisa ser esclarecido>
```

### 2.2 — Esperar todos retornarem
Quando todos os subagentes da onda retornarem, faça o parse dos resultados.

### 2.3 — Integração sequencial
Volte ao working dir principal (branch base da feature). Para cada subagente com
`STATUS: ok`, na ordem em que retornaram:

```bash
git checkout <branch-base>
git merge --no-ff <branch-da-issue>
```

**Se merge ok**:
- Atualize checkbox da issue para `[x]` no `.plans/plan.md`
- Limpe:
  ```bash
  git worktree remove <path-do-worktree>
  git branch -d <branch-da-issue>
  ```

**Se merge falhar (conflito)**:
- **Pare tudo**. Não tente próxima issue da onda nem próxima onda.
- **NÃO** remova o worktree nem a branch — eles ficam preservados para inspeção.
- Reporte:
  ```
  ⚠ Conflito ao mergear feat/issue-<id>-<slug> em <branch-base>
  Branch preservada: feat/issue-<id>-<slug>
  Worktree preservado: <path>
  Issues já integradas nesta sessão: <lista>
  Issues pendentes: <lista>

  Resolva o conflito manualmente e retome com "continua o loop paralelo".
  ```

### 2.4 — Falha em subagente da onda
Se algum subagente retornar `STATUS: failed`:
- Integre normalmente os que passaram (passo 2.3)
- **Não inicie a próxima onda**
- Reporte:
  ```
  Onda <N> concluída com falhas.
  ✓ Integradas: <lista de #id>
  ✗ Falharam: <lista de #id — motivo>
  Pausando para decisão humana.
  ```

---

## Passo 3 — Finalização

Após todas as ondas concluírem sem erro:
- Faça checkout da branch base da feature
- Confirme que todos os checkboxes estão `[x]`
- Invoque `open-pr` (que apaga o doc antes do push e abre um único PR para a branch da feature)

---

## Proteções

- **Máx. 5 subagentes paralelos** por onda (evita estouro de disco com worktrees)
- **Máx. 2 ciclos TDD por issue** (herdado da skill `tdd`)
- **Conflito de merge para tudo** — não tenta resolver sozinho
- **Falha em subagente para a próxima onda** — integra os que passaram, pausa
- **Modo Fix não suportado** — use `ralph-loop` para fix
- **Sem `depends_on` no plano** — delega ao `ralph-loop` sequencial

---

## Regras

- Nunca pular TDD em nenhum subagente
- Nunca forçar push com testes falhando
- Não mergeia PRs — responsabilidade do usuário
- Subagentes nunca abrem PR nem fazem push — só o orquestrador, ao final
- Se issue for ambígua, subagente retorna `STATUS: failed: ambígua: <motivo>` e o
  orquestrador pausa
- Cleanup automático de worktree + branch local **apenas após merge ok**
- Em caso de conflito ou falha, preserva worktrees/branches para inspeção humana
