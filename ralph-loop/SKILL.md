---
name: ralph-loop
description: Use para desenvolvimento autônomo de issues planejadas, ou para propagar
correções em cascade. Ativa quando o usuário diz "roda o ralph loop", "executa o loop",
"começa o ralph", ou "ralph-fix <issue>: <ajuste>". Entrega branches encadeadas com
PRs abertos por issue, ou correção propagada por toda a chain.
---

# Ralph Loop

Dois modos: **loop** (desenvolve issues autonomamente) e **fix** (propaga correção em cascade).

## Princípio

Lê `.plans/plan.md` gerado pelo `prd-to-issues` (PRD + issues com checkboxes de status).
Branches são encadeadas: cada issue nasce da branch da anterior. O doc é apagado
pelo `open-pr` antes de cada push — nunca entra em PR.

---

## Modo Loop

### Passo 1 — Verificar doc de sessão
Leia `.plans/plan.md` na raiz do projeto. Se não existir, pare:
"`.plans/plan.md` não encontrado. Rode prd-to-issues primeiro."
Anuncie: `N issues encontradas. Iniciando ralph-loop.`

### Passo 2 — Loop por issue
Para cada issue com checkbox `[ ]`:

1. Anuncia `[X/N] Iniciando: <título>`
2. Cria branch a partir da anterior (ou main se for a primeira)
3. Invoca skill `tdd` com escopo da issue
4. Implementa até testes passarem (máx. 2 ciclos; se falhar, pausa e reporta)
5. Commita via `smart-commit`
6. Abre PR via `open-pr`
7. Atualiza checkbox para `[x]` no doc
8. Avança para a próxima issue

### Proteções
- Máx. 2 ciclos TDD por issue antes de pausar
- Máx. 3 falhas consecutivas: para e apresenta relatório
- Máx. 15 issues por sessão; se exceder, pede confirmação para continuar

---

## Modo Fix

Ativa com: `ralph-fix <issue>: <descrição do ajuste>`

### Passo 1 — Identificar escopo
Leia o doc e mapeie todas as branches downstream a partir da issue informada.

### Passo 2 — Corrigir issue base
Checkout da branch, aplica ajuste com TDD, commita e força push.

### Passo 3 — Rebase em cascade
Para cada issue downstream em ordem:
1. `git rebase <branch-anterior>`
2. Se conflito: pausa, descreve e aguarda resolução humana
3. Força push após rebase concluído

### Relatório
```
✓ X branches rebased
⚠ Y conflitos resolvidos manualmente
```

---

## Regras

- Nunca pular TDD em nenhum dos modos
- Nunca forçar push com testes falhando
- Não mergeia PRs — responsabilidade do usuário
- Se issue for ambígua, para e pergunta antes de implementar
