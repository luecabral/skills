# Fluxo de Vibecoding — Mapa de Skills

Guia de quando usar cada skill, o que trigga cada uma e como elas se conectam.

---

## Visão geral do fluxo

```
💡 IDEIA
    ↓
[brainstorming] ──── refina a ideia, define o escopo
    ↓
[writing-plans] ──── cria o plano de tasks + cria a branch
    ↓
    ┌─────────────────────────────────────┐
    │  por task, repete até o plano acabar │
    │                                     │
    │  implementa o código                │
    │       ↓                             │
    │  [vibesec] ── checa segurança       │
    │  [ux-validation] ── checa interface │
    │       ↓                             │
    │  [write-tests] ── escreve e roda    │
    │       ↓                             │
    │  testes passaram?                   │
    │    não → [systematic-debugging]     │
    │           [verification-before-completion]
    │    sim ↓                            │
    │  [smart-commit] ── commita a task   │
    └─────────────────────────────────────┘
    ↓
[ready-check] ──── revisão de código + roteiro de teste manual
    ↓
[open-pr] ──── abre o PR com corpo + changelog
    ↓
[review-pr] ──── roteiro de staging para o revisor
```

---

## Detalhamento por skill

---

### 💡 brainstorming
**Momento:** antes de qualquer código
**Objetivo:** entender o problema real antes de propor solução

**Trigga quando o usuário diz:**
- "quero fazer X"
- "preciso de uma feature que..."
- "como eu faria para..."
- "tenho uma ideia para..."
- Qualquer pedido de nova implementação sem plano definido

**O que entrega:**
- Perguntas para refinar a ideia
- 2–3 abordagens com prós e contras
- Design aprovado salvo em `docs/design.md`

**Próxima skill:** `writing-plans`

---

### 📋 writing-plans
**Momento:** após brainstorming ou quando a ideia já está clara
**Objetivo:** criar plano de tasks + branch antes de codar

**Trigga quando o usuário diz:**
- "pode começar"
- "bora implementar"
- "cria o plano"
- "como a gente faz isso?"
- Após aprovação do brainstorming

**O que entrega:**
- Lista numerada de tasks de 2–5 minutos cada
- Nome da branch derivado do plano (`feat/descricao`)
- Branch criada no repositório
- Plano salvo em `docs/current-plan.md`

**Próxima skill:** implementar a task 1, depois `vibesec` e `ux-validation`

---

### 🔒 vibesec
**Momento:** durante a implementação, ao tocar em código sensível
**Objetivo:** prevenir vulnerabilidades antes que virem problema em produção

**Trigga quando o usuário:**
- Escreve código que lida com autenticação, inputs, banco, APIs externas
- Diz "isso é seguro?", "tem algum problema de segurança aqui?"
- Está implementando qualquer feature com dados do usuário

**O que entrega:**
- Checklist de segurança verificado
- Relatório de problemas com código corrigido
- Bloqueantes impedem o avanço

**Próxima skill:** `ux-validation` (se houver interface), `write-tests`

---

### 🎨 ux-validation
**Momento:** durante ou após implementar qualquer interface
**Objetivo:** garantir que a UI tem todos os estados e segue boas práticas

**Trigga quando o usuário:**
- Implementa ou modifica qualquer componente ou tela
- Diz "revisa a interface", "tá bom visualmente?", "valida o UX disso"

**Dois modos:**
- `guide` — ao construir algo novo
- `review` — ao revisar código existente

**O que entrega:**
- Checagem de componentização (sem duplicação)
- Checagem de estados (loading, erro, vazio, sucesso)
- Checagem de mensagens de erro (devem ser específicas)
- Análise das 10 heurísticas de Nielsen
- Checagem de acessibilidade básica
- Relatório com bloqueantes e sugestões

**Próxima skill:** `write-tests`

---

### 🧪 write-tests
**Momento:** após implementar a task, antes de commitar
**Objetivo:** escrever e rodar testes antes de considerar a task pronta

**Trigga quando o usuário diz:**
- "escreve os testes"
- "testa isso"
- "tá pronto pra commitar"
- "acabei de implementar"
- Após concluir a implementação de uma task

**O que entrega:**
- Testes de happy path, sad path e edge cases
- Testes rodados automaticamente
- Liberação para `smart-commit` se tudo estiver verde
- Acionamento de `systematic-debugging` se algum falhar

**Próxima skill:** `smart-commit` (se verde) ou `systematic-debugging` (se falhar)

---

### 🐛 systematic-debugging
**Momento:** quando algo quebra ou teste falha
**Objetivo:** encontrar a causa raiz antes de corrigir

**Trigga quando o usuário diz:**
- "não tá funcionando"
- "tá quebrando aqui"
- "por que isso acontece?"
- Quando `write-tests` reporta testes falhando
- Quando há erro no console ou comportamento inesperado

**Processo (4 fases):**
1. Observar — coletar o erro completo e o contexto
2. Hipóteses — listar causas possíveis em ordem de probabilidade
3. Testar — verificar cada hipótese com o menor experimento possível
4. Corrigir — implementar na causa raiz, não no sintoma

