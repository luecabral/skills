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

### Passo 1.5 — Análise de riscos de segurança / Threat Modeling (quando tocar em autenticação, dados ou integrações externas)

Ao apresentar ao usuário, explique que é uma análise para identificar o que pode dar errado antes de construir.

Documente:
- **Ativos** — quais dados são sensíveis? há dinheiro envolvido?
- **Atacantes** — usuário malicioso autenticado, externo sem autenticação, bot, insider
- **Vetores de ataque** — marque os relevantes e explique brevemente ao usuário o que cada um significa:
  - IDOR (acesso indevido a dados de outro usuário)
  - SQL injection (manipulação do banco de dados via campos de formulário)
  - XSS (injeção de código malicioso que roda no navegador de outra pessoa)
  - CSRF (ação executada sem o conhecimento do usuário logado)
  - Race condition (dois processos simultâneos causando comportamento inesperado)
  - Upload malicioso (arquivo enviado que pode comprometer o servidor)
  - Brute force (tentativas automáticas de adivinhar senha)
  - (ver REFERENCE.md para checklist completo)

Classifique cada risco por probabilidade × impacto (🔴 Alta / 🟡 Média / 🟢 Baixa). Riscos 🔴 viram tasks explícitas no `prd-to-issues`.

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
- **Contextualização de termos técnicos:** ao apresentar qualquer conceito técnico ao usuário, sempre inclua uma explicação simples entre parênteses ou em seguida. Exemplos de como fazer:
  - "banco de dados (onde as informações ficam guardadas de forma permanente)"
  - "autenticação (o sistema que controla quem pode acessar o quê)"
  - "integração com API externa (conexão com um serviço de terceiros, como WhatsApp ou Stripe)"
  - "sessão (memória temporária que some quando o usuário fecha o navegador)"
  - O objetivo é que qualquer pessoa entenda, sem precisar parar para pesquisar o termo
