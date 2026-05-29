---
name: publish
description: Use para publicar código e/ou abrir PR. Ativa quando o usuário diz "faz o
push", "sobe a branch", "publica a branch", "abre o PR", "sobe o PR", "cria o PR".
Valida código, faz revisão, push e opcionalmente abre PR como draft.
---

# Publish

Um fluxo só: validação → revisão → push → PR opcional.

**Modelos:** o publish roda na sessão principal (recomendado: Opus 4.8 High, dado o risco de prod/migrations). Etapas terceirizadas para subagentes com modelo fixo: a **revisão do Passo 4** (Segurança/Correção em Opus 4.8 High + UX em Sonnet 4.6 Médio, read-only) e a **implementação das correções escolhidas** (Sonnet 4.6 Médio). Steps com efeito colateral ou gate (backup, push, merge, deploy) nunca viram subagente.

## Processo

### Passo 0 — Commitar mudanças pendentes (smart-commit)
```bash
git status --short
```
Se houver mudanças não commitadas (modificadas, novas ou em stage), **acione `smart-commit`** — ele cuida de testes → debug → commit, agrupando por contexto lógico. Não faça `git add`/`git commit` manualmente aqui.
Se o working tree estiver limpo, pule para o Passo 1.

### Passo 1 — Verificar commits
```bash
git branch --show-current
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null || git log HEAD --oneline -5
```
Se for `main` ou não houver commits novos, informe e encerre.

### Passo 2 — Verificar código de debug
Busque no diff: `console.log`, `debugger`, `print(`, `puts `, `p `, `pp `, `var_dump`, `dd(`.
Se encontrar, pergunte: remover automaticamente ou seguir mesmo assim?

### Passo 3 — Rodar testes
```bash
npm test / npx vitest run / pytest / bundle exec rspec
```
Se falhar, acione `debugging`. Não prossiga até todos estarem verdes.

### Passo 3.1 — Auditar dependências
```bash
npm audit 2>/dev/null || true
```
Se houver vulnerabilidades de QUALQUER severidade (HIGH, MODERATE, LOW ou CRITICAL):
- Liste os pacotes afetados com severidade e CVE
- **Informe que o publish está bloqueado até correção**
- Execute automaticamente `npm audit fix` para correções não-breaking
- Se remanescerem vulnerabilidades, liste-as e sugira:
  - `npm audit fix --force` (atenção: breaking changes)
  - Upgrade manual de pacotes específicos
  - Análise de override se for falso positivo

**Não prossiga com o PR enquanto houver vulnerabilidades pendentes.**

Se o projeto não usar npm, pule este passo.

### Passo 3.2 — Testes de regressão

Identifique os arquivos alterados no diff e localize os specs relacionados — tanto os diretos quanto os de funcionalidades adjacentes que usam os mesmos arquivos ou camadas:

```bash
# Arquivos alterados
git diff origin/main...HEAD --name-only

# Specs candidatos (Rails)
git diff origin/main...HEAD --name-only | sed 's|app/||; s|\.rb$|_spec.rb|' | xargs -I{} find spec -name "$(basename {})" 2>/dev/null

# Rodar apenas os specs encontrados
bundle exec rspec <lista de specs>
```

Se o projeto usar outro framework, adapte o mapeamento `arquivo → spec`.

Se algum spec falhar: **bloqueie** e acione `debugging`. Não prossiga até verde.
Se nenhum spec for encontrado para os arquivos alterados: informe e continue.

### Passo 4 — Revisão de código e UX (dois subagentes em paralelo)

A revisão é read-only (analisa o diff, não edita). Lance **dois subagentes em paralelo**, cada um com modelo fixo, e mantenha a sessão principal só orquestrando:

1. **Subagente de Segurança/Correção** — `Agent(model: "opus")`, **Opus 4.8 High** (instrua o esforço High no prompt). Aplica os blocos **Funcionalidade**, **Segurança** e **Qualidade** do checklist (ver REFERENCE.md). Recebe o diff (`git diff origin/main...HEAD`) e devolve uma lista de achados 🚨/⚠️. É a etapa que protege contra bug indo pra prod — por isso o modelo forte.
2. **Subagente de UX** — `Agent(model: "sonnet")`, **Sonnet 4.6 Médio** (instrua o esforço Médio no prompt). Aplica o bloco **UX** do checklist. Devolve achados 🚨/⚠️.

Ambos são read-only e independentes → rode no mesmo bloco, em paralelo. A sessão principal **consolida** os dois relatórios e apresenta um relatório único:
- 🚨 BLOQUEANTE — corrija antes de prosseguir
- ⚠️ SUGESTÃO — pergunte se quer aplicar

