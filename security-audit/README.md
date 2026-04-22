# Security Checklist — Skill de Auditoria de Seguranca

Skill autocontida para auditoria de seguranca em aplicacoes web. Faz analise estatica do codigo, calcula score, salva historico por projeto e entrega recomendacoes praticas de remediacao.

---

## O que mudou para reuso

- Sem caminho fixo de `.agents/skills/...`: a execucao usa o caminho real do script.
- Checks separados por escopo:
- `generic`: rodam em qualquer projeto suportado.
- `stack-specific`: rodam apenas quando a stack correspondente e detectada.
- Deteccao automatica de stack (ex.: Next.js, Supabase, package manager).
- Auditoria de dependencias com suporte a `npm`, `pnpm` e `yarn`.

---

## Como funciona

1. O comando `security-audit` dispara o `scripts/index.ts`.
2. O script detecta a raiz do projeto e a stack.
3. Executa checks genericos e checks especificos aplicaveis.
4. Salva resultado em `memory/{hash-do-projeto}/`.
5. Exibe relatorio com score, severidade, tendencia e itens criticos.

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
│       └── error-handling.ts
└── memory/
    └── {hash-do-projeto}/
        ├── config.json
        └── history.json
```

---

## Deteccao automatica de stack

O auditor detecta:

- Ecosystem (`node` ou `unknown`)
- Package manager (`npm`, `pnpm`, `yarn`, `unknown`)
- Frameworks (`nextjs`, `express`)
- Servicos (`supabase`)

Essas informacoes aparecem no relatorio e controlam checks `stack-specific`.

---

## Generic vs stack-specific

Exemplo atual:

- Categoria `A` (Access Control com RLS) e `stack-specific` e so roda quando Supabase/Postgres com esse padrao e detectado.
- Alguns itens de categorias genericas (ex.: middleware Next.js, separacao de clients Supabase) sao marcados como `stack-specific` e ficam `skip` quando nao aplicavel.

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

## Estendendo checks

1. Crie um novo arquivo em `scripts/checks/`.
2. Exporte `check(projectRoot, context)`.
3. Registre no `scripts/index.ts` em `GENERIC_CHECKS` ou `STACK_SPECIFIC_CHECKS`.
4. Atualize `SECURITY_CHECKLIST.md` e `REMEDIATION_GUIDE.md`.

---

## Exit code

- `0`: sem falhas `critical`/`high`
- `1`: ha falhas `critical`/`high`

---

## Referencias

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
