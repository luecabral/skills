# Skills de Vibecoding

Skills são instruções que ensinam a IA a se comportar de um jeito específico em cada etapa do desenvolvimento. Em vez de dar o mesmo contexto repetido toda vez, você ativa a skill certa e ela já sabe o que fazer, o que checar e o que entregar.

Este repositório organiza o fluxo completo de desenvolvimento — do primeiro rascunho de uma ideia até o PR revisado e pronto para produção.

---

## Fluxo principal

```
💡 IDEIA
    ↓
[brainstorming] ──── refina a ideia + threat modeling
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
    │       (inclui testes de segurança)  │
    │       ↓                             │
    │  testes passaram?                   │
    │    não → [systematic-debugging]     │
    │           [verification-before-completion]
    │    sim ↓                            │
    │  [smart-commit] ── commita a task   │
    └─────────────────────────────────────┘
    ↓
[ready-check] ──── revisão + segurança + pipeline CI/CD
    ↓
[open-pr] ──── rebase + PR com corpo + changelog
    ↓
[review-pr] ──── roteiro de staging para o revisor
```

---

## Skills do fluxo

---

### 💡 brainstorming

Quem vibecoda tende a ir direto para o código antes de entender o problema de verdade. Essa skill freia esse impulso. Ela faz as perguntas certas para descobrir o que realmente precisa ser feito — o comportamento esperado, quem vai usar, o que fica fora do escopo — antes de qualquer linha de código.

Para features que envolvem dados, autenticação ou integrações externas, ela também faz um **threat modeling**: mapeia o que precisa ser protegido, quem poderia atacar e quais vetores de risco existem. Esse mapa vira parte do documento de design e depois se transforma em tasks de segurança no plano.

O resultado é um documento de design salvo em `docs/design.md`, que serve de base para o `writing-plans`.

**Quando usar:** sempre que a ideia ainda for vaga ou não houver plano definido.

---

### 📋 writing-plans

Sem um plano, a implementação vira uma sequência de decisões improvisadas. Essa skill quebra a ideia aprovada no brainstorming em tasks pequenas, de 2 a 5 minutos cada — específicas o suficiente para gerar commits limpos e revisões precisas.

Além do plano, ela cria a branch no repositório com nome padronizado (`feat/descricao`, `fix/descricao`) e salva tudo em `docs/current-plan.md`. Esse arquivo é o fio que conecta as próximas skills: o `write-tests` lê para saber o que testar, o `smart-commit` lê para nomear os commits, o `ready-check` lê para saber se o plano está completo.

**Quando usar:** após o brainstorming ser aprovado, ou quando a ideia já está clara e só falta organizar a execução.

---

### 🔒 vibesec

Quem vibecoda sem experiência em segurança introduz vulnerabilidades sem perceber — não por má intenção, mas por não saber o que procurar. Essa skill age como um bug hunter: lê o código implementado e vasculha ativamente pelos erros mais comuns antes que virem problema em produção.

O checklist cobre as principais categorias de risco: controle de acesso (IDOR), injeção de código (SQL/XSS), autenticação e sessão, exposição de dados, gestão de segredos, uploads, rate limit, security headers, multi-tenancy, race conditions e LGPD. Cada problema encontrado vem acompanhado do impacto e da correção específica, classificado como crítico, alto ou melhoria.

Depois do checklist, ela muda de perspectiva e atua como atacante — tentando explorar o que foi encontrado para garantir que as correções realmente fecham os vetores.

**Quando usar:** sempre que o código tocar em autenticação, inputs, banco de dados, APIs externas ou dados do usuário.

---

### 🎨 ux-validation

Interfaces mal feitas não são só feias — elas confundem, frustram e fazem o usuário desistir. Essa skill revisa a UI implementada com foco nos estados que costumam ser esquecidos: o que aparece enquanto carrega, o que aparece quando dá erro, o que aparece quando a lista está vazia.

Ela tem dois modos: `guide` para construir algo novo (orienta durante a implementação) e `review` para revisar código existente (aponta o que está faltando). A análise segue as 10 heurísticas de Nielsen e inclui checagem básica de acessibilidade.

**Quando usar:** sempre que uma tela ou componente for criado ou modificado.

---

### 🧪 write-tests

Testes escritos depois da implementação, mas antes do commit — esse é o momento certo no fluxo de vibecoding. Essa skill lê a task implementada, identifica os cenários relevantes e escreve os testes: o caminho feliz (happy path), os erros esperados (sad path), os casos extremos (edge cases) e a regressão (o que pode ter quebrado ao redor).

Se a task tocou em autenticação, dados ou uploads, ela também gera testes de segurança obrigatórios: acesso sem token, token de outro usuário, cross-tenant, rate limit, inputs maliciosos, arquivo de tipo inválido. Esses testes não são opcionais — se não forem aplicáveis, precisa ser declarado explicitamente.

Os testes são rodados antes de liberar para o `smart-commit`. Se algum falhar, aciona o `systematic-debugging` automaticamente.

**Quando usar:** após concluir a implementação de uma task, antes de commitar.

---

### 🐛 systematic-debugging

Quando algo quebra, o impulso é sair tentando coisas aleatórias até funcionar. Essa skill impõe um processo: antes de tocar no código, entender o que está acontecendo de verdade.