Os gates (corrigir? aplicar sugestão?) acontecem na sessão principal com o usuário — os subagentes só analisam e reportam.

**Aplicar as correções escolhidas (subagentes Sonnet 4.6 Médio):** depois que o usuário decide o que aplicar agora (🚨 obrigatórios + ⚠️ sugestões escolhidas), a implementação é feita por subagentes `Agent(model: "sonnet")` em **Sonnet 4.6 Médio** (instrua o esforço Médio no prompt) — não pela sessão principal. Cada subagente recebe a descrição exata do achado e implementa.

- **Mais de uma correção em arquivos diferentes** → subagentes **em paralelo**, um por correção (mesmo bloco).
- **Correções no mesmo arquivo** → um único subagente, sequencial, para evitar conflito de edição.
- **Uma só correção** → ainda via subagente Sonnet 4.6, não inline.

Depois que os subagentes terminam, a sessão principal **re-roda os testes relevantes** (Passos 3 e 3.2); se algo quebrar → aciona `debugging`. As correções aplicadas entram no commit antes do push (Passo 6).

### Passo 4.1 — Registrar sugestões não atendidas

Para cada ⚠️ SUGESTÃO do Passo 4 que o usuário optou por **não** aplicar agora:

1. Verifique se existe um arquivo de melhorias futuras no projeto:
   ```bash
   # Procura candidatos comuns
   find . -maxdepth 3 -name "fixes-futuros.md" -o -name "FIXES-FUTUROS.md" -o -name "TODO.md" 2>/dev/null | head -5
   ```

2. **Se encontrar** o arquivo → append ao final:
   ```markdown
   
   ## <data de hoje>
   
   - <descrição objetiva da sugestão>
   ```

3. **Se não encontrar** → crie `docs/fixes-futuros.md` (ou `fixes-futuros.md` na raiz se não houver pasta `docs/`) com:
   ```markdown
   # Fixes Futuros
   
   Sugestões identificadas durante revisão de código que não foram aplicadas imediatamente.
   
   ## <data de hoje>
   
   - <descrição objetiva da sugestão>
   ```

4. Informe o usuário qual arquivo foi criado/atualizado.

Se **todas** as sugestões foram aplicadas ou não havia sugestões, pule este passo.

### Passo 5 — Verificação e roteiro de teste manual

Antes de prosseguir, confirme:
- [ ] Fluxo principal funciona? (resultado exato, não "parece certo")
- [ ] Se for correção de bug: o comportamento problemático não ocorre mais?
- [ ] Testes de regressão passam? (funcionalidades que usam os mesmos arquivos)
- [ ] Dados existentes não foram corrompidos pela mudança?

Liste os fluxos afetados e gere roteiro executável por quem não escreveu o código.
Aguarde confirmação do usuário antes de prosseguir.

### Passo 5.5 — Backup obrigatório antes de migration

**Cheque se o diff inclui mudança de schema** (arquivos em `db/migrate/`, `prisma/migrations/`, `prisma/schema.prisma`, `schema.sql`):
```bash
git diff origin/main...HEAD --name-only | grep -E "(db/migrate|prisma/migrations|prisma/schema\.prisma|schema\.sql)"
```

Se houver **qualquer** mudança de schema, **antes de prosseguir** faça backup:

**Local** (se houver banco local rodando):
```bash
# Postgres em Docker
docker exec <nome-container-db> pg_dump -U <user> <db> > backup-local-$(date +%Y%m%d-%H%M).sql
# Postgres local instalado
pg_dump <db> > backup-local-$(date +%Y%m%d-%H%M).sql
```

**Remoto** (se Heroku):
```bash
heroku pg:backups:capture --app <nome-app-staging>
heroku pg:backups:capture --app <nome-app-prod>
# Aguarde Status: Completed
heroku pg:backups --app <nome-app-prod> | head -5
```

**Atenção ao release script:**
```bash
cat Procfile | grep release
```
Se o release usar `prisma db push --accept-data-loss` (em vez de `prisma migrate deploy`), avise o usuário explicitamente: **"migrations SQL serão IGNORADAS — o release vai aceitar drops sem confirmação. Backup é OBRIGATÓRIO. Backfills/transformações precisam ser rodados manualmente via `heroku run` ou `heroku pg:psql`."**

Se o backup falhar ou não puder ser feito, **PARE** e peça intervenção humana. Não prossiga sem confirmar que existe backup recente.

### Passo 6 — Push
```bash
git fetch origin && git rebase origin/main
git push -u origin HEAD
```
Se conflito no rebase: liste arquivos e aguarde resolução manual.
Se histórico divergente: ofereça `--rebase` ou `--force-with-lease`, aguarde escolha.

### Passo 7 — Subir em staging

