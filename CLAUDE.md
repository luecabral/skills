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

## Atualizar o maestro (repo pessoal + marketplace da INK)

O maestro vive em dois lugares: aqui (fonte da verdade) e no marketplace da empresa, `rsv-ink/ink-claude-marketplace`, como plugin `maestro@ink`. Quando a Luiza pedir pra atualizar o maestro:

1. **Repo pessoal — sempre, sem perguntar.** Edite `maestro/SKILL.md` (e `maestro/REFERENCE.md` se for o caso), copie pro flat (`cp maestro/SKILL.md maestro.md`) e commite na main. O hook pusha pro `luecabral`.
2. **INK — só com confirmação.** Pergunte: "Atualizo também no marketplace da INK?". Só se ela disser sim, rode `bash scripts/publicar-maestro-ink.sh`. O script copia os arquivos, sobe a versão (patch) no `plugin.json` e no `marketplace.json` da INK, abre o PR e mergeia. Sem subir a versão, ninguém na empresa recebe a mudança.

O texto do maestro é genérico ("o usuário"), porque é publicado pra empresa. Não reintroduza "a Luiza" ou "ela" se referindo a quem usa.

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
