---
name: systematic-debugging
description: Use ao encontrar qualquer bug, teste falhando, comportamento inesperado ou erro em console. Ativa quando o usuário mostra um erro, diz "não tá funcionando", "tá quebrando aqui", "por que isso acontece" ou quando o test-gate reporta testes falhando. Segue um processo de 4 fases para encontrar a causa raiz real antes de propor qualquer correção.
---

# Systematic Debugging

Processo de 4 fases para encontrar a causa raiz — nunca tratar sintoma.

## Passo 0 — Construir sinal de feedback

Antes de qualquer investigação, construa uma forma rápida e determinística de reproduzir o problema:
- Teste automatizado que falha
- Comando curl / script CLI
- Script throwaway no console do Rails/browser

O sinal precisa ser rápido (segundos), determinístico (falha sempre) e isolado. Se o bug acontece "às vezes", minimize variáveis até conseguir reprodução consistente.

## Fase 1 — OBSERVAR

- Comportamento atual (exato, não "não funciona") e esperado
- Mensagem de erro completa (stack trace inteiro)
- Em que contexto acontece? Quando começou?
- O que foi alterado recentemente nos arquivos relacionados?

Leia os arquivos relevantes — não apenas o diff, mas o contexto completo.

## Fase 2 — HIPÓTESES

Liste pelo menos 3 causas possíveis em ordem de probabilidade. Para cada uma: por que poderia ser esta causa? o que precisaria ser verdade para confirmar?

Categorias comuns: dado inválido, estado inconsistente, race condition, dependência externa falhando silenciosamente, erro de lógica, problema de ambiente.

## Fase 3 — TESTAR HIPÓTESES

Uma mudança por vez. Use o sinal do Passo 0 para validar cada experimento.

**Minimização:** reduza ao caso mais simples possível — remova dados e contexto desnecessários.

**Bisection (quando "quando começou?" é desconhecido):**
```bash
git bisect start
git bisect bad                  # commit atual tem o bug
git bisect good <commit-antigo> # commit que funcionava
# teste cada commit apontado pelo bisect com o sinal do Passo 0
```

Documente o que cada experimento revelou antes de avançar.

## Fase 4 — CORRIGIR

1. Implemente no local correto (causa, não sintoma)
2. Explique por que resolve a causa raiz
3. Verifique que não quebra comportamentos adjacentes
4. Escreva teste de regressão usando o sinal do Passo 0 — deve falhar sem a correção e passar com ela
5. Acione `verification-before-completion`

## Regras

- Nunca corrija sem identificar a causa raiz
- Remova logs de debug antes do commit
- Após 3 hipóteses sem resultado, pare e descreva o que foi descartado — o usuário pode ter contexto que você não tem
- Bugs recorrentes indicam ausência de teste — sempre acione `test-gate` após a correção