O push feito no Passo 6 dispara o deploy de staging automaticamente. Informe o usuário e prossiga sem aguardar confirmação.

### Passo 8 — Abrir ou editar PR?
Verifique se já existe PR para a branch:
```bash
gh pr view --json number,title,state 2>/dev/null
```

- **PR existente** → pergunte: "Quer atualizar o PR existente?"
  - **Não** → encerre
  - **Sim** → continue para Passo 9 (modo edição)
- **Sem PR** → pergunte: "Quer abrir PR agora?"
  - **Não** → encerre
  - **Sim** → continue para Passo 9 (modo criação)

Se chamada com foco em PR ("abre o PR", "atualiza o PR") e push já foi feito, pule direto para o Passo 9.

### Passo 9 — Detectar mudanças de infraestrutura

Antes de redigir o corpo, verifique no diff se o PR introduz:
- Novas variáveis de ambiente (`process.env.`, `ENV[`, `Rails.application.credentials`)
- Novos serviços externos (storage, filas, APIs de terceiros)
- Migrações de banco de dados
- Alterações em Dockerfile, CI/CD ou configuração de servidor

Se encontrar qualquer um desses, **crie uma seção própria** no corpo do PR — nunca enterre em "outros ajustes". A seção deve listar as vars com descrição e exemplo de valor.

### Passo 10 — Gerar título e corpo
**Formato:** `tipo: Mensagem no presente, sem ponto final`
**Tipos:** `feat` | `fix` | `refactor` | `perf` | `docs` | `config`

```markdown
### O que esse PR faz
[2-3 frases — foco no "o quê" e "para quê"]

### [Nome do serviço/infra] — se detectado no Passo 9
**Variáveis de ambiente necessárias em produção:**
\`\`\`
VAR_NAME=valor_exemplo   # descrição
\`\`\`

### Fora do escopo
[O que este PR deliberadamente NÃO faz]

### Decisões técnicas relevantes
[Por que foi implementado assim. Abordagens descartadas]

### O que tem mais risco
[Onde um erro seria mais grave]

### O que testar
- [ ] [Fluxo]: [passos e resultado esperado]
- [ ] Regressão: [fluxos adjacentes]
```

### Passo 10 — Remover plano de sessão (se ralph-loop)
Se `.plans/plan.md` existir e este PR faz parte de um ralph-loop, remova antes do push:
```bash
rm -f .plans/plan.md
```

### Passo 11 — Changelog e criar/editar PR
Em linguagem não-técnica: ✨ Novidades | 🐛 Correções | ⚡ Melhorias

Exiba título, corpo e changelog. Aguarde aprovação do usuário.

**Modo criação** (sem PR existente):
```bash
gh pr create --draft --title "<título>" --body "<corpo>"
gh pr comment <número> --body "## 📋 Changelog\n\n<changelog>"
```

**Modo edição** (PR já existe):
```bash
gh pr edit --title "<título>" --body "<corpo>"
gh pr comment <número> --body "## 📋 Changelog\n\n<changelog>"
```

Exiba a URL do PR ao final.

### Passo 12 — Aguardar CI

Depois de criar/editar o PR, aguarde o CI do GitHub terminar. Os testes locais (Passo 3) cobrem só o que roda na sua máquina; o CI roda a suíte completa (unit_tests paralelos, system_tests, linter, etc).

```bash
gh pr checks --watch --fail-fast
```

- **Todos verdes** → exiba o resumo (`gh pr checks`) e encerre.
- **Algum check falhou** → não encerre. Faça:
  ```bash
  # Identificar o run e os jobs que falharam
  gh run list --branch "$(git branch --show-current)" --limit 1 --json databaseId,conclusion
  gh run view <run-id> --log-failed
  ```
  Apresente:
  - Nome do check vermelho (ex: `CI / Test system_tests`)
  - Trecho relevante do log (últimas 50 linhas do job que falhou)
  - Link direto pro run no GitHub

  Em seguida, acione automaticamente a skill `debugging` passando o log como contexto. Não encerre o publish enquanto o CI estiver vermelho — depois do fix, o usuário roda `publish` de novo e o ciclo recomeça do Passo 1.

### Passo 13 — Merge na main

**Pré-requisito:** Passo 12 terminou com todos os checks verdes. Se algum check estiver vermelho, pulando ou pendente, **não ofereça merge** — volte para o Passo 12.

Confirme com `gh pr checks` que o estado é `pass` em todos antes de perguntar.

