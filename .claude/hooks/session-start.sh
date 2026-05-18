#!/bin/bash
set -euo pipefail

# Só roda em sessão remota (Claude Code on the web)
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Linka cada skill deste repo em ~/.claude/skills/ pra ficar discoverable
# como slash-command na sessão atual.
mkdir -p "$HOME/.claude/skills"

for skill_dir in "$CLAUDE_PROJECT_DIR"/*/; do
  name="$(basename "$skill_dir")"
  if [ -f "$skill_dir/SKILL.md" ]; then
    mkdir -p "$HOME/.claude/skills/$name"
    ln -sf "$skill_dir/SKILL.md" "$HOME/.claude/skills/$name/SKILL.md"
  fi
done
