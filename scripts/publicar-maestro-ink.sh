#!/bin/bash
# Publica o maestro no marketplace da empresa (rsv-ink/ink-claude-marketplace):
# copia SKILL.md e REFERENCE.md pro plugin, sobe a versão (patch), abre o PR e mergeia.
# Sem subir a versão ninguém recebe a mudança: lá os plugins têm version fixa.
#
# Uso:  bash scripts/publicar-maestro-ink.sh
# Clone da INK: $INK_MARKETPLACE_DIR, ou ../ink-claude-marketplace ao lado deste repo.
set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
INK_REPO="rsv-ink/ink-claude-marketplace"
INK_DIR="${INK_MARKETPLACE_DIR:-$(dirname "$REPO_ROOT")/ink-claude-marketplace}"
SKILL_DIR="plugins/maestro/skills/maestro"

[ -d "$INK_DIR/.git" ] || git clone -q "https://github.com/$INK_REPO.git" "$INK_DIR"
if [ -n "$(git -C "$INK_DIR" status --porcelain)" ]; then
  echo "⚠ $INK_DIR tem mudanças não commitadas — resolva antes de publicar"
  exit 1
fi
git -C "$INK_DIR" checkout -q main
git -C "$INK_DIR" pull -q --ff-only origin main

if ! grep -q '"name": "maestro"' "$INK_DIR/.claude-plugin/marketplace.json"; then
  echo "⚠ o maestro ainda não está no marketplace.json da INK — a primeira publicação é manual"
  exit 1
fi

mkdir -p "$INK_DIR/$SKILL_DIR"
cp "$REPO_ROOT/maestro/SKILL.md" "$REPO_ROOT/maestro/REFERENCE.md" "$INK_DIR/$SKILL_DIR/"
if [ -z "$(git -C "$INK_DIR" status --porcelain -- "$SKILL_DIR")" ]; then
  echo "✓ o maestro da INK já está igual ao pessoal — nada a publicar"
  exit 0
fi

NEW_VERSION="$(python3 -I - "$INK_DIR" <<'PY'
import re, sys
root = sys.argv[1]
def bump(m):
    major, minor, patch = m.group(2).split(".")
    return f'{m.group(1)}{major}.{minor}.{int(patch) + 1}"'
plugin = f"{root}/plugins/maestro/.claude-plugin/plugin.json"
s = open(plugin, encoding="utf-8").read()
s, n = re.subn(r'("version":\s*")(\d+\.\d+\.\d+)"', bump, s, count=1)
assert n == 1, "version não encontrada no plugin.json"
open(plugin, "w", encoding="utf-8").write(s)
new = re.search(r'"version":\s*"([^"]+)"', s).group(1)
market = f"{root}/.claude-plugin/marketplace.json"
s = open(market, encoding="utf-8").read()
s, n = re.subn(r'("name":\s*"maestro",.*?"version":\s*")[^"]+"', lambda m: f'{m.group(1)}{new}"', s, count=1, flags=re.S)
assert n == 1, "entrada do maestro sem version no marketplace.json"
open(market, "w", encoding="utf-8").write(s)
print(new)
PY
)"

BRANCH="maestro/v$NEW_VERSION"
git -C "$INK_DIR" checkout -q -b "$BRANCH"
git -C "$INK_DIR" add -A
git -C "$INK_DIR" commit -q -m "feat: atualiza maestro para v$NEW_VERSION

Sincroniza com luecabral/skills@$(git -C "$REPO_ROOT" rev-parse --short HEAD).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git -C "$INK_DIR" push -q -u origin "$BRANCH"

PR_URL="$(gh pr create --repo "$INK_REPO" --base main --head "$BRANCH" \
  --title "feat: atualiza maestro para v$NEW_VERSION" \
  --body "Sincroniza o plugin \`maestro\` com o repositório pessoal da Luiza ([luecabral/skills@$(git -C "$REPO_ROOT" rev-parse --short HEAD)](https://github.com/luecabral/skills/commit/$(git -C "$REPO_ROOT" rev-parse HEAD))) e sobe a versão para \`$NEW_VERSION\`, pra que quem tem o plugin instalado receba a mudança.

🤖 Generated with [Claude Code](https://claude.com/claude-code)")"
gh pr merge "$PR_URL" --repo "$INK_REPO" --merge

git -C "$INK_DIR" checkout -q main
git -C "$INK_DIR" pull -q --ff-only origin main
echo "✓ maestro v$NEW_VERSION publicado na INK: $PR_URL"
