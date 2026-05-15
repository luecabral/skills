---
name: security-audit
description: Use quando o usuário pedir "faz uma auditoria de segurança", "audita o projeto", "checa a segurança" ou antes de lançamentos importantes. Executa auditoria automatizada no projeto atual e apresenta resultados acionáveis por severidade.
---

# Security Audit

Auditoria de segurança automatizada no projeto atual.

## Processo

### Passo 1 — Identificar o projeto

O projeto auditado é o diretório de trabalho atual. O script detecta a raiz automaticamente por marcadores como `Gemfile`, `package.json`, `.git`.

### Passo 2 — Executar a auditoria

```bash
# Primeira execução: instalar dependências
cd <caminho-da-skill> && npm install

# Auditoria padrão
npx tsx <caminho-da-skill>/scripts/index.ts

# Auditoria de projeto específico
npx tsx <caminho-da-skill>/scripts/index.ts /caminho/do/projeto

# Flags úteis: --json | --sarif | --fail-on=<critical|high|medium|low>
# Marcar item como N/A: --na K1 "Sem IA no projeto" "autor"
# Responder verificações manuais: --answer-manual
```

Ver REFERENCE.md para lista completa de flags, categorias auditadas e verificações manuais.

### Passo 3 — Apresentar resultados

1. Score geral e breakdown por severidade
2. Itens críticos com recomendações práticas
3. Tendência vs. auditoria anterior (se houver)
4. Próximos passos — resolva 🔴 antes de 🟠, 🟠 antes de 🟡

### Passo 4 — Para cada falha crítica (🔴/🟠)

- Explique o risco em linguagem clara
- Mostre o código ou configuração exata para corrigir
- Priorize por impacto

## Tom

- Direto sobre riscos — não minimize vulnerabilidades críticas
- Ofereça código concreto, não apenas conceitos
- Reconheça o que está bem implementado (itens ✅)
- Para itens ⚠️, explique o que precisa de verificação manual
