# Security Checklist — Referência Completa

> Baseado em OWASP Top 10, práticas do projeto e boas práticas de segurança para aplicações web modernas.
> Atualizado: 2026-03

## Legenda de Severidade
- 🔴 **CRITICAL** — Exploração leva a comprometimento total
- 🟠 **HIGH** — Permite acesso indevido ou vazamento de dados
- 🟡 **MEDIUM** — Reduz postura de segurança, não explorável diretamente
- 🔵 **LOW** — Boas práticas que melhoram defesa em profundidade

## Status
- ✅ Implementado
- ❌ Ausente
- ⚠️ Parcial / Verificação necessária
- ⏭️ N/A ou verificação manual

## Verificações Manuais

Algumas categorias não podem ser verificadas automaticamente com precisão. Use o comando `--answer-manual` para responder a estas verificações:

```bash
node /caminho/para/security-audit/dist/scripts/index.js --answer-manual
```

As respostas são salvas e expiram após 90 dias.

---

## A. Broken Access Control (BOLA/IDOR)

- [ ] 🔴 RLS habilitado em todas as tabelas
- [ ] 🔴 Funções SECURITY DEFINER para lógica sensível
- [ ] 🟠 Isolamento por workspace/tenant com testes dedicados
- [ ] 🔴 Políticas separadas por operação (SELECT, INSERT, UPDATE, DELETE) com WITH CHECK
- [ ] 🔴 Controle de acesso por coluna para dados sensíveis
- [ ] 🔴 Autorização por role antes de qualquer operação
- [ ] 🟠 Verificação de ownership em operações de mutação
- [ ] 🟠 Testes de IDOR: acessar recurso de outro usuário retorna 403/404
- [ ] 🟡 Views ou funções RPC para limitar colunas expostas
- [ ] 🟡 Princípio do menor privilégio aplicado

---

## B. Authentication & Session Management

- [ ] 🔴 Rate limiting dual-layer (IP + identifier + por conta)
- [ ] 🟠 Rate limiting por endpoint
- [ ] 🟠 Política de senha forte (comprimento, complexidade, zxcvbn)
- [ ] 🟡 Verificação contra base de senhas vazadas (HaveIBeenPwned)
- [ ] 🔴 Proteção de rotas autenticadas no middleware
- [ ] 🔴 Autenticação e autorização SEMPRE no servidor
- [ ] 🟠 Separação de clientes (anon key vs service role)
- [ ] 🟠 Cookies com flags seguros (HttpOnly, Secure, SameSite=Strict)
- [ ] 🟠 Expiração de sessão/JWT com refresh token seguro
- [ ] 🟡 Prevenção de enumeração de usuários
- [ ] 🟠 Invalidação de sessão em troca de senha
- [ ] 🟠 Logout limpa tokens e invalida sessão no servidor
- [ ] 🟠 Proteção contra session fixation/hijacking
- [ ] 🟡 Tokens de convite: uso único, expiração curta

---

## C. Business Logic & Validation

- [ ] 🔴 Validação com schemas (Zod) em todos os endpoints
- [ ] 🔴 Validação server-side — nunca confiar no cliente
- [ ] 🔴 Nunca confiar em valores do client para lógica de negócio
- [ ] 🟠 Whitelist de valores permitidos (enums, tipos)
- [ ] 🟠 Validação de UUID/IDs com regex estrito
- [ ] 🟡 Limites de negócio enforçados no servidor (cotas, planos)
- [ ] 🟡 Prevenção de race conditions (transações atômicas)

---

## D. Client-Side Attacks (XSS, CSRF, Open Redirect)

- [ ] 🟠 CSP com diretivas restritivas (default-src, script-src, style-src)
- [ ] 🟡 Evitar `unsafe-inline` (preferir nonces/hashes)
- [ ] 🟠 X-Frame-Options: DENY
- [ ] 🟡 X-Content-Type-Options: nosniff
- [ ] 🟡 Referrer-Policy: strict-origin-when-cross-origin
- [ ] 🟡 Permissions-Policy (camera, mic, geolocation desabilitados)
- [ ] 🔴 Proteção CSRF (validação de origin em todas as mutações)
- [ ] 🟠 Prevenção de Open Redirect (validar destino de redirects)
- [ ] 🔴 Sanitização de output contra XSS (DOMPurify para HTML dinâmico)
- [ ] 🟡 Cache-Control: no-store para páginas autenticadas

---

## E. Injection (SQL, Command, SSTI)

- [ ] 🔴 Queries parametrizadas (ORM/query builder/driver seguro)
- [ ] 🔴 Nunca `exec()`/`eval()` com input do usuário
- [ ] 🟠 Sanitizar inputs em templates server-side
- [ ] 🟡 GraphQL: introspecção desabilitada em produção
- [ ] 🔴 Nunca interpolar input do usuário em comandos shell