**Reverificar rebase antes do merge:** entre o push (Passo 6) e agora, a `main` pode ter avançado (outros PRs mergeados). Cheque se a branch ainda está em cima da `main`:
```bash
git fetch origin
git log --oneline HEAD..origin/main   # se trouxer commits, a main andou — precisa rebase
```
Se a `main` avançou:
- Avise o usuário e rode `git rebase origin/main`.
- Se houver conflito: liste os arquivos e aguarde resolução manual; não mergeie até resolver.
- Após o rebase, `git push --force-with-lease` (nunca `--force` sozinho) e **volte ao Passo 12** para reconfirmar o CI sobre o novo HEAD antes de mergear.
Se nada veio do `fetch`, a branch está atualizada — prossiga.

Pergunte: "Todos os CIs passaram. Quer mergear na main agora?"
- **Não** → encerre exibindo a URL do PR.
- **Sim** → execute:
  ```bash
  gh pr merge --merge
  ```

**Importante — não deletar a branch:**
- Use `--merge` (merge commit), `--squash` ou `--rebase` conforme padrão do repo, mas **nunca** passe `--delete-branch`.
- Se o repositório tiver "automatically delete head branches" ligado no GitHub, avise o usuário que a branch será removida pelo próprio GitHub apesar da flag local — e pergunte se quer prosseguir mesmo assim.

Após o merge, exiba o SHA do commit de merge e continue para o Passo 14. **Não rode `git branch -d` nem `git push origin --delete`.**

### Passo 14 — Deploy em produção (Heroku)

**Pré-requisito:** merge na main concluído no Passo 13.

Verifique se o remote Heroku existe:
```bash
git remote | grep heroku
```

- **Remote não encontrado** → informe: "Remote `heroku` não configurado neste projeto. Configure com `heroku git:remote -a <nome-do-app>` e rode o deploy manualmente." Encerre.
- **Remote encontrado** → pergunte: "Quer fazer o deploy em produção agora?"
  - **Não** → encerre exibindo o SHA do merge.
  - **Sim** → prossiga.

**Verificar migrações pendentes:**
Cheque se o diff inclui arquivos em `db/migrate/`, `prisma/migrations/` ou `prisma/schema.prisma`:
```bash
git diff HEAD~1..HEAD --name-only | grep -E "(db/migrate|prisma/migrations|prisma/schema)"
```

Se houver, **antes do `git push heroku main`** confirme:
- [ ] Backup do Passo 5.5 está completo e listado em `heroku pg:backups`?
- [ ] Se release script usa `prisma db push --accept-data-loss`: migrations SQL **não vão rodar** — backfills precisam ser executados manualmente. Liste quais e quando.
- [ ] Avise o usuário: "Este deploy inclui migrations. Em caso de problema, `heroku rollback` PODE recriar colunas/tabelas vazias — backup do Passo 5.5 é a única rede de proteção real."

**Executar deploy:**
```bash
git push heroku main
```

Se o push falhar com histórico divergente, ofereça:
```bash
git push heroku main --force-with-lease
```
Nunca use `--force` sozinho.

**Rodar migrações (se houver):**
```bash
heroku run rails db:migrate
```
Aguarde a confirmação de sucesso antes de continuar.

**Verificar dynos após deploy:**
```bash
heroku ps
heroku releases --num 1
```

- **Dynos up e release criada** → exiba a versão (`vN`) e encerre com: "Deploy em produção concluído."
- **Dyno crashed ou release falhou** → exiba os logs:
  ```bash
  heroku logs --tail --num 50
  ```
  Acione `debugging` com o log. Não encerre enquanto o app estiver em crash.

## Regras
- Revisão do Passo 4 sempre em dois subagentes read-only: Segurança/Correção em `model: "opus"` (High), UX em `model: "sonnet"` (Médio) — consolide os dois relatórios na sessão principal
- Correções escolhidas (🚨 + ⚠️ aceitas) são implementadas por subagentes `model: "sonnet"` (Médio), nunca inline: paralelo em arquivos distintos, sequencial no mesmo arquivo
- Steps com efeito colateral ou gate (backup, push, merge, deploy) nunca viram subagente
- Mudanças não commitadas no início → sempre via `smart-commit`, nunca `git commit` manual
- Reverificar rebase antes do merge — se a `main` avançou, rebasear, dar `--force-with-lease` e revalidar o CI antes de mergear
- Nunca crie PR sem confirmação do usuário
- Nunca use `--force` sozinho, sempre `--force-with-lease`
- Changelog legível por quem não é desenvolvedor
- "O que tem mais risco" nunca em branco sem justificativa
- CI vermelho bloqueia o encerramento — sempre aciona `debugging` com o log do job que falhou
- Merge só com CI 100% verde — não ofereça merge enquanto algum check estiver pendente, pulando ou falhando
- **Nunca delete a branch** — não passe `--delete-branch` no `gh pr merge`, nem rode `git branch -d` ou `git push origin --delete`
