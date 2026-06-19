---
name: maestro
description: Use para o ciclo completo de uma feature — do brainstorming ao deploy.
Ativa quando o usuário diz "maestro", "roda o maestro", "faz o maestro". Pode entrar
diretamente em qualquer fase: "maestro fase 2", "maestro planeja", "maestro executa", "maestro corrige", "maestro publica".
---

# Maestro

Ciclo completo de uma feature, do brainstorming ao deploy, em 5 fases. **Este arquivo é autossuficiente:** todo o processo — fases, debugging, testes, docs e estilo de comunicação — está escrito aqui dentro, não invocado de outra skill. Editar qualquer skill avulsa **não muda** o comportamento do maestro. Só o `verify` (built-in do Claude Code) é externo.

**Modelos (obrigatório):** o Maestro (líder que orquestra todas as fases e gerencia os subagentes) roda em **Opus 4.8 High**. Os subagentes de desenvolvimento (Fase 3), de correção (Fases 4 e 5) e de revisão (Fase 5) usam os modelos indicados em cada fase.

**Comunicação (economia de token — apelido "caveman").** Objetivo: **mínimo de token por resposta, sem perder precisão.** Não dependa de "saber o que caveman significa" — as regras estão escritas aqui:
- **Regra de ouro:** na tela vão só **decisões (pra você escolher)** e **entregáveis** (plano, roteiro, relatório, PR, URL). Processo, investigação e progresso de subagente ficam de fora (máx. 1 linha de status). Dúvida: é decisão/entregável? mostra. É *como cheguei lá*? calo.
- **Estilo comprimido:** corta artigos, preâmbulos, confirmações vazias ("ótima pergunta!") e hedging ("provavelmente/talvez"); usa fragmentos quando o sujeito é óbvio e setas pra causalidade ("query lenta → sem índice"); mantém exatos termos técnicos, números e nomes de arquivo. Sem resumir o que acabou de fazer; **não narre cada passo mecânico** (status mecânico = 1 linha ou nada — o painel de tarefas e os tool calls falam por você).
- **Investigação é silenciosa:** resolver conflito de merge, achar EOL/CRLF, rodar git, debugar passo a passo — no raciocínio interno; reporta só o **resultado em 1 linha** (ex: "Conflito em `_form.html.erb` resolvido: minha versão + 2 mudanças de origin/main; testes verdes").
- **Uma investigação = UMA saída:** por mais voltas, becos sem saída e auto-correções ("errei a direção", "comando bugou"), **não** narre uma linha por tool call — os chips já mostram que está trabalhando. Vai pra tela só a conclusão ou o ponto de decisão.
- **Exceções (aí fale completo):** Fase 1 (explorar/desenhar) e quando há uma **decisão/trade-off pra você escolher** (alternativas, achados de review pra aprovar, bug com mais de um caminho). **Investigar ≠ decidir.**

**Contextualização de termos técnicos (só nos momentos de fala completa — Fase 1, fixes e gates dirigidos a você):** inclua uma explicação simples entre parênteses. Ex: "migration (script que cria/altera a estrutura do banco)", "branch (ramificação isolada do código)". Que qualquer pessoa entenda sem pesquisar. Fora desses momentos, caveman.

**Orquestração (nativa, via Agent tool):** todo o paralelismo e a verificação do maestro são feitos com subagentes `Agent` — **não** dependem do Workflow tool nem de digitar "ultracode". Subagentes que reportam dado devolvem **estruturado (schema)**, não prosa, pra você operar sobre o resultado sem reparsear. **Orquestrar é silencioso (todas as fases):** ao disparar subagentes (painel da Fase 1, dev da Fase 3, fixes da Fase 4, review da Fase 5), **não narre cada spawn/retorno** ("disparando X… rodando testes… mergeando…") — deixe o painel de tarefas mostrar o progresso e apresente só o **resultado consolidado** do grupo/lote em poucas linhas.

**Profundidade por risco (escala o esforço, nunca a segurança):** classifique a feature por sinais que você já tem — **TRIVIAL** (≤2 tasks, sem 🔴, sem migration) / **ALTO** (tem 🔴, migration destrutiva, ou toca auth/pagamento/dados sensíveis) / **MÉDIO** (o resto). O nível só dimensiona **quantos** subagentes você dispara (painel da Fase 1, pool de review da Fase 5) — **nunca rebaixa Segurança, nem pula gate ou backup**. É derivado: não pergunte, informe em 1 linha e grave `nivel:` no topo do `.plans/plan.md`.

---

## Fase 1 — Explore

Refinamento da ideia antes de qualquer linha de código.

**Quando NÃO usar (encerre e oriente):** usuário já tem plano claro → pule pra Fase 2; está debugando algo existente → `debugging`; mudança pontual e trivial (ex: "muda a cor do botão") → faça direto.

**Contexto do projeto (bootstrap, 1ª vez):** se o projeto não tem `AGENTS.md`/`CLAUDE.md`/`README` descrevendo build, testes, arquitetura e convenções, **ofereça criar um antes de desenhar** — detecte comandos de build/test, a stack e os padrões do código. Esse contexto alimenta as Fases 2-5 e evita design que ignora o que já existe.

### Passo 1 — Entender o problema real
Antes de perguntar, mapeie suposições ocultas e pontos cegos. Pergunte **uma por vez**, em ordem de dependência, e **ofereça uma resposta recomendada** junto:
> "Isso vai persistir no banco ou só viver em sessão? Sugiro banco, porque você vai querer histórico por usuário."

