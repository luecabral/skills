---
name: write-tests
description: Use após implementar uma task e antes de commitar, ou quando o usuário diz "escreve os testes", "testa isso". Infere o que foi implementado via Git (diff + commits), gera testes para o comportamento, roda e só libera o commit quando estiver verde.
---

# Write Tests

Testes escritos depois da implementação, antes do commit.

## Princípio

Testes não são opcional — são a garantia de que o que foi implementado funciona e vai continuar funcionando. Escrever depois da implementação (não antes) é mais aderente ao fluxo de vibecoding, mas a disciplina de rodar antes de commitar é inegociável.

## Processo

### Passo 1 — Carregar contexto

Infira o que foi implementado usando Git:

```bash
git status --short
git diff HEAD
git log -1 --oneline
```

Leia os arquivos alterados completamente (não apenas o diff) para entender o comportamento implementado e como a função/componente se encaixa no sistema.

Com base no diff e nos arquivos, identifique:
- Qual comportamento novo foi adicionado
- Quais funções/componentes foram criados ou modificados
- Qual é o objetivo da mudança

**Só pergunte ao usuário se o diff for muito ambíguo e não for possível inferir a intenção.**

### Passo 2 — Identificar o que testar

Para a task implementada, defina os cenários de teste:

**Happy path** — o fluxo esperado funcionando:
- Entrada válida → resultado correto
- Estado inicial → estado final esperado

**Sad path** — o que deve falhar graciosamente:
- Entrada inválida → erro ou validação clara
- Estado inconsistente → comportamento defensivo
- Recurso ausente → mensagem apropriada

**Edge cases óbvios:**
- Valores vazios, nulos ou zero
- Strings muito longas
- Usuário não autenticado tentando ação autenticada
- Múltiplas chamadas simultâneas (quando relevante)

**Regressão** — o que pode ter quebrado:
- Funcionalidades adjacentes que usam os mesmos arquivos modificados
- Integrações que dependem dos dados ou funções alterados

**Segurança** — obrigatório se a task tocou em auth, dados, uploads ou controle de acesso:
- Acesso sem token → deve retornar 401
- Token expirado → deve retornar 401
- Token válido de outro usuário → deve retornar 403
- Usuário A tentando acessar recurso do usuário B → deve retornar 403
- Tenant A tentando acessar dados do tenant B → deve retornar 403
- Exceder rate limit → deve retornar 429
- Payload com SQL injection → deve ser rejeitado
- Payload com XSS → deve ser sanitizado
- Upload de arquivo com tipo inválido → deve ser rejeitado
- Upload de arquivo acima do tamanho máximo → deve ser rejeitado

Se a task não tocou em nenhum desses pontos, escreva explicitamente "Testes de segurança: não aplicável para esta task." — nunca pule silenciosamente.

### Passo 3 — Gerar os testes

Escreva os testes seguindo as convenções do projeto. Se não houver framework de teste configurado:

1. Pergunte ao usuário qual framework usar
2. Se não houver nenhum, sugira configurar antes de continuar e ofereça ajuda

**Convenções a seguir (quando identificadas no projeto):**
- Localização dos arquivos de teste (`tests/`, `__tests__/`, junto do arquivo, etc.)
- Nomenclatura dos arquivos (`*.test.js`, `*_spec.rb`, `test_*.py`, etc.)
- Estrutura dos blocos (`describe`/`it`, `test`, `def test_`, etc.)

**Princípios gerais:**
- Um teste por comportamento, não por função
- Nomes de teste descrevem o que deve acontecer: "retorna erro quando email é inválido"
- Cada teste é independente — não depende de outro teste ter rodado antes
- Use dados de teste explícitos, não dados de produção

### Passo 4 — Apresentar os testes

Exiba os testes gerados antes de salvar. Aguarde confirmação ou ajustes.

### Passo 5 — Salvar e rodar

Salve os arquivos de teste. Em seguida, rode os testes:

```bash
# Detectar e rodar automaticamente conforme o projeto
# Exemplos comuns:
npm test
npx vitest run
pytest
bundle exec rspec
```

Se o comando de teste não for conhecido, pergunte ao usuário antes de tentar.

### Passo 6 — Avaliar resultado

**Se todos passarem:**
```
✅ X teste(s) passando. Pronto para o smart-commit.
```

**Se algum falhar:**
```
❌ X teste(s) falhando:
[lista dos testes que falharam com a mensagem de erro]

Acionando systematic-debugging para investigar antes de continuar.
```

Neste caso, não libere o commit. Acione `systematic-debugging` com o contexto do erro.

## Regras

- Nunca libere o commit com testes falhando
- Não escreva testes que testam apenas o mock — testes devem verificar comportamento real
- Se um comportamento for muito difícil de testar, sinalize: pode ser sinal de código acoplado demais
- Testes e implementação são commitados juntos pelo `smart-commit` — não comite um sem o outro
- Se o projeto não tiver nenhuma infraestrutura de teste, sinalize e ofereça ajuda para configurar antes de continuar
