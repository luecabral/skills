---
name: maestro
description: Use para o ciclo completo de uma feature — do brainstorming ao deploy.
Ativa quando o usuário diz "maestro", "roda o maestro", "faz o maestro". Pode entrar
diretamente em qualquer fase: "maestro fase 2", "maestro planeja", "maestro executa", "maestro publica".
---

# Maestro

Ciclo completo de uma feature, do brainstorming ao deploy, em 4 fases. **Este arquivo é autossuficiente:** o processo de cada fase está escrito aqui dentro, não invocado de outra skill. Editar `brainstorming`, `prd-to-issues`, `tdd`, `smart-commit` ou `publish` avulsas **não muda** o comportamento do maestro. Só `test-gate`, `debugging` e `context-docs` permanecem como utilitários invocados.

**Modelos (obrigatório):** o Maestro (líder que orquestra todas as fases e gerencia os subagentes) roda em **Opus 4.8 High**. Os subagentes de desenvolvimento da Fase 3 e os de revisão/correção da Fase 4 usam os modelos indicados em cada fase.

**Contextualização de termos técnicos (todas as fases):** ao apresentar qualquer conceito técnico ao usuário, inclua uma explicação simples entre parênteses. Ex: "banco de dados (onde as informações ficam guardadas permanentemente)", "migration (script que cria/altera a estrutura do banco)", "branch (ramificação isolada do código)". O objetivo é que qualquer pessoa entenda sem pesquisar.

---

## Fase 1 — Explore

Refinamento da ideia antes de qualquer linha de código.

**Quando NÃO usar (encerre e oriente):** usuário já tem plano claro → pule pra Fase 2; está debugando algo existente → `debugging`; mudança pontual e trivial (ex: "muda a cor do botão") → faça direto.

### Passo 1 — Entender o problema real
Antes de perguntar, mapeie suposições ocultas e pontos cegos. Pergunte **uma por vez**, em ordem de dependência, e **ofereça uma resposta recomendada** junto:
> "Isso vai persistir no banco ou só viver em sessão? Sugiro banco, porque você vai querer histórico por usuário."

Foco: o quê, para quem, critério de sucesso, restrições, casos de borda, integrações afetadas.

### Passo 1.5 — Threat modeling (se tocar em auth, dados ou integrações externas)
Explique que é uma análise pra identificar o que pode dar errado antes de construir. Documente:
- **Ativos** — quais dados são sensíveis? há dinheiro envolvido?
- **Atacantes** — usuário malicioso autenticado, externo, bot, insider
- **Vetores** (marque os relevantes e explique cada um em linguagem simples): IDOR (acesso a dados de outro usuário), SQL injection (manipulação do banco via formulário), XSS (script malicioso no navegador de outro), CSRF (ação sem o usuário saber), race condition (dois processos simultâneos), upload malicioso, brute force, prompt injection (se houver IA). Checklist completo em REFERENCE.md.

Classifique por probabilidade × impacto (🔴 Alta / 🟡 Média / 🟢 Baixa). Riscos 🔴 viram tasks explícitas na Fase 2.

### Passo 1.7 — Benchmark / referência (se a feature tiver paralelo no mercado)
Se for algo que produtos conhecidos já resolvem (login social, carrinho, chat, agendamento, paywall), **pergunte se há referência**:
> "Tem algum produto/tela de referência pra usar como base? (ex: 'o agendamento do Calendly'). Me manda o nome ou um print que eu adapto o design."

Com referência → use como âncora nos fluxos do Passo 3. Sem → siga boas práticas e diga em que está se baseando. Pule pra features sem paralelo óbvio.

### Passo 2 — Explorar alternativas
Apresente 2–3 abordagens (o que faz, vantagem, desvantagem/risco). Recomende uma com justificativa. Aguarde o usuário escolher.

### Passo 3 — Apresentar o design (detalhado)
Com a abordagem escolhida, descreva em seções curtas (uma por vez, aguardando confirmação). **Descreva como a feature vai se comportar de verdade:**
- **O que será criado/modificado** — telas, endpoints, modelos de dados.
- **Fluxos passo a passo** — caminho do usuário do início ao fim, o que vê e clica em cada etapa. Fluxo principal (feliz) + alternativos (erro, vazio, cancelamento).
- **Comportamentos esperados** — loading, mensagens de sucesso/erro, o que acontece em cada ação.
- **Regras de negócio** — condições e restrições explícitas (ex: "só admin aprova", "limite de 3 tentativas"). Liste cada uma e confirme.
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