Foco: o quê, para quem, critério de sucesso, restrições, casos de borda, integrações afetadas.

### Passo 1.5 — Threat modeling (se tocar em auth, dados ou integrações externas)
Explique que é uma análise pra identificar o que pode dar errado antes de construir. Documente:
- **Ativos** — quais dados são sensíveis? há dinheiro envolvido?
- **Atacantes** — usuário malicioso autenticado, externo, bot, insider
- **Vetores** (marque os relevantes e explique cada um em linguagem simples): IDOR (acesso a dados de outro usuário), SQL injection (manipulação do banco via formulário), XSS (script malicioso no navegador de outro), CSRF (ação sem o usuário saber), race condition (dois processos simultâneos), upload malicioso, brute force, prompt injection (se houver IA), **SSRF** (servidor forçado a chamar URL interna), **desserialização insegura**, **crypto fraca** (hash/cifra obsoleta, segredo hardcoded), **escopo de autorização ausente** (endpoint que não checa permissão/tenant). Checklist completo em REFERENCE.md.

Classifique por probabilidade × impacto (🔴 Alta / 🟡 Média / 🟢 Baixa). Riscos 🔴 viram tasks explícitas na Fase 2.

### Passo 1.7 — Benchmark / referência (se a feature tiver paralelo no mercado)
Se for algo que produtos conhecidos já resolvem (login social, carrinho, chat, agendamento, paywall), **pergunte se há referência**:
> "Tem algum produto/tela de referência pra usar como base? (ex: 'o agendamento do Calendly'). Me manda o nome ou um print que eu adapto o design."

Com referência → use como âncora nos fluxos do Passo 3. Sem referência, mas a feature pede embasamento (decisão técnica nova, padrão de mercado, comparar abordagens) → faça uma **pesquisa rápida**: várias fontes em paralelo, **verifique cada afirmação contra a fonte** (descarte o não confirmado) e **cite** de onde veio cada conclusão. Sem necessidade de pesquisa → siga boas práticas e diga em que se baseia. Pule pra features sem paralelo óbvio.

### Passo 2 — Explorar alternativas (painel de lentes)
Não invente as abordagens sozinho (single-agent ancora na 1ª ideia). **TRIVIAL → pule, faça você mesmo** (comportamento antigo). Senão dispare **em paralelo** N subagentes read-only `Agent(model: "sonnet")` (default 3), cada um com uma **lente** distinta e o mesmo briefing (problema, critério de sucesso, restrições, 🔴 do Passo 1.5 se houve, benchmark): (1) menor superfície / mais simples; (2) mais robusto e seguro; (3) mais rápido de entregar. Cada um devolve via schema: abordagem, vantagem, risco principal, custo. Você (o juiz): se rodou o Passo 1.5, descarte quem deixa algum 🔴 sem cobertura; recomende a vencedora e **liste o que vale puxar das outras**; lentes que convergem → funda e diga. Apresente os finalistas + a recomendação e aguarde o usuário escolher.

### Passo 3 — Apresentar o design (detalhado)
Com a abordagem escolhida, descreva o design **completo de uma vez** (não seção por seção, sem parar entre cada item). **Descreva como a feature vai se comportar de verdade:**
- **O que será criado/modificado** — telas, endpoints, modelos de dados.
- **Fluxos passo a passo** — caminho do usuário do início ao fim, o que vê e clica em cada etapa. Fluxo principal (feliz) + alternativos (erro, vazio, cancelamento).
- **Comportamentos esperados** — loading, mensagens de sucesso/erro, o que acontece em cada ação.
- **Regras de negócio** — condições e restrições explícitas (ex: "só admin aprova", "limite de 3 tentativas"). Liste todas (a confirmação vem uma vez só, no resumo do Passo 4).
- **Como as partes se conectam** e **o que fica fora do escopo.**

Com benchmark do Passo 1.7, referencie-o em cada fluxo.

### Passo 4 — Resumo final
Apresente o resumo do design (problema, solução, benchmark, escopo, fluxos, comportamentos, regras de negócio, fora do escopo, critério de sucesso, riscos). Template em REFERENCE.md.

**Gate:** "Design definido. Quer que eu crie o plano com grafo de dependências (Fase 2)?"
Se não → encerra sem implementar nada.

---

## Fase 2 — Plan

Plano de implementação + criação de branch antes de escrever código. Se vier da Fase 1, o design já está definido — use como contexto.

### Passo 1 — Quebrar em tasks
Cada task deve:
- Ser completável em 2–5 min; resultar em estado testável; max ~600 linhas (quebre se maior — calibre com `wc -l`).
- Verbo no infinitivo ("Criar X", "Conectar Y") + localização exata dos arquivos.
- Ter `em_resumo:` — **explicação em uma linha para não-techs**, sem jargão, do que entrega (ex: "permite recuperar a senha pelo e-mail").

**Princípio vertical slice:** cada task entrega um caminho funcional de ponta a ponta — não separe backend (model) da tela (frontend) se um depende do outro. **Inclua atualização de docs no escopo da task** quando a mudança afetar README/docs.

**Riscos 🔴 viram tasks:** cada vetor de alta prioridade do threat modeling (Fase 1 Passo 1.5) entra como task explícita de mitigação (ex: "Validar propriedade do recurso no endpoint X — previne IDOR"). Nenhum 🔴 fica sem task.

