# Security Audit — Referência

## Flags completas

```bash
npx tsx <caminho-da-skill>/scripts/index.ts --json          # saída JSON para pipelines
npx tsx <caminho-da-skill>/scripts/index.ts --sarif         # saída SARIF 2.1.0
npx tsx <caminho-da-skill>/scripts/index.ts --fail-on=high  # exit code por severidade (padrão: critical)
npx tsx <caminho-da-skill>/scripts/index.ts --configure     # ver/editar configuração do projeto
npx tsx <caminho-da-skill>/scripts/index.ts --answer-manual # responder verificações manuais
cat <caminho-da-skill>/memory/$(echo -n $(pwd) | sha256sum | cut -c1-12)/history.json  # histórico
```

## Categorias auditadas automaticamente

| ID | Categoria | Checks |
|----|-----------|--------|
| A | Access Control (BOLA/IDOR) | Supabase/Postgres com RLS |
| B | Authentication & Session | Rate limit, zxcvbn, middleware, cookies |
| C | Validation | Zod, .parse()/.safeParse(), UUID validation |
| D | Client-Side (XSS/CSRF) | CSP, headers de segurança, CSRF origin, sanitização |
| E | Injection | eval, new Function, exec, SQL template literals |
| G | Files & Misconfigs | Path traversal, upload, .gitignore, source maps |
| H | Secrets & Crypto | Hardcoded secrets, .env.example, Argon2id |
| I | Hardening | CORS, HSTS, X-Powered-By, rate limit global |
| L | Dependencies | npm/pnpm/yarn e bundle-audit, lockfile, CI, cron |
| M | Security Tests | Cross-tenant, privilege escalation, CSRF, RLS |
| N | Error Handling | Error catalog, stack traces, log PII |
| R | Rails Stack Security | CSRF, strong params, before_action, html_safe/raw |
| P | PostgreSQL for Rails | adapter, migrations, foreign keys, indexes |
| Q | Redis & Cache Security | auth/TLS, namespace, TTL, dados sensíveis |
| S | Sidekiq Async Security | retry, idempotência, payload sensível |
| T | Hotwire Frontend Security | csrf_meta_tags, innerHTML, raw/html_safe |

## Categorias de verificação manual

| ID | Categoria |
|----|-----------|
| F | SSRF (Server-Side Request Forgery) |
| J | Insecure Deserialization |
| K | LLM & Prompt Injection |
| O | Documentação & Processos |

Aparecem como `warn` até o usuário responder via `--answer-manual`. Respostas salvas em `memory/{hash}/manual-answers.json`, expiram após 90 dias.

## Memória e histórico

- `<projectRoot>/.security-audit.json` — config do projeto (versionada, compartilhável com o time)
- `<caminho-da-skill>/memory/{hash}/config.json` — config local (não versionada)
- `<caminho-da-skill>/memory/{hash}/history.json` — histórico de auditorias