Critério por task:
```
- [ ] 1. Criar model X — `app/models/x.rb`
       em_resumo: guarda as informações de X de forma permanente
       depends_on: []
       ✓ Pronto quando: migration roda sem erro e o dado pode ser consultado
```

### Passo 2 — Dependências e grupos paralelos
Para cada task declare `depends_on: [ids]`. Calcule grupos paralelos via topological sort (ver REFERENCE.md). Apresente: "X tasks em Y grupos, Z em paralelo no pico".

### Passo 3 — Backup antes de migration
**Se qualquer task tocar em schema** (`prisma/schema.prisma`, `db/migrate/`, `prisma/migrations/`): adicione **task T00 obrigatória** no Grupo 1 — "Backup local + remoto antes de migration". Todas as tasks de schema dependem de T00.

### Passo 4 — Aprovar e criar branch
Apresente o plano completo, aguarde aprovação, ajuste. Proponha nome (`tipo/descricao-em-kebab-case`; tipos: `feat` nova funcionalidade, `fix` correção, `refactor` melhoria interna, `chore` manutenção — explique cada um). Após confirmação:
```bash
git fetch origin && git checkout main && git pull origin main && git checkout -b <nome>
```

### Passo 5 — Salvar plano
Salve em `.plans/plan.md` na raiz (formato em REFERENCE.md). Sobrescreva se existir. Garanta `.plans/` no `.gitignore`.

**Gate:** "Plano salvo. Quer que eu execute com subagentes em paralelo (Fase 3)?"
Se não → encerra na branch criada.

---

## Fase 3 — Execute

O líder (este agente, em **Opus 4.8 High**) orquestra; quem escreve código são os subagentes em **Sonnet 4.6 Médio**.

1. Lê `.plans/plan.md`, reconstrói o grafo de dependências. Se houver task T00 de backup, valide que o backup completou antes de lançar qualquer task de schema.
2. Para cada grupo paralelo em ordem topológica:
   - Lança um `Agent(isolation: "worktree", model: "sonnet")` por task no grupo — **sempre `model: "sonnet"`**, esforço Médio (instrua no prompt). O líder nunca delega pra Opus.
   - Cada subagente segue o **ciclo TDD + commit** abaixo.
   - Aguarda todos do grupo concluírem; faz merge de cada worktree de volta à branch principal (ver REFERENCE.md). Se conflito: pausa, descreve, aguarda resolução humana.
3. Atualiza checkboxes no `.plans/plan.md` conforme tasks completam.

### O que cada subagente faz (TDD + smart-commit, inline)

**Passo 0 — Análise prévia.** Leia os arquivos que a task vai tocar. Aplique o **teste de deleção**: "Se eu deletasse esse módulo e reescrevesse quem o usa, o resultado seria pior ou equivalente?" Pior → módulo profundo, pode testar direto. Equivalente → módulo raso, refatore antes (cada passo deixando o código funcionando).

**Ciclo Red-Green-Refactor:**
- 🔴 **RED** — escreva um teste que descreve o comportamento desejado. Rode e confirme que **falha** (valida que o teste é útil).
- 🟢 **GREEN** — escreva o **mínimo** pra passar. Sem elegância, sem antecipação.
- 🔵 **REFACTOR** — com o teste verde, remova duplicação, melhore nomes. Rode e confirme que continua verde.
Repita por comportamento. Nunca escreva produção sem um teste falhando antes; se o teste é difícil de escrever, a interface está errada — redesenhe.

**Commit (smart-commit, inline):**
- Garanta os testes verdes (`npm test` / `npx vitest run` / `pytest` / `bundle exec rspec`). Se não houver testes pros arquivos → `test-gate`. Se falhar → `debugging`. Não commite até verde.
- Verifique docs: se o projeto usa `context-docs` (`AGENTS.md` ou `docs/`), atualize AGENTS.md, estrutura de pastas, regras, `docs/features/` e `docs/changelog.md` que ficaram desatualizados. Docs vão no mesmo commit, nunca "depois".
- Agrupe arquivos por contexto lógico (banco / modelos / controllers / componentes / testes / docs / config) e gere um commit por grupo. Mensagem: `tipo: Mensagem` (verbo no presente, maiúscula inicial, sem ponto final; tipos `feat·fix·refactor·perf·docs·style·config`).
- Commite via heredoc. Se hook falhar, corrija e crie **novo** commit. Nunca `--amend` nem `--no-verify`. Sinalize `console.log`/`debugger`/`print` esquecidos antes de commitar.

