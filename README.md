# Skills de Vibecoding

Skills são instruções que ensinam a IA a se comportar de um jeito específico em cada etapa do desenvolvimento. Em vez de dar o mesmo contexto repetido toda vez, você ativa a skill certa e ela já sabe o que fazer, o que checar e o que entregar.

Este repositório organiza um fluxo de desenvolvimento minimalista — do primeiro rascunho de uma ideia até o PR revisado e pronto para produção.

---

## Princípios das skills

✅ **Independentes**: cada skill funciona sozinha, sem depender de arquivos intermediários  
✅ **Inferem do Git**: usam commits e diff como fonte de verdade  
✅ **Não duplicam trabalho**: verificam o que já foi feito antes de refazer  
✅ **Automáticas quando possível**: você só interage quando realmente necessário  
✅ **Encadeiam quando faz sentido**: smart-commit chama write-tests, open-pr chama ready-check

---

## Fluxo mínimo

```
1. "cria a branch feature/X"
2. "implementa Y"
3. "faz o commit"     → testes + validações automáticas
4. "abre o PR"        → revisão + push + PR automático
```

Tudo o mais (testes, debug, documentação, revisão) acontece automaticamente.

---

## Fluxo completo

```
💡 IDEIA
    ↓
[brainstorming] ──── explora possibilidades e refina o problema
    ↓ (opcional)
[writing-plans] ──── planeja tasks + cria branch
    ↓
    ┌─────────────────────────────────────┐
    │  DESENVOLVIMENTO                    │
    │                                     │
    │  implementa o código                │
    │       ↓                             │
    │  Skills ativam conforme necessário: │
    │  • design-system (UI em Rails)     │
    │  • ux-validation (telas)           │
    │  • vibesec (auth/dados)            │
    └─────────────────────────────────────┘
    ↓
"faz o commit"
    ↓
[smart-commit] ─────┬─→ [context-docs] checklist de docs (se AGENTS.md existir)
                    ├─→ [write-tests] cria testes se não existirem
                    ├─→ roda todos os testes
                    ├─→ [systematic-debugging] se falhar
                    ├─→ [verification-before-completion]
                    └─→ commita quando tudo verde
    ↓
(opcional) "faz o push"
    ↓
[push] ─────────────┬─→ verifica código de debug
                    ├─→ roda todos os testes
                    ├─→ [systematic-debugging] se falhar
                    └─→ push da branch
    ↓
"abre o PR"
    ↓
[open-pr] ──────────┬─→ [context-docs] checklist consolidado da branch
                    ├─→ [ready-check] revisão de código
                    ├─→ [ux-validation] se houver UI
                    ├─→ rebase com main
                    └─→ cria PR draft
    ↓
[review-pr] ──── roteiro de staging para o revisor
```

---

## Skills do fluxo

---

### 💡 brainstorming

Use quando quiser **explorar possibilidades** ou entender como fazer algo antes de começar. Essa skill faz perguntas para refinar o problema, identificar restrições e explorar alternativas. Não propõe código — foca no entendimento.

Para features que envolvem dados, autenticação ou integrações externas, ela também faz **threat modeling**: mapeia ativos, atacantes e vetores de risco. Os riscos de alta prioridade são documentados para virar tasks de segurança depois.

Apresenta o design refinado na conversa, não cria arquivos.

**Quando usar:** "como eu poderia fazer X", "quero explorar ideias de Y", "qual a melhor abordagem para Z"

---

### 📋 writing-plans

**Planejamento sob demanda.** Quebra uma implementação complexa em tasks pequenas (2-5 min cada), deriva o nome da branch e a cria.

O plano é apresentado na conversa para guiar o desenvolvimento. Não é obrigatório — outras skills (smart-commit, write-tests) inferem o contexto diretamente do Git se não houver plano.

**Quando usar:** apenas quando você pedir explicitamente: "faz o planejamento", "cria o plano", "planeja isso"

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

Testes escritos depois da implementação, mas antes do commit. Essa skill **infere o que foi implementado** via `git status` e `git diff`, identifica os cenários relevantes e escreve os testes: happy path, sad path, edge cases e regressão.

Se a mudança tocou em autenticação, dados ou uploads, gera **testes de segurança obrigatórios**: acesso sem token, cross-tenant, rate limit, inputs maliciosos, arquivos inválidos.

Roda os testes e só libera o commit quando estiverem verdes. Se falharem, aciona `systematic-debugging` automaticamente.

**Quando usar:** "escreve os testes", ou automaticamente via `smart-commit`

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

