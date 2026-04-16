---
name: push
description: Use ao fazer push da branch. Ativa quando o usuário diz "faz o push", "sobe a branch", "publica a branch". Garante que o código está tecnicamente sólido antes do push: verifica código de debug esquecido, roda todos os testes, debuga se falharem, só então faz push. NÃO faz rebase nem revisão de código.
---

# Push

Push seguro: testes funcionando + código limpo.

## Princípio

Antes de publicar a branch, garanta que o código está funcionando. Esta skill foca nas validações técnicas: testes rodando, sem código de debug esquecido, nada quebrado. Rebase e revisão de código ficam para o `open-pr`.

## Processo

### Passo 1 — Verificar que há commits para publicar

```bash
git branch --show-current
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null || git log HEAD --oneline -5
```

**Se a branch for `main`:**
- Informe o usuário que não é possível fazer push direto na main
- Encerre

**Se não houver commits novos (branch já sincronizada):**
- Informe que a branch já está atualizada no remoto
- Encerre

### Passo 2 — Verificar código de debug esquecido

Busque por código de debug nos arquivos alterados:

```bash
git diff origin/$(git branch --show-current)..HEAD 2>/dev/null || git diff HEAD~1..HEAD
```

Procure por padrões de debug:
- `console.log`, `console.error`, `console.warn` (JavaScript/TypeScript)
- `debugger` (JavaScript/TypeScript)
- `print(` (Python - exceto em arquivos de teste)
- `puts `, `p `, `pp ` (Ruby - exceto em testes ou seeds)
- `var_dump`, `dd(`, `dump(` (PHP)
- `System.out.println`, `printStackTrace` (Java)

**Se encontrar código de debug:**
```
⚠️ CÓDIGO DE DEBUG DETECTADO

Arquivos com debug:
  - [arquivo]:[linha] → [trecho de código]

Deseja remover antes do push?
→ Sim: remover automaticamente
→ Não: seguir com push assim mesmo (não recomendado)
```

Se o usuário optar por remover, retire o código de debug e solicite confirmação antes de continuar.

### Passo 3 — Rodar todos os testes

```bash
# Detectar e rodar automaticamente conforme o projeto
npm test          # Node/JS
npx vitest run    # Vitest
pytest            # Python
bundle exec rspec # Ruby/Rails
```

**Se todos os testes passarem:**
→ Siga para o Passo 4

**Se algum teste falhar:**
```
❌ X teste(s) falhando:
[lista dos testes que falharam com a mensagem de erro]

Acionando systematic-debugging para investigar...
```

**Acione `systematic-debugging` automaticamente** com o contexto do erro. Não prossiga para o push até que todos os testes estejam verdes.

Após o debugging corrigir o problema, **rode os testes novamente** antes de prosseguir.

### Passo 4 — Verificação final

**Acione `verification-before-completion`** para confirmar que:
- O comportamento implementado funciona corretamente
- Não quebrou nada adjacente
- O código está limpo

Se a verificação falhar, não prossiga. Corrija os problemas identificados.

### Passo 5 — Executar o push

```bash
git push -u origin HEAD
```

**Se o push falhar por histórico divergente:**
```
⚠️ A branch remota tem commits diferentes.
Alguém fez push nesta branch desde o último fetch.

Opções:
1. git pull --rebase origin $(git branch --show-current)
   → Recomendado: coloca seus commits depois dos remotos

2. git push --force-with-lease origin HEAD
   → Sobrescreve o remoto (use apenas se tiver certeza)

Qual opção você prefere?
```

Aguarde escolha do usuário antes de executar.

**Se o push falhar por outro motivo:**
- Exiba o erro completo
- Não tente resolver automaticamente
- Encerre

### Passo 6 — Confirmar

```bash
git log origin/$(git branch --show-current) --oneline -5
```

Informe o usuário que o push foi concluído com sucesso e quantos commits foram publicados.

## Regras

- **NÃO faz rebase** — isso é responsabilidade do `open-pr`
- **NÃO faz revisão de código** — apenas validações técnicas
- Nunca use `--force` sozinho, sempre `--force-with-lease` se necessário
- Se testes falharem, não prossiga — debugar é obrigatório
- Código de debug pode ser mantido se o usuário confirmar explicitamente (mas desencoraje)
