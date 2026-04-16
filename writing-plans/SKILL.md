---
name: writing-plans
description: Use quando o usuário explicitamente pedir "faz o planejamento", "cria o plano", "planeja isso". Quebra a implementação em tasks pequenas (2-5 min cada), deriva o nome da branch e cria a branch. Apresenta o plano na conversa, não cria arquivos. O smart-commit infere o contexto do Git se não houver plano.
---

# Writing Plans

Plano de implementação + criação de branch antes de escrever qualquer código.

## Princípio

Um plano claro antes de codar evita decisões ruins no meio da implementação. Tasks pequenas e bem definidas facilitam commits limpos e revisões precisas.

## Processo

### Passo 1 — Carregar contexto

Verifique se há uma branch atual com commits que indiquem o que está sendo feito:

```bash
git log --oneline
git diff main...HEAD
```

Se houver trabalho em andamento, use isso como contexto.

Se não houver nada no Git ainda, pergunte ao usuário:
- O que será implementado?
- Qual é o comportamento esperado?
- Há alguma restrição técnica ou de integração?

### Passo 2 — Quebrar em tasks

Crie uma lista de tasks numeradas seguindo estas regras:

- Cada task deve ser completável em 2–5 minutos
- Cada task deve resultar em um estado testável (algo que funciona ou falha claramente)
- Nomeie com verbo no infinitivo: "Criar componente X", "Adicionar validação Y", "Conectar Z à API"
- Inclua a localização exata dos arquivos a criar ou modificar
- Defina dependências entre tasks quando existirem

**Ordem recomendada:**
1. Estrutura de dados / banco (se houver mudanças)
2. Lógica de negócio / backend
3. Interface / frontend
4. Testes
5. Ajustes e polish

### Passo 3 — Apresentar o plano

Exiba o plano completo e aguarde confirmação. O usuário pode:
- Aprovar → seguir para o Passo 4
- Pedir ajustes → aplicar e reapresentar
- Remover tasks → atualizar escopo

### Passo 4 — Criar a branch

Com o plano aprovado, derive o nome da branch:

**Padrão:** `tipo/descricao-curta-em-kebab-case`

**Tipos:**
- `feat` — nova funcionalidade
- `fix` — correção de bug
- `refactor` — reorganização sem mudança de comportamento
- `chore` — configuração, dependências, infraestrutura

**Exemplos:**
- `feat/cadastro-usuario`
- `fix/botao-salvar-desabilitado`
- `refactor/formulario-contato`

Apresente o nome proposto e aguarde confirmação antes de executar qualquer comando git.

Após confirmação, execute:

```bash
git fetch origin
git checkout main
git pull origin main
git checkout -b <nome-da-branch>
```

Confirme ao usuário que a branch foi criada e está ativa.

### Passo 5 — Apresentar o plano final

Exiba o plano final na conversa no formato abaixo. Não crie nenhum arquivo.

```
# Plano: [descrição da feature]
Branch: [nome da branch]
Iniciado em: [data]

## Tasks
- [ ] 1. [descrição da task] — `caminho/do/arquivo.ext`
- [ ] 2. [descrição da task] — `caminho/do/arquivo.ext`
- [ ] 3. [descrição da task] — `caminho/do/arquivo.ext`
```

Informe ao usuário que pode começar a implementar a task 1.

## Regras

- Nunca crie a branch sem confirmação do nome
- Nunca comece a implementar — o plano termina na criação da branch
- Tasks não devem ser grandes demais: se uma task parece demorar mais de 10 minutos, quebre em duas
- O plano é apresentado na conversa para guiar o desenvolvimento — não é obrigatório para usar outras skills
