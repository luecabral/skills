---
name: debugging
description: Use ao encontrar qualquer bug, teste falhando, comportamento inesperado ou
erro em console. Ativa quando o usuário mostra um erro, diz "não tá funcionando", "tá
quebrando aqui", "por que isso acontece", "não consigo achar a causa", "está difícil de
reproduzir", "sumiu em algum commit". Encontra a causa raiz antes de propor qualquer
correção.
---

# Debugging

Processo para encontrar causa raiz — nunca tratar sintoma.

## Passo 0 — Construir sinal de feedback

Antes de qualquer investigação, construa uma forma de reproduzir o problema:

| Tipo de bug | Sinal recomendado |
|---|---|
| Lógica de negócio | Teste automatizado que falha |
| API / endpoint | `curl` ou script CLI |
| UI / interação | Passos manuais mínimos |
| Performance | Benchmark isolado com métrica mensurável |
| Dado corrompido | Query que mostra o estado inconsistente |

O sinal precisa ser **rápido** (segundos), **determinístico** (falha sempre) e **isolado**.
Se o bug acontece "às vezes": minimize variáveis até reprodução consistente. Não avance sem sinal.

## Fase 1 — Observar

- Comportamento atual (exato, não "não funciona") e esperado
- Stack trace completo
- Em que contexto acontece? Quando começou?
- O que foi alterado recentemente nos arquivos relacionados?

Leia os arquivos relevantes — não apenas o diff, mas o contexto completo.

## Fase 2 — Hipóteses

Liste pelo menos 3 causas possíveis em ordem de probabilidade.
Para cada uma: por que poderia ser? o que precisaria ser verdade para confirmar?

Categorias comuns: dado inválido, estado inconsistente, race condition, dependência
externa falhando silenciosamente, erro de lógica, problema de ambiente.

## Fase 3 — Testar hipóteses

Uma mudança por vez. Use o sinal do Passo 0.

**Minimização:** reduza ao caso mais simples — remova dados e contexto desnecessários.
Quanto menor o caso, mais óbvia a causa.

**Bisection (quando não sabe em qual commit o bug apareceu):**
```bash
git bisect start
git bisect bad                  # commit atual tem o bug
git bisect good <commit-antigo> # commit que funcionava
# teste cada commit com o sinal do Passo 0
git bisect reset
```

Documente o que cada experimento revelou antes de avançar.

## Fase 4 — Corrigir

1. Implemente no local correto (causa, não sintoma)
2. Explique por que resolve a causa raiz
3. Verifique que não quebra comportamentos adjacentes
4. Escreva teste de regressão — deve falhar sem a correção e passar com ela

## Regras

- Nunca corrija sem identificar a causa raiz
- Remova logs de debug antes do commit
- Após 3 hipóteses sem resultado, pare e descreva o que foi descartado — o usuário
  pode ter contexto que você não tem
