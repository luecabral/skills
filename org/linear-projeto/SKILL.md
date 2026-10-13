---
name: linear-projeto
description: 'Criar um projeto no Linear a partir de um brief de task (Oportunidade + Solução, com fluxos e regras de negócio). Pergunta o que falta no brief, pergunta o time, mostra o preview e só cria depois da confirmação. Cria só o projeto: nada de issue, milestone ou sub-issue. Usar APENAS quando o usuário chamar /linear-projeto. Requer o conector do Linear.'
---

# Criação de Projeto no Linear

Transforma um brief de task num projeto do Linear documentado no formato de brief abaixo. O brief inteiro vira a descrição do projeto.

**Só o projeto.** Não crie issues, milestones, sub-issues nem nenhuma outra entidade — só o projeto e sua descrição. Os fluxos continuam documentados **dentro** da descrição, na seção Comportamento Esperado; eles não viram issue.

## Quando usar

Somente quando o usuário escrever `/linear-projeto`. Sem o comando, não ativar — mesmo que o assunto seja Linear, criar projeto ou abrir issue.

## O que vira o quê

- **Task → Projeto.** O brief inteiro (Oportunidade + Solução) vira a descrição do projeto, seguindo o template abaixo.
- **Fluxo → seção da descrição.** Cada `### Nome do Fluxo` do Comportamento Esperado fica dentro da descrição do projeto, com seus passos e o `#### Regras de negócio`. Não extraia fluxo pra fora do projeto.

## O processo

1. **Leia o brief que o usuário trouxe.** Pode vir já no formato do template ou como brain dump. Extraia tudo que der.
2. **Rascunhe a documentação** no formato do template (abaixo) e **mapeie as lacunas** — o que o template pede e o brief não respondeu. Não invente nada pra tapar buraco.
3. **Pergunte o que falta (obrigatório, antes do preview).** Nunca vá direto pro preview com lacuna em aberto. Veja a seção abaixo.
4. **Pergunte o time.** Liste os times com `list_teams` e pergunte em qual criar o projeto. Se o brief ou a conversa já deixarem claro o time, sugira esse como resposta recomendada.
5. **Monte o preview e confirme.** Mostre no chat: nome do projeto, time e a descrição completa, já com as respostas incorporadas. Só crie no Linear depois de o usuário confirmar.
6. **Crie o projeto** com `save_project`: `name`, `description` (no formato do template), `setTeams: ["<time escolhido>"]`, `state: "Para planejamento"`, `priority: 3` (Média) e `lead: null`. Status, prioridade e a ausência de líder são sempre esses.
7. **Devolva o link.** O identificador/URL do projeto criado, e uma linha avisando que o usuário não ficou como líder — se quiser acompanhar, é só se inscrever (Subscribe) no projeto pela interface do Linear.

## Perguntar o que falta (Passo 3)

O brief quase nunca chega completo, e projeto com lacuna escondida vira retrabalho depois. **Sempre passe por aqui**, mesmo que pareça que dá pra inferir.

**Primeiro mostre o placar das lacunas** — lista curta do que ficou em aberto, pro usuário ver o tamanho do buraco antes de responder ("Faltam 4 coisas pra fechar o brief: o critério de sucesso, o que acontece quando o pagamento falha, quem pode aprovar, e o nome do projeto").

**Depois pergunte uma por vez,** em ordem de dependência (o que destrava as outras primeiro), e **ofereça uma resposta recomendada junto com cada pergunta**:

> "O que acontece se o pagamento falhar no meio do fluxo? Sugiro voltar pro carrinho com o item preservado e uma mensagem explicando o erro, porque perder o carrinho é o que mais gera abandono."

O usuário responde num "sim" quando concorda, e é isso que faz a conversa andar rápido. Assuma que quem pede é de produto e não é técnico, a menos que mostre o contrário: pergunte em linguagem de produto (o que o usuário vê, o que o sistema faz, quem pode o quê), e se um termo técnico for inevitável, explique curto entre parênteses.

**O que conta como lacuna:** seção do template vazia ou genérica (Oportunidade que não é um problema, Contexto sem tela nem perfil, Consequências sem impacto), Hipótese sem resultado esperado, Impacto Almejado sem nada mensurável, fluxo sem caminho de erro/vazio/cancelamento, regra de negócio insinuada mas não declarada ("só quem tem permissão" — quem?), e o nome do projeto se o usuário não deu um.

