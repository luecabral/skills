# Skills da Lue

Skills são instruções que ensinam a IA a se comportar de um jeito específico em cada etapa do desenvolvimento. Em vez de dar o mesmo contexto repetido toda vez, você invoca a skill certa e ela já sabe o que fazer, o que checar e o que entregar.

---

## Fluxo principal de desenvolvimento

```
💡 IDEIA
    ↓
/brainstorming ──── explora possibilidades, refina o problema, faz threat modeling
    ↓
/prd-to-issues ──── PRD mínimo + tasks em vertical slice + cria branch
    ↓
    ┌──────────────────────────────────────────┐
    │  DESENVOLVIMENTO                         │
    │                                          │
    │  implementa o código                     │
    │       ↓                                  │
    │  Skills ativam conforme necessário:      │
    │  • /inkrivel_design_system (UI Rails)    │
    │  • /ux-validation (telas e componentes)  │
    │  • /vibesec (auth, dados, uploads)       │
    └──────────────────────────────────────────┘
    ↓
/smart-commit ──────┬─→ /context-docs (checklist de docs)
                    ├─→ /test-gate (cria testes se não existirem)
                    ├─→ roda todos os testes
                    ├─→ /systematic-debugging (se falhar)
                    └─→ commita quando verde
    ↓
/push ──────────────┬─→ verifica código de debug
                    ├─→ roda todos os testes
                    └─→ push da branch
    ↓
/open-pr ───────────┬─→ /context-docs (checklist consolidado da branch)
                    ├─→ /ready-check (revisão de código + roteiro de teste)
                    ├─→ rebase com main
                    └─→ cria PR draft com changelog
    ↓
/review-pr ──── roteiro de teste em staging para o revisor
```

---

## Skills do fluxo

### 💡 brainstorming

Refinamento de ideia antes de qualquer linha de código. Faz perguntas uma por vez em ordem de dependência e oferece uma resposta recomendada junto com cada pergunta — reduz a carga cognitiva e acelera o alinhamento.

Para features que envolvem dados, autenticação ou integrações externas, faz **threat modeling**: mapeia ativos, atacantes e vetores de risco antes de propor abordagens.

Apresenta o design refinado na conversa e passa para `/prd-to-issues` ao final.

**Quando usar:** "como eu poderia fazer X", "quero explorar ideias de Y", "qual a melhor abordagem para Z"

---

### 📋 prd-to-issues

Planejamento antes de codar. Parte do que o usuário descreve (não do Git), sintetiza um **PRD mínimo** (problema, solução, non-goals, perguntas em aberto) e quebra a implementação em tasks de **vertical slice** — cada task entrega um caminho completo ponta-a-ponta, não uma camada isolada.

Cada task tem critério explícito de conclusão e respeita o limite de ~600 linhas modificadas. Ao final, cria a branch.

**Quando usar:** "faz o planejamento", "cria o plano", "planeja isso"

---

### 🔒 vibesec

Quem vibecoda sem experiência em segurança introduz vulnerabilidades sem perceber. Essa skill age como bug hunter: vasculha o código implementado pelos erros mais comuns antes que virem problema em produção.

Checklist cobre: IDOR, SQL/XSS injection, autenticação e sessão, exposição de dados, secrets, uploads, rate limit, security headers, multi-tenancy, race conditions e LGPD. Cada problema vem com impacto e correção, classificado como crítico, alto ou melhoria.

**Quando usar:** sempre que o código tocar em autenticação, inputs, banco de dados, APIs externas ou dados do usuário

---

### 🎨 inkrivel_design_system

Padrões visuais do admin para a stack Rails + Tailwind CDN + Hotwire + InkDashboard Engine. Cobre container de página, escala tipográfica, grids responsivos, cards, botões, selects, breadcrumb, badges, checkboxes, tabelas e estados vazios. Os dois padrões de índice (com/sem busca) e o padrão de formulário com breadcrumb estão prontos em `COMPONENTS.md` para copiar e adaptar.

**Quando usar:** ao criar ou modificar telas na área admin

---

### 🧪 tdd

Metodologia de desenvolvimento guiada por testes: o teste vem antes do código. Segue o ciclo **Red-Green-Refactor** vertical slice por vertical slice — um comportamento por vez, do teste à implementação completa.

Diferente do `test-gate` (que escreve testes depois da implementação como gate de qualidade), o TDD usa o teste para guiar o **design da interface** antes de qualquer código existir. Testes escritos assim cobrem apenas a interface pública e sobrevivem a refatorações.

**Quando usar:** "faz com TDD", "quero usar TDD aqui", "desenvolve orientado a testes"

---

### 🧪 test-gate

Gate de qualidade antes do commit: infere o que foi implementado via Git, identifica os cenários relevantes e escreve os testes (happy path, sad path, edge cases, regressão e segurança quando necessário). Usa apenas interfaces públicas — testes escritos assim sobrevivem a refatorações.

Roda os testes e só libera o commit quando estiverem verdes. Se falharem, aciona `systematic-debugging`.

**Quando usar:** "escreve os testes", ou automaticamente via `smart-commit`

---

### 🐛 systematic-debugging

Processo de 4 fases para encontrar a causa raiz — nunca tratar sintoma. Antes de investigar, constrói um **sinal de feedback rápido e determinístico** (teste, curl, script) para que cada experimento seja preciso.

