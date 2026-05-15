---
name: prd-to-issues
description: Use quando o usuário explicitamente pedir "faz o planejamento", "cria o plano", "planeja isso". Quebra a implementação em tasks pequenas, cria a branch. Apresenta o plano na conversa, não cria arquivos.
---

# PRD to Issues

PRD = Product Requirements Document (documento que descreve o que será construído e por quê).

Plano de implementação + criação de branch (ramificação isolada do código para desenvolver a feature sem afetar o que já está funcionando) antes de escrever qualquer código.

## Processo

### Passo 1 — Entender o que será construído

Pergunte ao usuário: o que será implementado, comportamento esperado, restrições técnicas.

Se vier de um `brainstorming`, o design já está definido — use como contexto e pule as perguntas.

### Passo 2 — Quebrar em tasks

Cada task deve:
- Ser completável em 2–5 minutos
- Resultar em estado testável (algo que dá pra verificar que funcionou)
- Gerar no máximo ~600 linhas modificadas (quebre se maior — calibre com `wc -l` em arquivos similares)
- Ter verbo no infinitivo: "Criar X", "Adicionar Y", "Conectar Z"
- Incluir localização exata dos arquivos

**Princípio: vertical slice** (fatia vertical — entrega completa de ponta a ponta). Cada task entrega um caminho funcional completo — não separe a lógica do servidor (model/backend) da tela (frontend) se um depende do outro para funcionar.

Critério de conclusão por task:
```
- [ ] 1. Criar model X — `app/models/...`
       ✓ Pronto quando: migration (script que cria/altera a estrutura do banco de dados) roda sem erro e o dado pode ser consultado
```

### Passo 3 — Apresentar e confirmar

Exiba o plano completo. Aguarde aprovação, ajuste se necessário.

### Passo 4 — Criar a branch (ramificação isolada do código)

Padrão: `tipo/descricao-curta-em-kebab-case` (kebab-case = palavras separadas por hífen, tudo minúsculo)

Tipos — explique ao usuário o que cada um significa ao propor:
- `feat` — nova funcionalidade
- `fix` — correção de bug (comportamento quebrado)
- `refactor` — melhoria interna sem mudar o que o usuário vê
- `chore` — tarefa de manutenção (atualizar dependências, configurações, etc.)

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

### Passo 6 — Salvar plano em `.plans/plan.md`

Salve o plano final em `.plans/plan.md` na raiz do projeto.
Se o arquivo já existir, sobrescreva.
Se `.plans/` não estiver no `.gitignore`, adicione.

## Regras

- Nunca crie a branch sem confirmação do nome
- Nunca comece a implementar — o plano termina na criação da branch
- Tasks que parecem demorar mais de 10 minutos devem ser quebradas
- **Contextualização de termos técnicos:** ao apresentar o plano ao usuário, sempre acompanhe termos técnicos de uma breve explicação em linguagem simples. Exemplos:
  - "migration (script que cria ou altera a estrutura do banco de dados)"
  - "model (a camada do código que representa e salva os dados)"
  - "controller (o código que recebe as ações do usuário e decide o que fazer)"
  - "seed (dados iniciais carregados automaticamente no banco)"
  - O objetivo é que qualquer pessoa entenda o plano sem precisar parar para pesquisar
