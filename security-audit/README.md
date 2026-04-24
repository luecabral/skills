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
SEC_AUDIT_SCRIPT="/caminho/para/security-audit/dist/scripts/index.js"
```

Comandos:

```bash
# Auditoria no projeto atual
node "$SEC_AUDIT_SCRIPT"

# Auditoria de um projeto especifico
node "$SEC_AUDIT_SCRIPT" /caminho/do/projeto

# Saida JSON (pipeline)
node "$SEC_AUDIT_SCRIPT" --json

# Saida SARIF
node "$SEC_AUDIT_SCRIPT" --sarif

# Falhar o processo a partir de severidade escolhida (padrao: critical)
node "$SEC_AUDIT_SCRIPT" --fail-on=high

# Marcar item como N/A
node "$SEC_AUDIT_SCRIPT" --na K1 "Sem funcionalidades de IA" "nome"

# Responder verificações manuais (F/J/K/O)
node "$SEC_AUDIT_SCRIPT" --answer-manual

# Ver configuracao
node "$SEC_AUDIT_SCRIPT" --configure
```

Requisitos:

- Node.js 18+
- Rode `npm run build` antes de usar `node dist/scripts/index.js`; em desenvolvimento, use `npx tsx scripts/index.ts`.
- `memory/`, `dist/` e `node_modules/` são artefatos locais e não devem ser commitados.

---

## Memória e Histórico

A skill salva automaticamente:
- `<projectRoot>/.security-audit.json` — config do projeto (versionada no repositório, recomendada para compartilhar com o time)
- `<caminho-da-skill>/memory/{hash}/config.json` — config local do projeto (não versionada, para uso pessoal)
- `<caminho-da-skill>/memory/{hash}/history.json` — histórico de auditorias (não versionada)

O hash é gerado a partir do path absoluto do projeto, permitindo múltiplos projetos com históricos separados.
A configuração do repositório (`.security-audit.json`) tem prioridade sobre a configuração local.

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
echo "tools/security-audit/dist/" >> /destino/.gitignore
echo "tools/security-audit/node_modules/" >> /destino/.gitignore
```

Depois, execute com o caminho real do script:

```bash
npx tsx /destino/tools/security-audit/scripts/index.ts
```

---

## Estendendo checks/modulos

### Via YAML (Regras Customizadas)

Você pode adicionar regras simples específicas para o seu projeto criando um arquivo `.security-audit.rules.yaml` na raiz do projeto:

```yaml
rules:
  - id: CUSTOM-1
    description: "Sem console.log em server code"
    severity: medium
    glob: "app/api/**/*.ts"
    pattern: "console\\.log"
    expect: absent
    remediation: "Use logger estruturado"
```

### Via Código (Módulos Completos)

1. Crie um novo arquivo em `scripts/checks/`.
2. Exporte `check(projectRoot, context)`.
3. Registre o modulo em `scripts/modules/index.ts` definindo `layer`, `scope` e `supports(context)`.
4. Atualize `SECURITY_CHECKLIST.md` e `REMEDIATION_GUIDE.md`.

---

## Exit code

- `--json` e `--sarif` sao mutuamente exclusivos
- `0`: sem falhas na severidade definida por `--fail-on`
- `1`: ha falhas na severidade definida por `--fail-on`

---

## Referencias

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
