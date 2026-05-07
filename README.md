# INKriveis Skills

Skills são instruções que ensinam a IA a se comportar de um jeito específico em cada etapa do desenvolvimento. Em vez de dar o mesmo contexto repetido toda vez, você invoca a skill certa e ela já sabe o que fazer, o que checar e o que entregar.

---

## Fluxo principal de desenvolvimento

```
💡 IDEIA
    ↓
/brainstorming ──── explora possibilidades, refina o problema, faz threat modeling
    ↓
/prd-to-issues ──── PRD mínimo + tasks em vertical slice + cria branch + salva .plans/plan.md
    ↓
    ┌──────────────────────────────────────────┐
    │  DESENVOLVIMENTO                         │
    │                                          │
    │  /ralph-loop (autônomo, issue a issue)   │
    │    ou implementa manualmente             │
    │       ↓                                  │
    │  Skills ativam conforme necessário:           │
    │  • /tdd (analisa, refatora se preciso, testa) │
    │  • /inkrivel_design_system (UI Rails)         │
    │  • /vibesec (auth, dados, uploads)            │
    │  • /debugging (bug ou teste falhando)         │
    └──────────────────────────────────────────┘
    ↓
/smart-commit ──────┬─→ /context-docs (checklist de docs)
                    ├─→ /test-gate (cria testes se não existirem)
                    ├─→ roda todos os testes
                    ├─→ /debugging (se falhar)
                    └─→ commita quando verde
    ↓
/publish ───────────┬─→ verifica código de debug
                    ├─→ roda todos os testes
                    ├─→ revisão de código e UX (REFERENCE.md)
                    ├─→ checklist de verificação
                    ├─→ roteiro de teste manual
                    ├─→ rebase com main + push
                    └─→ cria PR draft com changelog (opcional)
    ↓
/review-pr ──── roteiro de teste em staging para o revisor
```

---

## Skills do fluxo

### 💡 brainstorming

Refinamento de ideia antes de qualquer linha de código. Faz perguntas uma por vez em ordem de dependência e oferece uma resposta recomendada junto com cada pergunta — reduz a carga cognitiva e acelera o alinhamento.

Para features que envolvem dados, autenticação ou integrações externas, faz **threat modeling**: mapeia ativos, atacantes e vetores de risco antes de propor abordagens.

**Quando usar:** "como eu poderia fazer X", "quero explorar ideias de Y", "qual a melhor abordagem para Z"

---

### 📋 prd-to-issues

Planejamento antes de codar. Sintetiza um **PRD mínimo** e quebra a implementação em tasks de **vertical slice** — cada task entrega um caminho completo ponta-a-ponta. Salva o plano em `.plans/plan.md` no projeto para uso do `ralph-loop`.

**Quando usar:** "faz o planejamento", "cria o plano", "planeja isso"

---

### 🔄 ralph-loop

Desenvolvimento autônomo de issues em sequência. Lê `.plans/plan.md`, cria uma branch por issue encadeada na anterior, aplica TDD, commita via `smart-commit`, abre PR via `publish` e atualiza o status no doc.

**Modo Fix:** propaga uma correção em cascade por todas as branches downstream via rebase. Pausa em conflitos e aguarda resolução humana.

**Quando usar:** "roda o ralph loop", "executa o loop", "ralph-fix \<issue\>: \<ajuste\>"

---

### 🔒 vibesec

Vasculha o código implementado pelos erros mais comuns antes que virem problema em produção. Checklist cobre: IDOR, SQL/XSS injection, autenticação e sessão, exposição de dados, secrets, uploads, rate limit, security headers, multi-tenancy, race conditions e LGPD. Cada problema vem com impacto e correção, classificado como crítico, alto ou melhoria.

**Quando usar:** sempre que o código tocar em autenticação, inputs, banco de dados, APIs externas ou dados do usuário

---

### 🎨 inkrivel_design_system

Padrões visuais do admin para a stack Rails + Tailwind CDN + Hotwire + InkDashboard Engine. Cobre container de página, escala tipográfica, grids responsivos, cards, botões, selects, breadcrumb, badges, checkboxes, tabelas e estados vazios.