### Validação (fim da Fase 3, antes da homologação do usuário)
Antes do relatório final, o líder valida o conjunto:
- Roda a suíte de testes completa do projeto.
- Invoca `verify` (Verify do Claude) pra **homologar todos os fluxos impactados** — não só os testes, mas o comportamento real de cada fluxo que a feature tocou (feliz + alternativos do design da Fase 1). O `verify` sobe o app e observa de verdade.
- Se algum fluxo falhar → `debugging`, corrige e revalida antes de seguir.

**Proteções:** máx. 2 ciclos TDD por task antes de pausar; máx. 3 falhas consecutivas para e reporta; máx. 15 tasks por sessão (pede confirmação se exceder).

**Gate:** "Desenvolvimento homologado pelo `verify` e mergeado na branch. Quer publicar agora (Fase 4)? Se preferir aplicar ajustes pontuais antes, é só chamar `maestro fase 4` (ou `maestro publica`) quando terminar."
Se não → encerra na branch, pronta pra fixes manuais e Fase 4 depois.

---

## Fase 4 — Publish

Validação → revisão → push → PR → CI → merge → deploy. Entra aqui direto via `maestro fase 4` / `maestro publica`, mesmo em sessão nova depois de fixes manuais. Dois blocos: **Bloco 1 (análise em paralelo)** → consolidação → correções; **Bloco 2 (pipeline sequencial)**.

### Passo 0 — Commitar pendências
`git status --short`. Se houver mudanças não commitadas, rode o fluxo de commit da Fase 3 (testes → debug → commit agrupado). Working tree limpo → pule.

### Passo 1 — Verificar commits
```bash
git branch --show-current
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null || git log HEAD --oneline -5
```
Se for `main` ou não houver commits novos, informe e encerre.

### Passo 2 — Bloco 1: Análise em paralelo
Tudo aqui depende **só do diff já commitado** → dispare **tudo no mesmo bloco, em paralelo**. Subagentes read-only (só reportam); checks mecânicos na sessão principal. Aguarde todos e consolide no Passo 3.

**Subagentes de revisão (read-only, modelo fixo):**
1. **Segurança/Correção** — `Agent(model: "opus")`, Opus 4.8 High. Aplica os blocos **Funcionalidade**, **Segurança** e **Qualidade** do checklist (REFERENCE.md) sobre `git diff origin/main...HEAD`. Devolve 🚨/⚠️. Protege contra bug indo pra prod — por isso o modelo forte.
2. **UX** — `Agent(model: "sonnet")`, Sonnet 4.6 Médio. Aplica o bloco **UX** do checklist. Devolve 🚨/⚠️.
3. **Documentação** — `Agent(model: "sonnet")`, Sonnet 4.6 Médio. Verifica se README, docs e comentários públicos refletem o diff. Lista o desatualizado/faltando — só reporta (update vem no Passo 4).

**Checks mecânicos (sessão principal, mesmo bloco):**
- **Código de debug:** busca no diff `console.log`, `debugger`, `print(`, `puts `, `p `, `pp `, `var_dump`, `dd(`.
- **Testes:** `npm test` / `npx vitest run` / `pytest` / `bundle exec rspec`.
- **Regressão:** mapeia specs dos arquivos alterados (diretos + adjacentes) e roda só eles:
  ```bash
  git diff origin/main...HEAD --name-only
  git diff origin/main...HEAD --name-only | sed 's|app/||; s|\.rb$|_spec.rb|' | xargs -I{} find spec -name "$(basename {})" 2>/dev/null
  bundle exec rspec <specs>
  ```
  Adapte o mapeamento se outro framework. Sem specs → informe.
- **Auditoria** (só npm): `npm audit 2>/dev/null || true`. Qualquer severidade conta.

