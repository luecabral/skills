# Skills Repo

Repositório de skills (slash commands) globais do Claude Code. Skills atuais: `maestro` e `linear`.

## Estrutura

```
<skill>/SKILL.md      ← fonte da verdade, edite aqui
<skill>.md            ← flat copy gerada pelo hook, não edite diretamente
~/.claude/commands/   ← destino final, sincronizado pelo hook
```

## Como editar uma skill

1. Edite `<skill>/SKILL.md`
2. Commit — o hook `post-commit` faz tudo, nesta ordem:
   - `SKILL.md` → `<skill>.md` (flat copy no root do repo)
   - `<skill>.md` → `~/.claude/commands/<skill>.md` (disponibiliza no Windows)
   - `git push luecabral` (único remoto)
   - `git pull` no clone do WSL (`~/.claude/commands`)
3. Nada de push manual. Se algum passo falhar (sem rede, WSL desligado), o hook avisa na saída do commit e informa o comando pra rodar depois.

O flat `.md` é regenerado **depois** do commit, então ele fica pendente no working tree — commite junto no próximo commit (`chore: flat copy do <skill>`).

**Nunca edite `~/.claude/commands/` diretamente** — é destino, sobrescrito pelo hook a cada commit.

Sessão do Claude Code já aberta continua com a versão antiga da skill carregada. Precisa abrir sessão nova.

## Atualizar maestro e linear (repo pessoal + biblioteca da organização no claude.ai)

As duas skills também ficam disponíveis pra empresa inteira na biblioteca de skills da organização do claude.ai (aba "Da sua organização"). O marketplace `rsv-ink/ink-claude-marketplace` **não é mais usado** — não publique lá.

| Aqui (pessoal) | Na organização (claude.ai) | Relação |
|---|---|---|
| `maestro/` → `/maestro` | `maestro` | mesma skill: `SKILL.md` + `references/` |
| `linear/` → `/linear` | `linear-projeto` (fonte: `org/linear-projeto/`) | variante: texto genérico, pergunta o time em vez de fixar `Random` |

Quando a Luiza pedir pra atualizar o maestro ou o linear:

1. **Repo pessoal — sempre, sem perguntar.** Edite `<skill>/SKILL.md` (e `maestro/references/` se for o caso), copie pro flat (`cp <skill>/SKILL.md <skill>.md`) e commite na main. O hook pusha pro `luecabral` e atualiza `~/.claude/commands`. Mudança no `linear` precisa ser replicada à mão em `org/linear-projeto/SKILL.md`, mantendo as diferenças da variante.
2. **Organização — só com confirmação.** Pergunte: "Atualizo também na biblioteca da organização?". Se sim, rode `bash scripts/empacotar-org.sh <maestro|linear-projeto>` e passe pra ela o caminho do zip em `dist/` com o passo a passo: claude.ai > Customize > Skills > abrir a skill > substituir pelo zip novo > **Publish to org** de novo. Editar a cópia dela não muda a cópia da organização: só a nova publicação muda, e se a org exigir revisão, todo mundo fica na versão anterior até um owner aprovar.

`dist/` está no `.gitignore` — os zips são gerados, não versionados.

O texto do maestro é genérico ("o usuário"), porque é o mesmo arquivo publicado pra empresa. Não reintroduza "a Luiza" ou "ela" se referindo a quem usa. O `linear` pessoal pode falar dela; o `linear-projeto` não.

## Como criar uma skill nova

1. Crie a pasta `<skill>/` com `SKILL.md`, com frontmatter `name` e `description` (a `description` decide quando a skill ativa — seja explícito, inclusive sobre quando **não** ativar)
2. O hook cria o flat `.md` automaticamente no commit

## Primeira vez num clone novo

```bash
bash setup.sh
```

Aponta o git pros hooks versionados em `.githooks/` via `core.hooksPath`. Roda uma vez por clone.

**Trocando de máquina?** O runbook completo está em [`SETUP.md`](SETUP.md) — inclui o que o clone não traz: hooks do WSL, `settings.json` com as 143 permissões, MCP e a pasta de memória.

## Remoto

- `luecabral` → https://github.com/luecabral/skills — **único remoto.**

Sem branches, sem PRs — direto na main.

O `rsv-ink/skills` (organização) **foi excluído** e não deve ser recriado como destino. Se um clone antigo ainda tiver o remoto `origin` apontando pra lá, remova: `git remote remove origin`, e reaponte o branch com `git branch --set-upstream-to=luecabral/main main`.