**Marque migrations destrutivas:** se uma task muda schema de forma que pode apagar dados existentes (drop/rename, mudança de tipo, `NOT NULL` em coluna com dados, `--accept-data-loss` — detalhe no Passo 14), sinalize na task: vai exigir backup de **produção** no deploy. Aditiva (nova tabela/coluna nullable, índice) não precisa.

Critério por task:
```
- [ ] 1. Criar model X — `app/models/x.rb`
       em_resumo: guarda as informações de X de forma permanente
       depends_on: []
       ✓ Pronto quando: migration roda sem erro e o dado pode ser consultado
```

### Passo 2 — Dependências e grupos paralelos
Para cada task declare `depends_on: [ids]`. Calcule grupos paralelos via topological sort (ver REFERENCE.md). Apresente: "X tasks em Y grupos, Z em paralelo no pico".

**Valide o grafo antes de seguir** (raciocínio sobre o que você já tem; sem pergunta, saída de 1 linha "grafo ok"): sem ciclo em `depends_on`; nenhum `depends_on` apontando pra id inexistente; **duas tasks do mesmo grupo não tocam o mesmo arquivo** (colisão = conflito de merge garantido → serialize uma via `depends_on`). Não reabra ~600 linhas nem 🔴→task (já são regra acima). Dimensione a largura dos grupos ao cap de paralelismo (~16 subagentes); se capar, diga quantos rodam vs. o pico.

### Passo 3 — Aprovar (gate único: plano → branch → execução)
Apresente o plano ao usuário pelos **`em_resumo`** (uma linha por task, sem jargão) + o **nome de branch proposto** (`tipo/descricao-em-kebab-case`; tipos: `feat` nova funcionalidade, `fix` correção, `refactor` melhoria interna, `chore` manutenção — explique cada um). O detalhe técnico (arquivos, `depends_on`, `✓ Pronto quando`) **não vai pra conversa** — fica pro `plan.md` (Passo 4). **Uma única aprovação cobre plano + nome + início da execução** — deixe explícito no gate:
> "Se aprovar, eu crio a branch, salvo o plano e **já começo a executar** (Fase 3) com subagentes em paralelo. (Se preferir só salvar na branch sem executar agora, me avise.)"

Após o ok:
```bash
git fetch origin && git checkout main && git pull origin main && git checkout -b <nome>
```

### Passo 4 — Salvar plano e seguir
Salve em `.plans/plan.md` na raiz (formato em REFERENCE.md), com o `nivel:` no cabeçalho (ver Profundidade por risco). Sobrescreva se existir. Garanta `.plans/` no `.gitignore`.

Plano salvo → **siga direto pra Fase 3** (a execução já foi aprovada no Passo 3; **sem novo gate**). Só pare na branch se o usuário pediu o opt-out de não executar agora.

---

## Fase 3 — Execute

O líder (este agente, em **Opus 4.8 High**) orquestra; quem escreve código são os subagentes em **Sonnet 4.6 Médio**.

1. Lê `.plans/plan.md`, reconstrói o grafo de dependências. **Retomada:** se a sessão anterior parou no meio, as tasks já feitas estão marcadas (`[x]`) — pegue só as não-marcadas, descarte worktrees órfãs de tasks concluídas e recomece pelo primeiro grupo com task pendente.
2. **Feature pequena (≤2 tasks sem interdependência de schema):** worktree + paralelismo custa mais do que rende. *Pergunte* se prefere executar inline (sem worktree), mantendo TDD + commit + validação. Default continua worktree — só pula se o usuário topar.
3. Para cada grupo paralelo em ordem topológica:
   - Lança um `Agent(isolation: "worktree", model: "sonnet")` por task no grupo — **sempre `model: "sonnet"`**, esforço Médio (instrua no prompt). O líder nunca delega dev pra Opus.
   - Cada subagente segue o **ciclo TDD + commit** abaixo e **retorna estruturado** (schema): `{task_id, status: done|paused|failed, commits_range: "base..HEAD", arquivos_tocados, motivo}`. Acaba o palpite de "o que mergear".
   - Aguarda todos do grupo concluírem. **Antes de mergear, cheque colisão:** cruze os `arquivos_tocados` (confirme com `git diff --name-only` do `commits_range` — subagente pode esquecer de listar arquivo gerado/lockfile) entre as tasks; se duas tocaram o mesmo arquivo, mergeie uma e re-rode/ajuste a outra. Faz merge de cada worktree pelo `commits_range` devolvido (ver REFERENCE.md). Conflito: pausa, descreve, aguarda resolução humana.
4. Atualiza os checkboxes no `.plans/plan.md` conforme as tasks completam.

### O que cada subagente faz (TDD + smart-commit, inline)

**Passo 0 — Análise prévia.** Leia os arquivos que a task vai tocar. Aplique o **teste de deleção**: "Se eu deletasse esse módulo e reescrevesse quem o usa, o resultado seria pior ou equivalente?" Pior → módulo profundo, pode testar direto. Equivalente → módulo raso, refatore antes (cada passo deixando o código funcionando).

