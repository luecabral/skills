---
name: maestro
description: Use para o ciclo completo de uma feature — do brainstorming ao deploy.
Ativa quando o usuário diz "maestro", "roda o maestro", "faz o maestro". Pode entrar
diretamente em qualquer fase: "maestro fase 2", "maestro planeja", "maestro executa", "maestro corrige", "maestro publica".
---

# Maestro

Ciclo completo de uma feature, do brainstorming ao deploy, em 5 fases. **Este arquivo é autossuficiente:** todo o processo — fases, debugging, docs e estilo de comunicação — está escrito aqui dentro, não invocado de outra skill. Editar qualquer skill avulsa **não muda** o comportamento do maestro. Só o `verify` (built-in do Claude Code) é externo.

**Sem testes automatizados.** O maestro **não escreve teste, não roda suíte, não faz TDD**. A rede de segurança é o **`verify`** (sobe o app e observa o comportamento real) + o **roteiro de homologação manual** entregue ao usuário. Se um projeto já tem suíte e o CI a roda, o CI continua sendo gate (Passo 12) — mas o maestro não cria nem mantém teste.

**NÃO ESCREVA COMENTÁRIOS.** Regra dura, vale pro líder e pra todo subagente: **zero comentário em código novo ou alterado.** A premissa é que comentário é sintoma — se o código precisa de explicação, o código está mal escrito. Em vez de comentar: nomes explícitos (variável/função/classe que diz o que é), funções curtas com uma responsabilidade, early return em vez de aninhamento, extrair condição complexa pra função com nome. Isso inclui comentário de seção, `TODO`, `FIXME`, comentário que repete o código e comentário "explicando o porquê" — o porquê vai na mensagem de commit, no corpo do PR ou nos docs, nunca no código. **Únicas exceções:** docstring/comentário de API pública quando a linguagem ou o projeto já exige (JSDoc em lib pública, docstring Python em módulo exportado), diretiva que a ferramenta lê (`# frozen_string_literal`, `eslint-disable`, `@ts-expect-error`, pragma de tipo) e comentário que **já existia** e você não tocou. Se o projeto tem convenção própria de comentário no `AGENTS.md`/`CLAUDE.md`, ela ganha — informe em 1 linha e siga.

**Modelos (obrigatório):** o desenvolvimento roda sempre em **ultracode**, e o ultracode orquestra os subagentes. Regra única de escolha de modelo: **`model: "opus"` pra tarefa complexa, `model: "sonnet"` pra tarefa simples.**
- **Complexa (Opus):** lógica não-trivial, arquitetura, migration/schema, refactor amplo, qualquer coisa que toque auth/pagamento/dados sensíveis, revisão de Segurança e o cético do nível ALTO (Fase 5), debugging que já falhou uma vez.
- **Simples (Sonnet):** CRUD direto, texto/label/estilo, rename, ajuste de config, docs, painel de lentes da Fase 1, review de UX/Docs, completeness critic.
- Em dúvida entre os dois → **Opus**. O líder classifica a task na hora de spawnar e não pergunta.

**Comunicação (economia de token — apelido "caveman").** Objetivo: **mínimo de token por resposta, sem perder precisão.** Não dependa de "saber o que caveman significa" — as regras estão escritas aqui:
- **Regra de ouro:** na tela vão só **decisões (pra você escolher)** e **entregáveis** (plano, roteiro, relatório, PR, URL). Processo, investigação e progresso de subagente ficam de fora (máx. 1 linha de status). Dúvida: é decisão/entregável? mostra. É *como cheguei lá*? calo.
- **Estilo comprimido:** corta artigos, preâmbulos, confirmações vazias ("ótima pergunta!") e hedging ("provavelmente/talvez"); usa fragmentos quando o sujeito é óbvio e setas pra causalidade ("query lenta → sem índice"); mantém exatos termos técnicos, números e nomes de arquivo. Sem resumir o que acabou de fazer; **não narre cada passo mecânico** (status mecânico = 1 linha ou nada — o painel de tarefas e os tool calls falam por você).
- **Investigação é silenciosa:** resolver conflito de merge, achar EOL/CRLF, rodar git, debugar passo a passo — no raciocínio interno; reporta só o **resultado em 1 linha** (ex: "Conflito em `_form.html.erb` resolvido: minha versão + 2 mudanças de origin/main; fluxo revalidado").
- **Uma investigação = UMA saída:** por mais voltas, becos sem saída e auto-correções ("errei a direção", "comando bugou"), **não** narre uma linha por tool call — os chips já mostram que está trabalhando. Vai pra tela só a conclusão ou o ponto de decisão.
- **Exceções (aí fale completo):** Fase 1 (explorar/desenhar) e quando há uma **decisão/trade-off pra você escolher** (alternativas, achados de review pra aprovar, bug com mais de um caminho). **Investigar ≠ decidir.**

