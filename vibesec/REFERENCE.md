# VibeSec — Checklist de segurança

## Controle de acesso (IDOR)
- [ ] Recursos são verificados por propriedade antes de retornar? (ex: `where(user_id: current_user.id)`)
- [ ] Um usuário consegue acessar dados de outro mudando um ID na URL?
- [ ] Ações destrutivas verificam se o recurso pertence ao usuário?

## Inputs e sanitização (XSS / Injection)
- [ ] Inputs sanitizados antes de exibir no HTML?
- [ ] Queries usam parâmetros preparados? (nunca interpolação direta)
- [ ] Uploads verificam tipo real do arquivo, não só a extensão?
- [ ] Campos numéricos validam que o valor é realmente um número?

## Autenticação e sessões
- [ ] Tokens e IDs de sessão com entropia suficiente? (não sequenciais)
- [ ] Senhas com hash seguro? (bcrypt, argon2 — nunca MD5/SHA1)
- [ ] Rotas autenticadas verificam sessão antes de qualquer lógica?
- [ ] Logs não expõem senhas, tokens ou dados sensíveis?

## Requisições externas (SSRF)
- [ ] URLs fornecidas pelo usuário são validadas antes de fazer requisições?
- [ ] Há whitelist de domínios permitidos?
- [ ] IPs internos (localhost, 192.168.x.x) bloqueados nas URLs aceitas?

## Exposição de dados
- [ ] Respostas retornam apenas os campos necessários?
- [ ] Mensagens de erro não expõem stack traces ao usuário?
- [ ] Dados sensíveis mascarados em logs?

**Padrão de erro no backend:**
```json
✅ {"error": "email_already_registered", "message": "Este email já está cadastrado"}
❌ {"error": "PG::UniqueViolation: duplicate key value violates unique constraint..."}
```

## Sessão e cookies
- [ ] Cookies com `HttpOnly`, `Secure` e `SameSite=Strict` (ou `Lax` com justificativa)?
- [ ] Tokens JWT com expiração curta (15–60 min)?
- [ ] Refresh token com rotação — invalidado a cada uso?
- [ ] Sessão invalidada no logout e na troca de senha?

## Rate limit e proteção contra abuso
- [ ] Endpoints de login, signup e recuperação têm rate limit?
- [ ] Rate limit por IP e por usuário autenticado?
- [ ] Resposta 429 com `Retry-After`?
- [ ] Lockout progressivo contra brute force?

## Security headers
- [ ] `Content-Security-Policy` configurado?
- [ ] `Strict-Transport-Security` com `max-age` longo e `includeSubDomains`?
- [ ] `X-Frame-Options: DENY`?
- [ ] `X-Content-Type-Options: nosniff`?
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`?

## Multi-tenancy
- [ ] `tenant_id` extraído do token, nunca do corpo da requisição?
- [ ] Todas as queries filtram por `tenant_id`?
- [ ] Teste automatizado que tenta acessar dados de outro tenant (deve retornar 403)?

## Gestão de segredos
- [ ] Nenhuma secret no código ou comentários?
- [ ] Nenhum `.env` com secrets reais commitado?
- [ ] Secrets diferentes por ambiente?
- [ ] CI/CD com secret scanning (GitLeaks, TruffleHog)?

## Uploads e conteúdo
- [ ] MIME type validado no servidor (não só pelo header HTTP)?
- [ ] Magic bytes (primeiros bytes do arquivo) verificados?
- [ ] Extensões por allowlist?
- [ ] Tamanho máximo limitado no servidor?
- [ ] Arquivos em storage externo (S3, GCS) com signed URLs?
- [ ] Nome do arquivo sanitizado contra path traversal?
- [ ] SVG tratado como potencialmente perigoso?

## Concorrência e integridade
- [ ] Operações críticas (pagamentos, saldo) usam transações de banco?
- [ ] Dois requests simultâneos podem causar inconsistência?
- [ ] Operações com retry são idempotentes?

## LGPD e privacidade
- [ ] Sistema coleta apenas dados necessários?
- [ ] Usuários conseguem solicitar exclusão dos próprios dados?
- [ ] Dados sensíveis (CPF, cartão) criptografados em repouso?
- [ ] Processo para anonimizar dados de usuários deletados?