**Quando usar:** ao criar ou modificar telas na área admin

---

### 🧪 tdd

Antes de escrever qualquer teste, analisa os módulos que a task vai tocar e aplica o **teste de deleção** para identificar código raso ou acoplado. Se encontrar, refatora primeiro — confirmando com o usuário — até a interface estar limpa. Só então entra no ciclo **Red-Green-Refactor** vertical slice por vertical slice.

Você não precisa saber que o código precisa de refatoração: o TDD descobre por você.

**Quando usar:** "faz com TDD", "quero usar TDD aqui", "desenvolve orientado a testes"

---

### 🧪 test-gate

Gate de qualidade antes do commit: infere o que foi implementado via Git, identifica os cenários relevantes e escreve os testes (happy path, sad path, edge cases, regressão). Roda os testes e só libera o commit quando verdes.

**Quando usar:** "escreve os testes", ou automaticamente via `smart-commit`

---

### 🐛 debugging

Processo para encontrar a causa raiz — nunca tratar sintoma. Constrói um sinal de feedback rápido e determinístico antes de investigar. Fases: observar → hipóteses → testar (com minimização e `git bisect`) → corrigir com regression test obrigatório.

**Quando usar:** quando algo não funciona, quando um teste falha, comportamento inesperado

---

### 💾 smart-commit

Fluxo completo de commit: verifica docs → cria/roda testes → aciona `debugging` se falhar → commita quando verde. Gera mensagens semânticas inferindo o contexto do diff. Agrupa arquivos por contexto lógico e executa commits diretamente.

**Quando usar:** "faz o commit", "salva isso", "commita"

---

### 🚀 publish

Fluxo unificado de publicação: verifica debug → roda testes → revisão de código e UX → checklist de verificação → roteiro de teste manual → rebase + push → PR draft com changelog (opcional). Remove `.plans/plan.md` antes do push quando parte de um `ralph-loop`.

**Quando usar:** "faz o push", "sobe a branch", "abre o PR", "cria o PR"

---

### 🧭 review-pr

Lê o PR de outra pessoa e traduz o que precisa ser testado em roteiro de ações concretas: onde clicar, o que preencher, o que deve aparecer. Executável por qualquer pessoa, técnica ou não.

**Quando usar:** ao receber um PR para revisar no GitHub

---

### 📝 context-docs

Documentação dual-audience: legível para humanos e usada como contexto por agentes de IA. Estrutura: `AGENTS.md` + `docs/features/` + `docs/flows/` + `docs/changelog.md`.

**Quando usar:** "documenta isso", "cria o AGENTS.md", "registra essa feature"

---

## Skills independentes

---

### 🚨 incident-response

Planejamento e resposta a incidentes em produção. **Preparação** (antes de ir para prod — alertas, playbooks, backups, LGPD) e **resposta ativa** (durante o incidente — triagem, contenção, preservação de evidências, post-mortem).

**Quando usar:** antes do primeiro deploy em produção, ou quando um incidente estiver ativo

---

### 🔐 security-audit

Auditoria de segurança automatizada no projeto atual. Analisa controles de acesso, autenticação, validação de inputs, headers, secrets, dependências e mais. Gera relatório acionável com severidade e correções específicas.

**Quando usar:** "faz uma auditoria de segurança", antes de lançamentos importantes

---

### 🗿 caveman

Modo de comunicação ultra-comprimido (~75% menos tokens). Corta artigos, preâmbulos, hedging e confirmações vazias. Mantém precisão técnica total. Persiste pelo resto da conversa até "para o caveman".

**Quando usar:** "caveman", "responde curto", "sem enrolação"

---

### ✍️ write-a-skill

Cria novas skills com estrutura correta: trigger claro na descrição, processo com passos concretos, abaixo de 100 linhas. Apresenta o rascunho para confirmação antes de salvar.

**Quando usar:** "cria uma skill para X", "quero uma skill que faça Y"
