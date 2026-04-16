---
name: incident-response
description: Use antes de ir para produção pela primeira vez, ou quando algo der errado em produção. Ativa quando o usuário diz "vamos subir para prod", "como a gente responde se der problema", "o que fazer se vazar dados", "preciso do plano de contingência" ou quando há um incidente ativo (invasão, vazamento, comportamento anômalo detectado).
---

# Incident Response

Plano do "e se der merda?" — definido antes de ir para produção, executado quando o problema acontece.

## Princípio

Incidentes em produção são inevitáveis. A diferença entre um time que sobrevive e um que entra em colapso é ter o plano pronto antes de precisar dele. Esta skill cobre dois momentos distintos: **preparação** (antes de ir para prod) e **resposta** (quando o incidente está acontecendo).

---

## Modo 1 — Preparação (antes de ir para produção)

Use este modo quando o usuário estiver se preparando para o primeiro deploy em produção ou revisando a prontidão do sistema.

### Passo 1 — Definir o que conta como incidente

Ajude o usuário a classificar os tipos de evento:

| Severidade | Exemplos | Tempo de resposta |
|---|---|---|
| 🔴 Crítico | Vazamento de dados, sistema fora do ar, acesso não autorizado | Imediato (< 1h) |
| 🟡 Alto | Funcionalidade principal com erro, lentidão severa, falha em pagamentos | < 4h |
| 🟢 Médio | Funcionalidade secundária com erro, anomalia detectada sem impacto confirmado | < 24h |

### Passo 2 — Definir os alertas de detecção

Confirme que os alertas abaixo estão configurados antes de ir para prod:

- [ ] Múltiplas falhas de login consecutivas (possível brute force)
- [ ] Erros 5xx em volume acima do normal
- [ ] Uso anormal de API (volume ou padrão fora da curva)
- [ ] Acesso a dados sensíveis fora do horário padrão
- [ ] Secret scanning no CI detectou credencial exposta
- [ ] Dependência com CVE crítico identificada

Se algum alerta não estiver configurado, sinalize e registre como task pendente.

### Passo 3 — Montar o playbook de resposta

Gere o playbook para o projeto atual com as ações concretas para cada cenário:

#### Vazamento de dados ou acesso não autorizado
1. Revogar todos os tokens ativos do(s) usuário(s) afetado(s)
2. Rotacionar as secrets potencialmente comprometidas
3. Bloquear IP(s) ou conta(s) envolvida(s)
4. Preservar logs — não apagar nada antes de analisar
5. Identificar o vetor de entrada (como entraram?)
6. Avaliar escopo: quantos usuários foram afetados? Quais dados?
7. **Se dados pessoais foram expostos:** notificar usuários afetados e registrar notificação à ANPD em até 72h (obrigação LGPD)
8. Corrigir o vetor e fazer deploy da correção
9. Post-mortem: documentar o que aconteceu, impacto e o que mudará

#### Sistema fora do ar
1. Verificar status da infraestrutura (banco, servidor, CDN, serviços externos)
2. Verificar se foi deploy recente — se sim, avaliar rollback
3. Escalar para a pessoa responsável pela infra
4. Comunicar status internamente (Slack, email — quem precisa saber?)
5. Se o problema persistir: ativar plano de backup/failover
6. Após resolução: post-mortem

#### Credencial exposta (secret no código ou repositório)
1. Revogar a credencial imediatamente no provedor (AWS, banco, API de terceiro)
2. Gerar nova credencial e atualizar no secret manager
3. Verificar nos logs se a credencial foi usada por alguém além do sistema
4. Remover do histórico do repositório (git filter-repo ou contato com suporte do GitHub)
5. Auditar outros secrets — se um vazou, verificar os demais

### Passo 4 — Definir backups

Confirme que os backups estão configurados:

- [ ] Backups automatizados do banco de dados
- [ ] Frequência definida (ex: diário para dados críticos)
- [ ] Restore testado — backup não testado não é backup
- [ ] Backups criptografados
- [ ] Backups isolados do ambiente principal (não na mesma conta/região)
- [ ] Retenção definida (quantos dias/versões manter)

### Passo 5 — Definir comunicação

Documente:
- **Internamente:** quem avisar quando um incidente crítico ocorrer? (nome ou papel, não só cargo)
- **Externamente:** como notificar usuários afetados? (email, banner no sistema, post em status page?)
- **ANPD:** para vazamentos de dados pessoais, notificação obrigatória em 72h

Apresente o playbook na conversa para o usuário salvar onde preferir.

---

## Modo 2 — Resposta ativa (incidente em andamento)

Use este modo quando o usuário reportar um incidente em curso.

### Passo 1 — Triagem imediata

Faça as perguntas de triagem:

1. O que foi detectado? (descrição do sintoma ou alerta)
2. Quando começou?
3. Há deploy recente nas últimas horas?
4. Quantos usuários estão sendo afetados?
5. Há dados sensíveis potencialmente expostos?

Com base nas respostas, classifique a severidade (crítico / alto / médio) e siga o playbook correspondente.

### Passo 2 — Contenção antes de investigação

Para incidentes críticos: **conter primeiro, investigar depois.**

Ações de contenção imediata (conforme o tipo):
- Revogar tokens suspeitos
- Bloquear IP ou conta envolvida
- Desativar endpoint comprometido temporariamente
- Acionar rollback se for regressão de deploy

### Passo 3 — Preservar evidências

Antes de qualquer limpeza ou rollback:
- Exportar logs relevantes do período
- Fazer snapshot do estado atual (banco, infra)
- Registrar timeline: o que aconteceu e quando

### Passo 4 — Comunicação

Siga o plano de comunicação definido no playbook. Se não existir playbook, defina agora:
- Quem notificar internamente
- Se há usuários afetados, quando e como notificá-los
- Se há dados pessoais expostos, iniciar contagem de 72h para ANPD

### Passo 5 — Post-mortem (após resolução)

Todo incidente crítico ou alto deve gerar um post-mortem. Pergunte ao usuário se quer criá-lo agora:

```markdown
# Post-mortem: [título do incidente]
Data: [data]
Severidade: [crítico/alto/médio]

## O que aconteceu
[descrição objetiva — sem culpa, sem julgamento]

## Linha do tempo
- HH:MM — [evento]
- HH:MM — [evento]

## Causa raiz
[o que realmente causou o problema]

## Impacto
- Usuários afetados: [número ou estimativa]
- Dados expostos: [sim/não — se sim, quais]
- Tempo de indisponibilidade: [duração]

## O que vai mudar
- [ ] [ação preventiva 1]
- [ ] [ação preventiva 2]
```

## Regras

- Nunca apague logs ou evidências antes de analisar
- Contenção antes de investigação em incidentes críticos
- Post-mortem sem culpa — o objetivo é aprender, não punir
- Se dados pessoais foram expostos: 72h para notificar a ANPD é obrigação legal (LGPD)
- Um backup não testado não conta como backup
- O playbook deve existir antes de ir para produção — não depois do primeiro incidente
