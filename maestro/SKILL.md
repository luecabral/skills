---
name: maestro
description: Use para o ciclo completo de uma feature — do brainstorming ao código rodando.
Ativa quando o usuário diz "maestro", "roda o maestro", "faz o maestro". Pode entrar
diretamente em qualquer fase: "maestro fase 2", "maestro planeja", "maestro executa", "maestro publica".
---

# Maestro

Ciclo completo de uma feature, do brainstorming ao deploy. O maestro **não reimplementa nada** — ele orquestra skills que já são donas de cada fase: **`brainstorming` (Fase 1) + `prd-to-issues` (Fase 2) + `tdd` + `smart-commit` (Fase 3) + `publish` (Fase 4)**. O que é só do maestro: grafo de dependências, paralelismo com worktrees, modelos e os gates entre fases.

**Modelos (obrigatório):** o Maestro (líder que orquestra todas as fases e gerencia os subagentes) roda em **Opus 4.8 High**. Todos os subagentes de desenvolvimento na Fase 3 rodam em **Sonnet 4.6 no esforço Médio**. Ver Fase 3.

## Fase 1 — Explore

Siga o processo completo do `brainstorming`, sem encurtar a exploração:
- Perguntas uma por vez com sugestão de resposta
- **Pergunta de benchmark/referência** quando a feature tiver paralelo no mercado (Passo 1.7 do `brainstorming`) — pergunte se há um produto ou tela de referência a seguir
- Threat modeling se tocar em auth/dados/integrações
- Apresenta 2–3 alternativas de abordagem, aguarda escolha
- **Design detalhado** (Passo 3 do `brainstorming`): descreva fluxos passo a passo (feliz + alternativos), comportamentos esperados (loading, sucesso, erro, estados) e regras de negócio explícitas — não apenas a lista do que será criado. Confirme cada parte com o usuário.
- Resumo do design (problema, solução, benchmark, escopo, fluxos, comportamentos, regras de negócio, riscos)

**Gate:** "Design definido. Quer que eu crie o plano com grafo de dependências (Fase 2)?"
Se não → encerra sem implementar nada.

---

## Fase 2 — Plan

1. Quebra em tasks (2–5 min cada, max ~600 linhas, verbo no infinitivo, localização de arquivo)
2. Para cada task declara `depends_on: [ids]` e uma **explicação em uma linha para não-techs** (`em_resumo:`) — uma frase simples, sem jargão, do que aquela task entrega na prática (ex: "permite que o usuário recupere a senha pelo e-mail")
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

O líder (este agente, em **Opus 4.8 High**) orquestra; quem escreve código são os subagentes em **Sonnet 4.6 Médio**.

1. Lê `.plans/plan.md`, reconstrói o grafo de dependências
2. Para cada grupo paralelo em ordem topológica:
   - Lança um `Agent(isolation: "worktree", model: "sonnet")` por task no grupo — **sempre `model: "sonnet"`** (Sonnet 4.6, esforço Médio). Instrua cada subagente no prompt a operar em esforço Médio. O líder nunca delega para Opus.
   - Cada subagente: invoca `tdd` → implementa → invoca `smart-commit`
   - Aguarda todos do grupo concluírem
   - Merge de cada worktree de volta à branch principal (ver REFERENCE.md)
   - Se conflito: pausa, descreve o conflito, aguarda resolução humana
3. Atualiza checkboxes no `.plans/plan.md` conforme tasks completam
4. **Validação** — antes do relatório final, o líder valida o conjunto:
   - Roda a suíte de testes completa do projeto
   - Invoca o `verify` (Verify do Claude) para **homologar todos os fluxos impactados** — não só os testes automatizados, mas o comportamento real de cada fluxo que a feature tocou (caminho feliz + alternativos do design da Fase 1). O `verify` sobe o app e observa o comportamento de verdade.
   - Se algum fluxo falhar na homologação: aciona `debugging`, corrige e revalida antes de seguir.
5. Após validação verde: apresenta relatório final

**Proteções:**
- Máx. 2 ciclos TDD por task antes de pausar e reportar
- Máx. 3 falhas consecutivas: para e apresenta relatório
- Máx. 15 tasks por sessão; se exceder, pede confirmação para continuar

**Gate:** "Desenvolvimento homologado pelo `verify` e mergeado na branch. Quer publicar agora (Fase 4)? Se preferir aplicar ajustes pontuais antes, é só chamar `maestro fase 4` (ou `maestro publica`) quando terminar."
Se não → encerra na branch, pronta pra fixes manuais e Fase 4 depois.

---

## Fase 4 — Publish

Quando o desenvolvimento está homologado (e quaisquer fixes pontuais do usuário aplicados), siga o processo completo do `publish` — ele é a fonte única da revisão, push, PR, CI, merge e deploy. O maestro só invoca; não duplica nenhum passo do publish.

- Entra aqui direto via `maestro fase 4` / `maestro publica`, mesmo numa sessão nova depois dos fixes manuais.
- O `publish` traz seus próprios subagentes e modelos (Segurança em Opus, UX/Docs em Sonnet) — o maestro não interfere nisso.
- Gates do publish (aplicar sugestão? mergear? deployar?) continuam sendo do publish, com o usuário.

---

## Entrada direta por fase

| Contexto | Fase de entrada |
|---|---|
| Ideia vaga / "como fazer X" | Fase 1 |
| Design definido / "planeja isso" | Fase 2 |
| `.plans/plan.md` já existe | Fase 3 |
| Branch desenvolvida + fixes aplicados / "maestro publica" | Fase 4 |

## Regras

- Gates de confirmação entre fases são obrigatórios — nunca avance sem resposta explícita
- Nunca implemente durante Fase 1 ou 2
- O maestro não reimplementa as sub-skills — cada fase delega à skill dona (brainstorming/prd-to-issues/tdd+smart-commit/publish); merge e deploy acontecem só dentro da Fase 4 via `publish`, respeitando os gates dele
- Se task for ambígua, para e pergunta antes de lançar o subagente
- Contextualizar termos técnicos ao longo de todas as fases (seguir padrão do `brainstorming`)
- **Backup antes de migration é inegociável** — qualquer plano que toque schema (Prisma, Rails migrate, SQL) precisa de task T00 de backup local + remoto como pré-requisito do Group 1. Validar no início da Fase 3 que o backup completou antes de lançar qualquer task de schema.
