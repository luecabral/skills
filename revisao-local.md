---
name: revisao-local
description: >
  Revisa o código que o usuário acabou de escrever localmente — as mudanças não
  commitadas ou commitadas contra uma base (main/master). Use quando o usuário
  pedir "revise meu código", "dá uma olhada nessas mudanças", "code review do
  que eu fiz", ou similar. Trabalha sobre o diff local via git e filesystem; não
  precisa de PR nem de GitHub.
---

# Revisão local de código

**Contexto de execução:** esta skill roda no diretório de trabalho do usuário, sobre as mudanças que ele acabou de fazer. Não há webhook, PR nem head SHA — o "diff a revisar" é o estado atual do repositório git local. O usuário dispara manualmente.

**Ferramentas:**

- `git` CLI para obter o diff, a lista de arquivos alterados e o histórico.
- Filesystem do repositório para ler arquivos fora do diff, rodar lint/testes e inspecionar contexto adicional.

**Fluxo:**

1. **Definir o escopo da revisão** — descobrir o que revisar, nesta ordem de preferência:
   - Mudanças não commitadas: `git diff` (working tree) e `git diff --staged` (index).
   - Se o working tree estiver limpo, comparar a branch atual com a base: `git diff $(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)...HEAD`. Detectar a base (`main`/`master`) com `git branch -r` / `git symbolic-ref refs/remotes/origin/HEAD`.
   - Se ainda assim não houver nada, ou se houver ambiguidade (working tree + commits novos ao mesmo tempo), perguntar ao usuário qual escopo ele quer antes de prosseguir.
   - Se não há nenhuma mudança em lugar nenhum, dizer isso e encerrar — não inventar uma revisão.

2. **Coletar contexto** — `git diff` (conteúdo), `git diff --name-only` (arquivos) e leitura de `docs/constitution.md` se existir no repositório. Usar o filesystem para ler arquivos relacionados que não estão no diff mas ajudam a entender a mudança (a função chamada, o teste correspondente, o tipo importado). Se houver lint/testes configurados e for barato rodar, rodar — um teste que quebra vale mais que dez comentários de estilo.