**O que NÃO perguntar:** o que dá pra inferir do brief sem chutar; líder, status e prioridade (são fixos); detalhe de implementação (banco, biblioteca, arquitetura) — isso não entra no brief. O time é perguntado no Passo 4, não aqui.

**Se o usuário deixar algo em aberto de propósito** ("não sei ainda", "decide depois", "deixa em branco"), aí sim entra `> [a definir: o que falta]` na descrição, e você segue. O marcador é resultado de uma escolha dele, não atalho pra não perguntar.

## Formato da descrição do projeto (template do brief)

Use exatamente estes níveis de heading e esta ordem no campo `description` do projeto:

```markdown
# Oportunidade
[uma frase só descrevendo o problema]

## Contexto
[onde o problema acontece: telas, fluxos, perfis de usuário afetados]

## Consequências
- [impacto do problema]
- [impacto do problema]

# Solução
[duas frases: o que é e como funciona em alto nível]

## Hipótese
Se fizermos [ação], então veremos [resultado esperado].

## Impacto Almejado
- [impacto esperado, quantitativo ou qualitativo]
- [impacto esperado, quantitativo ou qualitativo]

## Comportamento Esperado

### [Nome do Fluxo]
1. [usuário faz / vê algo]
2. [usuário faz / vê algo]
3. [sistema responde]

#### Regras de negócio
- [regra que governa esse fluxo]
- [regra que governa esse fluxo]
```

Regras rápidas das seções: **Oportunidade** é o problema numa frase, não a solução. **Contexto** é concreto (telas, perfis, onde dói). **Consequências** e **Impacto Almejado** em bullets de uma ideia cada. **Solução** em duas frases, sem virar especificação. **Hipótese** sempre no formato `Se fizermos ___, então veremos ___`. **Comportamento Esperado** é o coração: para cada fluxo, um `### Nome do Fluxo`, passos numerados na ótica do usuário, e um `#### Regras de negócio` logo embaixo. Repita o par (fluxo → regras) para cada fluxo.

## Ferramentas do Linear

- `list_teams` — listar os times pra perguntar em qual criar o projeto (Passo 4).
- `list_projects` — checar se já existe projeto com o mesmo nome antes de criar, pra evitar duplicata.
- `save_project` — cria o projeto. Campos fixos: `state: "Para planejamento"`, `priority: 3` (Média) e `lead: null`. Além desses: `setTeams` com o time escolhido, `name` e `description` (markdown, com quebras de linha e caracteres literais, sem escapar). Opcional: `summary` (resumo curto até 255 chars). Escala de prioridade, pra referência: 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low — sempre 3.

Nenhuma outra ferramenta de escrita. **Não** chame `save_issue`, `save_milestone` nem equivalentes.

## Regras

- **Só com /linear-projeto.** Não ativar por inferência de contexto.
- **Só o projeto.** Nada de issue, milestone ou sub-issue — mesmo que o brief tenha vários fluxos. Vários fluxos = várias seções na descrição, não vários itens no Linear.
- **Confirme antes de criar.** Nunca chame `save_project` sem o preview aprovado pelo usuário. É ação que escreve no workspace do Linear.
- **Não invente, pergunte.** Sem dados nem regras de negócio que o usuário não trouxe ou confirmou. Lacuna vira **pergunta antes do preview** (Passo 3); só o que ele escolher deixar em aberto vira `> [a definir: ...]`.
- **Time sempre perguntado,** nunca presumido. Status `Para planejamento` (`state`) e prioridade **Média** (`priority: 3`) são fixos: não pergunte nem varie esses dois.
- **Nunca ponha o usuário como líder.** `lead: null`, sempre — e não invente outra pessoa como líder. O usuário acompanha o projeto, não lidera. O `save_project` **não tem campo de membro nem de subscriber**, então não tente `addMembers`, `members` ou equivalente: não existe. Quem quiser acompanhar se inscreve pela interface.
- **Português do Brasil**, tom objetivo e claro. Nada de travessão (—) no conteúdo do brief; use vírgula, ponto ou parênteses.
