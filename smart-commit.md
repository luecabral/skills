---
name: smart-commit
description: Use ao commitar mudanças. Ativa quando o usuário diz "faz o commit", "salva isso", "commita". Executa automaticamente o fluxo completo: verifica docs, testa o código (test-gate), debuga se falhar (debugging), só então commita. Infere o contexto do Git, agrupa por contexto lógico e executa diretamente.
---

# Smart Commit

Fluxo completo: testes → debug → commit.

## Processo

### Passo 0 — Garantir que os testes passam

```bash
git status --short
```

Se existem testes para os arquivos alterados → rode-os. Se não existem → acione `test-gate` para criá-los primeiro.

```bash
npm test / npx vitest run / pytest / bundle exec rspec
```

Se falhar, acione `debugging`. Não commite até tudo estar verde.

### Passo 1 — Coletar estado atual

```bash
git status --short && git diff HEAD
```

Se não houver alterações, informe e encerre.

### Passo 2 — Identificar o contexto

```bash
git log --oneline -5
```

Use o diff + histórico para inferir o que foi implementado. Só pergunte ao usuário se o diff for muito ambíguo.

### Passo 3 — Verificar documentação

Se o projeto usar `context-docs` (presença de `AGENTS.md` ou `docs/`):

```
[ ] AGENTS.md — ainda reflete o estado atual?
[ ] Estrutura de Pastas — arquivo/pasta criado, movido ou removido?
[ ] Regras e Restrições — nova restrição surgiu?
[ ] docs/features/ — feature nova, modificada ou removida?
[ ] docs/changelog.md — atualizado?
```

Para cada item pendente, atualize e apresente o diff. Se o usuário não quiser agora, registre como pendência explícita.

### Passo 4 — Agrupar arquivos por contexto

| Grupo | Padrão dos arquivos |
|---|---|
| banco de dados | migrations, schema, seeds |
| modelos / lógica | models, services, utils, helpers |
| controllers / rotas | controllers, routes, api handlers |
| componentes / views | components, views, pages, templates |
| testes | `*.test.*`, `*_spec.*`, `test_*.py` |
| documentação | `*.md`, docs/ |
| configurações | config, env, CI/CD, package.json |
| outros | qualquer arquivo restante |

### Passo 5 — Gerar mensagem por grupo

**Formato:** `tipo: Mensagem` — verbo no presente, primeira letra maiúscula, sem ponto final

**Tipos:** `feat` · `fix` · `refactor` · `perf` · `docs` · `style` · `config`

Baseie na task do plano (se houver) ou no diff. Nunca invente funcionalidades.

### Passo 6 — Executar os commits

Para cada grupo, na ordem lógica da tabela:

```bash
git add <arquivo1> <arquivo2>
git commit -m "$(cat <<'EOF'
<mensagem>
EOF
)"
```

Se um commit falhar por hook, corrija e crie **novo** commit. Nunca use `--amend` nem `--no-verify`.

### Passo 7 — Resumo

```bash
git log --oneline -5
```

## Regras

- Implementação e testes da mesma task vão juntos — nunca separados
- Documentação desatualizada vai no mesmo PR, nunca "depois"
- Nunca use `--amend` ou `--no-verify`
- Se encontrar `console.log`, `debugger` ou `print` esquecidos, sinalize antes de commitar
