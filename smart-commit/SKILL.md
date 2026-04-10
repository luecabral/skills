---
name: smart-commit
description: Use ao commitar mudanças durante ou após a implementação. Ativa quando o usuário quer commitar, diz "salva isso", "faz o commit", "commitei a task X" ou quando o write-tests libera o commit com testes passando. Lê o plano em docs/current-plan.md para nomear os commits a partir das tasks, agrupa arquivos por contexto lógico e executa os commits diretamente sem pedir confirmação.
---

# Smart Commit

Commits semânticos e contextualizados a partir do plano de implementação.

## Princípio

Um bom commit conta o que mudou e por quê — não apenas "o que eu mexi". Com o plano disponível, o nome da task já carrega a intenção. Esta skill une esse contexto ao diff real para gerar mensagens precisas.

## Pré-condição

Esta skill assume que `write-tests` já rodou e os testes estão passando. Se não estiverem, não prossiga — retorne ao `write-tests`.

## Processo

### Passo 1 — Coletar estado atual

Execute em paralelo:

```bash
git status --short
git diff HEAD
```

Se não houver nenhuma alteração, informe o usuário e encerre.

### Passo 2 — Identificar a task do plano

Leia `docs/current-plan.md`. Identifique qual task (ou tasks) os arquivos alterados correspondem.

Se não for óbvio pelo diff, pergunte ao usuário: "Qual task você está commitando?"

Se `current-plan.md` não existir, siga sem ele — infira o contexto pelo diff.

### Passo 3 — Verificar documentação relacionada

Antes de agrupar os arquivos para commit, verifique se há documentação que precisa ser atualizada.

Leia o diff e identifique:
- Comportamentos visíveis ao usuário que mudaram (fluxos, ações, resultados)
- Endpoints ou APIs que foram criados, modificados ou removidos
- Configurações ou variáveis de ambiente que mudaram
- Funcionalidades que foram adicionadas ou removidas

Em seguida, busque no projeto por arquivos de documentação relacionados:

```bash
# Encontrar docs existentes
find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*"
```

Para cada mudança relevante identificada no diff, verifique se há um arquivo de doc que a descreve. Se houver e o conteúdo estiver desatualizado:

```
📄 DOCUMENTAÇÃO A ATUALIZAR

Mudança no código: [descrição do que mudou]
Arquivo de doc relacionado: docs/[arquivo].md
O que está desatualizado: [trecho ou seção que precisa mudar]

Atualize antes de continuar o commit.
```

Aguarde o dev atualizar a documentação antes de prosseguir.

Se não houver documentação desatualizada ou a mudança não impactar nenhuma doc existente, informe e siga para o Passo 4.

### Passo 4 — Agrupar arquivos por contexto

Organize os arquivos alterados nos grupos abaixo. Inclua os arquivos de documentação atualizados no grupo **documentação**. Um arquivo pertence ao **primeiro grupo** em que se encaixar. Grupos vazios são ignorados.

| Grupo | Padrão dos arquivos |
|---|---|
| **banco de dados** | migrations, schema, seeds |
| **modelos / lógica de negócio** | models, services, utils, helpers, hooks |
| **controllers / rotas** | controllers, routes, api handlers |
| **componentes / views** | components, views, pages, templates |
| **testes** | `*.test.*`, `*_spec.*`, `test_*.py`, `__tests__/` |
| **documentação** | `*.md`, docs/ |
| **configurações** | config, env, CI/CD, Docker, package.json |
| **outros** | qualquer arquivo que não se encaixe acima |

### Passo 5 — Gerar mensagem para cada grupo

Para cada grupo não-vazio, gere a mensagem de commit:

**Com plano disponível:**
Use o nome da task como base e ajuste pelo diff real.
- Task: "Criar componente de formulário de cadastro"
- Arquivos: `components/SignupForm.jsx`
- Mensagem: `feat: Adiciona componente de formulário de cadastro`

**Sem plano:**
Infira pelo diff.
- Arquivos: `components/SignupForm.jsx` com adição de validação
- Mensagem: `feat: Adiciona validação de campos no formulário de cadastro`

**Regras da mensagem:**
- **Idioma:** Português do Brasil
- **Formato:** `tipo: Mensagem`
- **Tipos:** `feat` · `fix` · `refactor` · `perf` · `docs` · `style` · `config`
- **Gramática:** verbo no presente do indicativo, primeira letra maiúscula, sem ponto final
- **Objetividade:** baseado no diff real — não invente funcionalidades

### Passo 6 — Executar os commits em ordem

Para cada grupo (na ordem lógica da tabela do Passo 5):

1. Stage apenas os arquivos do grupo:
```bash
git add <arquivo1> <arquivo2> ...
```

2. Commit com a mensagem gerada:
```bash
git commit -m "$(cat <<'EOF'
<mensagem do grupo>
EOF
)"
```

Se um commit falhar (ex: hook de pre-commit), investigue o erro, corrija e crie um **novo** commit. Nunca use `--amend` nem `--no-verify`.

### Passo 8 — Atualizar o plano

Após os commits bem-sucedidos, marque a task como concluída em `docs/current-plan.md`:

```
- [x] 1. Criar componente de formulário de cadastro ✓
```

### Passo 9 — Resumo final

```bash
git log --oneline -5
```

Informe quantos commits foram criados e qual task foi marcada como concluída. Se houver tasks restantes no plano, indique qual é a próxima.

## Regras

- Nunca commite implementação e testes em grupos separados se forem da mesma task — mantenha juntos
- Documentação atualizada sempre vai no mesmo PR que a mudança que a originou — nunca deixe pra depois
- Se identificar documentação desatualizada mas o dev não quiser atualizar agora, registre como pendência explícita antes de continuar
- Nunca use `--amend` ou `--no-verify`
- Execute os commits diretamente sem pedir confirmação ao usuário
- Se houver código de debug esquecido (console.log, debugger, print), sinalize antes de commitar
