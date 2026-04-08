---
name: verification-before-completion
description: Use antes de declarar qualquer task, bug ou implementação como concluída. Ativa quando o usuário diz "terminei", "tá pronto", "pode commitar", "resolveu" ou quando o systematic-debugging propõe uma correção. Garante que o que foi feito realmente funciona antes de seguir em frente.
---

# Verification Before Completion

Confirmar que está pronto antes de declarar que está pronto.

## Princípio

"Parece que funcionou" não é verificação. Esta skill força uma checagem sistemática antes de qualquer avanço — seja para o próximo commit, próxima task ou abertura de PR.

## Checklist de verificação

### 1. O comportamento implementado funciona?

- [ ] Testei o fluxo principal (happy path) manualmente ou via teste automatizado?
- [ ] O resultado é exatamente o esperado, não "parece certo"?
- [ ] Se for uma correção de bug: o comportamento problemático não ocorre mais?

### 2. Os testes passam?

- [ ] Todos os testes existentes continuam passando? (sem regressão)
- [ ] Os testes novos escritos para esta task passam?
- [ ] Se algum teste falhou: é um teste desatualizado ou um problema real?

### 3. Não quebrou nada adjacente?

- [ ] Funcionalidades que usam os mesmos arquivos ainda funcionam?
- [ ] Dados existentes não foram corrompidos ou afetados pela mudança?
- [ ] Integrações que dependem do código alterado ainda funcionam?

### 4. O código está limpo?

- [ ] Não há `console.log`, `print`, `debugger` ou código de debug esquecido?
- [ ] Não há código comentado que não deveria ir para o repositório?
- [ ] Variáveis temporárias de teste foram removidas?

## Resultado

**Se todas as checagens passarem:**
```
✅ Verificação concluída. Tudo funcionando como esperado.
Pronto para: [próxima ação — smart-commit, próxima task, ready-check]
```

**Se alguma checagem falhar:**
```
❌ Verificação falhou em: [item específico]
Problema: [descrição do que não está correto]
→ Retornando para [systematic-debugging / implementação] antes de continuar.
```

## Regras

- Verificação não é opcional — nunca pule esta etapa por pressão de tempo
- "Provavelmente funciona" não passa na verificação — precisa de confirmação concreta
- Se não for possível verificar automaticamente, descreva os passos manuais que o usuário deve executar e aguarde confirmação
- Em caso de dúvida, marque como não verificado e sinalize ao usuário
