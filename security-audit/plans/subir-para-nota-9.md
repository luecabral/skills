# Plano Faseado — security-audit de 8 → 9

## Summary

Levar a skill para nota 9 com uma estratégia **híbrida**: manter a auditoria estática forte, reduzir falsos positivos nos checks mais importantes e adicionar um modo dinâmico leve e opcional contra uma aplicação rodando. O objetivo é que a skill deixe de responder só "parece seguro no código" e passe a verificar também "o comportamento real expõe algo inseguro".

## Key Changes

### Fase 1 — Modelo de Risco e Score Mais Inteligente

- Adicionar um `riskContext` ao relatório, derivado de `.security-audit.json` e detecção automática:
  - `sensitiveData`
  - `isPublic`
  - `hasAuth`
  - `hasPayments`
  - `hasAdminArea`
  - `hasFileUpload`
- Separar três métricas no output:
  - `gate`: falha conforme `--fail-on`.
  - `coverage`: proporção de checks aplicáveis passando.
  - `riskScore`: score ponderado por severidade, stack e contexto.
- Atualizar o terminal/JSON para destacar:
  - "Top risks" em vez de apenas lista por categoria.
  - Checks `warn` críticos que exigem decisão manual.
  - Módulos não aplicáveis com motivo claro.
- Critério de aceite:
  - Projeto público com dados sensíveis pesa falhas de auth, logs e headers mais alto.
  - Projeto biblioteca sem servidor não é penalizado por headers/cookies runtime.

### Fase 2 — Precisão Estática com Mais AST

- Migrar os checks mais ruidosos restantes de regex para AST/parsing estruturado:
  - Auth/session em Next.js: distinguir chamada real de `auth/getSession/getUser` de comentário/string/import não usado.
  - Secrets: detectar literals atribuídos a variáveis sensíveis e reduzir falso positivo em exemplos/testes.
  - Rails: refinar `before_action`, `redirect_to`, `html_safe/raw`, strong params e authz em controllers.
  - Sidekiq/Redis: identificar payload sensível em args reais, não só palavras em arquivo.
- Criar helpers compartilhados em `scripts/ast.ts`:
  - `getTsCallName`
  - `findTsAssignments`
  - `findRubyMethodCalls`
  - `rubyNodeText`
- Critério de aceite:
  - Fixtures seguras com comentários contendo nomes perigosos continuam pass.
  - Fixtures vulneráveis continuam fail via `expectations`.
  - Nenhum check crítico fica sem fixture cobrindo pass e fail.

### Fase 3 — Modo Dinâmico Leve (`--probe-url`)

- Adicionar flag opcional:
  ```bash
  npx tsx scripts/index.ts --probe-url=http://localhost:3000
  ```
- Criar módulo `runtime-http-probes`, executado somente quando `--probe-url` existir.
- Probes iniciais:
  - Headers reais: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
  - Cookies reais: HttpOnly, Secure, SameSite.
  - CORS: enviar `Origin: https://evil.example` e verificar se não há `Access-Control-Allow-Origin: *` ou reflexo indevido.
  - Arquivos sensíveis: `.env`, `.git/config`, source maps comuns, `/_next/static/**/*.map` quando detectável.
  - Open redirect básico: testar paths configuráveis, sem fuzzing agressivo.
- Adicionar config opcional:
  ```json
  {
    "probe": {
      "paths": ["/", "/login", "/api/health"],
      "mutatingPaths": [],
      "timeoutMs": 5000
    }
  }
  ```
- Critério de aceite:
  - Sem `--probe-url`, comportamento atual não muda.
  - Com `--probe-url`, resultados aparecem como categoria `RUNTIME`.
  - Falha de conexão vira `warn`, não derruba a auditoria inteira.

### Fase 4 — Config, Supressões e Evidência Auditável

- Expandir `.security-audit.json` para suportar:
  - `riskContext`
  - `probe`
  - `severityOverrides`
  - `acceptedRisks`
- Cada `acceptedRisk` deve exigir:
  - `itemId`
  - `reason`
  - `author`
  - `expiresAt`
- Trocar exclusões permanentes simples por riscos aceitos com expiração.
- No relatório, mostrar:
  - itens aceitos vencidos como `warn`;
  - itens aceitos válidos como `skip` com justificativa;
  - evidência curta do achado: arquivo/linha, header observado, cookie observado ou URL testada.
- Critério de aceite:
  - Supressão sem expiração não passa validação.
  - Risco aceito vencido volta a aparecer no relatório.
  - JSON e SARIF preservam evidência do achado.

### Fase 5 — Testes, Fixtures e CI de Qualidade

- Adicionar fixtures novas:
  - `nextjs-runtime-secure`
  - `nextjs-runtime-vulnerable`
  - `rails-runtime-secure`
  - `rails-runtime-vulnerable`
- Para probes HTTP, criar servidores fixture mínimos no teste, sem depender de framework real pesado.
- Estender `test/run-fixtures.ts` para validar:
  - snapshots estáticos;
  - expectations por item;
  - runtime probes;
  - config inválida;
  - accepted risks expirados;
  - `--probe-url` indisponível.
- Adicionar scripts:
  ```json
  {
    "test:static": "npm run build && node dist/test/run-fixtures.js",
    "test:runtime": "npm run build && node dist/test/run-fixtures.js --runtime",
    "test:update": "npm run build && node dist/test/run-fixtures.js --update"
  }
  ```
- Critério de aceite:
  - `npm test` continua rápido e sem servidor externo.
  - `npm run test:runtime` cobre os probes.
  - Toda nova regra crítica precisa ter expectation fail em pelo menos uma fixture.

## Public Interfaces

- Novas flags:
  - `--probe-url=<url>`: ativa auditoria runtime HTTP.
  - `--probe-path=<path>`: opcional e repetível; adiciona paths ao probe sem editar config.
- Novos campos no JSON report:
  - `riskContext`
  - `riskScore`
  - `runtimeProbes`
  - `acceptedRisks`
- Config `.security-audit.json` passa a aceitar:
  - `riskContext`
  - `probe`
  - `severityOverrides`
  - `acceptedRisks`
- SARIF deve incluir evidência runtime em `message.text` e URL/arquivo em `locations` quando aplicável.

## Test Plan

- Rodar:
  ```bash
  cd security-audit
  npm test
  npm run test:runtime
  ```
- Validar manualmente:
  ```bash
  npx tsx scripts/index.ts test-projects/nextjs-vulnerable --json --fail-on=high
  npx tsx scripts/index.ts test-projects/nextjs-secure --probe-url=http://localhost:3000
  npm run build && node dist/scripts/index.js test-projects/nextjs-vulnerable --sarif
  ```
- Cenários obrigatórios:
  - Runtime vulnerável sem CSP falha.
  - Runtime seguro com headers completos passa.
  - CORS wildcard em app público falha high.
  - `.env` exposto falha critical.
  - `acceptedRisk` expirado aparece como warn.
  - `--probe-url` fora do ar não quebra a auditoria.

## Assumptions

- A direção escolhida para nota 9 é **híbrida**, com DAST leve e opt-in.
- A skill continua sendo local/path-based, sem publicação npm nesta fase.
- Não haverá fuzzing agressivo, crawling profundo ou integração OWASP ZAP neste ciclo.
- Remediation continua textual; a skill não gera patches automáticos.
- A compatibilidade com o modo atual é obrigatória: sem `--probe-url`, a auditoria permanece estática.
