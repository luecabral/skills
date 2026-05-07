---
name: tdd
description: Use quando quiser desenvolver uma feature ou corrigir um bug guiado por testes. Ativa quando o usuário diz "faz com TDD", "quero usar TDD aqui", "desenvolve orientado a testes". Analisa o código existente, refatora se necessário, depois segue o ciclo Red-Green-Refactor.
---

# TDD — Test-Driven Development

Desenvolvimento guiado por testes: analisa o que existe, prepara o terreno, escreve o teste antes do código.

## Diferença de test-gate

`test-gate` escreve testes depois da implementação, como gate de qualidade antes do commit.
`tdd` é uma metodologia: o teste define o comportamento antes de qualquer código existir.

## Passo 0 — Análise prévia do código existente

Antes de escrever qualquer teste, leia os arquivos relacionados à task:

```bash
find . -type f -name "*.rb" -o -name "*.js" -o -name "*.ts" | head -50
```

Para cada módulo que a task vai tocar, aplique o **teste de deleção**:
> "Se eu deletasse esse módulo e reescrevesse o código que o usa diretamente, o resultado seria pior ou equivalente?"

- **Pior** → módulo profundo, está fazendo algo valioso — pode testar direto
- **Equivalente** → módulo raso, refatore antes de escrever testes

Se encontrar módulos rasos: refatore primeiro, confirmando com o usuário antes de prosseguir. Cada passo de refatoração deve deixar o código funcionando. Só avance para o ciclo TDD depois que a interface estiver limpa.

## O ciclo Red-Green-Refactor

### 🔴 RED — Escreva um teste que falha

Descreva o comportamento desejado como um teste. Execute e confirme que **falha** — isso valida que o teste é útil e que a funcionalidade ainda não existe.

### 🟢 GREEN — Escreva o mínimo para passar

Escreva a quantidade **mínima** de código para fazer o teste passar. Sem elegância, sem antecipação — apenas resolver o problema técnico do teste atual.

### 🔵 REFACTOR — Limpe sem quebrar

Com o teste verde, remova duplicações, melhore nomes, aplique padrões. Execute os testes e confirme que continuam verdes.

**Repita o ciclo para o próximo comportamento.**

## Princípios

- **Vertical slice:** um comportamento por vez, do teste à implementação completa
- **Interface pública:** testes descrevem o "o quê", não o "como" — sobrevivem a refatorações internas
- **Testes pequenos e focados:** cada teste cobre um único comportamento
- **Suíte rápida:** se um teste demora para rodar, está testando coisa demais

## Regras

- Nunca escreva código de produção sem um teste que falha primeiro
- Se estiver difícil escrever o teste, a interface está errada — redesenhe antes de implementar
- Não pule o RED: um teste que nunca falhou não prova nada
- Refatoração não muda comportamento — se mudar, é outra coisa