3. **Revisar linha a linha** — a saída é entregue aqui na conversa, não postada em lugar nenhum. Estruture assim:
   - Um resumo curto (1-2 linhas) no topo: o que a mudança faz + o veredito.
   - Toda crítica concreta vem **ancorada em `caminho/do/arquivo.ext:linha`** (ou `:linha-inicial-linha-final` para ranges), uma por item, não diluída no resumo.
   - Procure por: bugs, problemas de segurança, violações da Constituição (`docs/constitution.md`), code smells, falta de testes, nomes confusos, custos/latência inesperados.
   - **Checklist de padrões recorrentes do projeto — caçar em toda revisão.** Extraído da análise dos últimos 100 PRs mergeados do majestic_monolith (jul/2026: 371 comentários inline + corpos de review de todos os devs; ~76 bugs reais catalogados). Os caminhos `.claude/rules/*.md` são relativos ao repo sob revisão — noutro projeto, trate-os como os padrões gerais que representam.

     **A. Bugs que mais escapam (as categorias dos bloqueios reais):**
     1. **Concorrência/race.** Check-then-act sem lock (`with_lock`/`lock!` — `concurrency.md`), find-then-create em vez de `create_or_find_by`, double-submit em endpoint de pagamento/estorno, jobs duplicados sem unique lock (sidekiq-unique-jobs v7 exige `Sidekiq::Worker` nativo, não ActiveJob — precedente `Sellers::Zoop::SyncStoreNameJob`), jobs agendados dependentes que podem rodar fora de ordem. Quirk: `Order` faz shadowing de `transaction` — `with_lock` é no-op lá, usar `lock!`. Job/turno de longa duração: capturar o id reivindicado (turn/uid/message id) no claim e passá-lo a TODOS os side effects (heartbeat, broadcast, cleanup no `ensure`) com CAS sob lock — não re-resolver "o atual/mais recente" do estado global (job preemptado fecha o turno errado).
     2. **Dados legados/de produção — o vetor nº 1 de bug.** Coluna nullable: `where(x: false)` não pega `NULL`. Dado armazenado formatado (CPF/CNPJ com pontuação, telefone com máscara) vs input só-dígitos. Registro antigo sem associação (`owner_address` nil, seller sem `fiscal_data`). `position: 0` em massa, histórico vazio, texto legado com `<...>`. Perguntar sempre: "que forma o dado REAL de produção tem?" — teste que monta o dado "limpo" na factory mascara exatamente isso.
     3. **Cobertura incompleta entre caminhos irmãos — foi 2 dos bloqueios reais.** Ao portar/alinhar comportamento OU corrigir bug, o PR quase sempre trata só o caminho do ticket. Enumerar TODOS os irmãos e conferir cada um: `Order` × `ExternalOrder`, produto × kit, action `edit` × `update` (e o `only:` do guard), endpoint admin × API, outro meio de pagamento/canal, demais estados da mesma whitelist, gate da view × policy, corpo × aside. Casos concretos: guard/`before_action` que ainda codifica a invariante ANTIGA depois de o fix mudar o significado dela; contrato de erro (status + formato do corpo) divergente do endpoint irmão. Cada irmão coberto — ou virou card.
     4. **Falha silenciosa / causa errada.** Erro engolido só com `Rails.logger.warn` quando o padrão é Rollbar (ver `payment_worker.rb`); sucesso reportado errado ("N incluídos" quando validações falharam em silêncio; `status: applied` em ação vazia); filtro inválido ignorado devolvendo o catálogo inteiro; toda falha atribuída à mesma causa na mensagem ao usuário. Telemetria que mente: métrica com nome de chave que não existe na fonte (= métrica morta, o emissor descarta não-numérico em silêncio), log com `status: 200` default mascarando erro, métrica espelhada somada (dobra) ou distribuída lida de um nó só (subconta) — validar contra o payload real.
     5. **Semântica de nil/boolean/param.** `params[:x].present?` é true para `"false"`; `||=` não distingue nil explícito de argumento ausente (usar sentinel); validação assimétrica entre filtros (um inválido → 422, outro → nil silencioso).
     6. **Ordenação e paginação.** `.paginate` sem `.order` determinístico pula/repete registros entre páginas (tiebreaker `id`); `pg_search` injeta `ORDER BY rank` e `.order` só acrescenta — usar `.reorder`; empate de `position` (default 0) quebra paginação offset.
     7. **Callbacks × operações em lote/cópia.** `destroy_all` com `before_destroy` que recalcula estado corrompe dados (posições `[1,2,4]`); `dup` copia campo que devia resetar (`problem_solved_at`); `after_commit` na criação roda antes das associações existirem; operação em massa que pode gerar registro inválido derruba o batch inteiro via rollback.
     8. **Estado congelado no boot.** Data/`Time.zone.now` interpolada em constante de classe ou `DESCRIPTION` de tool (congela no deploy); ENV parseada no load sem guard de ambiente derruba o boot de dev/CI; initializer também roda no Sidekiq.
     9. **Retry e idempotência.** Erro de negócio permanente (400/409) retentável queima os retries — separar `TERMINAL_ERRORS`; job com efeito misto reenvia e-mail já enviado no retry (side effect pro fim + guard); HTTP externo dentro de `transaction` só com justificativa; timeout sem `http_code` não pode virar resposta replayável por Idempotency-Key.
     10. **Segurança.** CSV injection em export (`=`/`+` viram fórmula — `csv_safe`); lookup sem escopo da loja (`find_by(id:)` cru = IDOR; sempre `current_store.xxx`, inclusive em classe cujo caller "já valida"); policy com self-lockout (revogar o último recurso trava o próprio gate); input sem teto (número > bigint → 500, base64 decodificado antes do check de tamanho, anexos sem limite de quantidade); PII para terceiros (`db_statement: :obfuscate`).
     11. **Estado/branch inalcançável e código morto.** Condição que nenhum fluxo real produz (só factory alcança) — mapear os fluxos antes de aceitar o estado; `rescue` de exceção que o código não levanta; `t(...)` sem `default:` em estado alcançável (= "translation missing" na vitrine); action/view/rota/spec/config órfãos após substituição; alterar template/rota inalcançável sem perceber.
     12. **Regex sobre texto livre ou dado serializado.** Padrão sem âncora/contexto casa demais (qualquer chave `*_count`; termo solto longe do alvo bloqueia pedido legítimo) — rodar com inputs reais legítimos E adversariais. Pra ler dado estruturado próprio, persistir/parsear como JSON por chave, não regex sobre a string.
     13. **Tools interativas de chat (preview→confirm→apply).** O `apply` revalida o estado no momento da execução (não confia no que o preview computou — janela TOCTOU); o preview não promete ação que o estado já invalida ("vou criar X" quando já existe); tratar interação pendente pré-existente ao abrir novo card; toda saída do resume (quota estourada, erro, cancel) dá feedback ao usuário.
     14. **Acessibilidade e consistência de UI.** Ação disponível só em `group-hover` (inacessível em touch/teclado); `aria-expanded` não atualizado; célula sem `<a href>` que as vizinhas têm (quebra clique sem-JS e leitor de tela — `frontend.md`); mensagem de erro trocada (erro de tamanho exibido como "formato inválido").

     **B. Convenções do projeto (viram pedido de mudança em review):**
     15. **Specs.** Sem `let`/`before` em código novo (`tests.md`, WET; não herdar a violação do arquivo legado) — EXCEÇÃO reconhecida pelo time: request specs rswag da INK API, cuja DSL não permite WET. `describe` em inglês. Model spec em grupos (`docs/testing/model_test.md`). Dado da factory refletindo o dado real do form (URL completa no teste mascara handle salvo pelo form). Teste de regressão deve falhar sem o fix (red/green); teste que stuba o caminho testado ou renderiza uma vez só não prova nada; não remover asserção sem confirmar que ela falhava. Cobertura de linha 100% não prova branch — exigir um exemplo que só passa pelo caminho NOVO (setup que sempre cai no antigo mascara o branch); não remover spec dedicado sem substituto equivalente.
     16. **Comentários.** Exceção, não regra; em inglês; só decisão não-óbvia. No sentido inverso: não remover comentário load-bearing (invariante que não se infere do código).
     17. **Reuso antes de reimplementar.** `ApplicationService` (todos os services herdam), `redirect_back(fallback_location:)`, `toggle!` no model, ink_components (`badge_component`, `dropdown_component`) antes de markup manual, `HasStateMachine` pra ciclo de vida, nativos (`normalizes`, `previously_new_record?`, `create_or_find_by`, `signed_id`), gem `cpf_cnpj` pra documentos, i18n com chave única composta e lazy lookup aninhado por action (`locales.md`).
     18. **Cargo-culting de arquivo irmão.** Linha espelhada cuja premissa não vale no destino (`reorder(nil)` sem `default_scope`, `Arel.sql`/`NULLS LAST` em coluna não-nullable). Duplicação em 2+ lugares → extrair — MAS duplicação entre domínios distintos pode ser intencional (`Order` × `ExternalOrder`, desacoplamento é valor do time); confirmar antes de flagrar.
     19. **Lugar da lógica.** Regra de domínio no model/PORO, não em operation/controller/tool (duplicar a regra no tool cria risco de divergência — `models.md`, `actors.md`); actors para orquestração de escrita; callbacks como métodos `private`; placement engine × monólito conforme `architecture.md` (atribuir o domínio certo antes de flagrar).
     20. **N+1 e custo de queries.** Teto de 10 queries/request (`queries.md`); NUNCA query individual em loop — `insert_all`/`upsert_all`/window function; `includes` cobrindo TODOS os caminhos (ex.: item customizável); render pesado por linha (modal por linha) → 1 compartilhado; bloco grande em loop → partial; query idêntica repetida 2+ vezes no mesmo request/método (count, lookup de config, `themes.current`) → reusar via variável local. CUIDADO ao sugerir memoização como fix: valor que muda no meio do request (callbacks) não pode ser memoizado cru.

     **C. Gates de PR (verificar antes de abrir):**
     21. **`db/schema.rb`.** O diff contra `origin/main` só pode conter o que as migrations do PR produzem — drift de dump local (colunas reordenadas, `::text` duplicado) e principalmente coluna sem migration (CI usa `schema:load`, produção usa `db:migrate` → ambientes divergem).
     22. **Migrations.** Timestamp posterior à última já em main (colisão/ordem quebra `db:migrate`); zero-downtime (`migrations.md`, strong_migrations); `if_not_exists` + `algorithm: :concurrently` não detecta índice órfão inválido.
     23. **Swagger da INK API.** Regenerar sobre o diretório INTEIRO de specs (subset apaga endpoints); drift além do endpoint do PR declarado na descrição.
     24. **Config de produção.** Scope doorkeeper registrado em `optional_scopes` + seeds (spec com factory pula a validação e passa mesmo quebrado!); env var/feature flag exigida confirmada em produção antes do merge; fallback de env apontando pra staging/dev.
     25. **Descrição do PR fiel ao código.** "Riscos conhecidos" completo; descrição não promete o que o código não faz; corte de escopo vs ticket registrado no ticket; PR stacked declarado (diff contaminado); nunca afirmar "testado/ajustado" sem o teste ter rodado verde.

     **D. Calibragem — falsos-positivos conhecidos (evitar apontamento ruim):**
     - Verificar a premissa EMPIRICAMENTE antes de apontar: rodar a regex com inputs reais, conferir o source da gem, checar se o model já tem guard que curto-circuita o caso.
     - Decisão de UX/produto preexistente ou gate de rollout intencional não é bug (comportamento igual ao form existente; restrição consciente até ticket futuro).
     - Estilo do arquivo legado: exigir convenção só no código novo.
     - Antes de prescrever `create_or_find_by`, checar se o model tem `validates_uniqueness_of`: nesse caso o `create` levanta `RecordInvalid` antes do fallback (que só resgata `RecordNotUnique` do banco) — usar `find_or_create_by!` apoiado em índice único.
     - Prescrever fix é mais arriscado que apontar problema — memoização sugerida já quebrou fluxo real (callback lendo valor stale, refutado com specs). Em dúvida, descrever o problema sem prescrever a solução.

     **O que o time aprova elogiando** (use como norte do "bom"): seguir o padrão das classes irmãs; escopo por loja em todo lookup; preload verificado ponta a ponta; migration zero-downtime; idempotência com índice único; lock certo pro model; controller fino + actor; fonte única de verdade; rename atômico (controller, rota, locale, swagger e specs juntos); specs que falham sem o fix.
   - Não comente o óbvio. Elogio só se agregar informação real (decisão de design não-trivial que ficou boa).
   - Quando houver mudança específica e óbvia a propor, mostre o patch como bloco diff ou como `original → corrigido` inline (ver validação abaixo).

