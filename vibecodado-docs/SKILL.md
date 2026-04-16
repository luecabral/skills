---
name: vibecodado-docs
description: >
  Metodologia completa de documentação para projetos vibecodados por pessoas não-tech.
  Cria e mantém documentação dual-audience: legível para humanos leigos E usada como
  contexto de guia por agentes de IA (Claude Code, Cursor, Copilot, Gemini, Trae, Windsurf
  e similares). Use esta skill SEMPRE que precisar documentar um projeto vibecodado,
  criar contexto para agentes de IA, escrever sobre features ou fluxos do sistema,
  gerar ou revisar AGENTS.md, ou quando alguém disser "documenta isso", "cria o AGENTS.md",
  "explica como funciona pra IA", "registra essa feature", ou qualquer variação disso.
  Funciona tanto para projetos já existentes quanto para projetos novos.
---

# Vibecodado Docs — Metodologia de Documentação

Documentação que serve dois públicos ao mesmo tempo:
- **Humanos não-tech**: entender o que o projeto faz, como funciona, o que cada parte significa
- **Agentes de IA**: contexto suficiente pra codar com qualidade, respeitar decisões existentes e não quebrar o que já funciona

---

## Estrutura de Arquivos

```
projeto/
├── AGENTS.md               ← Contexto mestre para agentes de IA (lido primeiro)
├── README.md               ← Visão geral humana do projeto
└── docs/
    ├── features/           ← Uma doc por feature
    │   ├── _template.md
    │   └── nome-da-feature.md
    ├── flows/              ← Fluxos e jornadas de usuário
    │   ├── _template.md
    │   └── nome-do-fluxo.md
    └── changelog.md        ← Registro de mudanças em linguagem humana
```

> Para projetos pequenos/iniciais, `AGENTS.md` + `README.md` já são suficientes.
> Adicione `docs/` quando o projeto crescer ou tiver múltiplas features.

---

## O Arquivo Mais Importante: `AGENTS.md`

O `AGENTS.md` é o arquivo que todo agente de IA deve ler **antes de qualquer coisa**.
Ele funciona como um briefing: "quem somos, o que fazemos, o que pode e o que não pode".

### Como criar o `AGENTS.md`

Siga esta estrutura. Leia os templates em `templates/agents-md.md` para blocos prontos.

**Seções obrigatórias:**

```markdown
# [Nome do Projeto] — Contexto para Agentes de IA

## O que é este projeto
[2-3 frases em linguagem simples. O que faz, pra quem serve, qual problema resolve.]

## Stack e Tecnologias
[Liste linguagem, framework, banco, serviços externos. Sem explicações longas — só nomes e versões.]

## Estrutura de Pastas
[Mapa das pastas principais com 1 linha de descrição cada. Não precisa ser exaustivo.]

## Como o projeto funciona (visão geral)
[Descreva o fluxo principal em bullets. Ex: "usuário acessa → autentica → vê dashboard → exporta"]

## Regras e Restrições (IMPORTANTE)
[O que o agente NÃO deve fazer. Ex: "não altere a estrutura do banco sem perguntar", "não remova autenticação", "este campo é calculado — não modifique manualmente"]

## Padrões de Código
[Convenções usadas: nomes de variáveis, estrutura de funções, estilo de commits, etc.]

## Features Documentadas
[Links para arquivos em docs/features/ se existirem]

## Fluxos Documentados
[Links para arquivos em docs/flows/ se existirem]

## Status Atual
[O que está funcionando, o que está em desenvolvimento, o que está quebrado/pausado]
```

---

## Documentando Features

Cada feature ganha um arquivo em `docs/features/nome-da-feature.md`.

Use o template em `templates/feature.md`. A estrutura obrigatória é:

```markdown
# [Nome da Feature]

**Status:** planejada | em desenvolvimento | funcionando | pausada | deprecated

---

## O que faz (para humanos)
[Explique como se estivesse falando pra alguém que nunca viu código.
O que o usuário vê? O que acontece quando usa? Qual o objetivo?]

## Como funciona (para agentes)
[Contexto técnico: quais arquivos estão envolvidos, qual a lógica principal,
quais serviços externos usa, quais são as dependências internas.]

**Arquivos principais:**
- `caminho/para/arquivo.ext` — [o que faz]

**Integrações:**
- [Serviço X]: [como é usado]

## Regras de Negócio
[O que não pode mudar. Restrições, validações, lógica que parece estranha mas tem motivo.]

## Histórico de Decisões
[Por que foi construída assim? Quais alternativas foram descartadas e por quê?
Isso evita que o agente "melhore" algo que foi deliberadamente feito diferente.]

## Pendências / Próximos Passos
- [ ] [o que ainda falta fazer]
```

---

## Documentando Fluxos

Fluxos descrevem **jornadas** — como algo acontece do início ao fim, passando por múltiplas features.

Use o template em `templates/flow.md`. Estrutura:

```markdown
# Fluxo: [Nome do Fluxo]

**Gatilho:** [O que inicia esse fluxo? Ex: "usuário clica em 'Novo Pedido'"]
**Resultado esperado:** [O que acontece no final quando tudo dá certo?]

---

## Passo a passo (para humanos)
1. [Passo 1 em linguagem simples]
2. [Passo 2]
...

## Mapa técnico (para agentes)
| Passo | Arquivo/Componente | O que acontece |
|-------|--------------------|----------------|
| 1     | `caminho/arquivo`  | [descrição]    |
| 2     | `caminho/arquivo`  | [descrição]    |

## Pontos de atenção
[Onde costuma dar problema, edge cases conhecidos, comportamentos não-óbvios.]

## Fluxos relacionados
- [Link para outro fluxo que interage com este]
```

