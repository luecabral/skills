---
name: incident-response
description: Use antes de ir para produção pela primeira vez, ou quando algo der errado em produção. Ativa quando o usuário diz "vamos subir para prod", "como a gente responde se der problema", "o que fazer se vazar dados", "preciso do plano de contingência" ou quando há um incidente ativo.
---

# Incident Response

Plano do "e se der merda?" — definido antes de ir para produção, executado quando o problema acontece.

## Modo 1 — Preparação (antes de ir para produção)

### Passo 1 — Classificar tipos de incidente

| Severidade | Exemplos | Tempo |
|---|---|---|
| 🔴 Crítico | Vazamento, sistema fora do ar, acesso não autorizado | < 1h |
| 🟡 Alto | Feature principal com erro, falha em pagamentos, lentidão severa | < 4h |
| 🟢 Médio | Feature secundária com erro, anomalia sem impacto confirmado | < 24h |

### Passo 2 — Confirmar alertas de detecção

- [ ] Múltiplas falhas de login consecutivas (brute force)
- [ ] Erros 5xx em volume acima do normal
- [ ] Uso anormal de API (volume fora da curva)
- [ ] Secret scanning detectou credencial exposta no CI
- [ ] Dependência com CVE crítico identificada

Se algum alerta não estiver configurado, registre como task pendente.

### Passo 3 — Gerar playbook

Para o projeto atual, documente ações concretas para cada cenário: vazamento de dados, sistema fora do ar, credencial exposta. Ver REFERENCE.md para roteiros detalhados.

### Passo 4 — Confirmar backups

- [ ] Backups automatizados com frequência definida
- [ ] Restore testado — backup não testado não conta
- [ ] Backups criptografados e isolados do ambiente principal

### Passo 5 — Definir comunicação

Quem avisar internamente? Como notificar usuários? Para dados pessoais: ANPD em até 72h (LGPD).

Apresente o playbook na conversa para o usuário salvar onde preferir.

---

## Modo 2 — Resposta ativa (incidente em andamento)

### Passo 1 — Triagem

O que foi detectado? Quando começou? Deploy recente? Quantos usuários afetados? Dados sensíveis expostos?

Classifique a severidade e siga o playbook correspondente (ver REFERENCE.md).

### Passo 2 — Contenção primeiro

Para críticos: **conter primeiro, investigar depois.**

Ações imediatas: revogar tokens suspeitos, bloquear IP/conta, desativar endpoint comprometido, acionar rollback se for regressão.

### Passo 3 — Preservar evidências

Antes de qualquer limpeza: exportar logs, snapshot do estado atual, registrar timeline.

### Passo 4 — Comunicação

Notificar internamente. Se usuários afetados, comunicar conforme plano. Se dados pessoais: iniciar contagem de 72h para ANPD.

### Passo 5 — Post-mortem (após resolução)

Todo incidente 🔴/🟡 gera post-mortem. Ver REFERENCE.md para template.

## Regras

- Nunca apague logs antes de analisar
- Contenção antes de investigação em críticos
- Post-mortem sem culpa — o objetivo é aprender, não punir
- Backup não testado não conta como backup
- O playbook deve existir antes de ir para produção
