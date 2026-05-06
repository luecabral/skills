---
name: brainstorming
description: Use quando o usuário quer explorar possibilidades ou entender como fazer algo. Ativa quando diz "como eu poderia fazer X", "quero explorar ideias de Y", "qual a melhor abordagem para Z", "não sei bem como resolver isso". Apresenta o design na conversa, não cria arquivos.
---

# Brainstorming

Refinamento de ideia antes de qualquer linha de código.

## Quando NÃO usar

- O usuário já tem um plano claro → use `prd-to-issues`
- O usuário está debugando algo existente → use `systematic-debugging`
- Mudança pontual e simples (ex: "muda a cor desse botão")

## Processo

### Passo 1 — Entender o problema real

Antes de perguntar, mapeie suposições ocultas e pontos cegos da ideia.

Pergunte **uma por vez**, em ordem de dependência. Junto com cada pergunta, **ofereça uma resposta recomendada**:

> "Isso vai persistir no banco ou só viver em sessão?
> Minha sugestão: banco, porque você vai querer histórico por usuário."

Foco: o quê, para quem, critério de sucesso, restrições, casos de borda, integrações afetadas.

### Passo 1.5 — Threat Modeling (quando tocar em auth, dados ou integrações externas)

Documente:
- **Ativos** — quais dados são sensíveis? há dinheiro envolvido?
- **Atacantes** — usuário malicioso autenticado, externo sem auth, bot, insider
- **Vetores** — marque os relevantes: IDOR, SQL injection, XSS, CSRF, race condition, upload malicioso, brute force (ver REFERENCE.md para checklist completo)

Classifique cada vetor por probabilidade × impacto (🔴 Alta / 🟡 Média / 🟢 Baixa). Vetores 🔴 viram tasks explícitas no `prd-to-issues`.

### Passo 2 — Explorar alternativas

Apresente 2–3 abordagens com: o que faz, vantagem principal, desvantagem ou risco. Recomende uma com justificativa. Aguarde o usuário escolher.

### Passo 3 — Apresentar o design

Com a abordagem escolhida, descreva em seções curtas (uma por vez, aguardando confirmação):
- O que será criado ou modificado
- Como as partes se conectam
- O que fica fora do escopo

### Passo 4 — Resumo final e próximo passo

Apresente o resumo do design (problema, solução, escopo, fora do escopo, critério de sucesso, riscos de segurança se houver).

**Sempre** pergunte ao final: "Quer que eu crie o plano de desenvolvimento via `prd-to-issues`?"
- Sim → execute `prd-to-issues` imediatamente
- Não → encerre sem implementar nada

## Regras

- Nunca proponha código durante o brainstorming
- Nunca inicie implementação ao final — sempre passe por `prd-to-issues`
- A pergunta sobre o plano (Passo 4) é obrigatória, sem exceções