**Ciclo Red-Green-Refactor:**
- 🔴 **RED** — escreva um teste que descreve o comportamento desejado. Rode e confirme que **falha** (valida que o teste é útil).
- 🟢 **GREEN** — escreva o **mínimo** pra passar. Sem elegância, sem antecipação.
- 🔵 **REFACTOR** — com o teste verde, remova duplicação, melhore nomes. Rode e confirme que continua verde.
Repita por comportamento. Nunca escreva produção sem um teste falhando antes; se o teste é difícil de escrever, a interface está errada — redesenhe.

**Commit (smart-commit, inline):**
- Garanta os testes verdes (`npm test` / `npx vitest run` / `pytest` / `bundle exec rspec`). Se não houver testes pros arquivos → `test-gate`. Se falhar → `debugging`. Não commite até verde.
- **Auto-check de segurança:** se a task tocou auth / dados / input de usuário / query / upload, releia o que mexeu contra os vetores do Passo 1.5 (IDOR, injection, SSRF, escopo de autorização, etc.) **antes de commitar** — pega o problema na fonte, não só na Fase 5.
- Verifique docs (dual-audience: humano leigo + agente de IA): se o projeto tem `AGENTS.md` ou `docs/`, atualize o que ficou desatualizado — AGENTS.md, estrutura de pastas, regras de negócio, `docs/features/`, `docs/changelog.md`. Tom simples pro humano, caminhos/nomes reais pro técnico. Docs vão no mesmo commit, nunca "depois".
- Agrupe arquivos por contexto lógico (banco / modelos / controllers / componentes / testes / docs / config) e gere um commit por grupo. Mensagem: `tipo: Mensagem` (verbo no presente, maiúscula inicial, sem ponto final; tipos `feat·fix·refactor·perf·docs·style·config`).
- Commite via heredoc. Se hook falhar, corrija e crie **novo** commit. Nunca `--amend` nem `--no-verify`. Sinalize `console.log`/`debugger`/`print` esquecidos antes de commitar.

### Validação (fim da Fase 3, antes da homologação do usuário)
Antes do relatório final, o líder valida o conjunto:
- Roda a suíte de testes completa do projeto.
- Invoca `verify` (Verify do Claude) pra **homologar todos os fluxos impactados** — não só os testes, mas o comportamento real de cada fluxo que a feature tocou (feliz + alternativos do design da Fase 1). O `verify` sobe o app e observa de verdade.
- **Fallback (só quando o app genuinamente não sobe — lib pura, CLI, cron sem UI):** pule o `verify` e cubra com a suíte completa + o roteiro manual abaixo, anotando que a homologação foi por testes, não por observação. Se dá pra subir, o `verify` é obrigatório.
- Se algum fluxo falhar → `debugging`, corrige e revalida antes de seguir.

### Roteiro de teste manual (entregue ao anunciar o fim do desenvolvimento)
Com a validação verde, gere um **roteiro de teste manual** pro usuário homologar com as próprias mãos antes de publicar. Liste cada fluxo afetado (feliz + alternativos do design da Fase 1) como passos executáveis por quem **não** escreveu o código — o que abrir, o que clicar, o resultado exato esperado em cada etapa. Inclua os estados de borda (erro, vazio, cancelamento) e a checagem de regressão dos fluxos adjacentes. Apresente esse roteiro junto do anúncio de que o desenvolvimento acabou.

**Proteções:** máx. 2 ciclos TDD por task antes de pausar; máx. 3 falhas consecutivas para e reporta.

**Gate:** "Desenvolvimento concluído e homologado pelo `verify`, mergeado na branch. Acima está o roteiro pra você homologar manualmente. **Achou o que ajustar? Me manda o bloco de fixes que eu aplico (Fase 4).** Sem fixes → publicar (Fase 5)."
Se não → encerra na branch, pronta pra Fase 4 (fixes) ou Fase 5 (publish) quando você quiser.

---

## Fase 4 — Fixes

Aplicação orquestrada de um **bloco de fixes** após a implementação da Fase 3. Entra após a homologação (você testou pelo roteiro da Fase 3 e achou ajustes), ou direto via `maestro fase 4` / `maestro corrige`. **Não** é review automático (isso é a Fase 5) — aqui **você manda o que corrigir e eu orquestro os subagentes**.

**Quando NÃO usar — fix único e pequeno:** não precisa de "maestro corrige" nem da fase inteira. Só diga o que ajustar; eu corrijo **direto (inline)**, garanto teste verde e sigo. A Fase 4 é pra **bloco** — vários fixes juntos, ou algo que valha paralelizar em subagentes.

### Passo 1 — Receber o bloco de fixes
Receba (ou peça) o bloco: lista livre do que ajustar — bugs da homologação, ajustes pontuais, pedidos de mudança. Para cada item, identifique o(s) **arquivo(s) alvo** (pergunte só se não der pra inferir do código). Sem bloco → pergunte qual é.

### Passo 1.5 — Triar o bloco (antes de orquestrar)
- **Entenda e deduplique:** consolide itens que são a mesma coisa; **esclareça só os genuinamente ambíguos** (não pergunte no que dá pra inferir do código).
- **Guard de band-aid:** se um fix é só remendo de um problema de design, **não corrija calado** — sinalize "isso briga com o design; o fix de raiz é X" e deixe você decidir.
- **Guard de escopo:** se um "fix" é grande ou é **feature** de verdade, **não force na Fase 4** — proponha voltar pro Plan (Fase 1/2) em vez de cramar como conserto.

### Passo 2 — Commitar pendências
`git status --short`: se houver mudança não commitada, rode o fluxo de commit da Fase 3 (testes → debug → commit agrupado). Working tree limpo antes de orquestrar.

