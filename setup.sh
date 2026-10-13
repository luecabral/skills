#!/bin/bash
# Aponta o git pros hooks versionados em .githooks/ — que, a cada commit na main,
# pusham pro luecabral. Rode UMA vez por clone:  bash setup.sh

git -C "$(git rev-parse --show-toplevel)" config core.hooksPath .githooks
echo "✓ core.hooksPath = .githooks (hooks versionados ativos)"
echo "  A cada commit na main: push luecabral."