---

## F. SSRF — ⏭️ Verificação Manual

- [ ] 🟠 Validar URLs antes de fetch server-side
- [ ] 🟠 Bloquear IPs internos/privados (127.x, 10.x, 192.168.x, 169.254.x)
- [ ] 🟡 Allowlist de domínios para integrações externas
- [ ] 🟡 Não expor respostas brutas de serviços internos

---

## G. Files & Misconfigurations

- [ ] 🟠 Validação de path/UUID antes de construir caminhos de arquivo
- [ ] 🔴 Prevenção de path traversal (resolver e validar prefix)
- [ ] 🟠 Whitelist de extensões/tipos MIME para upload
- [ ] 🟡 Limite de tamanho de arquivo (ex: 10MB)
- [ ] 🟡 Scan de conteúdo malicioso em uploads
- [ ] 🔴 Storage com RLS habilitado
- [ ] 🟡 Directory listing desabilitado
- [ ] 🔴 Sem exposição de .env, .git, source maps em produção
- [ ] 🟠 Sem error leakage em produção (stack traces, paths internos)
- [ ] 🟡 Minimizar dados sensíveis no DOM/console do browser

---

## H. Secrets & Cryptography

- [ ] 🟠 Criptografia client-side (zero-knowledge quando aplicável)
- [ ] 🟠 KDF robusto (Argon2id) para derivação de chaves/senhas
- [ ] 🟡 Versionamento de KDF (suporte a migração futura)
- [ ] 🟠 Limpeza de memória após uso (memzero, pagehide event)
- [ ] 🟡 Proteger chaves em memória (evitar React state/context para secrets)
- [ ] 🟠 Rotação de chaves com re-encriptação atômica
- [ ] 🟡 Proteção contra replay/rollback (versionamento de dados cifrados)
- [ ] 🟠 Validação de integridade (MAC/HMAC antes de decriptar)
- [ ] 🔴 Secrets SEMPRE em variáveis de ambiente, nunca no código
- [ ] 🔴 API keys NUNCA em variáveis NEXT_PUBLIC_ ou no client-side
- [ ] 🔴 Nunca em localStorage/sessionStorage (acessível via XSS)
- [ ] 🟡 Rotação trimestral de secrets documentada
- [ ] 🟡 Checklist pós-rotação (verificar todas as integrações)
- [ ] 🟠 .env.example como template para onboarding
- [ ] 🔴 Sem credenciais hardcoded no código-fonte
- [ ] 🟠 JWT: validar assinatura, expiração e issuer

---

## I. Hardening & Governança de API

- [ ] 🟠 Headers de segurança completos (CSP, HSTS, X-Frame-Options, etc.)
- [ ] 🟠 CORS com origins específicas (nunca `*`)
- [ ] 🟠 TLS/HTTPS obrigatório (HSTS com max-age longo)
- [ ] 🟡 Desabilitar features desnecessárias (introspecção GraphQL, etc.)
- [ ] 🟡 Limitar métodos HTTP por rota (GET, POST, etc.)
- [ ] 🟡 Remover X-Powered-By da resposta
- [ ] 🟡 Endpoints internos não acessíveis publicamente
- [ ] 🟠 Rate limit global + por endpoint sensível
- [ ] 🟡 Proteção DDoS via CDN/WAF

---

## J. Insecure Deserialization — ⏭️ Verificação Manual

- [ ] 🔴 Nunca `eval()`/`Function()` com dados não confiáveis
- [ ] 🟠 Validar schema de JSON antes de processar dados externos
- [ ] 🟡 `JSON.parse()` sempre em try/catch com validação de schema

---

## K. LLM & Prompt Injection — ⏭️ Verificação Manual

- [ ] 🟠 Separar system prompt de user input (não concatenar)
- [ ] 🟠 Sanitizar input antes de enviar para LLM
- [ ] 🟡 Não expor system prompts na resposta
- [ ] 🟡 Rate limit em endpoints de IA

---

## L. CI/CD & Dependências

- [ ] 🟠 Auditoria automatizada de dependências no CI (npm/pnpm/yarn audit)
- [ ] 🟠 Bloqueio de PRs com vulnerabilidades high/critical
- [ ] 🟡 Auditoria semanal agendada (cron no workflow)
- [ ] 🟡 Lockfile (package-lock.json) commitado no repositório

---

## M. Testes de Segurança

