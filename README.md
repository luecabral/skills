# Minhas Skills do Claude Code

Skills são instruções que ensinam o Claude Code a se comportar de um jeito específico. Em vez de repetir o mesmo contexto toda vez, você chama a skill por `/nome` e ela já sabe o processo, o que checar e o que entregar.

Este repositório tem **três skills**, cobrindo coisas diferentes: `maestro` conduz o desenvolvimento de uma feature de ponta a ponta, `linear` documenta a task no Linear, e `revisao-local` revisa código que você acabou de escrever, sem precisar de PR.

---

## 🎼 maestro

Ciclo completo de uma feature, da ideia ao deploy, em 4 fases. **É autossuficiente** — todo o processo está escrito dentro do próprio arquivo, então editar outra skill não muda o comportamento dele.

O desenho tem três premissas: a **ideação é o investimento principal**, uma **aprovação só libera todo o desenvolvimento**, e ele **para antes do push** — nada vai pro GitHub sem você homologar com as mãos.

```
💡 IDEIA
    ↓
Fase 1 — EXPLORE ......... pesquisa de mercado (melhores práticas, principais
    ↓                      erros, projetos open source), decisões de base
    ↓                      (regras de negócio, stack, arquitetura, dados),
    ↓                      threat modeling, benchmark, painel de alternativas,
    ↓                      design detalhado dos fluxos
    ↓                      ⏸ gate: aprova o design?
    ↓
Fase 2 — PLAN ............ tasks de vertical slice agrupadas em FASES DA
    ↓                      ENTREGA, cada fase com mapa de modelo por task,
    ↓                      validação e rollback; lista dos pontos onde sua
    ↓                      opinião pesa, resolvidos antes do gate
    ↓                      ⏸ GATE ÚNICO: aprovar a documentação libera todo
    ↓                        o desenvolvimento. Último ponto de opinião.
    ↓
Fase 3 — EXECUTE ......... 🔇 autônoma. Percorre as fases da entrega:
    ↓                      implementa, valida, revisa o diff da fase e
    ↓                      corrige sozinho o que for relevante.
    ↓                      Só duas linhas na tela:
    ↓                        Iniciando fase 4 (3 de 8)
    ↓                        * Task 6 (7 completas de 12)
    ↓                      🛑 PARA ANTES DO PUSH — tudo commitado na branch
    ↓                      local, nada no GitHub
    ↓                      ⏸ entrega: relatório + roteiro de homologação
    ↓
    ├─→ BLOCO DE FIXES ... achou algo homologando? manda o bloco, ele
    ↓                      orquestra os subagentes e volta pro mesmo ponto
    ↓
Fase 4 — PUBLISH ......... só quando você mandar: review final → reorganiza
                           os commits → push → UM PR → CI → merge → deploy
                           ⏸ stops: quais correções aplicar, merge, deploy
```

Entra direto em qualquer fase: `maestro fase 2`, `maestro planeja`, `maestro executa`, `maestro corrige`, `maestro publica`.

### As regras que definem o comportamento dele

**A ideação é onde você entra.** Fase 1 e 2 são longas de propósito: é o único momento em que você decide. O plano lista separado **os pontos onde sua opinião pesa** (no máximo 5) e resolve todos antes do gate — o que não for decidido ali vira decisão dele durante a execução, sem você poder opinar.

**Uma aprovação libera tudo, e ela para antes do push.** Aprovada a documentação, ele desenvolve as N fases da entrega sozinho e não pergunta nada no meio. Quando acaba, está tudo commitado **na branch local**: sem push, sem PR, sem CI, sem deploy. A regra escrita no arquivo é que a aprovação da Fase 2 cobre *desenvolver*, nunca *publicar*.

**Review por fase, não só no fim.** Cada fase da entrega é revisada assim que fecha (segurança sempre em Opus), e ele corrige sozinho o que for claramente relevante. O que for discutível vira sugestão no relatório final, não pergunta no meio. Revisar a cada fase é o que impede um erro da fase 1 contaminar as sete seguintes.

**Um PR só.** A feature inteira vai num único PR, no fim. Nunca um PR por fase, por task ou por bloco de fixes — fase da entrega vira seção do corpo do PR.

**Sem testes automatizados.** Não escreve teste, não roda suíte, não faz TDD. A rede de segurança é o `verify` (sobe o app e observa o comportamento real) + o roteiro de homologação manual que ele te entrega. Suíte que **já existe** no projeto roda como gate na Fase 4, só pra não publicar quebrando o que existia — mas ele não cria nem mantém teste.

**Zero comentário em código.** Nenhum comentário novo, em nenhuma fase. A premissa é que comentário é sintoma: se o código precisa de explicação, o código está mal escrito — então o lugar de resolver é o nome da variável, o tamanho da função, o early return. O "porquê" vai na mensagem de commit, no corpo do PR ou nos docs. Exceções: docstring de API pública que a linguagem exige, diretiva que a ferramenta lê (`eslint-disable`, `frozen_string_literal`) e comentário que já existia. O review tem um check automático: comentário adicionado no diff bloqueia.

**Modelos.** Desenvolvimento sempre em ultracode, que orquestra os subagentes. `opus` para task complexa (lógica não-trivial, arquitetura, migration, auth/pagamento/dados sensíveis, revisão de segurança, debugging), `sonnet` para simples e mediana (CRUD, texto, rename, config, docs, review de UX). O modelo de cada task fica no plano, decidido na Fase 2.

