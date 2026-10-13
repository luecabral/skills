#!/bin/bash
# Publica uma atualização de plugin no marketplace da empresa (rsv-ink/ink-claude-marketplace):
# sobe a versão (patch), abre o PR e mergeia. Sem subir a versão ninguém recebe a mudança.
#
#   maestro         copia maestro/SKILL.md e maestro/references/ deste repo — é a mesma skill
#   linear-projeto  publica o que já foi editado no clone da INK — é uma variante do /linear
#                   (nome próprio, texto genérico, pergunta o time), então não dá pra copiar
#
# Uso:  bash scripts/publicar-ink.sh <maestro|linear-projeto>
# Clone da INK: $INK_MARKETPLACE_DIR, ou ../ink-claude-marketplace ao lado deste repo.
set -euo pipefail

PLUGIN="${1:?uso: bash scripts/publicar-ink.sh <maestro|linear-projeto>}"
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
INK_REPO="rsv-ink/ink-claude-marketplace"
INK_DIR="${INK_MARKETPLACE_DIR:-$(dirname "$REPO_ROOT")/ink-claude-marketplace}"
SKILL_DIR="plugins/$PLUGIN/skills/$PLUGIN"

case "$PLUGIN" in
  maestro|linear-projeto) ;;
  *) echo "⚠ plugin desconhecido: $PLUGIN (use maestro ou linear-projeto)"; exit 1 ;;
esac

[ -d "$INK_DIR/.git" ] || git clone -q "https://github.com/$INK_REPO.git" "$INK_DIR"
git -C "$INK_DIR" fetch -q origin main
if [ "$(git -C "$INK_DIR" rev-parse --abbrev-ref HEAD)" != "main" ] || [ "$(git -C "$INK_DIR" rev-parse HEAD)" != "$(git -C "$INK_DIR" rev-parse origin/main)" ]; then
  echo "⚠ o clone da INK não está na main atualizada — rode 'git -C $INK_DIR checkout main && git -C $INK_DIR pull' antes de editar"
  exit 1
fi
if [ -n "$(git -C "$INK_DIR" status --porcelain -- . ":(exclude)$SKILL_DIR")" ]; then
  echo "⚠ o clone da INK tem mudanças fora de $SKILL_DIR — resolva antes de publicar"
  exit 1
fi
if ! grep -q "\"name\": \"$PLUGIN\"" "$INK_DIR/.claude-plugin/marketplace.json"; then
  echo "⚠ $PLUGIN ainda não está no marketplace.json da INK — a primeira publicação é manual"
  exit 1
fi

if [ "$PLUGIN" = "maestro" ]; then
  rm -rf "$INK_DIR/$SKILL_DIR/references"
  mkdir -p "$INK_DIR/$SKILL_DIR"
  cp "$REPO_ROOT/maestro/SKILL.md" "$INK_DIR/$SKILL_DIR/SKILL.md"
  cp -R "$REPO_ROOT/maestro/references" "$INK_DIR/$SKILL_DIR/references"
fi
if [ -z "$(git -C "$INK_DIR" status --porcelain -- "$SKILL_DIR")" ]; then
  echo "✓ $PLUGIN na INK já está atualizado — nada a publicar"
  exit 0
fi

NEW_VERSION="$(python3 -I - "$INK_DIR" "$PLUGIN" <<'PY'
import re, sys
root, plugin = sys.argv[1], sys.argv[2]
def bump(m):
    major, minor, patch = m.group(2).split(".")
    return f'{m.group(1)}{major}.{minor}.{int(patch) + 1}"'
manifest = f"{root}/plugins/{plugin}/.claude-plugin/plugin.json"
s = open(manifest, encoding="utf-8").read()
s, n = re.subn(r'("version":\s*")(\d+\.\d+\.\d+)"', bump, s, count=1)
assert n == 1, "version não encontrada no plugin.json"
open(manifest, "w", encoding="utf-8").write(s)
new = re.search(r'"version":\s*"([^"]+)"', s).group(1)
market = f"{root}/.claude-plugin/marketplace.json"
s = open(market, encoding="utf-8").read()
pattern = r'("name":\s*"' + re.escape(plugin) + r'",.*?"version":\s*")[^"]+"'
s, n = re.subn(pattern, lambda m: f'{m.group(1)}{new}"', s, count=1, flags=re.S)
assert n == 1, f"entrada de {plugin} sem version no marketplace.json"
open(market, "w", encoding="utf-8").write(s)
print(new)
PY
)"

SOURCE_SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
BRANCH="$PLUGIN/v$NEW_VERSION"
git -C "$INK_DIR" checkout -q -b "$BRANCH"
git -C "$INK_DIR" add -A
git -C "$INK_DIR" commit -q -m "feat: atualiza $PLUGIN para v$NEW_VERSION

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git -C "$INK_DIR" push -q -u origin "$BRANCH"

PR_URL="$(gh pr create --repo "$INK_REPO" --base main --head "$BRANCH" \
  --title "feat: atualiza $PLUGIN para v$NEW_VERSION" \
  --body "Atualiza a skill \`$PLUGIN\` e sobe a versão para \`$NEW_VERSION\`, pra que quem tem o plugin instalado receba a mudança. Origem: [luecabral/skills@${SOURCE_SHA:0:7}](https://github.com/luecabral/skills/commit/$SOURCE_SHA).

🤖 Generated with [Claude Code](https://claude.com/claude-code)")"
gh pr merge "$PR_URL" --repo "$INK_REPO" --merge

git -C "$INK_DIR" checkout -q main
git -C "$INK_DIR" pull -q --ff-only origin main
echo "✓ $PLUGIN v$NEW_VERSION publicado na INK: $PR_URL"