**Contextualização de termos técnicos (só nos momentos de fala completa — Fase 1, fixes e gates dirigidos a você):** inclua uma explicação simples entre parênteses. Ex: "migration (script que cria/altera a estrutura do banco)", "branch (ramificação isolada do código)". Que qualquer pessoa entenda sem pesquisar. Fora desses momentos, caveman.

**Orquestração (via subagentes):** todo o paralelismo e a verificação do maestro são feitos com subagentes — o ultracode cuida disso. Subagentes que reportam dado devolvem **estruturado (schema)**, não prosa, pra você operar sobre o resultado sem reparsear. **Orquestrar é silencioso (todas as fases):** ao disparar subagentes (painel da Fase 1, dev da Fase 3, fixes da Fase 4, review da Fase 5), **não narre cada spawn/retorno** ("disparando X… mergeando…") — deixe o painel de tarefas mostrar o progresso e apresente só o **resultado consolidado** do grupo/lote em poucas linhas.

**Profundidade por risco (escala o esforço, nunca a segurança):** classifique a feature por sinais que você já tem — **TRIVIAL** (≤2 tasks, sem 🔴, sem migration) / **ALTO** (tem 🔴, migration destrutiva, ou toca auth/pagamento/dados sensíveis) / **MÉDIO** (o resto). O nível só dimensiona **quantos** subagentes você dispara (painel da Fase 1, pool de review da Fase 5) — **nunca rebaixa Segurança, nem pula gate ou backup**. É derivado: não pergunte, informe em 1 linha e grave `nivel:` no topo do `.plans/plan.md`.

---

## Fase 1 — Explore

Refinamento da ideia antes de qualquer linha de código.

**Quando NÃO usar (encerre e oriente):** usuário já tem plano claro → pule pra Fase 2; está debugando algo existente → `debugging`; mudança pontual e trivial (ex: "muda a cor do botão") → faça direto.

**Contexto do projeto (bootstrap, 1ª vez):** se o projeto não tem `AGENTS.md`/`CLAUDE.md`/`README` descrevendo build, arquitetura e convenções, **ofereça criar um antes de desenhar** — detecte como o app sobe/builda, a stack e os padrões do código. Esse contexto alimenta as Fases 2-5 e evita design que ignora o que já existe.

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
Não invente as abordagens sozinho (single-agent ancora na 1ª ideia). **TRIVIAL → pule, faça você mesmo** (comportamento antigo). Senão dispare **em paralelo** N subagentes read-only `Agent(model: "sonnet")` (default 3 — lente é tarefa simples; feature que toca auth/pagamento/dados sensíveis → `model: "opus"`), cada um com uma **lente** distinta e o mesmo briefing (problema, critério de sucesso, restrições, 🔴 do Passo 1.5 se houve, benchmark): (1) menor superfície / mais simples; (2) mais robusto e seguro; (3) mais rápido de entregar. Cada um devolve via schema: abordagem, vantagem, risco principal, custo. Você (o juiz): se rodou o Passo 1.5, descarte quem deixa algum 🔴 sem cobertura; recomende a vencedora e **liste o que vale puxar das outras**; lentes que convergem → funda e diga. Apresente os finalistas + a recomendação e aguarde o usuário escolher.

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
- Ser completável em 2–5 min; resultar em estado **verificável na mão** (dá pra abrir/rodar e ver funcionando); max ~600 linhas (quebre se maior — calibre com `wc -l`).
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