### Passo 3 — Agrupar (causa-raiz, depois colisão)
Primeiro junte itens que compartilham **causa provável** — um fix pra causa, não um subagente por sintoma (vários sintomas reportados costumam ter a mesma raiz). Depois mapeie por arquivo: **arquivos diferentes → paralelo; mesmo arquivo → sequencial** (um subagente por vez, senão conflito garantido). Apresente o plano de fixes em 1-2 linhas.

### Passo 4 — Orquestrar os subagentes
Um `Agent(model: "sonnet")` Médio por fix (ou por grupo de mesmo-arquivo), **nunca inline**; o líder nunca delega fix pra Opus. **Cada subagente classifica o fix e escolhe o caminho:**
- **Comportamento novo** (a feature ganhou algo que não existia) → **ciclo TDD completo** (RED→GREEN→REFACTOR, igual Fase 3). É desenvolvimento, não conserto.
- **Bug** (comportamento existe mas está errado) → escreva primeiro um teste que **reproduz o bug** (falha), corrija até passar — vira teste de regressão.
- **Ajuste trivial sem mudar comportamento** (texto, estilo, rename) → só aplica e mantém os testes verdes; sem teste novo.

Sem teste pros arquivos quando o caminho exige um → `test-gate`; falhou → `debugging`. **Retorna estruturado** `{fix, tipo, status, commits_range, arquivos_tocados}`. Paralelo entre arquivos diferentes; sequencial no mesmo arquivo.

### Passo 5 — Revalidar, confirmar e commitar
Sessão principal **re-roda testes + regressão** (quebrou → `debugging`). **Confirme que o sintoma reportado sumiu** — não basta teste verde: o que você reportou agora se comporta como esperado (pra UI, via `verify`/roteiro do item). Commita as correções (smart-commit: agrupa por contexto, `tipo: Mensagem`, nunca `--amend`/`--no-verify`). Re-homologa só os fluxos que mudaram.
**Relatório honesto:** liste o que entrou e o que **não** deu (status `paused`/`failed`) com o motivo — nunca dropar um fix em silêncio.

**Gate:** "Fixes aplicados e revalidados. Manda mais um bloco, ou publico agora (Fase 5)?"
Mais um bloco → volta ao Passo 1. Senão → Fase 5.

---

## Fase 5 — Publish

Entra após a Fase 4, ou direto via `maestro fase 5` / `maestro publica` (mesmo em sessão nova depois de fixes manuais). Review final escalonado por risco + pipeline de publicação.

**Token:** o custo aqui é o review do Bloco 1 — então ele **escala pelo `nivel:`** (TRIVIAL quase não gasta; review cheio só no ALTO), os checks mecânicos (grátis) rodam primeiro, e **uma única leitura do diff** (`git diff origin/main...HEAD`) serve review + detecção de infra + corpo do PR. Rode os subagentes e os checks **em silêncio** e mostre só o **relatório consolidado** (Passo 3) — não narre cada subagente nem cada check. O Bloco 2 é shell puro, sem subagentes: **resultado por passo, não processo** (uma linha).

- **Bloco 1 — Review e correções:** tudo depende só do diff já commitado → roda em paralelo, sem ordem fixa.
- **Bloco 2 — Pipeline de publicação:** push → staging → PR → CI → merge → deploy. **Estritamente sequencial.**

### Bloco 1 — Review e correções

#### Passo 1 — Preparar
`git status --short`: se houver pendências, rode o fluxo de commit da Fase 3 (testes → debug → commit agrupado). Depois confirme que há commits novos:
```bash
git branch --show-current
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null || git log HEAD --oneline -5
```
Se for `main` ou não houver commits novos, informe e encerre.

#### Passo 2 — Análise em paralelo
Dispare **tudo no mesmo bloco**: subagentes read-only (só reportam) + checks mecânicos na sessão principal. Aguarde todos e consolide no Passo 3.

**Subagentes de revisão (read-only, modelo fixo):**
1. **Segurança/Correção** — `Agent(model: "opus")`, Opus 4.8 High. Aplica os blocos **Funcionalidade**, **Segurança** e **Qualidade** do checklist (REFERENCE.md) sobre `git diff origin/main...HEAD`. Devolve 🚨/⚠️. Protege contra bug indo pra prod — por isso o modelo forte.
2. **UX** — `Agent(model: "sonnet")`, Sonnet 4.6 Médio. Aplica o bloco **UX** do checklist. Devolve 🚨/⚠️.
3. **Documentação** — `Agent(model: "sonnet")`, Sonnet 4.6 Médio. Verifica se README, docs e comentários públicos refletem o diff. Lista o desatualizado/faltando — só reporta (update vem no Passo 4).

**Lente de limpeza (estilo simplify), dentro do revisor de Qualidade:** além de bug, sinalize **duplicação extraível** (reuso/DRY), **custo desnecessário** (eficiência) e **nível de abstração errado** (altitude — raso ou fundo demais). Entram como ⚠️ (qualidade), não bloqueiam.

