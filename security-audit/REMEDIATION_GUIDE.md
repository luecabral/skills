# Guia de Remediacao — Security Checklist

Recomendacoes praticas para cada item do checklist de seguranca.
Quando um item falha na auditoria, a recomendacao correspondente e exibida no relatorio.
Alguns itens sao stack-specific (ex: Next.js, Supabase) e devem ser aplicados apenas quando esse stack estiver em uso.

---

## A. Broken Access Control (BOLA/IDOR)

### A1 — RLS habilitado em todas as tabelas
Adicione `ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;` em uma migration.
Crie policies que filtrem por `current_workspace_id()` ou `auth.uid()`.
Sem RLS, qualquer usuario autenticado acessa todos os registros.

### A2 — Funcoes SECURITY DEFINER
Crie funcoes SQL com `SECURITY DEFINER` para logica sensivel (ex: verificar workspace, role).
Isso garante que a funcao roda com privilegios controlados, nao do chamador.
Exemplo: `CREATE FUNCTION current_workspace_id() RETURNS uuid SECURITY DEFINER AS $$ ... $$`

### A3 — Isolamento por workspace/tenant com testes
Crie testes que simulem dois usuarios de workspaces diferentes.
Verifique que SELECT, INSERT, UPDATE e DELETE sao bloqueados cross-workspace.
Use o Supabase client com tokens de usuarios distintos.

### A4 — Politicas separadas por operacao
Crie policies distintas para SELECT, INSERT, UPDATE e DELETE.
Cada operacao pode ter regras diferentes (ex: INSERT com WITH CHECK, SELECT com USING).
Nunca use ALL — seja explicito em cada operacao.

### A5 — Controle de acesso por coluna
Remova colunas sensiveis do SELECT direto (ex: `REVOKE SELECT(coluna) ON tabela FROM authenticated`).
Acesse via funcao SECURITY DEFINER (ex: `get_my_crypto_fields()`).

### A6 — Autorizacao por role
Verifique o role do usuario (admin, member, owner) antes de qualquer operacao.
Use funcoes como `current_user_role()` no SQL ou verificacao no route handler.

### A7 — Verificacao de ownership
Antes de UPDATE/DELETE, confirme que o recurso pertence ao usuario ou workspace.
Nunca confie apenas no ID enviado pelo client — verifique via RLS ou query.

### A8 — Testes de IDOR
Crie testes que tentam acessar recursos de outro usuario com IDs validos.
O resultado esperado e 403 (Forbidden) ou 404 (Not Found), nunca 200.

### A9 — Views ou RPC para limitar colunas
Use Views SQL ou funcoes RPC para retornar apenas as colunas necessarias.
Nunca exponha a tabela inteira ao front-end.

### A10 — Principio do menor privilegio
Revise cada role e remova acessos desnecessarios.
Cada usuario deve ter apenas as permissoes minimas para executar suas funcoes.

---

## B. Authentication & Session Management

### B1 — Rate limiting dual-layer
Implemente rate limit por IP (protecao contra flood) e por identificador (email/conta).
Use sliding window com backoff exponencial.
Ferramentas: Upstash Redis, in-memory fallback.

### B2 — Rate limiting por endpoint
Defina limites especificos para cada endpoint (ex: login 5/min, upload 20/min).
Endpoints de autenticacao devem ter limites mais restritivos.

### B3 — Politica de senha forte
Use Zod para validar: minimo 8 chars, maiuscula, minuscula, numero, especial.
Adicione zxcvbn com score minimo 3 para prevenir senhas previsiveis.

### B4 — Verificacao de senhas vazadas
Ative o leaked password check no Supabase (Auth > Settings).
Isso compara senhas contra bases de dados de vazamentos conhecidos.

### B5 — Protecao de rotas no middleware
Verifique sessao/token em `middleware.ts` antes de permitir acesso a rotas protegidas.
Redirecione para login se nao autenticado.

### B6 — Autenticacao no servidor
Nunca verifique roles ou permissoes no client-side (pode ser manipulado).
Toda verificacao de authn/authz deve ocorrer no servidor (Server Actions, Route Handlers).

### B7 — Separacao de clientes
Use `createClient()` (anon key) para operacoes do usuario.
Use `createServiceClient()` (service role) apenas para operacoes administrativas no servidor.
Nunca exponha a service role key no client.