O líder orquestra; quem escreve código são os subagentes (**Opus** na task complexa, **Sonnet** na simples — ver Modelos).

1. Lê `.plans/plan.md`, reconstrói o grafo de dependências. **Retomada:** se a sessão anterior parou no meio, as tasks já feitas estão marcadas (`[x]`) — pegue só as não-marcadas, descarte worktrees órfãs de tasks concluídas e recomece pelo primeiro grupo com task pendente.
2. **Feature pequena (≤2 tasks sem interdependência de schema):** worktree + paralelismo custa mais do que rende. *Pergunte* se prefere executar inline (sem worktree), mantendo commit + validação. Default continua worktree — só pula se o usuário topar.
3. Para cada grupo paralelo em ordem topológica:
   - Lança um `Agent(isolation: "worktree", ...)` por task no grupo, **classificando o modelo pela complexidade da task** (`opus` complexa / `sonnet` simples — em dúvida, `opus`). Diga no prompt que a regra de **zero comentário** é obrigatória.
   - Cada subagente segue o **ciclo de implementação + commit** abaixo e **retorna estruturado** (schema): `{task_id, status: done|paused|failed, commits_range: "base..HEAD", arquivos_tocados, motivo}`. Acaba o palpite de "o que mergear".
   - Aguarda todos do grupo concluírem. **Antes de mergear, cheque colisão:** cruze os `arquivos_tocados` (confirme com `git diff --name-only` do `commits_range` — subagente pode esquecer de listar arquivo gerado/lockfile) entre as tasks; se duas tocaram o mesmo arquivo, mergeie uma e re-rode/ajuste a outra. Faz merge de cada worktree pelo `commits_range` devolvido (ver REFERENCE.md). Conflito: pausa, descreve, aguarda resolução humana.
4. Atualiza os checkboxes no `.plans/plan.md` conforme as tasks completam.

### O que cada subagente faz (implementação + smart-commit, inline)

**Passo 0 — Análise prévia.** Leia os arquivos que a task vai tocar. Aplique o **teste de deleção**: "Se eu deletasse esse módulo e reescrevesse quem o usa, o resultado seria pior ou equivalente?" Pior → módulo profundo, siga em cima dele. Equivalente → módulo raso, refatore antes (cada passo deixando o código funcionando).

**Ciclo de implementação (um comportamento por vez):**
- 🟢 **IMPLEMENTA** — escreva o **mínimo** que entrega o comportamento. Sem antecipação, sem generalizar pra caso que não existe.
- 👀 **VERIFICA NA MÃO** — exercite o comportamento de verdade: abra a tela, chame o endpoint (`curl`), rode o comando, consulte o dado. Confirme o caminho feliz **e** o de erro do design da Fase 1. Não avance sem ter visto funcionar.
- 🔵 **LIMPA** — remova duplicação, melhore nomes, corte aninhamento. Reexercite pra confirmar que continua funcionando.

Repita por comportamento, sempre deixando o código rodando. **Sem teste automatizado em nenhum momento** — não crie arquivo de teste, não altere suíte, não adicione dependência de teste. Se algo é difícil de exercitar na mão, a interface está errada — redesenhe.

**Zero comentário** (ver regra no topo): o código sai autoexplicativo por nome e estrutura. Se você sentiu vontade de comentar, extraia uma função com o nome do que o comentário diria.

