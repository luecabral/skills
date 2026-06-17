# Skills Repo

Repositório de skills (slash commands) globais do Claude Code.

## Estrutura

```
<skill>/SKILL.md      ← fonte da verdade, edite aqui
<skill>.md            ← flat copy gerada pelo hook, não edite diretamente
~/.claude/commands/   ← destino final, sincronizado pelo hook
```

## Como editar uma skill

1. Edite `<skill>/SKILL.md`
2. Commit — o hook `post-commit` faz automaticamente:
   - `SKILL.md` → `<skill>.md` (flat copy no root do repo)
   - `<skill>.md` → `~/.claude/commands/<skill>.md` (disponibiliza globalmente)
3. Push para os dois remotos: `git push origin main && git push luecabral main`

**Nunca edite `~/.claude/commands/` diretamente** — é um diretório simples sem git, sobrescrito pelo hook a cada commit.

## Como criar uma skill nova

Use a skill `write-a-skill` ou:
1. Crie a pasta `<skill>/` com `SKILL.md`
2. O hook cria o flat `.md` automaticamente no commit

## Remotes

- `origin` → https://github.com/rsv-ink/skills (organização)
- `luecabral` → https://github.com/luecabral/skills (fork pessoal)

Sempre push para os dois. Sem branches, sem PRs — direto na main.
