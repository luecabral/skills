---
name: push
description: Use ao fazer push da branch. Ativa quando o usuário diz "faz o push", "sobe a branch", "publica a branch". Garante que o código está tecnicamente sólido antes do push: verifica código de debug esquecido, roda todos os testes, debuga se falharem, só então faz push. NÃO faz rebase nem revisão de código.
---

# Push

Push seguro: testes funcionando + código limpo.

## Processo

### Passo 1 — Verificar commits para publicar

```bash
git branch --show-current
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null || git log HEAD --oneline -5
```

Se for `main` ou não houver commits novos, informe e encerre.

### Passo 2 — Verificar código de debug

Busque no diff por: `console.log`, `debugger`, `print(`, `puts `, `p `, `pp `, `var_dump`, `dd(`.

Se encontrar, pergunte: remover automaticamente ou seguir mesmo assim (não recomendado)?

### Passo 3 — Rodar todos os testes

```bash
npm test / npx vitest run / pytest / bundle exec rspec
```

Se falhar, acione `systematic-debugging`. Não prossiga até que todos estejam verdes. Após o debug, rode novamente.

### Passo 4 — Verificação final

Acione `verification-before-completion`. Se falhar, corrija antes de continuar.

### Passo 5 — Executar o push

```bash
git push -u origin HEAD
```

Se falhar por histórico divergente, ofereça:
1. `git pull --rebase origin <branch>` — recomendado
2. `git push --force-with-lease origin HEAD` — somente se o usuário tiver certeza

Aguarde escolha antes de executar. Se falhar por outro motivo, exiba o erro e encerre.

### Passo 6 — Confirmar

```bash
git log origin/$(git branch --show-current) --oneline -5
```

Informe quantos commits foram publicados.

## Regras

- NÃO faz rebase — responsabilidade do `open-pr`
- NÃO faz revisão de código — apenas validações técnicas
- Nunca use `--force` sozinho, sempre `--force-with-lease`
- Código de debug pode ser mantido se o usuário confirmar explicitamente (mas desencoraje)
