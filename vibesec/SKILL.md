---
name: vibesec
description: Use ao escrever qualquer código que lida com dados do usuário, autenticação, inputs de formulário, APIs externas ou banco de dados. Ativa automaticamente em qualquer implementação de feature para prevenir vulnerabilidades comuns introduzidas por quem está vibecodando sem experiência em segurança. Use também quando o usuário perguntar "isso é seguro?", "tem algum problema de segurança aqui?" ou ao revisar código antes de um PR.
---

# VibeSec

Segurança desde o início, não como revisão posterior.

## Princípio

Quem vibecoda costuma não pensar em segurança. Esta skill aborda o código com a perspectiva de um bug hunter — procurando ativamente os erros mais comuns antes que virem problema em produção.

## Quando revisar

Revise automaticamente sempre que o código tocar em:
- Autenticação e sessões
- Inputs de formulário ou parâmetros de URL
- Queries ao banco de dados
- Chamadas a APIs externas
- Upload de arquivos
- Dados sensíveis (senhas, tokens, CPF, cartões)
- Controle de acesso (quem pode ver/editar o quê)

## Checklist de segurança

### Controle de acesso (IDOR)
- [ ] Recursos são verificados por propriedade antes de serem retornados? (ex: `where(user_id: current_user.id)`)
- [ ] Um usuário consegue acessar dados de outro só mudando um ID na URL?
- [ ] Ações destrutivas (deletar, editar) verificam se o recurso pertence ao usuário?

### Inputs e sanitização (XSS / Injection)
- [ ] Inputs do usuário são sanitizados antes de serem exibidos no HTML?
- [ ] Queries ao banco usam parâmetros preparados? (nunca interpolação direta de string)
- [ ] Uploads verificam tipo real do arquivo, não só a extensão?
- [ ] Campos numéricos validam que o valor é realmente um número?

### Autenticação e sessões
- [ ] Tokens e IDs de sessão são gerados com entropia suficiente? (não sequenciais, não previsíveis)
- [ ] Senhas são armazenadas com hash seguro? (bcrypt, argon2 — nunca MD5 ou SHA1)
- [ ] Rotas autenticadas verificam a sessão antes de qualquer lógica?
- [ ] Logs não expõem senhas, tokens ou dados sensíveis?

### Requisições externas (SSRF)
- [ ] URLs fornecidas pelo usuário são validadas antes de fazer requisições?
- [ ] Há whitelist de domínios permitidos para requisições externas?
- [ ] IPs internos (localhost, 192.168.x.x) estão bloqueados nas URLs aceitas?

### Exposição de dados
- [ ] Respostas de API retornam apenas os campos necessários? (sem `SELECT *` desnecessário)
- [ ] Mensagens de erro não expõem stack traces ou detalhes internos ao usuário?
- [ ] Mensagens de erro do backend são específicas o suficiente para o frontend traduzir em mensagem útil, mas sem expor detalhes de implementação
- [ ] Dados sensíveis são mascarados em logs? (ex: apenas últimos 4 dígitos do cartão)

**Padrão de mensagem de erro no backend:**

Erros devem ter código identificável e mensagem legível — não stack trace bruto:

```json
✅ {"error": "email_already_registered", "message": "Este email já está cadastrado"}
✅ {"error": "insufficient_permissions", "message": "Você não tem permissão para editar este item"}
❌ {"error": "PG::UniqueViolation: duplicate key value violates unique constraint..."}
❌ {"error": "Something went wrong"}
```

O frontend usa o `error` para lógica e o `message` para exibição. Nunca exponha o erro técnico diretamente.

## Como reportar

Para cada problema encontrado, apresente:

```
🚨 [TIPO DO PROBLEMA]
Arquivo: caminho/do/arquivo.ext — Linha X
Problema: [descrição clara do risco]
Impacto: [o que um atacante poderia fazer]

❌ Código atual:
[trecho problemático]

✅ Correção:
[trecho corrigido]
```

Classifique cada achado:
- **🚨 CRÍTICO** — exploração direta possível (IDOR, SQL injection, senhas em plain text)
- **⚠️ ALTO** — risco real mas com pré-condições (XSS sem contexto privilegiado, SSRF limitado)
- **💡 MELHORIA** — boas práticas que reduzem superfície de ataque

## Regras

- Nunca ignore um problema por parecer improvável de ser explorado
- Se não tiver certeza se algo é vulnerável, sinalize como revisão manual necessária
- Proponha sempre a correção, não apenas o problema
- Após listar todos os achados, pergunte se o usuário quer aplicar as correções antes de continuar