### B8 — Cookies seguros
Configure cookies com: `httpOnly: true`, `secure: true`, `sameSite: 'lax'` ou `'strict'`.
Isso previne acesso via JavaScript (XSS) e envio em requisicoes cross-site (CSRF).

### B9 — Expiracao de sessao
Configure expiracao de JWT (ex: 1 hora) com refresh token para renovacao.
Tokens expirados devem ser rejeitados automaticamente.

### B10 — Prevencao de enumeracao
Retorne mensagens genericas em login/registro (ex: "Credenciais invalidas").
Nunca indique se o email existe ou nao no sistema.

### B11 — Invalidacao em troca de senha
Quando o usuario troca a senha, invalide todas as sessoes ativas.
Force re-login com a nova senha.

### B12 — Logout seguro
No logout, limpe tokens no client E invalide a sessao no servidor.
Nao basta apagar o cookie — a sessao deve ser revogada.

### B13 — Session fixation/hijacking
JWTs nao devem ser reutilizaveis em outro navegador/contexto.
Considere binding de sessao por IP ou fingerprint.

### B14 — Tokens de convite
Tokens de convite devem ter uso unico e expiracao.
Apos aceito, o token deve ser invalidado imediatamente.

---

## C. Business Logic & Validation

### C1 — Validacao com schemas
Use Zod (ou equivalente) para definir schemas de input em TODOS os endpoints.
Valide antes de processar qualquer logica de negocio.

### C2 — Validacao server-side
Nunca confie apenas na validacao do front-end. O servidor deve validar independentemente.
Qualquer requisicao pode ser forjada — validacao client-side e apenas UX.

### C3 — Valores do client para logica de negocio
Nunca use precos, quantidades ou roles enviados pelo front-end para calculos criticos.
Sempre busque o valor real do banco de dados no servidor.

### C4 — Whitelist de valores
Para campos com opcoes limitadas (roles, tipos, slots), use whitelist no servidor.
Rejeite qualquer valor que nao esteja na lista permitida.

### C5 — Validacao de UUID
Valide UUIDs com regex estrito antes de usar em queries ou paths.
Isso previne path traversal e injection via IDs malformados.

### C6 — Limites de negocio
Implemente limites no servidor (max membros, max itens, max uploads).
Nunca deixe o front-end ser a unica barreira.

### C7 — Race conditions
Use transacoes atomicas (BEGIN/COMMIT) para operacoes que envolvem multiplas tabelas.
Funcoes como `rotate_vault_key()` devem ser atomicas.

---

## D. Client-Side Attacks

### D1 — CSP restritiva
Configure Content-Security-Policy com diretivas minimas:
`frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`

### D2 — Evitar unsafe-inline
Sempre que possivel, use nonces ou hashes em vez de `'unsafe-inline'`.
Se necessario por limitacao do framework, documente a razao.

### D3-D6 — Headers de seguranca
Adicione na camada de headers do seu framework/gateway (exemplo em `next.config.ts` ou `middleware.ts`):
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### D7 — Protecao CSRF
Valide o header `Origin` em requisicoes POST/PUT/PATCH/DELETE no middleware.
Rejeite requisicoes com origin diferente do esperado.

### D8 — Open Redirect
Nunca redirecione para URLs fornecidas pelo usuario sem validar contra whitelist.
Valide que a URL de destino pertence ao mesmo dominio.

### D9 — Sanitizacao contra XSS
Use frameworks que escapam output por padrao (React JSX faz isso).
Nunca use `dangerouslySetInnerHTML` com dados do usuario sem sanitizar.

### D10 — Cache-Control
Para paginas autenticadas, configure `Cache-Control: no-store`.
Isso previne que dados sensiveis sejam cacheados pelo navegador.

---

## E. Injection

### E1 — Queries parametrizadas
Use ORM/query builder/driver que parametriza automaticamente (ex: Prisma, Drizzle, Knex, Supabase client).
Nunca construa queries concatenando strings com input do usuario.

### E2 — Nunca eval/exec
Nunca passe input do usuario para `eval()`, `new Function()`, `exec()` ou `execSync()`.
Isso permite execucao de codigo arbitrario (RCE).

### E3 — Templates server-side
Se usar templates no servidor, sanitize todos os inputs antes de interpolar.
Use bibliotecas de template que escapam por padrao.

### E4 — GraphQL introspeccao
Em producao, desabilite introspeccao de GraphQL.
Isso evita que atacantes descubram todo o schema da API.

