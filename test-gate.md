---
name: test-gate
description: Use após implementar uma task e antes de commitar, ou quando o usuário diz "escreve os testes", "testa isso". Infere o que foi implementado via Git (diff + commits), gera testes para o comportamento, roda e só libera o commit quando estiver verde.
---

# Test Gate

Testes escritos depois da implementação, antes do commit.

## Processo

### Passo 1 — Carregar contexto

```bash
git status --short && git diff HEAD && git log -1 --oneline
```

Leia os arquivos alterados completamente. Identifique: comportamento novo, funções/componentes criados ou modificados, objetivo da mudança. Só pergunte ao usuário se o diff for muito ambíguo.

### Passo 2 — Identificar o que testar

- **Happy path** — entrada válida → resultado correto
- **Sad path** — entrada inválida → erro ou validação clara; recurso ausente → mensagem apropriada
- **Edge cases** — valores vazios/nulos/zero, strings longas, usuário não autenticado
- **Regressão** — funcionalidades adjacentes que usam os mesmos arquivos
- **Segurança** — obrigatório se tocou em auth, dados, uploads ou controle de acesso (ver REFERENCE.md para checklist completo)

Se a task não tocou em segurança, escreva "Testes de segurança: não aplicável" — nunca pule silenciosamente.

### Passo 3 — Gerar os testes

Siga as convenções do projeto (localização, nomenclatura, estrutura de blocos). Se não houver framework, pergunte ao usuário.

**Princípios:**
- Um teste por comportamento, não por função
- Nomes descrevem o que deve acontecer: "retorna erro quando email é inválido"
- Cada teste é independente — não depende de outro ter rodado antes
- Teste a interface pública (o "o quê"), não implementação interna (o "como")

### Passo 4 — Apresentar e confirmar

Exiba os testes antes de salvar. Aguarde confirmação ou ajustes.

### Passo 5 — Salvar e rodar

```bash
npm test / npx vitest run / pytest / bundle exec rspec
```

### Passo 6 — Avaliar resultado

**Se todos passarem:** `✅ X teste(s) passando. Pronto para o smart-commit.`

**Se algum falhar:** não libere o commit. Acione `systematic-debugging` com o contexto do erro.

## Regras

- Nunca libere o commit com testes falhando
- Se difícil de testar, sinalize — pode ser sinal de código acoplado demais
- Testes e implementação são commitados juntos pelo `smart-commit`
- Se o projeto não tiver infraestrutura de teste, ofereça ajuda para configurar
