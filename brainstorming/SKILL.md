---
name: brainstorming
description: Use quando o usuário quer explorar possibilidades ou entender como fazer algo. Ativa quando diz "como eu poderia fazer X", "quero explorar ideias de Y", "qual a melhor abordagem para Z", "não sei bem como resolver isso" ou expressa curiosidade sobre soluções. Ajuda a refinar o problema e explorar alternativas através de perguntas antes de qualquer implementação. Apresenta o design na conversa, não cria arquivos.
---

# Brainstorming

Refinamento de ideia antes de qualquer linha de código.

## Princípio

Nunca comece a implementar sem antes entender o problema real. Uma ideia vaga gera código errado. Perguntas certas agora evitam retrabalho depois.

## Quando NÃO usar

- O usuário já tem um plano claro e detalhado → use `writing-plans`
- O usuário está debugando algo existente → use `systematic-debugging`
- O usuário quer apenas uma mudança pontual e simples (ex: "muda a cor desse botão")

## Processo

### Passo 1 — Entender o problema real

Faça perguntas para refinar a ideia. Foque em:

- **O quê:** o que exatamente deve acontecer? qual é o comportamento esperado?
- **Para quem:** quem vai usar isso? qual é o contexto de uso?
- **Critério de sucesso:** como sabemos que está pronto e funcionando?
- **Restrições:** há algo que não pode mudar? integrações existentes? limitações técnicas?

Faça uma pergunta por vez. Não bombardeie com todas de uma vez.

### Passo 1.5 — Threat Modeling (obrigatório para features com dados, auth ou integrações externas)

Se a feature tocar em autenticação, dados do usuário, pagamentos, uploads, APIs externas ou controle de acesso, faça threat modeling antes de propor abordagens.

**Pergunte e documente:**

**Ativos** — o que precisa ser protegido?
- Quais dados trafegam ou são armazenados? São sensíveis (pessoais, financeiros)?
- Há dinheiro, créditos ou recursos escassos envolvidos?

**Atacantes** — quem pode tentar explorar isso?
- Usuário malicioso autenticado (cliente do próprio sistema)
- Atacante externo sem autenticação
- Insider com acesso legítimo (funcionário, contratado)
- Bot ou scraper automatizado
- Dependência comprometida (supply chain)

**Vetores** — como poderiam atacar? (marque os relevantes para a feature)
- [ ] Acesso a dados de outro usuário (IDOR)
- [ ] Injeção em queries (SQL/NoSQL Injection)
- [ ] Execução de script no browser (XSS)
- [ ] Falsificação de requisição (CSRF)
- [ ] Enumeração de usuários ou recursos
- [ ] Race condition (especialmente em pagamentos e contadores)
- [ ] Upload de arquivo malicioso
- [ ] Prompt injection (se houver IA)
- [ ] Abuso de rate (brute force, scraping)

**Classifique cada vetor identificado:**

| Vetor | Probabilidade | Impacto | Prioridade |
|---|---|---|---|
| [vetor] | Alta/Média/Baixa | Alto/Médio/Baixo | 🔴/🟡/🟢 |

Documente os vetores de alta prioridade em `docs/design.md` na seção "Riscos de segurança". Eles virarão tasks explícitas no `writing-plans`.

### Passo 2 — Explorar alternativas

Com base nas respostas, apresente 2–3 abordagens possíveis. Para cada uma:
- O que faz
- Vantagem principal
- Desvantagem ou risco

Recomende uma abordagem com justificativa clara. Aguarde o usuário escolher ou ajustar.

### Passo 3 — Apresentar o design em blocos

Com a abordagem escolhida, descreva o design proposto em seções curtas:
- O que será criado ou modificado
- Como as partes se conectam
- O que fica fora do escopo (importante para evitar scope creep)

Apresente uma seção por vez e aguarde confirmação antes de continuar.

### Passo 4 — Apresentar o resumo final do design

Após aprovação do design, apresente o resumo na conversa (não crie arquivo):

```
# Design: [nome da feature]
Data: [data]

## Problema
[descrição do problema]

## Solução escolhida
[descrição da abordagem]

## O que será feito
[lista do escopo]

## Fora do escopo
[lista do que não será feito]

## Critério de sucesso
[como saber que está pronto]

## Riscos de segurança
[vetores identificados no threat modeling com prioridade — deixe vazio se não aplicável]
```

Se for uma feature complexa, sugira usar `writing-plans` para criar o plano de implementação.

## Regras

- Nunca proponha código durante o brainstorming
- Se o usuário tentar pular direto para implementação, redirecione gentilmente: "Antes de codar, deixa eu entender melhor o que você precisa"
- Mantenha o foco no problema, não na solução técnica
- Se o usuário já souber exatamente o que quer, valide rapidamente e passe para `writing-plans`