O processo tem 4 fases — observar o erro completo, levantar hipóteses em ordem de probabilidade, testar cada uma com o menor experimento possível e só então corrigir na causa raiz. O objetivo é não tratar sintoma, não esconder o problema com um workaround e não criar novos bugs no processo.

**Quando usar:** quando algo não funciona, quando um teste falha, quando há comportamento inesperado no console ou na aplicação.

---

### ✅ verification-before-completion

Depois de implementar ou corrigir algo, é fácil declarar "pronto" sem verificar se realmente está. Essa skill faz a checagem final antes de avançar: o comportamento implementado funciona? os testes passam? algo adjacente quebrou? tem `console.log` esquecido?

É uma skill de disciplina — curta, direta, mas que evita que problemas básicos cheguem no PR ou, pior, em produção.

**Quando usar:** após qualquer implementação ou correção, antes de commitar.

---

### 💾 smart-commit

Commits com mensagem "ajustes", "fix", "wip" ou "alterações" não dizem nada para quem revisa ou para o `git log` no futuro. Essa skill gera mensagens semânticas baseadas na task do plano, no formato `tipo: Mensagem em português, presente do indicativo`.

Antes de commitar, ela verifica se há documentação desatualizada e aguarda atualização. Depois agrupa os arquivos por contexto lógico, confirma com o usuário e marca a task como concluída no `docs/current-plan.md`.

**Quando usar:** após a task estar implementada, testada e verificada.

---

### 🔍 ready-check

Antes de pedir revisão de outra pessoa, você deve ter feito a sua própria. Essa skill garante que o código está limpo, seguro e que os fluxos visíveis ao usuário foram testados manualmente — tudo isso antes de abrir o PR.

Ela tem três partes: revisão do código (funcionalidade, segurança em 12 itens, UX e qualidade geral), roteiro de teste manual para o próprio desenvolvedor validar no ambiente local, e checklist de pipeline CI/CD para garantir que lint, testes, análise de segurança estática e secret scanning estão configurados.

**Quando usar:** após todas as tasks do plano estarem concluídas, antes de abrir o PR.

---

### 🚀 open-pr

O corpo de um PR precisa funcionar para duas audiências completamente diferentes: a IA que vai revisar o código precisa de contexto técnico (intenção, decisões, onde focar); o humano que vai testar no staging precisa de um roteiro em linguagem simples (o que fazer, o que deve aparecer, o que fazer se der errado).

Essa skill gera os dois ao mesmo tempo, quando o contexto ainda está fresco. Antes do push, faz o rebase com `origin/main` para manter o histórico linear. Depois cria o PR como draft e posta o changelog — escrito em linguagem não-técnica — como comentário.

**Quando usar:** após o `ready-check` liberar e os fluxos terem sido testados manualmente.

---

### 🧭 review-pr

Receber um PR para revisar sem saber por onde começar é comum — especialmente para quem não escreveu o código. Essa skill lê o PR e traduz o que precisa ser testado em um roteiro de ações concretas: onde clicar, o que preencher, o que deve aparecer.

O roteiro é executável por qualquer pessoa, técnica ou não. Para revisores que vão analisar o código, ela também gera o contexto estruturado para colar em uma IA — com a intenção do PR, as decisões técnicas e onde focar a revisão.

**Quando usar:** ao receber um PR para revisar no GitHub.

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

## Skills fora do fluxo

Skills acionadas por contexto específico, independente de onde você está no fluxo.

---

### 🖼️ design-system

Manter consistência visual em um projeto que cresce é difícil — especialmente quando mais de uma pessoa escreve HTML. Essa skill carrega os padrões visuais estabelecidos no projeto (espaçamento, tipografia, grid, componentes) e os aplica diretamente ao criar qualquer tela nova, sem precisar replicar decisões a cada vez.

Os padrões são para a stack Rails + Tailwind CDN + Hotwire e cobrem espaçamento (seções vs. componentes), escala tipográfica, variantes de grid, card, botões, tabela, tabs, badges, breadcrumb e estado vazio.

**Quando usar:** sempre que for criar ou modificar uma tela ou componente com Tailwind.

---

### 🚨 incident-response

Todo sistema que vai para produção vai, em algum momento, enfrentar um problema sério — um vazamento de dados, uma credencial exposta, o sistema fora do ar. A diferença entre um time que responde bem e um que entra em colapso é ter o plano pronto antes de precisar dele.

Essa skill tem dois modos. **Preparação** (antes de ir para prod): define o que conta como incidente, configura alertas de detecção, monta playbooks de resposta por cenário (vazamento, fora do ar, credencial exposta), valida backups e define quem notificar — incluindo a obrigação legal de notificar a ANPD em 72h em caso de vazamento de dados pessoais (LGPD). **Resposta ativa** (durante um incidente): conduz a triagem, prioriza contenção antes de investigação, preserva evidências e produz o post-mortem.

**Quando usar:** antes do primeiro deploy em produção, ou imediatamente quando um incidente estiver ativo.

---

## Arquivo de estado compartilhado

**`docs/current-plan.md`** é o fio que conecta as skills durante o desenvolvimento:

- **`writing-plans`** cria e salva o arquivo
- **`write-tests`** lê para entender a task sendo testada
- **`smart-commit`** lê para nomear commits e marca tasks como `[x]`
- **`ready-check`** lê para verificar se todas as tasks estão concluídas

Não delete este arquivo durante o desenvolvimento. Ele é gerado automaticamente a cada nova branch pelo `writing-plans`.