**Commit (smart-commit, inline):**
- Antes de commitar, confirme que o comportamento da task funciona de verdade (o 👀 do ciclo). Quebrado → `debugging`. Não commite comportamento que você não viu rodar.
- **Varredura de comentário:** rode `git diff` do seu próprio trabalho e confirme que **nenhuma linha adicionada é comentário** (fora as exceções do topo). Achou → remova e melhore o código no lugar. Não commite com comentário novo.
- **Auto-check de segurança:** se a task tocou auth / dados / input de usuário / query / upload, releia o que mexeu contra os vetores do Passo 1.5 (IDOR, injection, SSRF, escopo de autorização, etc.) **antes de commitar** — pega o problema na fonte, não só na Fase 5.
- Verifique docs (dual-audience: humano leigo + agente de IA): se o projeto tem `AGENTS.md` ou `docs/`, atualize o que ficou desatualizado — AGENTS.md, estrutura de pastas, regras de negócio, `docs/features/`, `docs/changelog.md`. Tom simples pro humano, caminhos/nomes reais pro técnico. Docs vão no mesmo commit, nunca "depois".
- Agrupe arquivos por contexto lógico (banco / modelos / controllers / componentes / docs / config) e gere um commit por grupo. Mensagem: `tipo: Mensagem` (verbo no presente, maiúscula inicial, sem ponto final; tipos `feat·fix·refactor·perf·docs·style·config`).
- Commite via heredoc. Se hook falhar, corrija e crie **novo** commit. Nunca `--amend` nem `--no-verify`. Sinalize `console.log`/`debugger`/`print` esquecidos antes de commitar.

### Validação (fim da Fase 3, antes da homologação do usuário)
Antes do relatório final, o líder valida o conjunto. **Sem suíte de testes — a validação é observação do comportamento real:**
- Invoca `verify` (Verify do Claude) pra **homologar todos os fluxos impactados** — o comportamento real de cada fluxo que a feature tocou (feliz + alternativos do design da Fase 1). O `verify` sobe o app e observa de verdade. Com o TDD fora, **o `verify` é a rede de segurança principal — nunca pule se o app sobe.**
- **Fallback (só quando o app genuinamente não sobe — lib pura, CLI, cron sem UI):** exercite cada fluxo na mão (chamada direta, `curl`, comando no console, query do estado) e registre o que observou em 1 linha por fluxo.
- **Varredura de comentário no conjunto:** `git diff origin/main...HEAD` e confirme zero comentário adicionado (fora as exceções do topo). Achou → limpe antes de anunciar.
- Se algum fluxo falhar → `debugging`, corrige e revalida antes de seguir.

### Roteiro de homologação manual (entregue ao anunciar o fim do desenvolvimento)
Com a validação verde, gere um **roteiro de homologação manual** pro usuário conferir com as próprias mãos antes de publicar. Sem suíte automatizada, esse roteiro é o principal registro do que foi verificado — seja específico e completo. Liste cada fluxo afetado (feliz + alternativos do design da Fase 1) como passos executáveis por quem **não** escreveu o código — o que abrir, o que clicar, o resultado exato esperado em cada etapa. Inclua os estados de borda (erro, vazio, cancelamento) e a checagem de regressão dos fluxos adjacentes. Apresente esse roteiro junto do anúncio de que o desenvolvimento acabou.

**Proteções:** máx. 2 ciclos de implementação por task antes de pausar; máx. 3 falhas consecutivas para e reporta.

**Gate:** "Desenvolvimento concluído e homologado pelo `verify`, mergeado na branch. Acima está o roteiro pra você homologar manualmente. **Achou o que ajustar? Me manda o bloco de fixes que eu aplico (Fase 4).** Sem fixes → publicar (Fase 5)."
Se não → encerra na branch, pronta pra Fase 4 (fixes) ou Fase 5 (publish) quando você quiser.

---

## Fase 4 — Fixes

Aplicação orquestrada de um **bloco de fixes** após a implementação da Fase 3. Entra após a homologação (você testou pelo roteiro da Fase 3 e achou ajustes), ou direto via `maestro fase 4` / `maestro corrige`. **Não** é review automático (isso é a Fase 5) — aqui **você manda o que corrigir e eu orquestro os subagentes**.

