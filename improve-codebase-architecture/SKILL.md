---
name: improve-codebase-architecture
description: Use quando quiser encontrar oportunidades de melhoria arquitetural no codebase. Ativa quando o usuário diz "o código está difícil de manter", "quero refatorar isso", "está ficando bagunçado", "como melhorar a arquitetura disso" ou quando julgar que módulos existentes estão rasos ou mal abstraídos.
---

# Improve Codebase Architecture

Encontrar módulos rasos e aprofundá-los — mais testáveis, mais navegáveis, mais fáceis de modificar.

## Princípio

Um módulo **profundo** tem interface simples e esconde complexidade. Um módulo **raso** tem interface grande e esconde pouca coisa — é quase transparente, adiciona camadas sem encapsular nada.

Módulos rasos têm três sintomas:
- São difíceis de testar (testam implementação, não comportamento)
- Quebram quando o código interno muda
- Crescem sem parar porque qualquer detalhe vaza para fora

## Processo

### Passo 1 — Explorar o codebase

Leia a estrutura do projeto e identifique os módulos principais:

```bash
find . -type f -name "*.rb" -o -name "*.js" -o -name "*.ts" | head -50
```

Use o vocabulário do domínio do projeto (nomes de models, controllers, services, helpers) para orientar a exploração.

### Passo 2 — Aplicar o teste de deleção

Para cada módulo identificado, faça mentalmente:
> "Se eu deletasse esse módulo e reescrevesse o código que o usa diretamente, o resultado seria pior ou equivalente?"

- **Pior** → módulo profundo, está fazendo algo valioso
- **Equivalente** → módulo raso, é pura indireção sem valor

### Passo 3 — Apresentar candidatos

Liste os módulos rasos encontrados no formato:

```
[N] Nome do módulo — caminho/do/arquivo

Problema: [o que torna esse módulo raso — interface grande, nada encapsulado, etc.]
Oportunidade: [como aprofundar — o que poderia ser encapsulado, que complexidade poderia esconder]
Benefícios: [mais testável / mais navegável / mais fácil de modificar / menos acoplamento]
```

Apresente no máximo 5 candidatos. Priorize os que têm maior impacto para quem mantém o código.

### Passo 4 — Alinhar com o usuário

Para cada candidato, confirme:
- Faz sentido refatorar agora?
- Há contexto que muda a avaliação (prazo, dependências, risco)?

Só prossiga com os candidatos aprovados.

### Passo 5 — Planejar a refatoração

Para cada módulo aprovado, crie um plano de refatoração usando `prd-to-issues`:
- Cada commit deve deixar o código funcionando
- Comece pela interface (o que o módulo expõe), não pela implementação
- Testes novos devem usar a interface pública, não detalhes internos

## Regras

- Nunca refatore sem antes entender o motivo pelo qual o módulo existe
- Se um módulo parece raso mas tem história de decisões importantes, pergunte antes de sugerir mudança
- Refatoração não muda comportamento — se mudar comportamento, é outra coisa
