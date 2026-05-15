#!/bin/bash
# Instala os git hooks que mantêm os flat .md sincronizados com <skill>/SKILL.md
HOOKS_DIR="$(git rev-parse --show-toplevel)/.git/hooks"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

for hook in post-commit post-merge; do
  cp "$SCRIPT_DIR/.githooks/$hook" "$HOOKS_DIR/$hook"
  chmod +x "$HOOKS_DIR/$hook"
  echo "hook instalado: $hook"
done

echo "setup concluído"
