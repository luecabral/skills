---
name: ralph-loop
description: Use para desenvolvimento autônomo de issues planejadas, ou para propagar
correções em cascade. Ativa quando o usuário diz "roda o ralph loop", "executa o loop",
"começa o ralph", ou "ralph-fix <issue>: <ajuste>". Respeita a estrutura de branches
definida pelo prd-to-issues — uma branch por issue ou branch única, conforme o plano.
---

# Ralph Loop

Dois modos: **loop** (desenvolve issues autonomamente) e **fix** (propaga correção em cascade).

## Princípio

Lê `.plans/plan.md` gerado pelo `prd-to-issues` (PRD + issues com checkboxes de status).
**A estrutura de branches é definida pelo plano** — ralph-loop não decide isso sozinho.
Se o plano tiver uma branch por issue, cria chain encadeada. Se tiver branch única, trabalha
nela do início ao fim. O doc é apagado pelo `open-pr` antes de cada push — nunca entra em PR.

---

## Modo Loop

### Passo 1 — Verificar doc de sessão
Leia `.plans/plan.md` na raiz do projeto. Se não existir, pare:
"`.plans/plan.md` não encontrado. Rode prd-to-issues primeiro."

Identifique a estrutura de branches no plano:
- **Branch única** (campo `Branch:` no topo, sem branches por issue): todas as tasks vão nessa branch
- **Branches por issue** (cada issue tem branch própria): encadeia uma na outra

Anuncie: `N issues encontradas. Iniciando ralph-loop.`

Para cada issue `[ ]` encontrada, crie uma Claude task via `TaskCreate` com:
- `title`: título da issue
- `description`: critério de conclusão ("✓ Pronto quando: …") extraído do plano

### Passo 2 — Loop por issue
Para cada issue com checkbox `[ ]`:

1. Anuncia `[X/N] Iniciando: <título>`
2. Marca a Claude task correspondente como `in_progress` via `TaskUpdate`
3. **Se branch única:** permanece na branch do plano. **Se branches por issue:** faz checkout da branch da issue (ou cria a partir da anterior se não existir)
4. Invoca skill `tdd` com escopo da issue
5. Implementa até testes passarem (máx. 2 ciclos; se falhar, pausa e reporta)
6. Invoca skill `smart-commit`
7. **Se branches por issue:** abre PR via `open-pr` para essa branch
8. Atualiza checkbox para `[x]` no doc
9. Marca a Claude task como `completed` via `TaskUpdate`
10. Avança para a próxima issue

Após todas as issues concluídas:
- **Se branch única:** abre um único PR via `open-pr` para a branch da feature

### Proteções
- Máx. 2 ciclos TDD por issue antes de pausar
- Máx. 3 falhas consecutivas: para e apresenta relatório
- Máx. 15 issues por sessão; se exceder, pede confirmação para continuar

---

## Modo Fix

Ativa com: `ralph-fix <issue>: <descrição do ajuste>`

### Passo 1 — Identificar escopo
Leia o doc, identifique a estrutura de branches do plano.
- **Branch única:** aplica o fix direto na branch, sem cascade
- **Branches por issue:** mapeie todas as branches downstream a partir da issue informada

### Passo 2 — Corrigir issue base
Checkout da branch, aplica ajuste com TDD, invoca skill `smart-commit`, força push.

### Passo 3 — Rebase em cascade (somente se branches por issue)
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