**Quando NÃO usar — fix único e pequeno:** não precisa de "maestro corrige" nem da fase inteira. Só diga o que ajustar; eu corrijo **direto (inline)**, confirmo o comportamento na mão e sigo. A Fase 4 é pra **bloco** — vários fixes juntos, ou algo que valha paralelizar em subagentes.

### Passo 1 — Receber o bloco de fixes
Receba (ou peça) o bloco: lista livre do que ajustar — bugs da homologação, ajustes pontuais, pedidos de mudança. Para cada item, identifique o(s) **arquivo(s) alvo** (pergunte só se não der pra inferir do código). Sem bloco → pergunte qual é.

### Passo 1.5 — Triar o bloco (antes de orquestrar)
- **Entenda e deduplique:** consolide itens que são a mesma coisa; **esclareça só os genuinamente ambíguos** (não pergunte no que dá pra inferir do código).
- **Guard de band-aid:** se um fix é só remendo de um problema de design, **não corrija calado** — sinalize "isso briga com o design; o fix de raiz é X" e deixe você decidir.
- **Guard de escopo:** se um "fix" é grande ou é **feature** de verdade, **não force na Fase 4** — proponha voltar pro Plan (Fase 1/2) em vez de cramar como conserto.

### Passo 2 — Commitar pendências
`git status --short`: se houver mudança não commitada, rode o fluxo de commit da Fase 3 (verifica na mão → debug → commit agrupado). Working tree limpo antes de orquestrar.

### Passo 3 — Agrupar (causa-raiz, depois colisão)
Primeiro junte itens que compartilham **causa provável** — um fix pra causa, não um subagente por sintoma (vários sintomas reportados costumam ter a mesma raiz). Depois mapeie por arquivo: **arquivos diferentes → paralelo; mesmo arquivo → sequencial** (um subagente por vez, senão conflito garantido). Apresente o plano de fixes em 1-2 linhas.

### Passo 4 — Orquestrar os subagentes
Um `Agent` por fix (ou por grupo de mesmo-arquivo), **nunca inline**, com o modelo pela complexidade do fix (`opus` complexo / `sonnet` simples). **Cada subagente classifica o fix e escolhe o caminho:**
- **Comportamento novo** (a feature ganhou algo que não existia) → **ciclo de implementação completo** da Fase 3 (implementa → verifica na mão → limpa). É desenvolvimento, não conserto. Costuma ser complexo → `opus`.
- **Bug** (comportamento existe mas está errado) → primeiro **reproduza o bug na mão** (passos exatos, `curl`, estado do dado) pra ter certeza do sintoma, corrija a causa, e reexercite confirmando que o sintoma sumiu **e** que o fluxo adjacente continua ok.
- **Ajuste trivial sem mudar comportamento** (texto, estilo, rename) → aplica e confere visualmente. `sonnet`.

Nenhum caminho escreve teste. Falhou → `debugging`. **Zero comentário** e varredura do próprio `git diff` antes de commitar. **Retorna estruturado** `{fix, tipo, status, commits_range, arquivos_tocados}`. Paralelo entre arquivos diferentes; sequencial no mesmo arquivo.

### Passo 5 — Revalidar, confirmar e commitar
Sessão principal **reexercita os fluxos tocados + os adjacentes** via `verify` ou na mão (quebrou → `debugging`). **Confirme que o sintoma reportado sumiu** — o que você reportou agora se comporta como esperado (pra UI, via `verify`/roteiro do item). Commita as correções (smart-commit: agrupa por contexto, `tipo: Mensagem`, nunca `--amend`/`--no-verify`). Re-homologa só os fluxos que mudaram.
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
`git status --short`: se houver pendências, rode o fluxo de commit da Fase 3 (verifica na mão → debug → commit agrupado). Depois confirme que há commits novos:
```bash
git branch --show-current
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null || git log HEAD --oneline -5
```
Se for `main` ou não houver commits novos, informe e encerre.

#### Passo 2 — Análise em paralelo
Dispare **tudo no mesmo bloco**: subagentes read-only (só reportam) + checks mecânicos na sessão principal. Aguarde todos e consolide no Passo 3.

