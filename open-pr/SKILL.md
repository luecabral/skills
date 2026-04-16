---
name: open-pr
description: Use ao abrir um Pull Request. Ativa quando o usuário diz "abre o PR", "sobe o PR", "cria o PR". Executa automaticamente o ready-check (revisão de código + roteiro de teste), faz push se necessário, gera título, corpo com contexto para IA e roteiro para humano, gera o changelog e cria o PR como draft.
---

# Open PR

Fluxo completo: validações → push → ready-check → criação do PR.

## Princípio

O corpo do PR serve duas audiências diferentes: a IA que vai revisar o código precisa de contexto de intenção e risco; o humano que vai testar no staging precisa de roteiro claro e simples. Esta skill faz a revisão final automaticamente e publica o PR.

## Processo

### Passo 0 — Detectar se a branch já foi publicada

```bash
git branch --show-current
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null
```

**Se a branch não existir no remoto (erro no git log):**
→ Branch ainda não foi publicada
→ Executar validações técnicas (testes + código limpo)

**Se a branch existir e não houver commits diferentes:**
→ Branch já sincronizada
→ Pular validações técnicas (foram feitas no push)

**Se a branch existir mas houver commits novos locais:**
→ Push foi feito antes, mas há commits novos
→ Executar validações técnicas apenas nos novos commits

### Passo 0.1 — Validações técnicas (apenas se necessário)

Execute este passo APENAS se a branch não foi publicada ou há commits novos.

**1. Verificar código de debug:**
Procure por: `console.log`, `debugger`, `print(`, `puts `, `p `, `pp `

Se encontrar, pergunte ao usuário se quer remover antes de continuar.

**2. Rodar todos os testes:**
```bash
npm test / npx vitest run / pytest / bundle exec rspec
```

Se algum teste falhar, acione `systematic-debugging` e não prossiga até que todos estejam verdes.

**Se a branch já foi publicada e está sincronizada:**
→ Pular este passo completamente (validações já foram feitas)

### Passo 0 — Verificar documentação da branch (vibecodado-docs)

Se o projeto usar a metodologia `vibecodado-docs` (presença de `AGENTS.md` ou pasta `docs/` na raiz), rode a verificação completa sobre **todos os commits da branch** antes de abrir o PR.

```bash
git diff main...HEAD --stat
git diff main...HEAD
```

Percorra o checklist consolidado da branch inteira:

```
[ ] AGENTS.md — reflete todas as mudanças feitas na branch?
[ ] AGENTS.md > Estrutura de Pastas — arquivos/pastas criados, movidos ou removidos na branch?
[ ] AGENTS.md > Regras e Restrições — novas restrições que surgiram durante o desenvolvimento?
[ ] AGENTS.md > Status Atual — algo mudou de status ao longo da branch?
[ ] docs/features/ — todas as features novas ou modificadas têm doc atualizada?
[ ] docs/flows/ — algum fluxo foi impactado pelo conjunto de mudanças da branch?
[ ] docs/changelog.md — há uma entrada consolidada descrevendo o que esta branch entrega?
```

Para cada item pendente, faça a atualização e apresente o diff ao usuário para confirmação antes de seguir.

Se o usuário não quiser atualizar algum item agora, registre explicitamente no corpo do PR (seção "Decisões técnicas relevantes") que a documentação está desatualizada e o que falta.

### Passo 0 — Executar ready-check automaticamente

Antes de abrir o PR, **acione `ready-check` automaticamente** para:
1. Revisar o código e identificar problemas
2. Gerar roteiro de teste manual

**Se ready-check identificar bloqueantes:**
- Apresente os problemas ao usuário
- Pergunte se quer corrigir antes de abrir o PR ou seguir assim mesmo
- Se optar por corrigir, aplique as correções e rode ready-check novamente

**Se não houver bloqueantes:**
→ Siga para o Passo 1

Use o roteiro de teste gerado pelo ready-check na seção "O que testar" do PR (Passo 4).

### Passo 1 — Coletar dados da branch

Execute em paralelo:

```bash
git branch --show-current
git log main..HEAD --oneline
git diff main...HEAD --stat
git diff main...HEAD
```

Se a branch atual for `main`, informe o usuário e encerre.

### Passo 2 — Verificar se PR já existe

```bash
gh pr view --json url,state 2>/dev/null
```

Se já existir um PR aberto para esta branch, exiba a URL e encerre.

### Passo 3 — Gerar o título

Identifique o tipo predominante de mudança e gere o título:

**Formato:** `tipo: Mensagem em português, presente do indicativo, sem ponto final`

**Tipos:**
- `feat` — nova funcionalidade
- `fix` — correção de bug
- `refactor` — reorganização sem mudança de comportamento
- `perf` — melhoria de performance
- `docs` — apenas documentação
- `config` — configurações, dependências