**Próxima skill:** `verification-before-completion`

---

### ✅ verification-before-completion
**Momento:** após qualquer correção ou implementação, antes de declarar pronto
**Objetivo:** confirmar que está funcionando de verdade antes de avançar

**Trigga quando o usuário diz:**
- "terminei"
- "tá pronto"
- "resolveu"
- Após `systematic-debugging` propor uma correção

**O que verifica:**
- O comportamento implementado funciona?
- Os testes passam?
- Nada adjacente quebrou?
- Não há código de debug esquecido?

**Próxima skill:** `smart-commit`

---

### 💾 smart-commit
**Momento:** após task implementada, testada e verificada
**Objetivo:** commitar com mensagens semânticas baseadas no plano

**Trigga quando o usuário diz:**
- "salva isso"
- "faz o commit"
- "commitei a task X"
- Após `write-tests` liberar (testes passando)

**Pré-condição:** testes passando (responsabilidade do `write-tests`)

**O que faz:**
- Lê `docs/current-plan.md` para identificar a task
- **Verifica se há documentação desatualizada** — aponta e aguarda atualização antes de commitar
- Agrupa arquivos por contexto lógico (incluindo docs atualizadas)
- Gera mensagem baseada no nome da task
- Confirma antes de executar cada commit
- Marca a task como `[x]` no plano

**Formato da mensagem:** `tipo: Mensagem em português, presente do indicativo, sem ponto final`

**Próxima skill:** próxima task do plano → repete o ciclo; ou `ready-check` quando o plano estiver completo

---

### 🔍 ready-check
**Momento:** após todas as tasks concluídas, antes de abrir o PR
**Objetivo:** revisão de código + roteiro de teste manual antes de expor para revisão

**Trigga quando o usuário diz:**
- "tá pronto"
- "posso abrir o PR"
- "revisa antes de subir"
- "o que tá faltando"
- Quando todas as tasks do `current-plan.md` estão marcadas como `[x]`

**O que faz:**

*Parte 1 — Revisão de código:*
- Funcionalidade, segurança, UX, qualidade geral
- Relatório com bloqueantes, sugestões e nitpicks
- Aplica correções com confirmação

*Parte 2 — Roteiro de teste manual:*
- Identifica fluxos visíveis ao usuário afetados pela branch
- Gera roteiro passo a passo em linguagem simples
- Inclui cenários de erro e checklist de regressão
- Aguarda confirmação de que os fluxos foram testados

**Próxima skill:** `open-pr`

---

### 🚀 open-pr
**Momento:** após `ready-check` liberar e fluxos testados
**Objetivo:** criar o PR com corpo para duas audiências + changelog

**Trigga quando o usuário diz:**
- "abre o PR"
- "sobe o PR"
- "cria o PR"
- Após `ready-check` confirmar que está tudo certo

**O que gera:**

*Título:* `tipo: Mensagem em português, presente do indicativo`

*Corpo do PR — para IA revisora:*
- "O que esse PR faz" — intenção em 2–3 frases
- "Decisões técnicas relevantes" — contexto de implementação
- "O que tem mais risco" — onde focar a revisão

*Corpo do PR — para humano:*
- "Staging" — URL do ambiente
- "O que testar" — roteiro de fluxos em linguagem simples

*Changelog:* resumo em linguagem não-técnica postado como comentário no PR

**Próxima skill:** `review-pr` (para o revisor)

---

### 🧭 review-pr
**Momento:** ao receber um PR para revisar
**Objetivo:** gerar roteiro de teste em staging + contexto para revisão com IA

**Trigga quando o usuário diz:**
- "preciso revisar o PR X"
- "o que eu testo nesse PR"
- "me ajuda a revisar"
- Ao receber um PR para revisar no GitHub

**O que entrega:**
- Roteiro de teste detalhado por fluxo (para qualquer revisor)
- Contexto estruturado para colar em uma IA e pedir revisão de código
- Instruções de como reportar problemas encontrados

**Não faz:** análise técnica de código (essa responsabilidade é da IA com o contexto gerado)

---

## Conexões entre skills

```
brainstorming ──→ writing-plans
writing-plans ──→ [ciclo de tasks]
vibesec ────────→ write-tests (bloqueantes resolvidos primeiro)
ux-validation ──→ write-tests (bloqueantes resolvidos primeiro)
write-tests ────→ smart-commit (se verde)
write-tests ────→ systematic-debugging (se falhar)
systematic-debugging → verification-before-completion
verification-before-completion → smart-commit
smart-commit ───→ próxima task ou ready-check
ready-check ────→ open-pr
open-pr ────────→ review-pr (para o revisor)
```

---

## Arquivo de estado compartilhado

**`docs/current-plan.md`** é o fio que conecta as skills durante o desenvolvimento:

- **`writing-plans`** cria e salva o arquivo
- **`write-tests`** lê para entender a task sendo testada
- **`smart-commit`** lê para nomear commits e marca tasks como `[x]`
- **`ready-check`** lê para verificar se todas as tasks estão concluídas

Não delete este arquivo durante o desenvolvimento. Ele é gerado automaticamente a cada nova branch pelo `writing-plans`.
