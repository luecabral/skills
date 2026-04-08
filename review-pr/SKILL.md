---
name: review-pr
description: Use ao revisar o PR de outra pessoa. Ativa quando o usuário recebe um PR para revisar, diz "preciso revisar o PR X", "o que eu testo nesse PR", "me ajuda a revisar" ou quando abre um PR no GitHub e quer saber o que fazer. Lê o PR, extrai os fluxos de staging e gera um roteiro de teste em linguagem simples para validar no staging.
---

# Review PR

Roteiro de teste em staging para revisores — técnicos ou não.

## Princípio

O revisor não precisa entender o código para fazer uma revisão valiosa. Testar o comportamento real no staging é tão importante quanto revisar o código. Esta skill traduz o PR em ações concretas que qualquer pessoa pode executar.

## Processo

### Passo 0 — Identificar o PR

Se o usuário não informou o número ou URL do PR, pergunte:
"Qual é o número ou URL do PR que você quer revisar?"

Extraia o número do PR do argumento ou URL.

### Passo 1 — Coletar dados do PR

```bash
gh pr view <NUMBER> --json number,title,body,author,baseRefName,headRefName,url,additions,deletions,changedFiles
```

Leia o corpo do PR completo. Identifique as seções:
- "O que esse PR faz"
- "Decisões técnicas relevantes"
- "O que tem mais risco"
- "Staging" (URL do ambiente)
- "O que testar"

### Passo 2 — Gerar roteiro de teste para humano

Com base na seção "O que testar" do PR, expanda cada fluxo em um roteiro detalhado:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 ROTEIRO DE TESTE — PR #<NUMBER>
<título do PR>
Autor: @<autor>
Staging: <URL>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Fluxo 1] <nome do fluxo>

Antes de começar:
→ [o que precisa existir ou estar configurado]

Passos:
1. Acesse: <URL específica no staging>
2. [ação clara e específica]
3. [ação clara e específica]
4. [ação clara e específica]

O que deve acontecer:
✅ [resultado esperado em linguagem simples]

O que fazer se algo der errado:
→ Tire um print da tela
→ Anote o que você fez e o que apareceu (diferente do esperado)
→ Poste no PR com o print e a descrição

---

[Fluxo 2] ...

---

[Regressão] Fluxos adjacentes para checar
Mesmo que não sejam o foco deste PR, vale confirmar que continuam funcionando:
- [ ] <fluxo adjacente 1>
- [ ] <fluxo adjacente 2>
```

Se a seção "O que testar" do PR estiver vazia ou incompleta, infira os fluxos a partir de "O que esse PR faz" e do diff.

### Passo 3 — Orientações para revisão de código com IA

Se o revisor for usar IA para revisar o código (via VSCode ou similar), apresente o contexto que a IA deve receber:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 CONTEXTO PARA REVISÃO COM IA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cole este contexto para a IA antes de pedir a revisão:

---
Estou revisando o PR #<NUMBER>: "<título>"

O que esse PR faz:
<conteúdo da seção "O que esse PR faz">

Decisões técnicas:
<conteúdo da seção "Decisões técnicas relevantes">

Onde focar a revisão:
<conteúdo da seção "O que tem mais risco">

Por favor, revise o código com esse contexto em mente e aponte:
1. Problemas que podem quebrar em produção
2. Problemas de segurança
3. Lógica incorreta ou edge cases não tratados
4. Sugestões de melhoria (marcadas claramente como opcionais)
---
```

### Passo 4 — Como reportar problemas encontrados

Explique ao revisor como documentar os problemas:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 COMO REPORTAR PROBLEMAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para problemas no staging:
→ Abra o PR no GitHub
→ Clique em "Add your review" ou "Leave a comment"
→ Descreva: o que você fez, o que esperava, o que aconteceu
→ Anexe print se houver erro visual

Para problemas no código (via IA):
→ Copie o comentário sugerido pela IA
→ Cole diretamente na linha relevante do diff no GitHub
→ Marque como "Request changes" se for crítico

Classificação sugerida para comentários:
🚨 Bloqueante — não deve ir para produção assim
⚠️ Sugestão — melhoria importante mas não crítica
💡 Pergunta — quero entender a decisão
```

## Regras

- O roteiro de teste deve ser executável por alguém que não escreveu o código e não é desenvolvedor
- Se a URL de staging não estiver no PR, pergunte ao usuário antes de continuar
- Não analise o código — esta skill é sobre teste de comportamento, não revisão técnica
- Se o PR não tiver seção "O que testar", infira os fluxos mas sinalize que o autor deveria ter incluído
