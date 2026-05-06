---
name: diagnose
description: Use para bugs difíceis, regressões de performance ou problemas que o systematic-debugging não conseguiu resolver. Ativa quando o usuário diz "não consigo achar a causa", "está difícil de reproduzir", "sumiu em algum commit", "está lento só em produção". Constrói um sinal de feedback rápido antes de investigar, minimiza o caso e usa bisection quando necessário.
---

# Diagnose

Loop disciplinado para bugs difíceis: sinal de feedback → reproduzir → minimizar → hipóteses → instrumentar → corrigir → regressão.

## Diferença de systematic-debugging

`systematic-debugging` cobre qualquer bug com um processo de 4 fases.
`diagnose` é para quando o bug é difícil de reproduzir, intermitente ou apareceu em algum commit sem saber qual. O diferencial é o investimento upfront em construir um sinal de feedback rápido antes de qualquer investigação.

## Processo

### Passo 1 — Construir o sinal de feedback

Antes de investigar qualquer coisa, construa uma forma de reproduzir o problema que seja:
- **Rápida** — executa em segundos
- **Determinística** — falha sempre, não às vezes
- **Isolada** — sem dependências desnecessárias

Escolha o tipo de sinal mais simples que reproduz o bug:

| Tipo de bug | Sinal recomendado |
|---|---|
| Lógica de negócio | Teste automatizado que falha |
| API / endpoint | `curl` ou script CLI que reproduz a resposta errada |
| UI / interação | Script de browser headless ou passos manuais mínimos |
| Performance | Benchmark isolado com métrica mensurável (ex: `time curl ...`) |
| Dado corrompido | Query que mostra o estado inconsistente |

Se o bug acontece "às vezes": minimize variáveis (dados, ambiente, carga) até conseguir reprodução consistente. Não avance sem sinal determinístico.

### Passo 2 — Minimizar o caso

Com o sinal em mãos, reduza o caso ao menor possível:
- Remova dados que não afetam o bug
- Remova camadas de código que não estão no caminho do problema
- Remova dependências externas que podem ser substituídas por stubs

**Por que minimizar:** quanto menor o caso, mais óbvia fica a causa. Um bug que parece complexo em contexto real frequentemente é trivial em isolamento.

### Passo 3 — Hipóteses

Liste causas possíveis em ordem de probabilidade. Para cada uma:
- Por que poderia ser esta causa?
- O que precisaria ser verdade para confirmar?

Considere pelo menos 3 hipóteses antes de escolher onde investigar.

### Passo 4 — Instrumentar

Teste cada hipótese com o menor experimento possível usando o sinal do Passo 1:
- Adicione logs estratégicos nos pontos suspeitos
- Modifique uma variável por vez
- Documente o resultado de cada experimento antes de passar para o próximo

**Bisection (quando não sabe em qual commit o bug apareceu):**
```bash
git bisect start
git bisect bad                  # commit atual tem o bug
git bisect good <commit-antigo> # commit que funcionava
# git bisect sugere commits — teste cada um com o sinal do Passo 1
# git bisect good / git bisect bad conforme resultado
git bisect reset                # ao terminar
```

### Passo 5 — Corrigir

Somente após confirmar a causa raiz:
1. Implemente a correção no local correto (causa, não sintoma)
2. Verifique com o sinal do Passo 1 que o bug não ocorre mais
3. Verifique que a correção não quebra comportamentos adjacentes

### Passo 6 — Teste de regressão

Transforme o sinal do Passo 1 em teste permanente:
- O teste deve falhar sem a correção e passar com ela
- Deve ficar no codebase para nunca deixar esse bug voltar silenciosamente

## Regras

- Não avance do Passo 1 sem sinal determinístico — investigar sem sinal é adivinhar
- Nunca faça múltiplas mudanças ao mesmo tempo durante a instrumentação
- Logs de debug adicionados durante a investigação devem ser removidos antes do commit
- Se após 3 hipóteses testadas a causa ainda não for clara, descreva o que foi descartado — o usuário pode ter contexto que você não tem
