# Maestro — Referência

Tudo que o `SKILL.md` referencia como "REFERENCE.md" está aqui. Este arquivo é autossuficiente — não depende dos REFERENCE das skills avulsas.

## Fase 1 — Checklist de vetores (Threat Modeling)

- [ ] Acesso a dados de outro usuário (IDOR)
- [ ] Injeção em queries (SQL/NoSQL Injection)
- [ ] Execução de script no browser (XSS)
- [ ] Falsificação de requisição (CSRF)
- [ ] Enumeração de usuários ou recursos
- [ ] Race condition (especialmente em pagamentos e contadores)
- [ ] Upload de arquivo malicioso
- [ ] Prompt injection (se houver IA)
- [ ] Abuso de rate (brute force, scraping)

Classificação:

| Vetor | Probabilidade | Impacto | Prioridade |
|---|---|---|---|
| [vetor] | Alta/Média/Baixa | Alto/Médio/Baixo | 🔴/🟡/🟢 |

## Fase 1 — Template de resumo do design (Passo 4)

```
# Design: [nome da feature]
Data: [data]

## Problema
[descrição do problema]

## Solução escolhida
[descrição da abordagem]

## Benchmark / referência
[produto ou tela usada como base — deixe vazio se não houver]

## O que será feito
[lista do escopo]

## Fluxos
[caminho passo a passo do usuário — feliz + alternativos (erro, vazio, cancelamento)]

## Comportamentos esperados
[o que o sistema faz em cada situação: loading, sucesso, erro, estados]

## Regras de negócio
[condições e restrições que governam a feature, uma por linha]

## Fora do escopo
[lista do que não será feito]

## Critério de sucesso
[como saber que está pronto]

## Riscos de segurança
[vetores identificados no threat modeling — deixe vazio se não aplicável]
```

## Fase 4 — Checklist de revisão

Usado pelos subagentes de revisão do Bloco 1. Segurança/Correção aplica **Funcionalidade + Segurança + Qualidade**; UX aplica **UX**.

### Funcionalidade
- [ ] Faz o que foi proposto? Edge cases óbvios tratados?

### Segurança
- [ ] Inputs sanitizados em todas as camadas?
- [ ] Recursos verificam propriedade antes de retornar (sem IDOR)?
- [ ] Dados sensíveis não aparecem em logs ou respostas?
- [ ] Nenhuma secret no código ou arquivos commitados?
- [ ] Security headers configurados (CSP, HSTS, X-Frame-Options)?
- [ ] Rate limit em endpoints de auth e dados sensíveis?
- [ ] Cookies com `HttpOnly`, `Secure` e `SameSite`?
- [ ] Multi-tenancy: `tenant_id` validado em todas as queries?
- [ ] Uploads: MIME type, magic bytes e tamanho validados no servidor?
- [ ] Operações financeiras/contadores protegidos contra race condition?
- [ ] IA no sistema: inputs protegidos contra prompt injection?

### UX
- [ ] Ações assíncronas têm feedback visual (loading, sucesso, erro)?
- [ ] Mensagens de erro são específicas — nunca "Algo deu errado"?
- [ ] Empty states implementados?
- [ ] Interface volta ao estado correto após erro (não fica presa em loading)?
- [ ] Confirmação em ações destrutivas?
- [ ] Inputs têm `label` (não só placeholder)?
- [ ] Botões com ícone têm `aria-label`?
- [ ] Imagens têm `alt` descritivo?
- [ ] Navegação por Tab em ordem lógica?
- [ ] Componente já existe no projeto? (nunca recriar sem razão)

### Qualidade
- [ ] Sem `console.log`, `debugger` ou código de debug?
- [ ] Testes cobrem interface pública, não implementação interna?

## Formato `.plans/plan.md`

```
# Plano: [feature]
Branch: feat/nome | Data: YYYY-MM-DD

## Fora do escopo
- [non-goals]

## Tasks

- [ ] 1. Criar model X — `app/models/x.rb`
       em_resumo: guarda os dados de X no sistema
       depends_on: []
       ✓ Pronto quando: migration roda sem erro

- [ ] 2. Criar controller Y — `app/controllers/y.rb`
       em_resumo: recebe a ação do usuário e responde
       depends_on: [1]
       ✓ Pronto quando: endpoint responde 200

- [ ] 3. Criar view Z — `app/views/z.html.erb`
       em_resumo: a tela que o usuário vê
       depends_on: [1]
       ✓ Pronto quando: página renderiza sem erro

- [ ] 4. Integrar controller + view — `app/...`
       em_resumo: liga a tela à ação, fechando o fluxo
       depends_on: [2, 3]
       ✓ Pronto quando: fluxo completo funciona
```

## Grupos paralelos (topological sort)

Para o exemplo acima:
- **Grupo 1**: [task 1] — sem dependências
- **Grupo 2**: [task 2, task 3] — ambas dependem só de 1 → rodam em paralelo
- **Grupo 3**: [task 4] — depende de 2 e 3

Apresentar ao usuário como:
> "4 tasks em 3 grupos. Pico de paralelismo: 2 subagentes simultâneos."

## Merge de worktrees

Após cada grupo paralelo concluir, para cada worktree do grupo. **A task pode ter feito mais de um commit** — nunca aplique só um hash; traga o range inteiro ou faça merge da branch.

```bash
# Lista todos os commits que a worktree criou (pode ser >1)
git -C <worktree-path> log --oneline <branch-base>..HEAD

# Opção A — merge da branch da worktree (preserva todos os commits)
git merge --no-ff <branch-da-worktree>

# Opção B — cherry-pick do range completo (não um hash só)
git cherry-pick <branch-base>..<branch-da-worktree>
```

Se conflito:
1. Pausa a Fase 3
2. Descreve: "Conflito em `arquivo.rb` entre task 2 e task 3 — ambas modificaram o método `X`"
3. Aguarda resolução humana
4. Retoma a partir da task seguinte após resolução
