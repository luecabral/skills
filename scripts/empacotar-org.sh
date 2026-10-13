#!/bin/bash
# Gera os .zip pra subir na biblioteca de skills da organização no claude.ai
# (Customize > Skills > + > Upload a skill, depois "Publish to org").
#
#   maestro         maestro/ deste repo, com references/ (é a mesma skill do /maestro)
#   linear-projeto  org/linear-projeto/ — variante genérica do /linear: pergunta o time
#                   em vez de fixar o Random e não fala da Luiza
#
# Uso:  bash scripts/empacotar-org.sh            (as duas)
#       bash scripts/empacotar-org.sh maestro    (só uma)
# Saída: dist/<skill>.zip — a pasta de dentro do zip tem o mesmo nome da skill, como o claude.ai exige.
set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
DIST="$REPO_ROOT/dist"
mkdir -p "$DIST"

source_dir() {
  case "$1" in
    maestro) echo "$REPO_ROOT/maestro" ;;
    linear-projeto) echo "$REPO_ROOT/org/linear-projeto" ;;
    *) echo "⚠ skill desconhecida: $1 (use maestro ou linear-projeto)" >&2; exit 1 ;;
  esac
}

for skill in "${@:-maestro linear-projeto}"; do
  for name in $skill; do
    src="$(source_dir "$name")"
    rm -f "$DIST/$name.zip"
    (cd "$(dirname "$src")" && zip -qr -X "$DIST/$name.zip" "$(basename "$src")" -x '*.DS_Store')
    echo "✓ $DIST/$name.zip"
  done
done