**Comunicação em duas camadas.** *Caveman* controla o quanto vai pra tela: só decisão e entregável, processo e investigação ficam de fora, status mecânico é uma linha ou nada. E como a usuária é Product Manager e não é técnica, todo termo técnico que aparece vem com uma explicação curta entre parênteses na primeira vez — termo certo e o que ele significa, mais o efeito no produto. As duas coisas convivem: resposta curta e termo explicado.

**Profundidade por risco.** Ele classifica a feature em TRIVIAL / MÉDIO / ALTO e isso dimensiona quantos subagentes dispara. Nunca rebaixa segurança nem pula backup antes de migration destrutiva.

Detalhe completo em [`maestro/SKILL.md`](maestro/SKILL.md); checklists de review, template de plano e de brief em [`maestro/REFERENCE.md`](maestro/REFERENCE.md).

---

## 📐 linear

Transforma um brief de task num projeto documentado no Linear. **Só o projeto** — nada de issue, milestone ou sub-issue.

- **Task → Projeto.** O brief inteiro (Oportunidade + Solução) vira a descrição, no formato do `/task`.
- **Fluxo → seção da descrição.** Cada `### Nome do Fluxo` do Comportamento Esperado fica dentro do projeto, com seus passos e regras de negócio. Não vira item separado.
- **Pergunta o que falta antes do preview.** Mostra o placar das lacunas e vai uma pergunta por vez, cada uma com uma resposta recomendada junto. `[a definir]` só sobra no que você escolher deixar em aberto.
- **Campos fixos:** time `Random`, status `Para planejamento`, prioridade Média, **sem líder**. Não pergunta nem varia.
- Mostra o preview no chat e só escreve no Linear depois da confirmação.

Só ativa com `/linear` escrito explicitamente. Detalhe em [`linear/SKILL.md`](linear/SKILL.md).

---

## 🔍 revisao-local

Revisa o código que você acabou de escrever, **sem precisar de PR nem de GitHub** — trabalha sobre o diff local (mudanças não commitadas, ou commitadas contra a `main`).

O que a torna diferente de um review genérico é o **checklist de padrões recorrentes**, extraído da análise dos últimos 100 PRs mergeados do majestic_monolith (371 comentários inline, ~76 bugs reais catalogados). Ele cobre:

- **Bugs que mais escapam** — concorrência e race condition, dados legados de produção (o vetor nº 1), cobertura incompleta entre caminhos irmãos, falha silenciosa, ordenação e paginação, callbacks em operação em lote, retry e idempotência, segurança (IDOR, CSV injection), regex sobre texto livre.
- **Convenções do projeto** — specs, reuso antes de reimplementar, lugar da lógica, N+1 e teto de queries.
- **Gates de PR** — drift de `schema.rb`, migrations, swagger, config de produção.
- **Calibragem de falso-positivo** — o que o time já refutou, pra não gerar apontamento ruim.

Detalhe em [`revisao-local/SKILL.md`](revisao-local/SKILL.md).

---

## Como funciona a publicação

Cada skill é uma pasta com um `SKILL.md` — **é o único arquivo que você edita.** O resto é automático.

```
maestro/SKILL.md          ← fonte da verdade, edite aqui
      ↓ hook post-commit
maestro.md                ← flat copy no root (o formato que o Claude Code lê)
      ↓ hook post-commit
~/.claude/commands/       ← Windows: fica disponível como /maestro
      ↓ hook post-commit
luecabral/main            ← push automático
      ↓ hook post-commit
WSL ~/.claude/commands    ← pull automático (é um clone git que tracka luecabral)
```

Ou seja: **basta commitar na main.** O hook gera o flat, sincroniza o Windows, pusha pro `luecabral` e atualiza o clone do WSL, nessa ordem. Se algum passo falhar (sem rede, WSL desligado), ele avisa na saída do commit e diz o comando pra rodar depois.

**Nunca edite `~/.claude/commands/` direto** — é destino, sobrescrito a cada commit.

Sessão do Claude Code que já estava aberta continua com a versão antiga carregada. Precisa abrir sessão nova pra pegar a mudança.

### Primeira vez num clone novo

```bash
bash setup.sh
```

Aponta o git pros hooks versionados em `.githooks/` (via `core.hooksPath`, então o hook nunca fica defasado). Roda uma vez por clone.

### Criar uma skill nova

1. Crie a pasta `<skill>/` com um `SKILL.md` dentro, com frontmatter `name` e `description` — a `description` é o que decide quando a skill ativa, então seja explícito (inclusive sobre quando **não** ativar).
2. Commite. O hook cria o flat e propaga.

---

## Remoto

- `luecabral` → https://github.com/luecabral/skills — **único remoto e fonte da verdade.** É pra onde o hook pusha e de onde o WSL puxa.

Sem branches, sem PRs: direto na main. Nada de push manual — o hook cuida.

O `rsv-ink/skills`, que era o repositório da organização, **foi excluído.** Não há mais destino secundário e nenhuma skill daqui é publicada em outro lugar.

---

## Fora deste repositório

A skill `caveman` (modo de comunicação comprimido) continua ativa no WSL, mas vive em `~/.agents/skills/caveman`, exposta via symlink em `~/.claude/skills/`. Não é versionada aqui. As regras de comunicação comprimida que o maestro usa estão escritas dentro do próprio maestro, então ele não depende dessa skill pra funcionar.
