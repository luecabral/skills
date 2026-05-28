---
name: maestro
description: Use para o ciclo completo de uma feature — do brainstorming ao código rodando.
Ativa quando o usuário diz "maestro", "roda o maestro", "faz o maestro". Pode entrar
diretamente em qualquer fase: "maestro fase 2", "maestro planeja", "maestro executa".
---

# Maestro

Ciclo completo de uma feature: exploração → plano com grafo de dependências → execução paralela com subagentes.

## Fase 1 — Explore

Siga o processo completo do `brainstorming`:
- Perguntas uma por vez com sugestão de resposta
- Threat modeling se tocar em auth/dados/integrações
- Apresenta 2–3 alternativas de abordagem, aguarda escolha
- Resumo do design (problema, solução, escopo, riscos)

**Gate:** "Design definido. Quer que eu crie o plano com grafo de dependências (Fase 2)?"
Se não → encerra sem implementar nada.

---

## Fase 2 — Plan

1. Quebra em tasks (2–5 min cada, max ~600 linhas, verbo no infinitivo, localização de arquivo)
2. Para cada task declara `depends_on: [ids]`
3. Calcula grupos paralelos via topological sort (ver REFERENCE.md)
4. Apresenta o plano com os grupos: "X tasks em Y grupos, Z em paralelo no pico"
5. **Se qualquer task tocar em schema** (`prisma/schema.prisma`, `db/migrate/`, `prisma/migrations/`): adicionar **task T00 obrigatória** no Grupo 1 — "Backup local + remoto antes de migration". Todas as tasks de schema dependem de T00.
6. Aguarda aprovação e ajusta se necessário
7. Propõe nome da branch (`feat/descricao-em-kebab-case`), aguarda confirmação, cria
8. Salva em `.plans/plan.md` (formato em REFERENCE.md)

**Gate:** "Plano salvo. Quer que eu execute com subagentes em paralelo (Fase 3)?"
Se não → encerra na branch criada.

---

## Fase 3 — Execute

1. Lê `.plans/plan.md`, reconstrói o grafo de dependências
2. Para cada grupo paralelo em ordem topológica:
   - Lança um `Agent(isolation: "worktree")` por task no grupo
   - Cada subagente: invoca `tdd` → implementa → invoca `smart-commit`
   - Aguarda todos do grupo concluírem
   - Merge de cada worktree de volta à branch principal (ver REFERENCE.md)
   - Se conflito: pausa, descreve o conflito, aguarda resolução humana
3. Atualiza checkboxes no `.plans/plan.md` conforme tasks completam
4. Após todas as tasks: apresenta relatório final

**Proteções:**
- Máx. 2 ciclos TDD por task antes de pausar e reportar
- Máx. 3 falhas consecutivas: para e apresenta relatório
- Máx. 15 tasks por sessão; se exceder, pede confirmação para continuar

---

## Entrada direta por fase

| Contexto | Fase de entrada |
|---|---|
| Ideia vaga / "como fazer X" | Fase 1 |
| Design definido / "planeja isso" | Fase 2 |
| `.plans/plan.md` já existe | Fase 3 |

## Regras

- Gates de confirmação entre fases são obrigatórios — nunca avance sem resposta explícita
- Nunca implemente durante Fase 1 ou 2
- Não mergeie PRs — responsabilidade do usuário
- Se task for ambígua, para e pergunta antes de lançar o subagente
- Contextualizar termos técnicos ao longo de todas as fases (seguir padrão do `brainstorming`)
- **Backup antes de migration é inegociável** — qualquer plano que toque schema (Prisma, Rails migrate, SQL) precisa de task T00 de backup local + remoto como pré-requisito do Group 1. Validar no início da Fase 3 que o backup completou antes de lançar qualquer task de schema.