**Fluxo completo de commit:** verifica docs desatualizadas → cria/roda testes → debuga se falhar → commita quando verde.

Gera mensagens semânticas no formato `tipo: Mensagem em português` inferindo o contexto dos últimos commits e do diff atual. Agrupa arquivos por contexto lógico (banco, modelos, controllers, componentes, testes, docs, config) e executa os commits diretamente.

**Quando usar:** "faz o commit", "salva isso", "commita"

---

### 📤 push

**Push seguro:** validações técnicas antes de publicar a branch.

Verifica código de debug esquecido (`console.log`, `debugger`, `print`), roda todos os testes, aciona `systematic-debugging` se falharem, e só então faz push.

NÃO faz rebase (isso é no `open-pr`) nem revisão de código (apenas validações técnicas).

**Quando usar:** "faz o push", "sobe a branch", "publica a branch"

---

### 🔍 ready-check

Revisão de código antes de abrir o PR. Analisa funcionalidade, segurança (12 itens obrigatórios), UX e qualidade geral. Gera roteiro de teste manual para validar os fluxos implementados.

Identifica bloqueantes, sugestões e nitpicks. Se houver bloqueantes, pergunta se quer corrigir antes de prosseguir.

**Quando usar:** automaticamente via `open-pr`, ou "revisa antes do PR"

---

### 🚀 open-pr

**Fluxo completo de PR:** validações → push → revisão → PR draft.

Detecta se a branch já foi publicada. Se não, faz validações técnicas (testes + código limpo) antes do push. Executa `ready-check` para revisão de código, faz rebase com main, gera título, corpo (contexto para IA + roteiro para humano) e changelog.

Cria o PR como draft.

**Quando usar:** "abre o PR", "sobe o PR", "cria o PR"

---

### 🧭 review-pr

Receber um PR para revisar sem saber por onde começar é comum — especialmente para quem não escreveu o código. Essa skill lê o PR e traduz o que precisa ser testado em um roteiro de ações concretas: onde clicar, o que preencher, o que deve aparecer.

O roteiro é executável por qualquer pessoa, técnica ou não. Para revisores que vão analisar o código, ela também gera o contexto estruturado para colar em uma IA — com a intenção do PR, as decisões técnicas e onde focar a revisão.

**Quando usar:** ao receber um PR para revisar no GitHub.

---

## Skills fora do fluxo

Skills acionadas por contexto específico.

---

### 📝 context-docs

Metodologia completa de documentação para projetos vibecodados por pessoas não-tech. Cria e mantém documentação dual-audience: legível para humanos leigos **e** usada como contexto de guia por agentes de IA.

A estrutura gira em torno do `AGENTS.md` — um briefing que todo agente lê antes de qualquer coisa — e de arquivos em `docs/features/` e `docs/flows/` para detalhar cada parte do sistema. Para projetos pequenos, só o `AGENTS.md` já resolve.

A skill é acionada automaticamente pelo `smart-commit` (verificação leve a cada commit) e pelo `open-pr` (verificação consolidada de toda a branch antes do PR). Em ambos os casos, o agente percorre um checklist e bloqueia o avanço se houver documentação desatualizada.

**Quando usar:** "documenta isso", "cria o AGENTS.md", "explica como funciona pra IA", "registra essa feature", ou ao iniciar um projeto novo

---

### 🖼️ design-system

**Apenas para projetos Ruby/Rails.** Carrega os padrões visuais do projeto (espaçamento, tipografia, grid, componentes) e aplica diretamente ao criar telas com Tailwind CDN.

Cobre container de página admin, escala tipográfica, grids responsivos, cards, botões, tabelas, tabs, badges, breadcrumb e estados vazios.

**Quando usar:** sempre ao criar ou modificar HTML com Tailwind em projetos Rails


---

### 🚨 incident-response

Todo sistema que vai para produção vai, em algum momento, enfrentar um problema sério — um vazamento de dados, uma credencial exposta, o sistema fora do ar. A diferença entre um time que responde bem e um que entra em colapso é ter o plano pronto antes de precisar dele.

Essa skill tem dois modos. **Preparação** (antes de ir para prod): define o que conta como incidente, configura alertas de detecção, monta playbooks de resposta por cenário (vazamento, fora do ar, credencial exposta), valida backups e define quem notificar — incluindo a obrigação legal de notificar a ANPD em 72h em caso de vazamento de dados pessoais (LGPD). **Resposta ativa** (durante um incidente): conduz a triagem, prioriza contenção antes de investigação, preserva evidências e produz o post-mortem.

**Quando usar:** antes do primeiro deploy em produção, ou imediatamente quando um incidente estiver ativo.
