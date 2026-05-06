# Incident Response — Referência

## Playbook: Vazamento de dados ou acesso não autorizado

1. Revogar todos os tokens ativos do(s) usuário(s) afetado(s)
2. Rotacionar as secrets potencialmente comprometidas
3. Bloquear IP(s) ou conta(s) envolvida(s)
4. Preservar logs — não apagar nada antes de analisar
5. Identificar o vetor de entrada (como entraram?)
6. Avaliar escopo: quantos usuários afetados? Quais dados?
7. **Se dados pessoais expostos:** notificar usuários afetados + registrar notificação à ANPD em até 72h (LGPD)
8. Corrigir o vetor e fazer deploy da correção
9. Post-mortem: documentar o que aconteceu, impacto e o que mudará

## Playbook: Sistema fora do ar

1. Verificar status da infraestrutura (banco, servidor, CDN, serviços externos)
2. Verificar se foi deploy recente — se sim, avaliar rollback
3. Escalar para a pessoa responsável pela infra
4. Comunicar status internamente
5. Se persistir: ativar plano de backup/failover
6. Após resolução: post-mortem

## Playbook: Credencial exposta (secret no código ou repositório)

1. Revogar a credencial imediatamente no provedor (AWS, banco, API de terceiro)
2. Gerar nova credencial e atualizar no secret manager
3. Verificar nos logs se a credencial foi usada por alguém além do sistema
4. Remover do histórico do repositório (git filter-repo ou suporte do GitHub)
5. Auditar outros secrets — se um vazou, verificar os demais

---

## Template de post-mortem

```markdown
# Post-mortem: [título do incidente]
Data: [data] | Severidade: [crítico/alto/médio]

## O que aconteceu
[Descrição objetiva — sem culpa, sem julgamento]

## Linha do tempo
- HH:MM — [evento]
- HH:MM — [evento]

## Causa raiz
[O que realmente causou o problema]

## Impacto
- Usuários afetados: [número ou estimativa]
- Dados expostos: [sim/não — se sim, quais]
- Tempo de indisponibilidade: [duração]

## O que vai mudar
- [ ] [ação preventiva 1]
- [ ] [ação preventiva 2]
```