### E5 — Comandos shell
Nunca interpole input do usuario em comandos shell.
Use arrays de argumentos em vez de strings concatenadas.

---

## G. Files & Misconfigurations

### G1 — Validacao de path
Valide UUIDs e IDs antes de construir caminhos de arquivo no storage.
Use regex estrito (ex: `isValidUUID()`) para cada componente do path.

### G2 — Path traversal
Bloqueie sequencias como `../`, `..\\`, `%2e%2e` em inputs usados para paths.
Sempre construa paths a partir de componentes validados.

### G3-G4 — Upload seguro
Valide tipo MIME e extensao contra whitelist.
Limite tamanho maximo de arquivo (ex: 256 KB para attachments).

### G5 — Storage com RLS
Configure RLS no bucket de storage do Supabase.
Verifique acesso via funcao como `has_vault_access()`.

### G6 — Arquivos sensiveis
Adicione ao `.gitignore`: `.env`, `.env.local`, `.env.production`.
Desabilite source maps em producao no `next.config.ts`.
Nunca commite arquivos com credentials.

### G7 — Dados sensiveis na interface
Nao exponha IDs internos, PII, regras de negocio ou logs no DOM ou console.
Trate dados sensiveis no backend, nao no frontend.

---

## H. Secrets & Cryptography

### H1 — Secrets hardcoded
Mova qualquer API key, token ou senha do codigo para variaveis de ambiente.
Use `.env.local` localmente e variaveis de ambiente no deploy (Vercel, etc.).

### H2 — .env.example
Crie um `.env.example` com todas as variaveis necessarias (sem valores reais).
Isso serve como template para novos desenvolvedores.

### H3 — Limpeza de memoria
Use `sodium.memzero()` para limpar chaves apos uso.
Limpe estado criptografico no evento `pagehide` do navegador.

### H4 — KDF robusto
Use Argon2id com parametros adequados (MODERATE: 3 ops, 256 MB).
Versione os parametros de KDF para permitir migracao futura.

### H5 — NEXT_PUBLIC_ com secrets
Variaveis `NEXT_PUBLIC_*` sao expostas no browser.
Nunca use este prefixo para API keys, tokens ou secrets.
Mova para Edge Functions ou Server Actions.

### H6 — localStorage/sessionStorage
Nunca armazene secrets, tokens de API ou chaves criptograficas em localStorage.
Use cookies HttpOnly para tokens de sessao.

---

## I. Hardening

### I1 — CORS
Configure origins especificas no CORS (nunca `Access-Control-Allow-Origin: *` em producao).
Listar apenas os dominios que devem acessar a API.