**Regras:**
- Verbo no presente do indicativo, terceira pessoa: "Adiciona", "Corrige", "Remove"
- Específico: evite "Atualiza código" ou "Melhora sistema"
- Sem emojis, sem escopo entre parênteses, sem ponto final

**Exemplo:** `feat: Adiciona formulário de cadastro com validação de email`

### Passo 4 — Gerar o corpo do PR

Preencha o template abaixo. As três primeiras seções são para a IA revisora; as duas últimas são para o humano que vai testar.

```markdown
### O que esse PR faz
[2-3 frases descrevendo a intenção — o que o usuário consegue fazer agora
que não conseguia antes, ou o que foi corrigido. Foque no "o quê" e no
"para quê", não no "como".]

### Decisões técnicas relevantes
[Por que foi implementado dessa forma e não de outra. Inclua:
- Abordagens consideradas e descartadas (e por quê)
- Dependências ou integrações que afetam a implementação
- Limitações conhecidas ou trade-offs deliberados
Deixe em branco se não houver decisões não-óbvias.]

### O que tem mais risco
[Arquivos ou fluxos onde um erro seria mais grave ou onde a lógica é mais
complexa. Oriente a IA sobre onde focar a revisão. Exemplos:
- "A lógica de cálculo em services/pricing.js merece atenção especial"
- "A query em models/user.js foi reescrita e pode ter impacto de performance"
Escreva "Nenhum risco identificado" se for uma mudança simples e isolada.]

### Staging
URL: [URL do ambiente de staging com esta branch]

### O que testar
[Liste os fluxos que o revisor humano deve validar no staging.
Use linguagem simples, sem jargão técnico.
Inclua o que deve acontecer E o que deve aparecer em caso de erro.]

- [ ] [Fluxo 1]: [passos simples e resultado esperado]
- [ ] [Fluxo 2]: [passos simples e resultado esperado]
- [ ] Regressão: [fluxos adjacentes que podem ter sido afetados]
```

### Passo 5 — Gerar o changelog

Com base no corpo gerado + commits da branch, crie o changelog em linguagem não-técnica:

**Regras:**
- Reescreva para quem não é desenvolvedor
- Foque no impacto para o usuário, não na implementação
- Agrupe por tipo:
  - ✨ **Novidades** — o que o usuário pode fazer agora
  - 🐛 **Correções** — problemas que foram resolvidos
  - ⚡ **Melhorias** — coisas que ficaram mais rápidas ou estáveis

**Exemplo:**
```
❌ feat: Adiciona índice na coluna user_id da tabela sessions
✅ ⚡ Login ficou mais rápido

❌ fix: Corrige validação de email no formulário de cadastro
✅ 🐛 Corrigido erro que impedia cadastro com emails válidos
```

### Passo 6 — Apresentar e confirmar

Exiba título, corpo e changelog. Aguarde confirmação ou ajustes antes de criar o PR.

O usuário pode ajustar qualquer seção antes de confirmar.

### Passo 7 — Sincronizar com a main antes de publicar

Atualize a branch com as últimas mudanças da main para garantir histórico linear e evitar conflitos no PR:

```bash
git fetch origin
git rebase origin/main
```

**Se houver conflitos:**
- Liste os arquivos em conflito e explique o conflito ao usuário
- Não resolva automaticamente — aguarde resolução manual
- Após resolução, instrua: `git rebase --continue`
- Só avance após rebase concluído sem conflitos

**Por que rebase e não merge:** o rebase mantém histórico linear — os commits da feature aparecem em sequência após os da main, sem commit de merge extra. Facilita a revisão do PR e o `git log`.

### Passo 8 — Publicar a branch

```bash
git push -u origin HEAD
```

Se o push falhar por histórico divergente (branch já publicada antes do rebase), oriente:

```bash
git push --force-with-lease origin HEAD
```

`--force-with-lease` é mais seguro que `--force`: falha se outra pessoa tiver feito push na branch desde o último fetch.

Se o push falhar por outro motivo, informe o erro e encerre sem criar o PR.

### Passo 9 — Criar o PR

```bash
gh pr create \
  --draft \
  --title "<título aprovado>" \
  --body "$(cat <<'EOF'
<corpo aprovado>
EOF
)"
```

### Passo 10 — Postar o changelog como comentário

```bash
gh pr comment <número do PR> --body "$(cat <<'EOF'
## 📋 Changelog

<changelog gerado>
EOF
)"
```

### Passo 11 — Confirmar

Exiba a URL do PR e informe que foi criado como draft com o changelog postado como comentário.

## Regras

- Nunca crie o PR sem confirmação do usuário
- O corpo deve sempre ter as 5 seções — não omita nenhuma mesmo que seja curta
- "O que tem mais risco" nunca deve ser deixado em branco sem justificativa
- O changelog deve ser legível por alguém fora da equipe de desenvolvimento
- Se o `gh` CLI não estiver configurado, oriente o usuário a configurar antes de continuar