**Profundidade pelo nível** (lê `nivel:` do plan.md; entrada direta sem plano = MÉDIO; **Segurança roda sempre em Opus, em qualquer nível**):
- **TRIVIAL** → só checks mecânicos + Segurança; pula UX/Docs se o diff não toca view/template/`.css`/`.md`.
- **MÉDIO** → os 3 revisores acima (atual).
- **ALTO** → os 3 + lentes de perf e regressão + **1 cético** `Agent(model: "opus")` que tenta refutar cada 🚨 não-mecânico contra o diff. **Nunca rebaixa** achado de classe alta-confiança (SQLi, IDOR, secret commitada, falha de auth) — esses sempre bloqueiam. Rebaixado vira ⚠️ com 1 linha de evidência (a guarda que já existe no diff).

**Checks mecânicos (sessão principal, mesmo bloco):**
- **Código de debug:** busca no diff `console.log`, `debugger`, `print(`, `puts `, `p `, `pp `, `var_dump`, `dd(`.
- **Testes:** `npm test` / `npx vitest run` / `pytest` / `bundle exec rspec`.
- **Regressão:** mapeia specs dos arquivos alterados (diretos + adjacentes) e roda só eles:
  ```bash
  git diff origin/main...HEAD --name-only
  # Ruby/RSpec:  app/x.rb -> spec/x_spec.rb
  git diff origin/main...HEAD --name-only | sed 's|app/||; s|\.rb$|_spec.rb|' | xargs -I{} find spec -name "$(basename {})" 2>/dev/null
  bundle exec rspec <specs>
  # JS/Vitest:   src/x.ts -> x.test.ts / x.spec.ts  →  npx vitest run <arquivos>
  # Python:      x.py     -> test_x.py / tests/test_x.py  →  pytest <arquivos>
  ```
  Adapte o mapeamento ao framework do projeto. Sem specs → informe.
- **Auditoria** (só npm): `npm audit 2>/dev/null || true`. Qualquer severidade conta.

#### Passo 3 — Consolidação e gates
Antes de consolidar, **1 completeness critic** (`Agent`, read-only): "o review cobre todos os fluxos do design da Fase 1, as env vars novas (Passo 9) e cada 🔴 do threat modeling? o que falta?" — buracos viram itens do relatório.

Filtros antes do relatório:
- **Verificação de falso-positivo (todo 🚨, não só no ALTO):** confirme cada achado contra o código real — a guarda/validação/teste que já existe pode invalidá-lo. Não confirmou → não é 🚨.
- **Pré-existente × introduzido:** achado que **já existia** no código tocado (não foi o diff que criou) vira ⚠️ "pré-existente" — registra, **não bloqueia**; bloqueante é só o que o diff introduziu.
- **`REVIEW.md` do repo:** se existir, honre a calibração de severidade dele.
Relatório **único** — review + critic + checks:
- 🚨 BLOQUEANTE — falhas de teste/regressão, vulnerabilidades pendentes, achados críticos. Resolver antes de prosseguir.
- ⚠️ SUGESTÃO — melhorias de review/UX, docs desatualizadas. Pergunte o que aplicar agora.

Bloqueios: teste/regressão vermelho → `debugging`, não prossegue até verde. Vulnerabilidade de qualquer severidade → bloqueia (lista pacotes+CVE, roda `npm audit fix` não-breaking; remanescentes → sugere `--force` breaking, upgrade manual ou override). Debug code → pergunta remover ou seguir.

#### Passo 4 — Aplicar correções escolhidas
As que o usuário escolher (🚨 + ⚠️ aceitas, **incl. docs**) → subagentes `Agent(model: "sonnet")`, Sonnet 4.6 Médio, **nunca inline**. Arquivos diferentes → paralelo; mesmo arquivo → um subagente sequencial; uma só → ainda via subagente. Depois, a sessão principal **re-roda testes + regressão** (quebrou → `debugging`). Correções entram no commit antes do push.

#### Passo 5 — Registrar sugestões não atendidas
Para cada ⚠️ que o usuário **não** aplicou: procure `fixes-futuros.md`/`FIXES-FUTUROS.md`/`TODO.md` (`find . -maxdepth 3 ...`). Se achar → append `## <data>` + descrição. Se não → crie `docs/fixes-futuros.md` (ou na raiz). Informe o arquivo. Se aplicou todas ou não havia, pule.

### Bloco 2 — Pipeline de publicação (sequencial)

#### Passo 6 — Homologação e limpar plano
- **Veio da Fase 3/4 nesta sessão:** já homologado e você já autorizou publicar no gate anterior — **não re-pergunte**, siga direto.
- **Entrada direta** (`maestro publica`, sem Fase 3/4 nesta sessão): gere o roteiro (fluxos afetados + passos executáveis por quem não escreveu o código), confirme homologação (fluxo principal ok? bug não ocorre mais? regressão passa? dados íntegros?) e aguarde o ok pra publicar.
- **Limpeza:** se `.plans/plan.md` existir, `rm -f .plans/plan.md` (está no `.gitignore`, é só faxina antes do push).

#### Passo 7 — Push (dispara staging)
```bash
git fetch origin && git -c merge.renormalize=true rebase origin/main
git push -u origin HEAD
```
**Não faça cirurgia de EOL/CRLF manual.** Churn de fim-de-linha contra um merge-base antigo (a `main` foi normalizada depois que você ramificou) some sozinho no rebase com `merge.renormalize=true` — vá direto pro rebase, sem normalizar/converter arquivos à mão.
Conflito no rebase → **resolva os mecânicos você mesmo** (EOL/CRLF, whitespace, cosméticos, lado óbvio) **em silêncio** e reporte em 1 linha; **só pause e peça** se for conflito de conteúdo real (os dois lados mudaram a mesma lógica). Histórico divergente → `--force-with-lease` (nunca `--force` sozinho). O push dispara o deploy de staging automaticamente — informe e siga sem aguardar.