### Passo 3 — Consolidação e gates
Relatório **único** — review (3 subagentes) + checks:
- 🚨 BLOQUEANTE — falhas de teste/regressão, vulnerabilidades pendentes, achados críticos. Resolver antes de prosseguir.
- ⚠️ SUGESTÃO — melhorias de review/UX, docs desatualizadas. Pergunte o que aplicar agora.

Bloqueios: teste/regressão vermelho → `debugging`, não prossegue até verde. Vulnerabilidade de qualquer severidade → bloqueia (lista pacotes+CVE, roda `npm audit fix` não-breaking; remanescentes → sugere `--force` breaking, upgrade manual ou override). Debug code → pergunta remover ou seguir.

### Passo 4 — Aplicar correções escolhidas
As que o usuário escolher (🚨 + ⚠️ aceitas, **incl. docs**) → subagentes `Agent(model: "sonnet")`, Sonnet 4.6 Médio, **nunca inline**. Arquivos diferentes → paralelo; mesmo arquivo → um subagente sequencial; uma só → ainda via subagente. Depois, a sessão principal **re-roda testes + regressão** (quebrou → `debugging`). Correções entram no commit antes do push.

### Passo 4.1 — Registrar sugestões não atendidas
Para cada ⚠️ que o usuário **não** aplicou: procure `fixes-futuros.md`/`FIXES-FUTUROS.md`/`TODO.md` (`find . -maxdepth 3 ...`). Se achar → append `## <data>` + descrição. Se não → crie `docs/fixes-futuros.md` (ou na raiz). Informe o arquivo. Se aplicou todas ou não havia, pule.

### Passo 5 — Verificação e roteiro manual
Confirme: fluxo principal funciona (resultado exato)? se bug, não ocorre mais? regressão passa? dados existentes não corrompidos? Liste fluxos afetados e gere roteiro executável por quem não escreveu o código. Aguarde confirmação.

### Passo 5.5 — Backup obrigatório antes de migration
Cheque schema no diff: `git diff origin/main...HEAD --name-only | grep -E "(db/migrate|prisma/migrations|prisma/schema\.prisma|schema\.sql)"`. Se houver, **antes de prosseguir**:
- **Local:** `pg_dump <db> > backup-local-$(date +%Y%m%d-%H%M).sql` (ou via `docker exec <container> pg_dump ...`).
- **Remoto (Heroku):** `heroku pg:backups:capture --app <staging>` e `--app <prod>`; aguarde `Completed` (`heroku pg:backups --app <prod>`).
- **Release script:** `cat Procfile | grep release`. Se usar `prisma db push --accept-data-loss`, avise: **"migrations SQL serão IGNORADAS, drops aceitos sem confirmação. Backup OBRIGATÓRIO. Backfills manuais via `heroku run`/`pg:psql`."**
Backup falhou/impossível → **PARE** e peça intervenção humana.

### Passo 6 — Push
```bash
git fetch origin && git rebase origin/main
git push -u origin HEAD
```
Conflito no rebase → liste arquivos, aguarde resolução. Histórico divergente → ofereça `--rebase` ou `--force-with-lease`.

### Passo 7 — Staging
O push do Passo 6 dispara o deploy de staging. Informe e prossiga sem aguardar.

### Passo 8 — Abrir ou editar PR?
`gh pr view --json number,title,state 2>/dev/null`. PR existente → "Atualizar?" (não → encerra; sim → Passo 9 modo edição). Sem PR → "Abrir agora?" (não → encerra; sim → Passo 9 modo criação). Se chamada com foco em PR e push feito, pule pro 9.

### Passo 9 — Detectar mudanças de infraestrutura
No diff, verifique: novas env vars (`process.env.`, `ENV[`, `Rails.application.credentials`), novos serviços externos, migrações, mudanças em Dockerfile/CI/config. Se houver, **crie seção própria** no corpo do PR (nunca enterre em "outros ajustes"), listando vars com descrição e exemplo.

### Passo 10 — Gerar título e corpo
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

### Passo 10.1 — Remover plano de sessão
Se `.plans/plan.md` existir, remova antes do push: `rm -f .plans/plan.md`.

