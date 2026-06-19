#!/bin/bash
# Aponta o git pros hooks versionados em .githooks/ — que, a cada commit na main,
# sincronizam os flats, pusham pro luecabral e atualizam o clone do WSL.
# Rode UMA vez por clone:  bash setup.sh
#
# (Antes este script copiava .githooks/ -> .git/hooks/, mas a cópia ficava defasada
#  quando o hook mudava. core.hooksPath usa o versionado direto — nunca desatualiza.)

git -C "$(git rev-parse --show-toplevel)" config core.hooksPath .githooks
echo "✓ core.hooksPath = .githooks (hooks versionados ativos)"
echo "  A cada commit na main: sync Windows + push luecabral + pull WSL."
