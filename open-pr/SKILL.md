---
name: open-pr
description: Use ao abrir um Pull Request. Ativa quando o usuário diz "abre o PR", "sobe o PR", "cria o PR". Executa o ready-check, faz push se necessário, gera título + corpo com contexto para IA e roteiro para humano, gera changelog e cria o PR como draft.
---

# Open PR

Fluxo completo: validações → push → ready-check → criação do PR.

## Processo

### Passo 1 — Verificar estado da branch

```bash
git branch --show-current
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null
gh pr view --json url,state 2>/dev/null
```

Se for `main`, encerre. Se já existir PR aberto, mostre a URL e encerre.

### Passo 2 — Validações técnicas (se houver commits novos não publicados)

1. Verificar debug esquecido: `console.log`, `debugger`, `print(`, `puts `
2. Rodar todos os testes — se falhar, acione `systematic-debugging` antes de continuar

### Passo 3 — Verificar documentação (se o projeto usar context-docs)

```bash
git diff main...HEAD
```

Checklist consolidado da branch: AGENTS.md, Estrutura de Pastas, docs/features/, docs/changelog.md. Para cada item pendente, atualize e confirme com o usuário. Se não quiser agora, registre em "Decisões técnicas relevantes" do PR.

### Passo 4 — Executar ready-check automaticamente

Acione `ready-check` para revisar o código e gerar roteiro de teste. Se houver bloqueantes, pergunte se quer corrigir antes de abrir. Use o roteiro gerado na seção "O que testar".

### Passo 5 — Coletar dados da branch

```bash
git log main..HEAD --oneline && git diff main...HEAD --stat && git diff main...HEAD
```

### Passo 6 — Gerar título

**Formato:** `tipo: Mensagem no presente do indicativo, sem ponto final`
**Tipos:** `feat` | `fix` | `refactor` | `perf` | `docs` | `config`

### Passo 7 — Gerar corpo do PR

```markdown
### O que esse PR faz
[2-3 frases sobre o que o usuário consegue fazer agora — foco no "o quê" e "para quê"]

### Fora do escopo
[O que este PR deliberadamente NÃO faz. "Sem exclusões relevantes" se o escopo for completo.]

### Validações
- [x] Documentação: Changelog, AGENTS.md e/ou docs da feature atualizados.
- [x] Testes: Criados/atualizados e rodando verde.
- [x] Git: Rebase com a `main` realizado.
- [x] Código limpo: Sem logs, debuggers ou comentários mortos.

### Decisões técnicas relevantes
[Por que foi implementado dessa forma. Abordagens descartadas e por quê. Em branco se não há decisões não-óbvias.]

### O que tem mais risco
[Onde um erro seria mais grave ou a lógica mais complexa. "Nenhum risco identificado" se for mudança simples.]

### O que testar
- [ ] [Fluxo 1]: [passos simples e resultado esperado]
- [ ] Regressão: [fluxos adjacentes que podem ter sido afetados]
```

### Passo 8 — Gerar changelog

Em linguagem não-técnica, para quem não é desenvolvedor:
- ✨ **Novidades** | 🐛 **Correções** | ⚡ **Melhorias**

### Passo 9 — Confirmar

Exiba título, corpo e changelog. Aguarde aprovação do usuário.

### Passo 10 — Sincronizar e publicar

```bash
git fetch origin && git rebase origin/main
git push -u origin HEAD   # ou --force-with-lease se houver histórico divergente
```

Se houver conflitos no rebase, liste os arquivos e aguarde resolução manual antes de continuar.

### Passo 11 — Criar PR e postar changelog

```bash
gh pr create --draft --title "<título>" --body "<corpo>"
gh pr comment <número> --body "## 📋 Changelog\n\n<changelog>"
```

Exiba a URL do PR ao final.

## Regras

- Nunca crie o PR sem confirmação do usuário
- Todas as seções do template são obrigatórias
- "O que tem mais risco" nunca em branco sem justificativa
- Changelog deve ser legível por alguém fora da equipe