### Passo 11 — Changelog e criar/editar PR
Changelog não-técnico: ✨ Novidades | 🐛 Correções | ⚡ Melhorias. Exiba título, corpo e changelog; aguarde aprovação.
- Criação: `gh pr create --draft --title "<t>" --body "<corpo>"` + `gh pr comment <n> --body "## 📋 Changelog\n\n<changelog>"`
- Edição: `gh pr edit --title "<t>" --body "<corpo>"` + comment do changelog.
Exiba a URL.

### Passo 12 — Aguardar CI
`gh pr checks --watch --fail-fast`. Os testes locais (Passo 2) cobrem só a máquina; o CI roda a suíte completa.
- Todos verdes → exiba `gh pr checks` e siga.
- Algum falhou → não encerre: `gh run list --branch "$(git branch --show-current)" --limit 1 --json databaseId,conclusion` + `gh run view <id> --log-failed`. Apresente o check vermelho, últimas ~50 linhas do log e o link. Acione `debugging` com o log. CI vermelho bloqueia encerramento.

### Passo 13 — Merge na main
Pré-requisito: Passo 12 todo verde (confirme com `gh pr checks` = `pass`). **Reverificar rebase:** entre o push e agora a `main` pode ter andado:
```bash
git fetch origin
git log --oneline HEAD..origin/main   # se trouxer commits, precisa rebase
```
Se andou → avise, `git rebase origin/main` (conflito → resolução manual), `git push --force-with-lease`, **volte ao Passo 12** pra revalidar o CI. Senão prossiga.

Pergunte: "Todos os CIs passaram. Quer mergear na main?" Não → encerra exibindo a URL. Sim → `gh pr merge --merge` (ou `--squash`/`--rebase` conforme o repo; **nunca `--delete-branch`**). Se o repo deleta head branch automaticamente, avise e confirme. Exiba o SHA do merge. **Não rode `git branch -d` nem `git push origin --delete`.**

### Passo 14 — Deploy em produção (Heroku)
Pré-requisito: merge concluído. `git remote | grep heroku`. Sem remote → informe como configurar (`heroku git:remote -a <app>`) e encerre. Com remote → "Deploy em produção agora?" (não → encerra com o SHA).

**Migrações pendentes:** `git diff HEAD~1..HEAD --name-only | grep -E "(db/migrate|prisma/migrations|prisma/schema)"`. Se houver, antes do push confirme: backup do 5.5 completo e listado em `heroku pg:backups`? release usa `--accept-data-loss` (migrations SQL não rodam → backfills manuais)? Avise que `heroku rollback` pode recriar colunas/tabelas vazias — backup é a única rede real.

```bash
git push heroku main
```
Falha por histórico divergente → ofereça `--force-with-lease` (nunca `--force` sozinho). Migrações: `heroku run rails db:migrate` (aguarde sucesso). Verifique: `heroku ps` + `heroku releases --num 1`. Dynos up → exiba `vN` e "Deploy concluído". Crash → `heroku logs --tail --num 50` + `debugging`; não encerre enquanto crashar.

---

## Entrada direta por fase

| Contexto | Fase |
|---|---|
| Ideia vaga / "como fazer X" | Fase 1 |
| Design definido / "planeja isso" | Fase 2 |
| `.plans/plan.md` já existe | Fase 3 |
| Branch desenvolvida + fixes aplicados / "maestro publica" | Fase 4 |

## Regras

- Gates de confirmação entre fases são obrigatórios — nunca avance sem resposta explícita
- Nunca implemente durante Fase 1 ou 2; nunca proponha código durante a Fase 1
- Se task for ambígua, para e pergunta antes de lançar o subagente
- **Modelos:** líder Opus 4.8 High; dev (Fase 3) e correções (Fase 4) em `model: "sonnet"` Médio; revisão de Segurança (Fase 4) em `model: "opus"` High
- **Backup antes de migration é inegociável** — task T00 (local + remoto) na Fase 2/3; backup do Passo 5.5 antes de qualquer deploy com schema
- Bloco 1 da Fase 4 roda em paralelo; correções nunca inline (subagentes Sonnet); Bloco 2 (push→deploy) é estritamente sequencial
- Nunca use `--force` sozinho, sempre `--force-with-lease`; **nunca delete a branch**; nunca `--amend`/`--no-verify`
- CI vermelho bloqueia o encerramento; merge só com CI 100% verde
- Changelog legível por não-desenvolvedor; "O que tem mais risco" nunca em branco
