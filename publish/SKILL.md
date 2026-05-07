---
name: publish
description: Use para publicar código e/ou abrir PR. Ativa quando o usuário diz "faz o
push", "sobe a branch", "publica a branch", "abre o PR", "sobe o PR", "cria o PR".
Valida código, faz revisão, push e opcionalmente abre PR como draft.
---

# Publish

Um fluxo só: validação → revisão → push → PR opcional.

## Processo

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

### Passo 4 — Revisão de código e UX
Analise o diff com o checklist (ver REFERENCE.md): funcionalidade, segurança, UX e qualidade.
Apresente relatório:
- 🚨 BLOQUEANTE — corrija antes de prosseguir
- ⚠️ SUGESTÃO — pergunte se quer aplicar

### Passo 5 — Verificação e roteiro de teste manual

Antes de prosseguir, confirme:
- [ ] Fluxo principal funciona? (resultado exato, não "parece certo")
- [ ] Se for correção de bug: o comportamento problemático não ocorre mais?
- [ ] Testes de regressão passam? (funcionalidades que usam os mesmos arquivos)
- [ ] Dados existentes não foram corrompidos pela mudança?

Liste os fluxos afetados e gere roteiro executável por quem não escreveu o código.
Aguarde confirmação do usuário antes de prosseguir.

### Passo 6 — Push
```bash
git fetch origin && git rebase origin/main
git push -u origin HEAD
```
Se conflito no rebase: liste arquivos e aguarde resolução manual.
Se histórico divergente: ofereça `--rebase` ou `--force-with-lease`, aguarde escolha.

### Passo 7 — Subir em staging

Antes de abrir PR, o código precisa passar por staging.

```bash
git log origin/$(git branch --show-current)..HEAD --oneline
```

Pergunte: "O deploy para staging está configurado automaticamente ou você sobe manualmente?"

- **Automático** (ex: Render, Railway, Heroku preview apps) → aguarde o deploy concluir e peça a URL de staging
- **Manual** → instrua o usuário a subir e fornecer a URL de staging

Após receber a URL de staging, liste os fluxos afetados pelo PR e peça confirmação:
- [ ] Testou o fluxo principal em staging?
- [ ] Comportamento em staging bate com o esperado?
- [ ] Sem erros no console / logs de staging?

Aguarde confirmação explícita do usuário antes de prosseguir.
Se staging falhou ou não foi testado, encerre e não abra PR.

### Passo 8 — Abrir PR?
Pergunte: "Quer abrir PR agora?"
- **Não** → encerre
- **Sim** → continue

Se chamada com foco em PR ("abre o PR") e push já foi feito, pule direto para o Passo 9.

### Passo 9 — Gerar título e corpo
**Formato:** `tipo: Mensagem no presente, sem ponto final`
**Tipos:** `feat` | `fix` | `refactor` | `perf` | `docs` | `config`

```markdown
### O que esse PR faz
[2-3 frases — foco no "o quê" e "para quê"]

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

### Passo 11 — Changelog e criação
Em linguagem não-técnica: ✨ Novidades | 🐛 Correções | ⚡ Melhorias

Exiba título, corpo e changelog. Aguarde aprovação do usuário.
```bash
gh pr create --draft --title "<título>" --body "<corpo>"
gh pr comment <número> --body "## 📋 Changelog\n\n<changelog>"
```
Exiba a URL do PR ao final.

## Regras
- Nunca crie PR sem confirmação do usuário
- Nunca use `--force` sozinho, sempre `--force-with-lease`
- Changelog legível por quem não é desenvolvedor
- "O que tem mais risco" nunca em branco sem justificativa