Fases: observar → hipóteses → testar (com minimização e bisection quando necessário) → corrigir com regression test obrigatório.

**Quando usar:** quando algo não funciona, quando um teste falha, quando há comportamento inesperado

---

### ✅ verification-before-completion

Checagem final antes de declarar qualquer task, bug ou implementação como concluída. Verifica: comportamento funcionando, testes passando, nada adjacente quebrado, código limpo. Para correções de bug, exige regression test que falha sem a correção e passa com ela.

**Quando usar:** após qualquer implementação ou correção, antes de commitar

---

### 💾 smart-commit

Fluxo completo de commit: verifica docs → cria/roda testes → debuga se falhar → commita quando verde. Gera mensagens semânticas em português inferindo o contexto do diff e dos commits recentes. Agrupa arquivos por contexto lógico e executa commits diretamente.

**Quando usar:** "faz o commit", "salva isso", "commita"

---

### 📤 push

Push seguro: verifica código de debug esquecido, roda todos os testes, aciona `systematic-debugging` se falharem, e só então faz push. Não faz rebase nem revisão de código.

**Quando usar:** "faz o push", "sobe a branch", "publica a branch"

---

### 🔍 ready-check

Revisão de código antes do PR: analisa funcionalidade, segurança (12 itens), UX e qualidade geral. Verifica se os testes cobrem interfaces públicas, não detalhes internos. Gera roteiro de teste manual para validar os fluxos implementados. Identifica bloqueantes, sugestões e nitpicks.

**Quando usar:** automaticamente via `open-pr`, ou "revisa antes do PR"

---

### 🚀 open-pr

Fluxo completo de PR: validações técnicas → checklist de docs → `ready-check` → rebase com main → gera título, corpo (com seção "Fora do escopo") e changelog em linguagem não-técnica → cria PR draft.

O corpo do PR serve duas audiências: a IA que vai revisar precisa de contexto de intenção e risco; o humano que vai testar no staging precisa de roteiro claro.

**Quando usar:** "abre o PR", "sobe o PR", "cria o PR"

---

### 🧭 review-pr

Lê o PR de outra pessoa e traduz o que precisa ser testado em roteiro de ações concretas: onde clicar, o que preencher, o que deve aparecer. Executável por qualquer pessoa, técnica ou não.

**Quando usar:** ao receber um PR para revisar no GitHub

---

### 📝 context-docs

Metodologia de documentação dual-audience: legível para humanos leigos e usada como contexto por agentes de IA. Estrutura: `AGENTS.md` (briefing mestre) + `docs/features/` + `docs/flows/` + `docs/changelog.md`.

Acionada automaticamente pelo `smart-commit` (checklist leve) e pelo `open-pr` (checklist consolidado da branch).

**Quando usar:** "documenta isso", "cria o AGENTS.md", "registra essa feature"

---

## Skills independentes

Skills acionadas por contexto específico, fora do fluxo principal.

---

### 🔬 diagnose

Para bugs difíceis, intermitentes ou regressões de performance que o `systematic-debugging` não conseguiu resolver. O diferencial é o investimento upfront em construir um sinal de feedback rápido e determinístico antes de qualquer investigação. Inclui minimização de caso e bisection via `git bisect`.

Ao final, o sinal vira teste de regressão permanente.

**Quando usar:** "não consigo achar a causa", "está difícil de reproduzir", "sumiu em algum commit"

---

### 🏗️ improve-codebase-architecture

Encontra módulos **rasos** no codebase (interface grande, pouca complexidade encapsulada) e propõe como aprofundá-los. Usa o "teste de deleção": se deletar o módulo e reescrever o que o usa não piora nada, o módulo é raso.

Apresenta até 5 candidatos com problema, oportunidade e benefícios. Só prossegue com os aprovados pelo usuário.

**Quando usar:** "o código está difícil de manter", "quero refatorar isso", "como melhorar a arquitetura disso"

---

### 🚨 incident-response

Planejamento e resposta a incidentes em produção. Dois modos: **preparação** (antes de ir para prod — define o que conta como incidente, configura alertas, monta playbooks, valida backups, define obrigações LGPD) e **resposta ativa** (durante o incidente — triagem, contenção, preservação de evidências, post-mortem).

**Quando usar:** antes do primeiro deploy em produção, ou imediatamente quando um incidente estiver ativo

---

### 🔐 security-audit

Auditoria de segurança automatizada no projeto atual. Analisa controles de acesso, autenticação, validação de inputs, headers, secrets, dependências e mais. Gera relatório acionável com severidade e correções específicas.

**Quando usar:** "faz uma auditoria de segurança", antes de lançamentos importantes

---

### 🗿 caveman

Modo de comunicação ultra-comprimido (~75% menos tokens). Corta artigos, preâmbulos, hedging e confirmações vazias. Mantém precisão técnica total — termos exatos, números precisos, nomes de arquivos sem abreviação.

Persiste pelo resto da conversa até você dizer "para o caveman".

**Quando usar:** "caveman", "responde curto", "sem enrolação" — no início de qualquer conversa onde quiser respostas diretas

---

### ✍️ write-a-skill

Cria novas skills com estrutura correta: trigger claro na descrição, processo com passos concretos, abaixo de 100 linhas. Apresenta o rascunho para confirmação antes de salvar.

**Quando usar:** "cria uma skill para X", "quero uma skill que faça Y"
