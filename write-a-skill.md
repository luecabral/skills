---
name: write-a-skill
description: Use para criar uma skill nova com estrutura correta. Ativa quando o usuário diz "cria uma skill para X", "quero uma skill que faça Y", "adiciona uma skill de Z". Garante que a skill tem descrição com triggers claros, processo bem definido e fica abaixo de 100 linhas.
---

# Write a Skill

Criar skills com estrutura correta, triggers claros e tamanho adequado.

## Princípio

Uma skill boa tem três propriedades:
1. **Trigger claro** — o agente sabe exatamente quando ativar (a descrição no frontmatter diz "quando o usuário diz X" ou "ativa quando Y")
2. **Processo definido** — passos concretos, não princípios vagos
3. **Tamanho adequado** — abaixo de 100 linhas no SKILL.md principal; se precisar de mais, use arquivos de referência separados

## Processo

### Passo 1 — Entender o que a skill deve fazer

Pergunte (uma por vez):
- Quando exatamente essa skill ativa? Quais palavras ou situações disparam?
- O que ela entrega ao final — um arquivo, um relatório, uma ação executada?
- Há skills existentes que se sobrepõem? (Se sim, vale atualizar a existente em vez de criar nova)

### Passo 2 — Rascunhar a skill

Escreva o SKILL.md seguindo esta estrutura:

```markdown
---
name: nome-da-skill
description: Use quando [situação específica]. Ativa quando o usuário diz "[frase exata]"
ou "[variação]". Entrega [o que produz].
---

# Nome da Skill

[Uma linha descrevendo o propósito]

## Princípio

[Por que essa skill existe — o problema que ela resolve]

## Processo

### Passo 1 — [Nome do passo]
[Instruções concretas]

### Passo 2 — [Nome do passo]
[Instruções concretas]

## Regras

- [Restrições importantes]
```

### Passo 3 — Verificar o rascunho

Antes de salvar, confirme:
- [ ] A `description` no frontmatter tem triggers explícitos ("quando o usuário diz X")?
- [ ] O processo tem passos numerados com ações concretas (não princípios vagos)?
- [ ] O arquivo tem menos de 100 linhas?
- [ ] Se precisar de mais de 100 linhas: o conteúdo extra pode ir em arquivo de referência separado na mesma pasta?

### Passo 4 — Apresentar e confirmar

Exiba o rascunho completo. Aguarde confirmação ou ajustes antes de salvar.

### Passo 5 — Salvar

Crie a pasta e o arquivo:
```
~/.agents/skills/nome-da-skill/SKILL.md
```

Pergunte se quer adicionar ao README de skills (se existir).

## Regras

- Nunca salve sem confirmação do usuário
- Se a skill parece grande demais, questione: pode ser duas skills menores?
- Descrições vagas ("use quando necessário") são inúteis — sempre peça trigger específico