**Subagentes de revisão (read-only):**
1. **Segurança/Correção** — `Agent(model: "opus")`. Tarefa complexa por definição: protege contra bug indo pra prod, e sem suíte de testes é a principal checagem de correção. Aplica os blocos **Funcionalidade**, **Segurança** e **Qualidade** do checklist (REFERENCE.md) sobre `git diff origin/main...HEAD`. Devolve 🚨/⚠️.
2. **UX** — `Agent(model: "sonnet")`. Aplica o bloco **UX** do checklist. Devolve 🚨/⚠️.
3. **Documentação** — `Agent(model: "sonnet")`. Verifica se README e `docs/` refletem o diff. Lista o desatualizado/faltando — só reporta (update vem no Passo 4). **Não** pede comentário no código: o que precisaria de comentário vai pra doc ou pro corpo do PR.

**Lente de limpeza (estilo simplify), dentro do revisor de Qualidade:** além de bug, sinalize **duplicação extraível** (reuso/DRY), **custo desnecessário** (eficiência) e **nível de abstração errado** (altitude — raso ou fundo demais). Entram como ⚠️ (qualidade), não bloqueiam. **Comentário adicionado no diff é exceção:** entra como 🚨 (ver check mecânico) junto da sugestão de reescrita que dispensa o comentário.

**Profundidade pelo nível** (lê `nivel:` do plan.md; entrada direta sem plano = MÉDIO; **Segurança roda sempre em Opus, em qualquer nível**):
- **TRIVIAL** → só checks mecânicos + Segurança; pula UX/Docs se o diff não toca view/template/`.css`/`.md`.
- **MÉDIO** → os 3 revisores acima (atual).
- **ALTO** → os 3 + lentes de perf e regressão + **1 cético** `Agent(model: "opus")` que tenta refutar cada 🚨 não-mecânico contra o diff. **Nunca rebaixa** achado de classe alta-confiança (SQLi, IDOR, secret commitada, falha de auth) — esses sempre bloqueiam. Rebaixado vira ⚠️ com 1 linha de evidência (a guarda que já existe no diff).

**Checks mecânicos (sessão principal, mesmo bloco):**
- **Código de debug:** busca no diff `console.log`, `debugger`, `print(`, `puts `, `p `, `pp `, `var_dump`, `dd(`.
- **Comentário no diff (🚨 bloqueante):** lista as linhas **adicionadas** que são comentário e não caem nas exceções do topo (docstring de API pública exigida, diretiva de ferramenta, comentário pré-existente):
  ```bash
  git diff origin/main...HEAD -U0 | grep -E "^\+" | grep -E "^\+\s*(//|#|/\*|\*|<!--|--)" | grep -vE "(frozen_string_literal|eslint-|ts-expect-error|ts-ignore|prettier-|rubocop:|noqa|type:|pragma|#!/)"
  ```
  Saída vazia → ok. Saída com linhas → 🚨: cada uma volta como fix (remover o comentário e deixar o código autoexplicativo).
- **Fluxos (substitui a suíte):** confirme via `verify` que os fluxos do design da Fase 1 e os adjacentes continuam se comportando como esperado. Sem suíte automatizada, **essa é a checagem de regressão** — não pule.
- **Auditoria** (só npm): `npm audit 2>/dev/null || true`. Qualquer severidade conta.
- **Suíte pré-existente (só se o projeto já tem uma):** se o repo tem testes que você não escreveu, rode o comando do projeto **só pra não publicar quebrando o que já existia**. Vermelho → 🚨. Não crie nem conserte teste pra fazer passar: se o teste velho cobre comportamento que a feature mudou de propósito, reporte e pergunte. Sem suíte no repo → pule em silêncio.

#### Passo 3 — Consolidação e gates
Antes de consolidar, **1 completeness critic** (`Agent(model: "sonnet")`, read-only): "o review cobre todos os fluxos do design da Fase 1, as env vars novas (Passo 9) e cada 🔴 do threat modeling? o que falta?" — buracos viram itens do relatório.

