# Security Checklist — Skill de Auditoria de Seguranca

Skill autocontida para auditoria de seguranca em aplicacoes web. Faz analise estatica do codigo, calcula score, salva historico por projeto e entrega recomendacoes praticas de remediacao.

---

## O que mudou para reuso

- Sem caminho fixo de `.agents/skills/...`: a execucao usa o caminho real do script.
- Runtime modular por camadas: `core`, `data`, `infra`, `stack`, `frontend`.
- Cada modulo implementa `supports(context)` e `run(context)`.
- Modulos `stack-specific` rodam apenas quando a stack correspondente e detectada.
- Deteccao automatica de stack expandida (Node/Ruby, Rails, Next.js, Supabase, Postgres, Redis, Sidekiq, Hotwire, package manager).
- Auditoria de dependencias por ecossistema: `npm/pnpm/yarn` e `bundle-audit` para Ruby quando aplicavel.

---

## Como funciona

1. O comando `security-audit` dispara o `scripts/index.ts`.
2. O script detecta a raiz do projeto e a stack.
3. Resolve os modulos aplicaveis por contexto (`supports(context)`).
4. Executa modulos aplicaveis (core + stack-specific relevantes).
5. Salva resultado em `memory/{hash-do-projeto}/`.
6. Exibe relatorio com score, severidade, tendencia e itens criticos.

O script nao executa a aplicacao auditada. Ele apenas analisa os arquivos do repositorio.

---

## Uso via CLI

Defina uma variavel com o caminho da skill (em qualquer repositorio):

```bash
SEC_AUDIT_SCRIPT="/caminho/para/security-audit/scripts/index.ts"
```

Comandos:

```bash
# Auditoria no projeto atual
npx tsx "$SEC_AUDIT_SCRIPT"

# Auditoria de um projeto especifico
npx tsx "$SEC_AUDIT_SCRIPT" /caminho/do/projeto

# Saida JSON (pipeline)
npx tsx "$SEC_AUDIT_SCRIPT" --json

# Marcar item como N/A
npx tsx "$SEC_AUDIT_SCRIPT" --na K1 "Sem funcionalidades de IA" "nome"

# Ver configuracao
npx tsx "$SEC_AUDIT_SCRIPT" --configure
```

Requisitos:

- Node.js 18+
- `tsx` disponivel via `npx`

---

## Estrutura

```text
security-audit/
├── SKILL.md
├── SECURITY_CHECKLIST.md
├── REMEDIATION_GUIDE.md
├── README.md
├── scripts/
│   ├── index.ts
│   ├── stack.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── reporter.ts
│   ├── memory.ts
│   ├── runtime.ts
│   ├── modules/
│   │   └── index.ts
│   └── checks/
│       ├── access-control.ts
│       ├── auth-session.ts
│       ├── validation.ts
│       ├── client-side.ts
│       ├── injection.ts
│       ├── files.ts
│       ├── secrets-crypto.ts
│       ├── hardening.ts
│       ├── dependencies.ts
│       ├── tests.ts
│       ├── error-handling.ts
│       ├── rails-stack.ts
│       ├── postgres-rails.ts
│       ├── redis-infra.ts
│       ├── sidekiq-infra.ts
│       └── hotwire-frontend.ts
└── memory/
    └── {hash-do-projeto}/
        ├── config.json
        └── history.json
```

---

## Deteccao automatica de stack

O auditor detecta:

- Ecosystem (`node`, `ruby`, `mixed`, `unknown`)
- Package manager (`npm`, `pnpm`, `yarn`, `unknown`)
- Frameworks (`nextjs`, `express`, `rails`, `hotwire`)
- Servicos (`supabase`, `postgres`, `redis`, `sidekiq`)
- Tooling (`tailwind`, `esbuild`)

Essas informacoes aparecem no relatorio e controlam checks `stack-specific`.

---

## Camadas e escopo

Camadas de modulo:

- `core`: checks universais.
- `data`: banco e acesso a dados.
- `infra`: cache, filas e runtime operacional.
- `stack`: framework backend.
- `frontend`: framework/layer client.

Escopo:

- `generic`: modulo sempre elegivel.
- `stack-specific`: modulo so executa quando `supports(context)` for verdadeiro.

Isso reduz falsos positivos em projetos fora do stack de origem.

---

## Copiando para outro projeto

```bash
cp -r /origem/security-audit /destino/tools/security-audit
```

Opcional no `.gitignore` do destino:

```bash
echo "tools/security-audit/memory/" >> /destino/.gitignore
```

Depois, execute com o caminho real do script:

```bash
npx tsx /destino/tools/security-audit/scripts/index.ts
```

---

## Estendendo checks/modulos

1. Crie um novo arquivo em `scripts/checks/`.
2. Exporte `check(projectRoot, context)`.
3. Registre o modulo em `scripts/modules/index.ts` definindo `layer`, `scope` e `supports(context)`.
4. Atualize `SECURITY_CHECKLIST.md` e `REMEDIATION_GUIDE.md`.

---

## Exit code

- `0`: sem falhas `critical`/`high`
- `1`: ha falhas `critical`/`high`

---

## Referencias

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
