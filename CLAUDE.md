# Skills Repo

Marketplace de plugins do Claude Code. Plugins atuais: `maestro` e `linear`, cada um com uma skill de mesmo nome (`/maestro`, `/linear`).

## Estrutura

```
.claude-plugin/marketplace.json           ← catálogo do marketplace (name: luecabral)
plugins/<skill>/.claude-plugin/plugin.json ← metadados do plugin, SEM "version"
plugins/<skill>/skills/<skill>/SKILL.md    ← fonte da verdade, edite aqui
```

## Como editar uma skill

1. Edite `plugins/<skill>/skills/<skill>/SKILL.md`
2. Commit na main — o hook `post-commit` pusha pro `luecabral`. Nada de push manual.
3. Quem instalou o plugin com auto-update ligado recebe a mudança na próxima sessão.

**Nunca adicione `version` nos `plugin.json` nem no `marketplace.json`.** Sem ela, cada commit vira versão nova e o auto-update entrega. Com ela, ninguém recebe nada até o número mudar.

Frontmatter de `SKILL.md` precisa ser YAML válido: `description` com mais de uma linha usa `>` e todas as linhas indentadas. Valide sempre com `claude plugin validate .` — o único aviso esperado é o de `version` ausente.

Sessão do Claude Code já aberta continua com a versão antiga. Precisa abrir sessão nova ou rodar `/reload-plugins`.

## Como criar uma skill nova

1. Crie `plugins/<skill>/.claude-plugin/plugin.json` e `plugins/<skill>/skills/<skill>/SKILL.md` (frontmatter `name` e `description` — a `description` decide quando a skill ativa; seja explícito, inclusive sobre quando **não** ativar)
2. Adicione a entrada em `.claude-plugin/marketplace.json` com o mesmo `name` do `plugin.json`
3. Valide e commite

## Instalação (cada pessoa, uma vez)

```
/plugin marketplace add luecabral/skills
/plugin install maestro@luecabral
/plugin install linear@luecabral
```

E ligar o auto-update em `/plugin` → Marketplaces → `luecabral` → Enable auto-update.

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
