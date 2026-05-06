---
name: smart-commit
description: Use ao commitar mudanças. Ativa quando o usuário diz "faz o commit", "salva isso", "commita". Executa automaticamente o fluxo completo: verifica docs desatualizadas, testa o código (test-gate), debuga se falhar (systematic-debugging), só então commita. Infere o contexto do Git para nomear os commits, agrupa arquivos por contexto lógico e executa os commits diretamente sem pedir confirmação.
---

# Smart Commit

Fluxo completo: testes → debug → commit.

## Princípio

Quando você pede pra commitar, assume-se que o código está pronto. Esta skill garante que está **realmente** pronto: executa os testes automaticamente, debuga se falharem, e só então commita. Um bom commit conta o que mudou e por quê — não apenas "o que eu mexi".

## Processo

### Passo 0 — Garantir que os testes passam

Antes de qualquer commit, verifique se há testes para o código alterado.

```bash
git status --short
```

**1. Identificar arquivos de implementação alterados** (excluindo arquivos de teste)

**2. Para cada arquivo de implementação, verificar se já existe teste:**
- Procure por arquivo de teste correspondente seguindo as convenções do projeto:
  - `*.test.js`, `*.spec.js`, `__tests__/*.js` (JavaScript/TypeScript)
  - `*_spec.rb`, `spec/**/*_spec.rb` (Ruby/Rails)
  - `test_*.py`, `*_test.py` (Python)
  - Outros padrões identificados no projeto

**3. Decidir ação:**

**Se os testes JÁ EXISTEM para os arquivos alterados:**
→ Apenas rode os testes (não crie novos)

**Se NÃO EXISTEM testes para algum arquivo:**
→ **Acione `test-gate` automaticamente** para gerar os testes faltantes

**4. Rodar todos os testes do projeto:**

```bash
# Detectar e rodar automaticamente conforme o projeto
npm test          # Node/JS
npx vitest run    # Vitest
pytest            # Python
bundle exec rspec # Ruby/Rails
```

**Se todos os testes passarem:**
→ Siga para o Passo 1 (commit)

**Se algum teste falhar:**
```
❌ X teste(s) falhando:
[lista dos testes que falharam com a mensagem de erro]

Acionando systematic-debugging para investigar...
```

**Acione `systematic-debugging` automaticamente** com o contexto do erro. Não prossiga para o commit até que todos os testes estejam verdes.

Após o debugging corrigir o problema, **rode os testes novamente** antes de prosseguir.

### Passo 1 — Coletar estado atual

Execute em paralelo:

```bash
git status --short
git diff HEAD
```

Se não houver nenhuma alteração, informe o usuário e encerre.

### Passo 2 — Identificar o contexto da mudança

Infira o contexto da mudança pelo diff e pelos commits recentes da branch:

```bash
git log --oneline -5
```

O histórico de commits + o diff atual revelam claramente o que está sendo implementado. Use isso para gerar a mensagem de commit.

**Só pergunte ao usuário se o diff for muito ambíguo** (ex: múltiplas mudanças não relacionadas em arquivos diversos sem padrão claro).

### Passo 3 — Verificar documentação relacionada

Antes de agrupar os arquivos para commit, verifique se o projeto usa a metodologia `context-docs` (presença de `AGENTS.md` ou pasta `docs/` na raiz).

**Se o projeto usar `context-docs`:**

Percorra o checklist abaixo com base no diff atual:

```
[ ] AGENTS.md — a descrição do projeto ainda bate com o que foi feito?
[ ] AGENTS.md > Estrutura de Pastas — algum arquivo/pasta foi criado, movido ou removido?
[ ] AGENTS.md > Regras e Restrições — surgiu alguma nova restrição importante?
[ ] AGENTS.md > Status Atual — algo mudou de status?
[ ] docs/features/ — tem feature nova, modificada ou removida?
[ ] docs/flows/ — algum fluxo existente foi impactado?
[ ] docs/changelog.md — registrar o que mudou (sempre, sem exceção)
```

Para cada item marcado como necessário, faça a atualização da documentação antes de prosseguir. Apresente o diff ao usuário para confirmação.

Se algum item precisar de atualização mas o usuário não quiser fazer agora, registre como pendência explícita antes de continuar.

**Se o projeto NÃO usar `context-docs`:**

Leia o diff e identifique mudanças com impacto em qualquer doc existente:
- Comportamentos visíveis ao usuário que mudaram
- Endpoints ou APIs criados, modificados ou removidos
- Configurações ou variáveis de ambiente que mudaram
- Funcionalidades adicionadas ou removidas

```bash
find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*"
```

Para cada mudança relevante, verifique se há um arquivo de doc que a descreve. Se houver e estiver desatualizado:

```
📄 DOCUMENTAÇÃO A ATUALIZAR

Mudança no código: [descrição do que mudou]
Arquivo de doc relacionado: docs/[arquivo].md
O que está desatualizado: [trecho ou seção que precisa mudar]

Atualize antes de continuar o commit.
```

Aguarde o dev atualizar a documentação antes de prosseguir.

Se não houver documentação desatualizada, informe e siga para o Passo 4.

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

### Passo 8 — Resumo final

```bash
git log --oneline -5
```

Informe quantos commits foram criados e o que foi implementado com base no histórico.

## Regras

- Nunca commite implementação e testes em grupos separados se forem da mesma task — mantenha juntos
- Documentação atualizada sempre vai no mesmo PR que a mudança que a originou — nunca deixe pra depois
- Se identificar documentação desatualizada mas o dev não quiser atualizar agora, registre como pendência explícita antes de continuar
- Nunca use `--amend` ou `--no-verify`
- Execute os commits diretamente sem pedir confirmação ao usuário
- Se houver código de debug esquecido (console.log, debugger, print), sinalize antes de commitar
