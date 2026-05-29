# Maestro — Referência

## Formato `.plans/plan.md`

```
# Plano: [feature]
Branch: feat/nome | Data: YYYY-MM-DD

## Fora do escopo
- [non-goals]

## Tasks

- [ ] 1. Criar model X — `app/models/x.rb`
       em_resumo: guarda os dados de X no sistema
       depends_on: []
       ✓ Pronto quando: migration roda sem erro

- [ ] 2. Criar controller Y — `app/controllers/y.rb`
       em_resumo: recebe a ação do usuário e responde
       depends_on: [1]
       ✓ Pronto quando: endpoint responde 200

- [ ] 3. Criar view Z — `app/views/z.html.erb`
       em_resumo: a tela que o usuário vê
       depends_on: [1]
       ✓ Pronto quando: página renderiza sem erro

- [ ] 4. Integrar controller + view — `app/...`
       em_resumo: liga a tela à ação, fechando o fluxo
       depends_on: [2, 3]
       ✓ Pronto quando: fluxo completo funciona
```

## Grupos paralelos (topological sort)

Para o exemplo acima:
- **Grupo 1**: [task 1] — sem dependências
- **Grupo 2**: [task 2, task 3] — ambas dependem só de 1 → rodam em paralelo
- **Grupo 3**: [task 4] — depende de 2 e 3

Apresentar ao usuário como:
> "4 tasks em 3 grupos. Pico de paralelismo: 2 subagentes simultâneos."

## Merge de worktrees

Após cada grupo paralelo concluir, para cada worktree do grupo:

```bash
# Confirma o commit do subagente
git -C <worktree-path> log --oneline -1

# Aplica na branch principal
git cherry-pick <commit-hash>
```

Se conflito:
1. Pausa a Fase 3
2. Descreve: "Conflito em `arquivo.rb` entre task 2 e task 3 — ambas modificaram o método `X`"
3. Aguarda resolução humana
4. Retoma a partir da task seguinte após resolução
