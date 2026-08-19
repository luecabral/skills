# Minhas Skills do Claude Code

Skills são instruções que ensinam o Claude Code a se comportar de um jeito específico. Em vez de repetir o mesmo contexto toda vez, você chama a skill por `/nome` e ela já sabe o processo, o que checar e o que entregar.

Este repositório tem **duas skills**, e elas cobrem coisas diferentes: `maestro` conduz o desenvolvimento de uma feature de ponta a ponta, `linear` documenta a task no Linear.

---

## 🎼 maestro

Ciclo completo de uma feature, da ideia ao deploy, em 5 fases. **É autossuficiente** — todo o processo está escrito dentro do próprio arquivo, então editar outra skill não muda o comportamento dele.

```
💡 IDEIA
    ↓
Fase 1 — EXPLORE ......... entende o problema, threat modeling (mapa do que
    ↓                      pode dar errado), benchmark, painel de alternativas
    ↓                      em paralelo, design detalhado dos fluxos
    ↓                      ⏸ gate: aprova o design?
    ↓
Fase 2 — PLAN ............ quebra em tasks de vertical slice (cada task entrega
    ↓                      um caminho funcionando de ponta a ponta), monta o
    ↓                      grafo de dependências, cria a branch
    ↓                      ⏸ gate único: aprovar = branch criada + execução começa
    ↓
Fase 3 — EXECUTE ......... 🔇 silêncio total. Subagentes em paralelo, um por
    ↓                      task, cada um em worktree isolada. Nenhuma mensagem
    ↓                      até acabar.
    ↓                      ⏸ entrega: relatório final + roteiro de homologação
    ↓
Fase 4 — FIXES ........... você manda um bloco de ajustes, ele orquestra os
    ↓                      subagentes (paralelo entre arquivos diferentes)
    ↓                      ⏸ gate: mais um bloco, ou publica?
    ↓
Fase 5 — PUBLISH ......... review escalonado por risco → reorganiza os commits
                           → push → PR → CI → merge → deploy
                           ⏸ stops: quais correções aplicar, merge, deploy
```

Entra direto em qualquer fase: `maestro fase 2`, `maestro planeja`, `maestro executa`, `maestro corrige`, `maestro publica`.

### As regras que definem o comportamento dele

**Sem testes automatizados.** Não escreve teste, não roda suíte, não faz TDD. A rede de segurança é o `verify` (sobe o app e observa o comportamento real) + o roteiro de homologação manual que ele te entrega. Suíte que **já existe** no projeto roda como gate na Fase 5, só pra não publicar quebrando o que existia — mas ele não cria nem mantém teste.

**Zero comentário em código.** Nenhum comentário novo, em nenhuma fase. A premissa é que comentário é sintoma: se o código precisa de explicação, o código está mal escrito — então o lugar de resolver é o nome da variável, o tamanho da função, o early return. O "porquê" vai na mensagem de commit, no corpo do PR ou nos docs. Exceções: docstring de API pública que a linguagem exige, diretiva que a ferramenta lê (`eslint-disable`, `frozen_string_literal`) e comentário que já existia. Na Fase 5 tem um check automático: comentário adicionado no diff bloqueia a publicação.

**Fase 3 é silenciosa do começo ao fim.** Você aprovou o plano na Fase 2 e não vai receber mais nenhuma mensagem até o desenvolvimento acabar — nem status, nem problema encontrado, nem pergunta. Toda decisão de execução é dele. Task que trava vira `paused` com o motivo e o resto do plano continua; o que travou aparece no relatório final. Você continua vendo os chips de tarefa rodando na interface, mas nenhum texto.

**Modelos.** Desenvolvimento sempre em ultracode, que orquestra os subagentes. `opus` para task complexa (lógica não-trivial, arquitetura, migration, auth/pagamento/dados sensíveis, revisão de segurança, debugging), `sonnet` para simples e mediana (CRUD, texto, rename, config, docs, review de UX).

**Comunicação em duas camadas.** *Caveman* controla o quanto vai pra tela: só decisão e entregável, processo e investigação ficam de fora, status mecânico é uma linha ou nada. E como a usuária é Product Manager e não é técnica, todo termo técnico que aparece vem com uma explicação curta entre parênteses na primeira vez — termo certo e o que ele significa, mais o efeito no produto. As duas coisas convivem: resposta curta e termo explicado.

**Profundidade por risco.** Ele classifica a feature em TRIVIAL / MÉDIO / ALTO e isso dimensiona quantos subagentes dispara. Nunca rebaixa segurança nem pula backup antes de migration destrutiva.

Detalhe completo em [`maestro/SKILL.md`](maestro/SKILL.md); checklists de review, template de plano e de brief em [`maestro/REFERENCE.md`](maestro/REFERENCE.md).

---

## 📐 linear

Transforma um brief de task em projeto documentado no Linear, mais uma issue por fluxo.

- **Task → Projeto.** O brief inteiro (Oportunidade + Solução) vira a descrição, no formato do `/task`.
- **Fluxo → Issue.** Cada `### Nome do Fluxo` do Comportamento Esperado vira uma issue, só com o título — sem template, sem corpo imposto.
- **Campos fixos:** time `Random`, Luiza como leader, status `Para planejamento`. Não pergunta nem varia.
- Mostra o preview no chat e só escreve no Linear depois da confirmação.

Só ativa com `/linear` escrito explicitamente. Detalhe em [`linear/SKILL.md`](linear/SKILL.md).

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
