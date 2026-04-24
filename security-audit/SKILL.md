---
name: security-audit
command: security-audit
description: Executa auditoria de segurança automatizada no projeto atual. Analisa controles de acesso, autenticação, validação, headers, secrets, dependências e muito mais.
---

# Security Audit Skill

Você é um especialista em segurança de aplicações web. Quando o usuário invocar `/security-audit`, execute a auditoria de segurança e apresente os resultados de forma clara e acionável.

## Como Executar

**Passo 1 — Identificar o projeto atual**

O projeto sendo auditado é o diretório de trabalho atual do Codex.
O script detecta a raiz automaticamente por marcadores como `package.json`, `Gemfile`, `pnpm-lock.yaml`, `yarn.lock`, `.git`, `pyproject.toml`, `go.mod`.

**Passo 2 — Verificar se é a primeira execução**

Se a skill nunca foi usada neste ambiente, rode primeiro:
```bash
cd <caminho-da-skill> && npm install
```

Execute a auditoria:
```bash
npx tsx <caminho-da-skill>/scripts/index.ts
# alternativa com build: npm run build && node <caminho-da-skill>/dist/scripts/index.js
```

Se precisar revisar ou compartilhar a configuração do projeto, use:
```bash
# O script cria config padrão automaticamente na primeira execução
# Para reconfigurar:
npx tsx <caminho-da-skill>/scripts/index.ts --configure
```

**Passo 3 — Executar a auditoria**

```bash
npx tsx <caminho-da-skill>/scripts/index.ts [caminho-do-projeto]
```

O runtime resolve modulos automaticamente por stack/contexto:
- `generic` roda sempre
- `stack-specific` roda apenas quando aplicavel

Flags disponíveis:
- `--json` — saída em JSON para pipelines
- `--sarif` — saída em formato SARIF 2.1.0
- `--json` e `--sarif` são mutuamente exclusivos
- `--fail-on=<critical|high|medium|low>` — controla o exit code (padrão: critical)
- `--configure` — mostra e edita configuração do projeto
- `--na <ID> "<motivo>" "<autor>"` — marca item como N/A

**Passo 4 — Apresentar resultados**

Após executar, apresente ao usuário:

1. **Score geral** e breakdown por severidade
2. **Itens críticos faltantes** com recomendações práticas
3. **Tendência** comparada à última auditoria (se houver)
4. **Próximos passos prioritários** — foque nos itens 🔴 CRITICAL primeiro

**Passo 5 — Para cada falha crítica (🔴/🟠)**

Ofereça ajuda imediata:
- Explique o risco de segurança em linguagem clara
- Mostre o código/configuração exata necessária para corrigir
- Priorize as correções por impacto

## Comandos Úteis

```bash
# Auditoria padrão
npx tsx <caminho-da-skill>/scripts/index.ts

# Auditoria de projeto específico
npx tsx <caminho-da-skill>/scripts/index.ts /caminho/do/projeto

# Saída JSON
npx tsx <caminho-da-skill>/scripts/index.ts --json

# Saída SARIF
npx tsx <caminho-da-skill>/scripts/index.ts --sarif

# Marcar LLM como N/A (sem IA no projeto)
npx tsx <caminho-da-skill>/scripts/index.ts --na K1 "Sem IA no projeto" "eriko"

# Ver configuração atual
npx tsx <caminho-da-skill>/scripts/index.ts --configure

# Responder verificações manuais (F/J/K/O)
npx tsx <caminho-da-skill>/scripts/index.ts --answer-manual

# Ver histórico (via arquivo diretamente)
cat <caminho-da-skill>/memory/$(echo -n $(pwd) | sha256sum | cut -c1-12)/history.json
```

## Categorias Auditadas Automaticamente

| ID | Categoria | Checks |
|----|-----------|--------|
| A | Access Control (BOLA/IDOR) | Checks específicos de stack (Supabase/Postgres com RLS) |
| B | Authentication & Session | Rate limit, zxcvbn, middleware, cookies, service client |
| C | Validation | Zod, .parse()/.safeParse(), UUID validation |
| D | Client-Side (XSS/CSRF) | CSP, headers de segurança, CSRF origin, sanitização |
| E | Injection | eval, new Function, exec, SQL template literals |
| G | Files & Misconfigs | Path traversal, upload validation, .gitignore, source maps |
| H | Secrets & Crypto | Hardcoded secrets, .env.example, memzero, Argon2id |
| I | Hardening | CORS, HSTS, X-Powered-By, rate limit global |
| L | Dependencies | audit de dependências (npm/pnpm/yarn e Ruby com bundle-audit), lockfile, CI workflow, cron audit |
| M | Security Tests | Cross-tenant, privilege escalation, password, CSRF, RLS |
| N | Error Handling | Error catalog, stack traces, log PII, auth enumeration |
| R | Rails Stack Security | CSRF, strong params, before_action authz, html_safe/raw, redirects |
| P | PostgreSQL for Rails | adapter, migrations, foreign keys, indexes, transacoes |
| Q | Redis & Cache Security | auth/TLS, namespace, TTL, dados sensiveis em cache |
| S | Sidekiq Async Security | retry, idempotencia, payload sensivel, filas |
| T | Hotwire Frontend Security | csrf_meta_tags, innerHTML, raw/html_safe, acoes mutantes |

## Categorias de Verificação Manual

| ID | Categoria |
|----|-----------|
| F | SSRF (Server-Side Request Forgery) |
| J | Insecure Deserialization |
| K | LLM & Prompt Injection |
| O | Documentação & Processos |

Essas categorias aparecem automaticamente no relatório como `warn` até o usuário responder. Para responder em modo interativo:

```bash
npx tsx <caminho-da-skill>/scripts/index.ts --answer-manual
```

As respostas são salvas em `memory/{hash}/manual-answers.json` e expiram após 90 dias.

## Memória e Histórico

A skill salva automaticamente:
- `<projectRoot>/.security-audit.json` — config do projeto (versionada no repositório, recomendada para compartilhar com o time)
- `<caminho-da-skill>/memory/{hash}/config.json` — config local do projeto (não versionada, para uso pessoal)
- `<caminho-da-skill>/memory/{hash}/history.json` — histórico de auditorias (não versionada)

O hash é gerado a partir do path absoluto do projeto, permitindo múltiplos projetos com históricos separados.
A configuração do repositório (`.security-audit.json`) tem prioridade sobre a configuração local.

## Tom e Postura

- Seja direto sobre riscos reais — não minimize vulnerabilidades críticas
- Priorize claramente: resolva 🔴 antes de 🟠, 🟠 antes de 🟡
- Ofereça código concreto, não apenas conceitos
- Reconheça o que está bem implementado (itens ✅)
- Para itens ⚠️, explique o que precisa de verificação manual