- [ ] 🟠 Testes de isolamento cross-tenant (acesso a recursos de outro usuário)
- [ ] 🟠 Testes de escalada de privilégio
- [ ] 🟡 Testes de validação de senha (força, comprimento, senhas comuns)
- [ ] 🟡 Testes de rate limiting (requisições excessivas retornam 429)
- [ ] 🟡 Testes de criptografia/decriptografia (round-trip, integridade)
- [ ] 🟡 Testes de path traversal
- [ ] 🟡 Testes de proteção CSRF
- [ ] 🟡 Testes de manipulação de convites (uso duplo, expiração)
- [ ] 🟡 Testes de integridade criptográfica (detecção de adulteração)
- [ ] 🟡 Testes de session hijacking

---

## N. Tratamento de Erros & Logs

- [ ] 🟡 Catálogo centralizado de erros (ERROR_MESSAGES)
- [ ] 🟠 Erros genéricos para o usuário (sem detalhes internos)
- [ ] 🔴 Sem stack traces em produção (apenas internamente)
- [ ] 🟡 Rate limit errors opacos (não revelar limite exato)
- [ ] 🟠 Auth errors não revelam se usuário existe (anti-enumeração)
- [ ] 🔴 NUNCA logar secrets/tokens/PII em logs
- [ ] 🟡 Monitoramento e alertas configurados (Sentry, Datadog, etc.)
- [ ] 🟡 Console limpo em produção (usar logger estruturado)

---

## P. PostgreSQL (Rails)

- [ ] 🟠 Adapter PostgreSQL configurado por ambiente
- [ ] 🟠 Migrations versionadas e revisadas
- [ ] 🟠 Foreign keys para integridade referencial
- [ ] 🟡 Indices unicos para constraints de negocio
- [ ] 🟠 Transacoes em operacoes multi-escrita criticas

---

## Q. Redis & Cache

- [ ] 🟠 Redis com autenticacao/TLS (preferir rediss://)
- [ ] 🟡 Namespace de chaves por app/ambiente
- [ ] 🟡 TTL explicito para entradas de cache
- [ ] 🔴 Sem secrets/tokens sensiveis em cache
- [ ] 🟡 Politica de expiracao e invalidacao documentada

---

## R. Rails Stack

- [ ] 🔴 CSRF habilitado no ApplicationController
- [ ] 🔴 Strong parameters em endpoints mutaveis
- [ ] 🟠 before_action de authn/authz em rotas sensiveis
- [ ] 🟠 Evitar `html_safe`/`raw` com conteudo dinamico
- [ ] 🟠 `redirect_to` com destino validado (anti open redirect)
- [ ] 🟠 Sessao/cookies hardenizados em producao

---

## S. Sidekiq

- [ ] 🟠 Retry configurado por worker
- [ ] 🟠 Jobs criticos idempotentes/deduplicados
- [ ] 🔴 Sem dados sensiveis no payload da fila
- [ ] 🟡 Filas/prioridades definidas em config
- [ ] 🟡 Tratamento de dead jobs e alertas operacionais

---

## T. Hotwire (Turbo + Stimulus)

- [ ] 🔴 `csrf_meta_tags` presente no layout base
- [ ] 🟠 Evitar `innerHTML`/`insertAdjacentHTML` sem sanitizacao
- [ ] 🟠 Evitar `raw`/`html_safe` em views dinamicas
- [ ] 🟡 Acoes mutantes via Turbo com authz garantida no backend
- [ ] 🟡 Fluxos Turbo Streams revisados para XSS

---

## O. Documentação & Processos

- [ ] 🔵 Changelog organizado e atualizado
- [ ] 🔵 Decisões de segurança documentadas (ADRs)
- [ ] 🔵 Rotações de secrets e incidentes registrados

---

## Checklist para Code Reviews

| Tipo de mudança       | Verificar                                             |
|-----------------------|-------------------------------------------------------|
| Nova tabela           | RLS + policies antes de expor endpoint                |
| Endpoint sensível     | Validação (Zod), authn/authz, rate limit              |
| Sessão/cookies        | Middleware e proteção de rota                         |
| Crypto                | Compatibilidade + versionamento KDF                   |
| Coluna sensível       | SECURITY DEFINER?                                     |
| Nova dependência      | auditoria de dependências, licença, mantenedor ativo  |
| Upload de arquivo     | Tipo, tamanho, path traversal, RLS no storage         |
| Nova variável de env  | Não usar NEXT_PUBLIC_ para secrets                    |
| Redirect              | Validar destino (prevenir open redirect)              |

---

## Ferramentas Recomendadas

- **npm/pnpm/yarn audit** — auditoria de dependências
- **eslint-plugin-security** — regras de segurança no ESLint
- **zod** — validação de schemas
- **zxcvbn** — força de senha
- **DOMPurify** — sanitização XSS
- **argon2** — KDF robusto
- **@upstash/ratelimit** — rate limiting com Redis
- **libsodium** — criptografia moderna (memzero, etc.)

---

## Referências

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/database/row-level-security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/)