#### Passo 8 — Abrir ou editar PR?
`gh pr view --json number,title,state 2>/dev/null`. PR existente → "Atualizar?" (não → encerra; sim → Passo 9 modo edição). Sem PR → "Abrir agora?" (não → encerra; sim → Passo 9 modo criação). Se chamada com foco em PR e push feito, pule pro 9.

#### Passo 9 — Detectar mudanças de infraestrutura
No diff, verifique: novas env vars (`process.env.`, `ENV[`, `Rails.application.credentials`), novos serviços externos, migrações, mudanças em Dockerfile/CI/config. Anote as env vars novas — elas alimentam **o corpo do PR (Passo 10)** e a **checagem de prod (Passo 14)**. Se houver, **crie seção própria** no corpo do PR (nunca enterre em "outros ajustes"), listando vars com descrição e exemplo.

#### Passo 10 — Gerar título e corpo
Formato: `tipo: Mensagem no presente, sem ponto`. Tipos: `feat·fix·refactor·perf·docs·config`.
```markdown
### O que esse PR faz
[2-3 frases — o quê e para quê]

### [Serviço/infra] — se detectado no Passo 9
**Variáveis de ambiente necessárias em produção:**
VAR_NAME=valor_exemplo   # descrição

### Fora do escopo
[o que NÃO faz]

### Decisões técnicas relevantes
[por que assim; abordagens descartadas]

### O que tem mais risco
[onde um erro seria mais grave]

### O que testar
- [ ] [Fluxo]: passos e resultado esperado
- [ ] Regressão: fluxos adjacentes
```

#### Passo 11 — Criar/editar PR
Crie o PR já como **draft** (editável) e exiba título + corpo — não bloqueie esperando aprovação do texto; ajuste depois se quiser.
- Criação: `gh pr create --draft --title "<t>" --body "<corpo>"`
- Edição: `gh pr edit --title "<t>" --body "<corpo>"`
Exiba a URL.

#### Passo 12 — Aguardar CI
`gh pr checks --watch --fail-fast`. Os testes locais (Passo 2) cobrem só a máquina; o CI roda a suíte completa.
- Todos verdes → exiba `gh pr checks` e siga.
- Algum falhou → não encerre: `gh run list --branch "$(git branch --show-current)" --limit 1 --json databaseId,conclusion` + `gh run view <id> --log-failed`. Apresente o check vermelho, últimas ~50 linhas do log e o link. Acione `debugging` com o log. CI vermelho bloqueia encerramento.

#### Passo 13 — Merge na main
Pré-requisito: Passo 12 todo verde (confirme com `gh pr checks` = `pass`). **Reverificar rebase:** entre o push e agora a `main` pode ter andado:
```bash
git fetch origin
git log --oneline HEAD..origin/main   # se trouxer commits, precisa rebase
```
Se andou → avise em 1 linha, `git rebase origin/main` (conflito → resolva mecânicos em silêncio como no Passo 7; pause só em conteúdo real), `git push --force-with-lease`, **volte ao Passo 12** pra revalidar o CI. Senão prossiga.

Pergunte: "Todos os CIs passaram. Quer mergear na main?" Não → encerra exibindo a URL. Sim → `gh pr merge --merge` (ou `--squash`/`--rebase` conforme o repo; **nunca `--delete-branch`**). Se o repo deleta head branch automaticamente, avise e confirme. Exiba o SHA do merge. **Não rode `git branch -d` nem `git push origin --delete`.**

#### Passo 14 — Deploy em produção (Heroku)
Pré-requisito: merge concluído. `git remote | grep heroku`. Sem remote → informe como configurar (`heroku git:remote -a <app>`) e encerre. Com remote → "Deploy em produção agora?" (não → encerra com o SHA).

**a) Env vars (do Passo 9):** se o Passo 9 detectou variáveis novas, confirme que estão setadas em prod **antes** do push — `heroku config --app <prod> | grep <VAR>`. Faltando → `heroku config:set <VAR>=... --app <prod>` (peça o valor ao usuário). Sem isso a app crasha no boot.

**b) Backup de produção (só se a migration puder perder dados):** cheque migration destrutiva no diff:
```bash
git diff origin/main...HEAD --name-only | grep -E "(db/migrate|prisma/migrations|prisma/schema\.prisma|schema\.sql)"
```
Se houver schema no diff, avalie se é **destrutiva** (drop/rename de coluna ou tabela, mudança de tipo, `NOT NULL` em coluna com dados, release com `--accept-data-loss`). Aditiva (nova tabela/coluna nullable, índice) → segue sem backup. Destrutiva → **agora** (o mais próximo possível da migration, não antes): `heroku pg:backups:capture --app <prod>` e aguarde `Completed` (`heroku pg:backups --app <prod>`). Cheque o release (`cat Procfile | grep release`): se usa `prisma db push --accept-data-loss`, avise que migrations SQL são IGNORADAS, drops são aceitos sem confirmação e backfills são manuais via `heroku run`/`pg:psql`. Backup falhou/impossível → **PARE** e peça intervenção humana. `heroku rollback` pode recriar colunas/tabelas vazias — o backup é a única rede real.