Filtros antes do relatório:
- **Verificação de falso-positivo (todo 🚨, não só no ALTO):** confirme cada achado contra o código real — a guarda/validação que já existe pode invalidá-lo. Não confirmou → não é 🚨. **Comentário adicionado não passa por esse filtro** — é objetivo, o grep já provou.
- **Pré-existente × introduzido:** achado que **já existia** no código tocado (não foi o diff que criou) vira ⚠️ "pré-existente" — registra, **não bloqueia**; bloqueante é só o que o diff introduziu.
- **`REVIEW.md` do repo:** se existir, honre a calibração de severidade dele.
Relatório **único** — review + critic + checks:
- 🚨 BLOQUEANTE — fluxo quebrado, comentário adicionado no diff, suíte pré-existente vermelha, vulnerabilidades pendentes, achados críticos. Resolver antes de prosseguir.
- ⚠️ SUGESTÃO — melhorias de review/UX, docs desatualizadas. Pergunte o que aplicar agora.

Bloqueios: fluxo quebrado ou suíte pré-existente vermelha → `debugging`, não prossegue até resolver. Comentário no diff → remove, não pergunta. Vulnerabilidade de qualquer severidade → bloqueia (lista pacotes+CVE, roda `npm audit fix` não-breaking; remanescentes → sugere `--force` breaking, upgrade manual ou override). Debug code → pergunta remover ou seguir.

#### Passo 4 — Aplicar correções escolhidas
As que o usuário escolher (🚨 + ⚠️ aceitas, **incl. docs**) → subagentes `Agent`, modelo pela complexidade da correção (`opus` complexa / `sonnet` simples), **nunca inline**. Arquivos diferentes → paralelo; mesmo arquivo → um subagente sequencial; uma só → ainda via subagente. Depois, a sessão principal **reexercita os fluxos tocados via `verify`** (quebrou → `debugging`) e re-roda a varredura de comentário. Correções entram no commit antes do push.

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

