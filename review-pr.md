---
name: review-pr
description: Use ao revisar o PR de outra pessoa. Ativa quando o usuário diz "preciso revisar o PR X", "o que eu testo nesse PR", "me ajuda a revisar" ou quando abre um PR no GitHub e quer saber o que fazer. Traduz o PR em roteiro de teste executável por qualquer pessoa, técnica ou não.
---

# Review PR

Roteiro de teste em staging para revisores — técnicos ou não.

## Processo

### Passo 0 — Identificar o PR

Se não informado: "Qual é o número ou URL do PR que você quer revisar?"

### Passo 1 — Coletar dados do PR

```bash
gh pr view <NUMBER> --json number,title,body,author,baseRefName,headRefName,url,additions,deletions,changedFiles
```

Leia o corpo completo. Foque em: "O que esse PR faz", "O que tem mais risco", "O que testar", URL de staging.

### Passo 2 — Roteiro de teste

Expanda cada fluxo da seção "O que testar" em passos concretos:

```
🧪 ROTEIRO DE TESTE — PR #<NUMBER>: <título>
Autor: @<autor> | Staging: <URL>

[Fluxo 1] <nome>
Antes de começar: [pré-requisitos]
Passos:
1. Acesse <URL específica>
2. [ação clara]
3. [ação clara]
✅ O que deve acontecer: [resultado esperado]
❌ Se der errado: tire print, anote o que aconteceu, poste no PR

[Regressão] Fluxos adjacentes para checar:
- [ ] <fluxo adjacente>
```

Se "O que testar" estiver vazio, infira os fluxos de "O que esse PR faz" e do diff — mas sinalize que o autor deveria ter incluído.

### Passo 3 — Contexto para revisão com IA (opcional)

Se o revisor for usar IA, gere um prompt com: título e número do PR, "O que esse PR faz", decisões técnicas, onde focar — pedindo problemas de produção, segurança, lógica incorreta e edge cases.

### Passo 4 — Como reportar problemas

- **Staging:** print + descrição (o que fez, esperava, aconteceu) → comentário no PR
- **Código via IA:** copie o comentário → cole na linha do diff no GitHub
- 🚨 Bloqueante | ⚠️ Sugestão | 💡 Pergunta

## Regras

- Roteiro deve ser executável por quem não escreveu o código
- Se URL de staging não estiver no PR, pergunte antes de continuar
- Esta skill é sobre teste de comportamento, não revisão técnica de código
