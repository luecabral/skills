# Brainstorming — Referência

## Checklist de vetores (Threat Modeling)

- [ ] Acesso a dados de outro usuário (IDOR)
- [ ] Injeção em queries (SQL/NoSQL Injection)
- [ ] Execução de script no browser (XSS)
- [ ] Falsificação de requisição (CSRF)
- [ ] Enumeração de usuários ou recursos
- [ ] Race condition (especialmente em pagamentos e contadores)
- [ ] Upload de arquivo malicioso
- [ ] Prompt injection (se houver IA)
- [ ] Abuso de rate (brute force, scraping)

## Classificação de vetores

| Vetor | Probabilidade | Impacto | Prioridade |
|---|---|---|---|
| [vetor] | Alta/Média/Baixa | Alto/Médio/Baixo | 🔴/🟡/🟢 |

## Template de resumo do design (Passo 4)

```
# Design: [nome da feature]
Data: [data]

## Problema
[descrição do problema]

## Solução escolhida
[descrição da abordagem]

## O que será feito
[lista do escopo]

## Fora do escopo
[lista do que não será feito]

## Critério de sucesso
[como saber que está pronto]

## Riscos de segurança
[vetores identificados no threat modeling — deixe vazio se não aplicável]
```
