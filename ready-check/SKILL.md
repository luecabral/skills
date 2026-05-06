---
name: ready-check
description: Use antes de abrir qualquer PR. Ativa quando o usuário diz "tá pronto", "posso abrir o PR", "revisa antes de subir", "o que tá faltando" ou quando julgar que a implementação está completa. Faz as duas coisas necessárias antes do PR: revisa o código e gera o roteiro de teste manual para o dev validar localmente.
---

# Ready Check

Revisão de código + roteiro de teste manual antes de abrir o PR.

## Princípio

Antes de pedir revisão de outra pessoa, você deve ter feito a sua própria. Esta skill garante que o código está limpo e que os fluxos visíveis ao usuário foram testados manualmente.

## Processo

### Parte 1 — Revisão do código

#### Passo 1 — Coletar o diff

```bash
git rev-parse --abbrev-ref HEAD
git log main..HEAD --oneline
git diff main...HEAD
```

Liste todos os arquivos alterados em relação à main.

#### Passo 2 — Analisar cada arquivo

Para cada arquivo alterado, verifique:

**Funcionalidade**
- [ ] O código faz o que foi proposto implementar?
- [ ] Há edge cases óbvios não tratados? (null, undefined, array vazio, usuário não autenticado)
- [ ] Há lógica condicional complexa que poderia ser simplificada?

**Segurança** (revisão final antes de expor para revisão)
- [ ] Inputs do usuário são sanitizados em todas as camadas (frontend e backend)?
- [ ] Recursos verificam propriedade antes de retornar (sem IDOR)?
- [ ] Dados sensíveis não aparecem em logs ou respostas de API?
- [ ] Nenhuma secret está no código, comentários ou arquivos commitados?
- [ ] Security headers estão configurados (CSP, HSTS, X-Frame-Options, nosniff)?
- [ ] Rate limit aplicado nos endpoints de auth e dados sensíveis?
- [ ] Sessão invalida no logout e na troca de senha?
- [ ] Cookies com `HttpOnly`, `Secure` e `SameSite`?
- [ ] Se há multi-tenancy: `tenant_id` validado no servidor em todas as queries?
- [ ] Se há uploads: MIME type, magic bytes e tamanho validados no servidor?
- [ ] Se há operações financeiras ou contadores: protegidos contra race condition?
- [ ] Se há IA no sistema: inputs protegidos contra prompt injection?

**UX** (repete checagem do ux-validation)
- [ ] Ações assíncronas têm feedback visual?
- [ ] Estados de erro têm mensagem legível?
- [ ] Empty states estão implementados?

**Qualidade geral**
- [ ] Não há `console.log`, `debugger` ou código de debug esquecido?
- [ ] Não há código comentado que não deveria ir para produção?
- [ ] Funções e variáveis têm nomes que expressam intenção?
- [ ] Há código duplicado que poderia ser extraído?
- [ ] Os testes cobrem a interface pública (o "o quê"), não detalhes de implementação interna (o "como")? Testes em interface pública sobrevivem a refatorações sem precisar de ajuste.

#### Passo 3 — Apresentar relatório de código

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 REVISÃO DE CÓDIGO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Branch: [nome] | N arquivo(s) | +X -Y linhas
N achado(s): X bloqueante(s) · Y sugestão(ões) · Z nitpicks

[1] 🚨 BLOQUEANTE | arquivo.ext — Linha X
Problema: [descrição clara]
Correção: [o que mudar]

[2] ⚠️ SUGESTÃO | arquivo.ext — Linha X
Problema: [descrição]
Correção: [o que melhorar]
```

Se não houver achados: "Código dentro dos padrões. Nenhuma observação."

#### Passo 4 — Aplicar correções

Pergunte quais itens o usuário quer aplicar. Aplique com confirmação, um por vez.

---

### Parte 2 — Roteiro de teste manual

#### Passo 5 — Identificar fluxos afetados

Com base no diff, identifique quais fluxos visíveis ao usuário foram criados ou modificados.

Exemplos de fluxos:
- Cadastro de novo usuário
- Login e logout
- Criação de um item
- Edição de um item existente
- Exclusão com confirmação
- Upload de arquivo
- Busca e filtragem

#### Passo 6 — Gerar roteiro de teste

Para cada fluxo identificado:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 ROTEIRO DE TESTE MANUAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Fluxo 1] Cadastro de novo usuário
Pré-condição: nenhuma conta criada com o email de teste

Passos:
1. Acesse a página de cadastro
2. Preencha o nome com "Teste Silva"
3. Preencha o email com "teste@exemplo.com"
4. Preencha a senha com "Senha123!"
5. Clique em "Criar conta"

Resultado esperado: redireciona para o dashboard com mensagem "Bem-vindo, Teste!"

Cenário de erro:
- Tente criar com o mesmo email → deve aparecer "Este email já está cadastrado"
- Tente criar com email inválido → deve aparecer mensagem de validação antes de enviar

---

[Fluxo 2] ...
```

Inclua também:

```
[Regressão] Fluxos que podem ter sido afetados indiretamente
- [ ] [fluxo que usa os mesmos componentes ou dados]
- [ ] [fluxo adjacente que pode ter quebrado]
```

#### Passo 7 — Aguardar confirmação de teste

Apresente o roteiro e aguarde o usuário confirmar que testou cada fluxo antes de liberar para o `open-pr`.

```
Testou todos os fluxos acima?
→ Sim: seguir para open-pr
→ Não ainda: aguardar o usuário testar e retornar
```

### Parte 3 — Checklist de pipeline (se o projeto tiver CI/CD)

Antes de liberar para o `open-pr`, confirme que o pipeline inclui:

- [ ] Lint e formatação automáticos
- [ ] Testes unitários e de integração rodando no CI
- [ ] SAST — análise estática de segurança (Semgrep, SonarQube, Bandit)
- [ ] Dependency audit (npm audit, pip-audit, Snyk)
- [ ] Secret scanning bloqueando merge se encontrar credenciais (GitLeaks, TruffleHog)
- [ ] Container scan (Trivy) — se o projeto usar Docker
- [ ] DAST em staging (OWASP ZAP) — se disponível
- [ ] Deploy com least privilege (sem credenciais de prod no CI)

Se o projeto ainda não tiver CI/CD configurado, sinalize como ponto de atenção — não bloqueie, mas registre no corpo do PR na seção "O que tem mais risco".

## Regras

- Não pule a revisão de código mesmo que o usuário esteja com pressa
- O roteiro de teste deve ser executável por alguém que não escreveu o código
- Fluxos de regressão são tão importantes quanto os fluxos novos
- Somente libere para `open-pr` após confirmação dos testes manuais
