# Context Docs — Referência

## Estrutura do AGENTS.md

```markdown
# [Nome do Projeto] — Contexto para Agentes de IA

## O que é este projeto
[2-3 frases em linguagem simples: o que faz, pra quem, qual problema resolve]

## Stack e Tecnologias
[Linguagem, framework, banco, serviços externos — só nomes e versões]

## Estrutura de Pastas
[Mapa das pastas principais com 1 linha de descrição cada]

## Como o projeto funciona (visão geral)
[Fluxo principal em bullets: "usuário acessa → autentica → vê dashboard → exporta"]

## Regras e Restrições (IMPORTANTE)
[O que o agente NÃO deve fazer: "não altere o banco sem perguntar", "não remova autenticação"]

## Padrões de Código
[Convenções: nomes, estrutura de funções, estilo de commits]

## Features Documentadas
[Links para docs/features/]

## Fluxos Documentados
[Links para docs/flows/]

## Status Atual
[O que está funcionando, em desenvolvimento, quebrado/pausado]
```

---

## Template de feature (docs/features/nome.md)

```markdown
# [Nome da Feature]

**Status:** planejada | em desenvolvimento | funcionando | pausada | deprecated

## O que faz (para humanos)
[O que o usuário vê? O que acontece quando usa? Qual o objetivo?]

## Como funciona (para agentes)
**Arquivos principais:**
- `caminho/arquivo.ext` — [o que faz]

**Integrações:**
- [Serviço X]: [como é usado]

## Regras de Negócio
[O que não pode mudar: restrições, validações, lógica que parece estranha mas tem motivo]

## Histórico de Decisões
[Por que foi construída assim? Quais alternativas foram descartadas?]

## Pendências / Próximos Passos
- [ ] [o que ainda falta fazer]
```

---

## Template de fluxo (docs/flows/nome.md)

```markdown
# Fluxo: [Nome]

**Gatilho:** [O que inicia esse fluxo?]
**Resultado esperado:** [O que acontece no final quando tudo dá certo?]

## Passo a passo (para humanos)
1. [Passo 1 em linguagem simples]
2. [Passo 2]

## Mapa técnico (para agentes)
| Passo | Arquivo/Componente | O que acontece |
|-------|--------------------|----------------|
| 1     | `caminho/arquivo`  | [descrição]    |

## Pontos de atenção
[Onde costuma dar problema, edge cases conhecidos]

## Fluxos relacionados
- [Link para outro fluxo]
```

---

## Formato do changelog (docs/changelog.md)

```markdown
## [Data] — [Título curto do que mudou]

**O que mudou:** [1-2 frases sobre o que foi alterado]
**Por quê:** [Qual problema resolve ou melhoria traz]
**Impacto:** [O que o usuário vai notar? Há quebra de comportamento?]
**Arquivos afetados:** [Lista opcional, útil para agentes]
```

---

## Checklist de atualização (Caso 3)

```
[ ] AGENTS.md — a descrição ainda bate com o que foi feito?
[ ] AGENTS.md > Estrutura de Pastas — algum arquivo/pasta foi criado, movido ou removido?
[ ] AGENTS.md > Regras e Restrições — surgiu nova restrição importante?
[ ] AGENTS.md > Status Atual — algo mudou de status?
[ ] docs/features/ — tem feature nova, modificada ou removida?
[ ] docs/flows/ — algum fluxo existente foi impactado?
[ ] docs/changelog.md — registrar o que mudou (sempre, sem exceção)
```