---

## Changelog em Linguagem Humana

`docs/changelog.md` registra mudanças de forma que qualquer pessoa entenda — não só desenvolvedores.

```markdown
## [Data] — [Título curto do que mudou]

**O que mudou:** [Descreva em 1-2 frases o que foi alterado no projeto]
**Por quê:** [Qual problema isso resolve ou qual melhoria traz]
**Impacto:** [O que o usuário vai notar? Tem alguma quebra de comportamento anterior?]
**Arquivos afetados:** [Lista opcional, útil para agentes]
```

---

## Guia de Uso por Caso

### Caso 1: Projeto já existe, sem documentação

1. Comece pelo `AGENTS.md` — peça ao agente para explorar o repositório e **gerar um rascunho** baseado no código existente
2. Revise o rascunho: corrija nomes, adicione contexto de negócio que o código não mostra
3. Para cada feature principal, crie um arquivo em `docs/features/` — pode pedir ao agente pra gerar o esqueleto
4. Adicione as **Regras de Negócio** e **Histórico de Decisões** manualmente — isso é o que o agente não consegue inferir
5. Documente os fluxos principais em `docs/flows/`

### Caso 2: Projeto novo, começando do zero

1. Antes de codar qualquer coisa, escreva o `AGENTS.md` com o que você imagina que o projeto vai ser
2. Para cada feature planejada, crie um arquivo em `docs/features/` com status `planejada`
3. Conforme o agente vai construindo, atualize os arquivos: adicione os caminhos reais, ajuste o que mudou
4. Mantenha o `AGENTS.md` atualizado — ele é o "contrato" entre você e o agente

### Caso 3: Projeto existente com docs — atualizando após mudanças

Documentação desatualizada é pior que documentação inexistente: ela confunde agentes e humanos.
**Sempre que uma tarefa de desenvolvimento for concluída, a documentação deve ser revisada antes de considerar a tarefa pronta.**

**Gatilhos que obrigam atualização de docs:**

| O que aconteceu | O que atualizar |
|-----------------|-----------------|
| Nova feature foi criada | Criar `docs/features/nova-feature.md` + adicionar link no `AGENTS.md` |
| Feature existente foi modificada | Atualizar o arquivo da feature: arquivos afetados, regras, status |
| Feature foi removida ou desativada | Mudar status para `deprecated` no arquivo da feature + remover do `AGENTS.md` |
| Arquivo ou pasta foi movido/renomeado | Atualizar caminhos no `AGENTS.md` e em todos os docs de feature/fluxo que referenciam esse caminho |
| Nova integração externa foi adicionada | Atualizar seção "Stack e Tecnologias" e "Regras e Restrições" no `AGENTS.md` |
| Regra de negócio mudou | Atualizar seção "Regras de Negócio" da feature afetada + "Regras e Restrições" no `AGENTS.md` se for global |
| Status de algo mudou (ex: bug conhecido foi resolvido) | Atualizar seção "Status Atual" no `AGENTS.md` |
| Fluxo principal mudou | Atualizar o arquivo de fluxo correspondente em `docs/flows/` |

**Checklist de atualização (rodar ao fim de qualquer tarefa de desenvolvimento):**

```
[ ] AGENTS.md — a descrição do projeto ainda bate com o que foi feito?
[ ] AGENTS.md > Estrutura de Pastas — algum arquivo/pasta foi criado, movido ou removido?
[ ] AGENTS.md > Regras e Restrições — surgiu alguma nova restrição importante?
[ ] AGENTS.md > Status Atual — algo mudou de status?
[ ] docs/features/ — tem feature nova, modificada ou removida?
[ ] docs/flows/ — algum fluxo existente foi impactado pelo que foi feito?
[ ] docs/changelog.md — registrar o que mudou (sempre, sem exceção)
```

**Instrução para o agente:** ao concluir qualquer tarefa de desenvolvimento, percorra este checklist antes de declarar a tarefa pronta. Se algum item precisar de atualização, faça a atualização e apresente o diff ao humano para confirmação. Nunca deixe docs desatualizados como "tarefa de depois" — docs desatualizados quebram o contexto de sessões futuras.

---

## Instruções para o Agente que Lê Esta Skill

Quando você (agente de IA) for criar ou atualizar documentação seguindo esta skill:

1. **Leia os arquivos existentes primeiro** antes de criar algo novo — nunca sobrescreva sem verificar
2. **Separe claramente** o que é para humanos do que é para agentes dentro de cada doc
3. **Pergunte antes de inferir** regras de negócio — o humano sabe o porquê das coisas, você não
4. **Mantenha o tom simples** na seção humana: sem jargão, sem siglas sem explicação
5. **Seja específico** na seção técnica: nomes de arquivos reais, caminhos reais, não genéricos
6. **Não documente o óbvio** — foque no que é específico deste projeto, não em como o framework funciona
7. Após criar/atualizar docs, **confirme com o humano** o que foi gerado e peça para validar as regras de negócio

---

## Templates

Leia os arquivos em `templates/` para blocos prontos de copy-paste:
- `templates/agents-md.md` — AGENTS.md completo com exemplos preenchidos
- `templates/feature.md` — Template de feature preenchido com exemplo
- `templates/flow.md` — Template de fluxo preenchido com exemplo
