---
name: systematic-debugging
description: Use ao encontrar qualquer bug, teste falhando, comportamento inesperado ou erro em console. Ativa quando o usuário mostra um erro, diz "não tá funcionando", "tá quebrando aqui", "por que isso acontece" ou quando o write-tests reporta testes falhando. Segue um processo de 4 fases para encontrar a causa raiz real antes de propor qualquer correção.
---

# Systematic Debugging

Processo de 4 fases para encontrar a causa raiz — nunca tratar sintoma.

## Princípio

A primeira hipótese raramente é a causa real. Debugar sem processo leva a correções que mascaram o problema ou introduzem novos bugs. Esta skill força a investigação antes da correção.

## As 4 fases

### Fase 1 — OBSERVAR

Colete tudo sobre o problema antes de teorizar:

- Qual é o comportamento atual? (exato, não "não funciona")
- Qual é o comportamento esperado?
- Qual é a mensagem de erro completa? (stack trace inteiro)
- Em que contexto acontece? (sempre, às vezes, só com certos dados?)
- Quando começou? (após qual mudança, se souber)
- O que foi alterado recentemente nos arquivos relacionados?

Leia os arquivos relevantes — não apenas o diff, mas o contexto completo.

### Fase 2 — HIPÓTESES

Liste as causas possíveis em ordem de probabilidade. Para cada uma:
- Por que poderia ser esta causa?
- O que precisaria ser verdade para confirmar?

**Não pule para a mais óbvia.** Considere pelo menos 3 hipóteses antes de escolher onde investigar.

Exemplos de categorias:
- Dado inválido chegando de onde não se espera
- Estado inconsistente de variável ou objeto
- Condição de corrida ou problema de timing
- Dependência externa falhando silenciosamente
- Erro de lógica em condicionais
- Problema de ambiente (versão, configuração, variável de ambiente)

### Fase 3 — TESTAR HIPÓTESES

Teste cada hipótese com o menor experimento possível:

- Adicione logs estratégicos (não aleatórios) para verificar valores em pontos-chave
- Isole o componente problemático
- Reproduza o problema com o caso mais simples possível
- Verifique os dados de entrada e saída em cada etapa

**Nunca faça múltiplas mudanças ao mesmo tempo.** Uma mudança por vez — assim você sabe o que resolveu.

Documente o que cada experimento revelou antes de passar para o próximo.

### Fase 4 — CORRIGIR

Somente após confirmar a causa raiz:

1. Implemente a correção no local correto (causa, não sintoma)
2. Explique por que a correção resolve a causa raiz
3. Verifique se a correção não quebra outros comportamentos relacionados
4. Acione `write-tests` para escrever um teste que teria capturado este bug
5. Acione `verification-before-completion` para confirmar que está resolvido

## Formato de investigação

Apresente o progresso assim:

```
🔍 INVESTIGANDO

Comportamento atual: [exato]
Comportamento esperado: [exato]
Erro: [mensagem completa]

Hipóteses (ordem de probabilidade):
1. [hipótese] — [razão]
2. [hipótese] — [razão]
3. [hipótese] — [razão]

Testando hipótese 1...
→ [resultado do experimento]

Testando hipótese 2...
→ [resultado do experimento]

✅ Causa raiz identificada: [descrição clara]
Correção: [o que será mudado e por quê]
```

## Regras

- **Nunca corrija sem identificar a causa raiz** — correções cegas criam débito técnico
- Logs de debug adicionados durante a investigação devem ser removidos antes do commit
- Se após 3 hipóteses testadas a causa ainda não for clara, pare e descreva o que foi descartado — às vezes o usuário tem contexto que o agente não tem
- Bugs recorrentes indicam ausência de teste — sempre acione `write-tests` após a correção