### O que homologar
- [ ] [Fluxo]: passos e resultado esperado
- [ ] Regressão: fluxos adjacentes
```

#### Passo 11 — Criar/editar PR
Crie o PR já como **draft** (editável) e exiba título + corpo — não bloqueie esperando aprovação do texto; ajuste depois se quiser.
- Criação: `gh pr create --draft --title "<t>" --body "<corpo>"`
- Edição: `gh pr edit --title "<t>" --body "<corpo>"`
Exiba a URL.

#### Passo 12 — Aguardar CI
`gh pr checks --watch --fail-fast`. Os checks locais (Passo 2) cobrem só a máquina; o CI é o gate do repo — se ele roda suíte, lint ou build, vale o que ele disser.
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

Acionados por nome ao longo das fases (`→ debugging`). Estão aqui, não em skills avulsas.

### Debugging
Sempre que algo falha (CI, crash, comportamento errado). Use `model: "opus"` se delegar — debugging é tarefa complexa. **Ache a causa raiz, nunca trate o sintoma:**
0. **Sinal de repro** — construa um jeito rápido, determinístico e isolado de reproduzir (`curl`, passos mínimos na UI, comando no console, query do estado). **Sem criar arquivo de teste** — repro é na mão. Não avance sem ele.
1. **Observe** — comportamento exato (não "não funciona") vs. esperado, stack trace completo, o que mudou recentemente. Leia o contexto, não só o diff.
2. **Hipóteses** — liste ≥3 causas por probabilidade + o que confirmaria cada uma (dado inválido, estado inconsistente, race, dependência externa, lógica, ambiente).
3. **Cheque uma por vez** — minimize ao caso mais simples; `git bisect` se não sabe em qual commit surgiu.
4. **Corrija a causa** e confirme pelo sinal de repro: o sintoma sumiu, e os fluxos adjacentes continuam ok (`verify` ou na mão).

Após 3 hipóteses sem resultado → **pare e reporte o que descartou** (você pode ter contexto que eu não tenho). Remova logs de debug antes de commitar.

## Regras

- **Caveman por padrão:** narração mecânica mínima (uma linha ou nada); investigação (conflito, git, debug) é **silenciosa**, só o resultado em 1 linha; fala completa só na Fase 1 e quando há uma **decisão/trade-off pra você escolher** (estilo caveman descrito em Comunicação)
- **Cadência de confirmação:** confirme **uma vez por fase** (no entregável — design na Fase 1; **plano+branch+execução na Fase 2: um gate só — aprovar o plano cria a branch e dispara a Fase 3**; homologação na Fase 3; bloco de fixes na Fase 4; publicar na Fase 5) e só nos **stops irreversíveis**. Não pare a cada seção ou micro-passo: agrupe e siga. Stops inegociáveis (sempre peça ok): merge na main, deploy em produção, escolher quais correções aplicar, backup antes de migration destrutiva. Criar branch e push já estão cobertos pela aprovação do plano/gate — não re-pergunte
- Nunca implemente durante Fase 1 ou 2; nunca proponha código durante a Fase 1
- Se task for ambígua, para e pergunta antes de lançar o subagente
- **Sem teste automatizado, nunca:** não escreva teste, não crie arquivo de teste, não altere suíte, não adicione dependência de teste, não faça TDD. A rede é `verify` + roteiro de homologação manual. Suíte que **já existe** no repo: roda como gate na Fase 5 pra não publicar quebrando, mas não é mantida nem estendida pelo maestro
- **Zero comentário em código:** nenhum comentário novo em código novo ou alterado — se precisa de comentário pra explicar, reescreva (nome melhor, função extraída, early return). Exceções: docstring de API pública que a linguagem/projeto exige, diretiva de ferramenta (`eslint-disable`, `frozen_string_literal`, `ts-expect-error`) e comentário pré-existente não tocado. Comentário adicionado no diff é 🚨 bloqueante na Fase 5. O "porquê" vai pro commit, PR ou docs
- **Modelos:** desenvolvimento sempre em ultracode; **`model: "opus"` pra tarefa complexa, `model: "sonnet"` pra simples**, em dúvida Opus. Complexa: lógica não-trivial, arquitetura, migration, refactor amplo, auth/pagamento/dados sensíveis, revisão de Segurança, cético do ALTO, debugging. Simples: CRUD direto, texto/estilo, rename, config, docs, painel de lentes, review de UX/Docs, completeness critic
- **Backup só de produção e só em migration destrutiva** (drop/rename de coluna ou tabela, mudança de tipo, `NOT NULL` em coluna com dados, `--accept-data-loss`) — capturado no Passo 14, imediatamente antes da migration do deploy. Sem backup local nem de staging; migration aditiva não precisa
- Fase 4 (fixes do seu bloco) e Bloco 1 da Fase 5 (review) rodam em paralelo; correções nunca inline (sempre via subagente, modelo pela complexidade); Bloco 2 da Fase 5 (push→deploy) é estritamente sequencial
- **Profundidade escala por risco (nível TRIVIAL/MÉDIO/ALTO), nunca por capricho** — e o cético do nível ALTO **nunca rebaixa** achado de classe alta-confiança (SQLi/IDOR/secret/auth); Segurança roda sempre em Opus, mesmo em TRIVIAL
- Subagentes que reportam dado devolvem estruturado (schema), não prosa
- Nunca use `--force` sozinho, sempre `--force-with-lease`; **nunca delete a branch**; nunca `--amend`/`--no-verify`
- CI vermelho bloqueia o encerramento; merge só com CI 100% verde
- "O que tem mais risco" no corpo do PR nunca em branco
- **Menos interrupção:** na 1ª vez num projeto, ofereça pré-autorizar (allowlist em `.claude/settings.json`) os comandos read-only que o maestro repete — `git status/log/diff`, `gh pr checks` — pra o fluxo não parar a cada prompt de permissão