### I2 — HSTS
Adicione `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
Isso forca HTTPS em todas as conexoes.

### I3 — X-Powered-By
Remova ou desabilite o header `X-Powered-By`.
Exemplo Next.js: `poweredByHeader: false` no `next.config.ts`.

### I4 — DDoS
Use um CDN com protecao DDoS integrada (Vercel, Cloudflare).
Combine com rate limiting na aplicacao.

---

## L. CI/CD e Dependencias

### L1 — Auditoria automatizada
Adicione auditoria de dependencias no CI/CD de acordo com o package manager:
- npm: `npm audit --audit-level=high`
- pnpm: `pnpm audit --audit-level high`
- yarn: `yarn npm audit` (Berry) ou `yarn audit` (Classic)
Bloqueie merges com vulnerabilidades high ou critical.

### L2 — Auditoria semanal
Crie um workflow agendado (cron) para rodar auditoria semanalmente.
Notifique o time sobre novas vulnerabilidades.

### L3 — Lockfile
Commite o lockfile do gerenciador em uso (`package-lock.json`, `pnpm-lock.yaml` ou `yarn.lock`) e revise mudancas em PRs.
Isso garante builds reprodutiveis e previne supply chain attacks.

---

## M. Testes de Seguranca

### M1-M6 — Testes por categoria
Crie testes dedicados para cada area de seguranca:
- Isolamento cross-tenant (dois usuarios de workspaces diferentes)
- Escalada de privilegio (member tentando virar admin)
- Validacao de senha (senhas fracas rejeitadas)
- Rate limiting (exceder limites retorna 429)
- Criptografia (encrypt/decrypt roundtrip, bit-flipping detection)
- CSRF (origin mismatch retorna 403)

---

## N. Tratamento de Erros e Logs

### N1 — Catalogo de erros
Crie um arquivo centralizado com todas as mensagens de erro.
Isso garante consistencia e facilita internacionalizacao.

### N2 — Stack traces em producao
Nunca retorne stack traces em respostas de API em producao.
Logue o erro detalhado no servidor, retorne mensagem generica ao usuario.

### N3 — Logs sensiveis
NUNCA logue secrets, tokens, API keys ou PII.
Revise periodicamente dashboards de monitoramento (Sentry, LogFlare).
O console do browser em producao nao deve conter dados internos.

### N4 — Erros de autenticacao
Retorne "Credenciais invalidas" em vez de "Senha incorreta" ou "Usuario nao encontrado".
Isso previne enumeracao de usuarios.

---

## P. PostgreSQL (Rails)

### P1-P2 — Adapter e migrations
Garanta `adapter: postgresql` em `config/database.yml` para os ambientes corretos.
Mantenha migrations pequenas, reversiveis e revisadas em PR.

### P3 — Foreign keys
Adicione `add_foreign_key` ou `foreign_key: true` nas referencias entre tabelas.
Sem FK, erros de integridade ficam escondidos na aplicacao.

### P4 — Indices unicos
Use `add_index ..., unique: true` para constraints de negocio.
Isso evita corrida e duplicacao sob concorrencia.

### P5 — Transacoes
Use `ActiveRecord::Base.transaction` em fluxos com multiplas escritas.
Isso evita estados parciais quando uma etapa falha.

---

## Q. Redis & Cache

### Q1-Q2 — Conexao segura
Use autenticacao e prefira `rediss://` em ambientes externos.
Evite Redis aberto em rede sem ACL/TLS.

### Q3 — Namespace
Defina namespace de chaves por app/ambiente.
Isso reduz colisao entre servicos e facilita invalidacao.

### Q4 — TTL
Aplique `expires_in`/TTL em entradas de cache.
Sem TTL, dados stale podem persistir indefinidamente.

### Q5 — Dados sensiveis
Nao armazene password/token/secret em cache.
Passe apenas IDs e busque dados sensiveis em storage seguro.

---

## R. Rails Stack

### R1 — CSRF
Mantenha `protect_from_forgery`/`verify_authenticity_token` ativo no controller base.

### R2 — Strong Parameters
Aplique `params.require(...).permit(...)` para todo payload mutavel.
Isso previne mass assignment indevido.

### R3 — before_action de authz/authn
Defina guardas de autenticacao/autorizacao antes de acoes sensiveis.
Nao dependa de validacao apenas na view.

### R4-R5 — HTML e redirects
Evite `raw/html_safe` com input do usuario.
Valide destinos de `redirect_to` com allowlist para evitar open redirect.

### R6 — Sessao/cookies
Ative `force_ssl` e hardening de cookie store no ambiente de producao.

---

## S. Sidekiq

### S1-S2 — Retry e operacao
Configure retries por worker e trate dead jobs com observabilidade.

### S3 — Idempotencia
Garanta idempotencia por chave de negocio ou deduplicacao de jobs.
Retry sem idempotencia gera efeitos duplicados.

### S4 — Payload sensivel
Nao enfileire secrets/tokens; passe IDs e recupere no worker.

### S5 — Filas
Defina filas/prioridades para isolamento de workloads criticos.

---

## T. Hotwire (Turbo + Stimulus)

### T1-T2 — Baseline de seguranca
Confirme Turbo/Stimulus configurados e `csrf_meta_tags` no layout base.

### T3-T4 — HTML dinamico
Evite `innerHTML`/`insertAdjacentHTML` sem sanitizacao e `raw/html_safe` em views.

### T5 — Acoes mutantes
Para links/forms mutantes via Turbo, aplique autorizacao no backend.
Nunca trate autorizacao apenas no frontend.

---

## O. Documentacao e Processos

### O1 — Changelog
Mantenha um registro organizado de todas as mudancas.
Inclua features, fixes, melhorias e atualizacoes de seguranca.

### O2 — Decisoes de seguranca
Documente o porque de cada regra de seguranca.
Inclua: quem decidiu, quando, e qual impacto no sistema.

### O3 — Rotacoes e incidentes
Registre cada rotacao de secret com data e responsavel.
Documente incidentes de seguranca com analise de causa raiz.
