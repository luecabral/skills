---
name: prd-to-issues
description: Use quando o usuário explicitamente pedir "faz o planejamento", "cria o plano", "planeja isso". Quebra a implementação em tasks pequenas, cria a branch. Apresenta o plano na conversa, não cria arquivos.
---

# PRD to Issues

Plano de implementação + criação de branch antes de escrever qualquer código.

## Processo

### Passo 1 — Entender o que será construído

Pergunte ao usuário: o que será implementado, comportamento esperado, restrições técnicas.

Se vier de um `brainstorming`, o design já está definido — use como contexto e pule as perguntas.

### Passo 1.5 — PRD mínimo (para features maiores que 3 tasks)

Sintetize antes de quebrar em tasks:
- **Problema:** qual dor isso resolve?
- **Solução:** o que será feito, em uma linha
- **Non-goals:** o que explicitamente NÃO faz parte
- **Perguntas em aberto:** o que precisa de definição antes ou durante

Apresente e aguarde confirmação. Ajuste o escopo se necessário.

### Passo 2 — Quebrar em tasks

Cada task deve:
- Ser completável em 2–5 minutos
- Resultar em estado testável
- Gerar no máximo ~600 linhas modificadas (quebre se maior — calibre com `wc -l` em arquivos similares)
- Ter verbo no infinitivo: "Criar X", "Adicionar Y", "Conectar Z"
- Incluir localização exata dos arquivos

**Princípio: vertical slice.** Cada task entrega caminho completo ponta-a-ponta — não separe model de frontend se dependem um do outro para funcionar.

Critério de conclusão por task:
```
- [ ] 1. Criar model X — `app/models/...`
       ✓ Pronto quando: migration roda e model responde ao console
```

### Passo 3 — Apresentar e confirmar

Exiba o plano completo. Aguarde aprovação, ajuste se necessário.

### Passo 4 — Criar a branch

Padrão: `tipo/descricao-curta-em-kebab-case`
Tipos: `feat` | `fix` | `refactor` | `chore`

Proponha o nome e aguarde confirmação. Após confirmação:
```bash
git fetch origin && git checkout main && git pull origin main && git checkout -b <nome>
```

### Passo 5 — Plano final

```
# Plano: [feature]
Branch: [nome] | Data: [data]

## Fora do escopo
- [non-goals]

## Tasks
- [ ] 1. [descrição] — `arquivo`
       ✓ Pronto quando: [critério]
```

## Regras

- Nunca crie a branch sem confirmação do nome
- Nunca comece a implementar — o plano termina na criação da branch
- Tasks que parecem demorar mais de 10 minutos devem ser quebradas
