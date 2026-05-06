---
name: tdd
description: Use quando quiser desenvolver uma feature ou corrigir um bug guiado por testes. Ativa quando o usuário diz "faz com TDD", "quero usar TDD aqui", "desenvolve orientado a testes". Escreve o teste antes da implementação e segue o ciclo Red-Green-Refactor vertical slice por vertical slice.
---

# TDD — Test-Driven Development

Desenvolvimento guiado por testes: o teste vem antes do código.

## Diferença de test-gate

`test-gate` escreve testes depois da implementação, como gate de qualidade antes do commit.
`tdd` é uma metodologia de desenvolvimento: o teste define o comportamento antes de qualquer código existir. O teste guia o design da interface, não apenas verifica o resultado.

## O ciclo Red-Green-Refactor

### 🔴 RED — Escreva um teste que falha

Descreva o comportamento desejado como um teste. Execute e confirme que **falha** — isso valida que o teste é útil e que a funcionalidade ainda não existe.

```
Exemplo: "retorna erro quando email já está cadastrado"
→ escreve o teste → roda → vê falhar → segue
```

### 🟢 GREEN — Escreva o mínimo para passar

Escreva a quantidade **mínima** de código para fazer o teste passar. Sem elegância, sem antecipação — apenas resolver o problema técnico do teste atual.

Execute e confirme que **passa**.

### 🔵 REFACTOR — Limpe sem quebrar

Com o teste verde, limpe o código:
- Remova duplicações
- Melhore nomes
- Aplique padrões de design

Execute os testes novamente e confirme que continuam verdes.

**Repita o ciclo para o próximo comportamento.**

## Princípios

- **Vertical slice:** um comportamento por vez, do teste à implementação completa. Não escreva todos os testes antes de implementar nada
- **Interface pública:** testes descrevem o "o quê", não o "como" — sobrevivem a refatorações internas
- **Testes pequenos e focados:** cada teste cobre um único comportamento
- **Suíte rápida:** se um teste demora para rodar, está testando coisa demais

## Regras

- Nunca escreva código de produção sem um teste que falha primeiro
- Se estiver difícil escrever o teste, é sinal que a interface está errada — redesenhe antes de implementar
- Não pule o RED: um teste que nunca falhou não prova nada