4. **Validação obrigatória antes de entregar** — para cada comentário:
   - **Confirmar a linha.** O trecho problemático precisa estar literalmente na linha citada. Se você mencionou um identificador, string ou expressão entre crases, ela precisa existir lá. Em dúvida, releia o arquivo (`sed -n 'N,Mp' arquivo` ou abra o arquivo) e conte de novo. Cuidado especial com templates dentro de heredocs, código de template embutido em arquivo de outra linguagem, e diffs grandes — off-by-one é o erro mais comum. Lembre que números de linha do `git diff` (`@@ -a,b +c,d @@`) são do arquivo novo a partir do `+`; confira contra o arquivo em disco, não contra a contagem do hunk.
   - **Validar patches sugeridos.** Reler: aplicar a correção produziria código válido? Sem duplicação, sem perda de conteúdo, indentação preservada, sintaxe íntegra? Se o patch toca N linhas, confira que está substituindo exatamente as N linhas originais certas.
   - **Quando preferir prosa em vez de patch.** Use prosa quando o contexto for complexo (templates aninhados, código embutido em outra linguagem), a correção envolver múltiplas linhas não-contíguas, ou houver qualquer dúvida sobre o alvo. Em prosa, cite o trecho entre crases mostrando a mudança (original → corrigido). Menos conveniente, risco zero.

5. **Veredito** — fechar com um dos três:
   - **Aprovado** — mudança boa, sem ressalvas relevantes. Vale para arquivos sensíveis se for trivialmente correta e sem risco (ex.: bump de versão).
   - **Pedir mudanças** — usar com parcimônia. Teste mental: "se isto fizesse merge agora, alguma destas seria verdade? bug funcional em produção, falha de segurança, teste falso-positivo, violação clara e específica da Constituição." Se sim em pelo menos uma → pedir mudanças. Se você escreveu "se preferir manter, tudo bem" em algum comentário, isso por definição não é pedir mudanças.
   - **Comentários** — default em dúvida. Observações sem bloqueio, mesmo que várias.

**Regras:**

- **Tom:** direto e conversacional, como um colega de squad. Sem cabeçalhos pomposos, sem separadores entre seções, sem "Observação de processo". Markdown só onde agrega (code blocks, listas curtas).
- **Arquivos sensíveis** (`secrets`, `.github/workflows/`, scripts de deploy, migrations): avaliar caso a caso. Aprovar só se trivialmente correto e sem risco identificado.
- **Foco no diff:** comente o que mudou. Mencione código fora do diff só quando a mudança o afeta diretamente (ex.: quebrou um contrato que outro arquivo depende).
