---
name: writing-plans
description: Use após o brainstorming ou quando houver uma ideia clara do que implementar. Ativa quando o usuário diz "pode começar", "bora implementar", "cria o plano", "como a gente faz isso" ou quando há um design aprovado sem plano de execução. Cria o plano de tasks, deriva o nome da branch, cria a branch e salva o plano em docs/current-plan.md para que o smart-commit possa nomear os commits corretamente.
---

# Writing Plans

Plano de implementação + criação de branch antes de escrever qualquer código.

## Princípio

Um plano claro antes de codar evita decisões ruins no meio da implementação. Tasks pequenas e bem definidas facilitam commits limpos e revisões precisas.

## Processo

### Passo 1 — Carregar contexto

Leia `docs/design.md` se existir (gerado pelo brainstorming). Se não existir, pergunte ao usuário o que será implementado antes de continuar.

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

### Passo 5 — Salvar o plano

Salve o plano em `docs/current-plan.md`:

```markdown
# Plano: [descrição da feature]
Branch: [nome da branch]
Iniciado em: [data]

## Tasks
- [ ] 1. [descrição da task] — `caminho/do/arquivo.ext`
- [ ] 2. [descrição da task] — `caminho/do/arquivo.ext`
- [ ] 3. [descrição da task] — `caminho/do/arquivo.ext`
```

Informe ao usuário que o plano foi salvo e que pode começar a implementar a task 1.

## Regras

- Nunca crie a branch sem confirmação do nome
- Nunca comece a implementar — o plano termina na criação da branch
- Se o usuário quiser pular o plano e ir direto pro código, explique: o `smart-commit` usa o `current-plan.md` para nomear os commits. Sem plano, os commits serão genéricos
- Tasks não devem ser grandes demais: se uma task parece demorar mais de 10 minutos, quebre em duas
- O arquivo `docs/current-plan.md` será atualizado pelo `smart-commit` conforme as tasks forem concluídas