**c) Deploy:**
```bash
git push heroku main
```
Falha por histórico divergente → `--force-with-lease` (nunca `--force` sozinho). Migrações: `heroku run rails db:migrate` (aguarde sucesso). Verifique: `heroku ps` + `heroku releases --num 1`. Dynos up → exiba `vN` e "Deploy concluído". Crash → `heroku logs --tail --num 50` + `debugging`; não encerre enquanto crashar.

---

## Entrada direta por fase

| Contexto | Fase |
|---|---|
| Ideia vaga / "como fazer X" | Fase 1 |
| Design definido / "planeja isso" | Fase 2 |
| `.plans/plan.md` já existe | Fase 3 |
| Bloco de fixes pós-implementação / "maestro corrige" | Fase 4 |
| Branch pronta pra publicar / "maestro publica" | Fase 5 |

## Utilitários (inline)

Acionados por nome ao longo das fases (`→ debugging`, `→ test-gate`). Estão aqui, não em skills avulsas.

### Debugging
Sempre que algo falha (teste vermelho, CI, crash, comportamento errado). **Ache a causa raiz, nunca trate o sintoma:**
0. **Sinal de repro** — construa um jeito rápido, determinístico e isolado de reproduzir (teste que falha, `curl`, passos mínimos, query do estado). Não avance sem ele.
1. **Observe** — comportamento exato (não "não funciona") vs. esperado, stack trace completo, o que mudou recentemente. Leia o contexto, não só o diff.
2. **Hipóteses** — liste ≥3 causas por probabilidade + o que confirmaria cada uma (dado inválido, estado inconsistente, race, dependência externa, lógica, ambiente).
3. **Teste uma por vez** — minimize ao caso mais simples; `git bisect` se não sabe em qual commit surgiu.
4. **Corrija a causa** + teste de regressão (falha sem o fix, passa com ele); confira que não quebra adjacentes.

Após 3 hipóteses sem resultado → **pare e reporte o que descartou** (você pode ter contexto que eu não tenho). Remova logs de debug antes de commitar.

### Test-gate
Quando os arquivos alterados **não têm teste**, antes de liberar o commit: escreva testes do **comportamento público** — happy path, sad path (input inválido / recurso ausente), edge cases (vazio/nulo/zero, não-autenticado), **regressão** dos adjacentes, e **segurança** se tocou auth/dados/upload/controle de acesso. Um teste por comportamento, testando a interface (o quê), não a implementação (o como). Rode; **não commita até verde** (vermelho → Debugging). Sem infra de teste no projeto → ofereça configurar.

## Regras

- **Caveman por padrão:** narração mecânica mínima (uma linha ou nada); investigação (conflito, git, debug) é **silenciosa**, só o resultado em 1 linha; fala completa só na Fase 1 e quando há uma **decisão/trade-off pra você escolher** (estilo caveman descrito em Comunicação)
- **Cadência de confirmação:** confirme **uma vez por fase** (no entregável — design na Fase 1; **plano+branch+execução na Fase 2: um gate só — aprovar o plano cria a branch e dispara a Fase 3**; homologação na Fase 3; bloco de fixes na Fase 4; publicar na Fase 5) e só nos **stops irreversíveis**. Não pare a cada seção ou micro-passo: agrupe e siga. Stops inegociáveis (sempre peça ok): merge na main, deploy em produção, escolher quais correções aplicar, backup antes de migration destrutiva. Criar branch e push já estão cobertos pela aprovação do plano/gate — não re-pergunte
- Nunca implemente durante Fase 1 ou 2; nunca proponha código durante a Fase 1
- Se task for ambígua, para e pergunta antes de lançar o subagente
- **Modelos:** líder Opus 4.8 High; dev (Fase 3) e correções (Fases 4 e 5) em `model: "sonnet"` Médio; revisão de Segurança (Fase 5) em `model: "opus"` High
- **Backup só de produção e só em migration destrutiva** (drop/rename de coluna ou tabela, mudança de tipo, `NOT NULL` em coluna com dados, `--accept-data-loss`) — capturado no Passo 14, imediatamente antes da migration do deploy. Sem backup local nem de staging; migration aditiva não precisa
- Fase 4 (fixes do seu bloco) e Bloco 1 da Fase 5 (review) rodam em paralelo; correções nunca inline (subagentes Sonnet); Bloco 2 da Fase 5 (push→deploy) é estritamente sequencial
- **Profundidade escala por risco (nível TRIVIAL/MÉDIO/ALTO), nunca por capricho** — e o cético do nível ALTO **nunca rebaixa** achado de classe alta-confiança (SQLi/IDOR/secret/auth); Segurança roda sempre em Opus, mesmo em TRIVIAL
- Subagentes que reportam dado devolvem estruturado (schema), não prosa; toda verificação/painel é via Agent tool, sem depender do Workflow tool
- Nunca use `--force` sozinho, sempre `--force-with-lease`; **nunca delete a branch**; nunca `--amend`/`--no-verify`
- CI vermelho bloqueia o encerramento; merge só com CI 100% verde
- "O que tem mais risco" no corpo do PR nunca em branco
- **Menos interrupção:** na 1ª vez num projeto, ofereça pré-autorizar (allowlist em `.claude/settings.json`) os comandos read-only que o maestro repete — `git status/log/diff`, `gh pr checks`, runners de teste — pra o fluxo não parar a cada prompt de permissão
