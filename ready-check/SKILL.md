---
name: ready-check
description: Use antes de abrir qualquer PR. Ativa quando o usuário diz "tá pronto", "posso abrir o PR", "revisa antes de subir", "o que tá faltando". Faz revisão de código + gera roteiro de teste manual antes de liberar para o open-pr.
---

# Ready Check

Revisão de código + roteiro de teste manual antes do PR.

## Processo

### Parte 1 — Revisão do código

#### Passo 1 — Coletar o diff

```bash
git log main..HEAD --oneline && git diff main...HEAD
```

#### Passo 2 — Analisar cada arquivo alterado

**Funcionalidade**
- [ ] Faz o que foi proposto? Edge cases óbvios tratados?

**Segurança**
- [ ] Inputs sanitizados em todas as camadas?
- [ ] Recursos verificam propriedade antes de retornar (sem IDOR)?
- [ ] Dados sensíveis não aparecem em logs ou respostas?
- [ ] Nenhuma secret no código ou arquivos commitados?
- [ ] Security headers configurados (CSP, HSTS, X-Frame-Options)?
- [ ] Rate limit em endpoints de auth e dados sensíveis?
- [ ] Cookies com `HttpOnly`, `Secure` e `SameSite`?
- [ ] Multi-tenancy: `tenant_id` validado em todas as queries?
- [ ] Uploads: MIME type, magic bytes e tamanho validados no servidor?
- [ ] Operações financeiras/contadores protegidos contra race condition?
- [ ] IA no sistema: inputs protegidos contra prompt injection?

**UX**
- [ ] Ações assíncronas têm feedback visual?
- [ ] Estados de erro têm mensagem legível?
- [ ] Empty states implementados?

**Qualidade**
- [ ] Sem `console.log`, `debugger` ou código de debug?
- [ ] Os testes cobrem a interface pública (o "o quê"), não implementação interna?

#### Passo 3 — Apresentar relatório

```
🔍 REVISÃO DE CÓDIGO — Branch: [nome] | +X -Y linhas | N achados

[1] 🚨 BLOQUEANTE | arquivo.ext — Linha X
Problema: [descrição] | Correção: [o que mudar]

[2] ⚠️ SUGESTÃO | arquivo.ext — Linha X
Problema: [descrição] | Correção: [o que melhorar]
```

#### Passo 4 — Aplicar correções

Pergunte quais aplicar. Execute com confirmação, um por vez.

---

### Parte 2 — Roteiro de teste manual

#### Passo 5 — Identificar fluxos afetados

Com base no diff, liste os fluxos visíveis ao usuário criados ou modificados.

#### Passo 6 — Gerar roteiro

Para cada fluxo:

```
🧪 ROTEIRO DE TESTE MANUAL

[Fluxo 1] <nome>
Pré-condição: [o que precisa existir]
Passos: 1. [ação] 2. [ação]
Resultado esperado: [o que deve aparecer]
Cenário de erro: [o que deve acontecer quando falha]

[Regressão] Fluxos adjacentes:
- [ ] [fluxo que pode ter sido afetado]
```

#### Passo 7 — Aguardar confirmação

Aguarde o usuário confirmar que testou antes de liberar para o `open-pr`.

---

### Parte 3 — Pipeline CI/CD (se existir)

Confirme: lint, testes no CI, SAST, dependency audit, secret scanning. Se não existir, registre no corpo do PR em "O que tem mais risco".

## Regras

- Não pule a revisão mesmo que o usuário esteja com pressa
- O roteiro deve ser executável por quem não escreveu o código
- Regressão é tão importante quanto os fluxos novos
- Só libere para `open-pr` após confirmação dos testes manuais
