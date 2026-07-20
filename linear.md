---
name: linear
description: >
  Cria um projeto e as issues correspondentes no Linear a partir de um brief de
  task, usando o formato de documentação do /task como conteúdo do projeto.
  USAR APENAS quando a Luiza chamar explicitamente com /linear. Não ativar por
  inferência de contexto, menção a "Linear", "criar projeto", "abrir issue" ou
  pedidos sem o comando.
---

# Criação de Projeto e Issues no Linear

Transforma um brief de task num projeto do Linear documentado no formato do `/task`, e cria uma issue para cada fluxo do Comportamento Esperado. O brief vira a descrição do projeto; as issues são criadas enxutas, só com o título.

## Quando usar

Somente quando a Luiza escrever `/linear`. Sem o comando, não ativar — mesmo que o assunto seja Linear, criar projeto ou abrir issue.

## O que vira o quê

- **Task → Projeto.** O brief inteiro (Oportunidade + Solução) vira a descrição do projeto, seguindo o template do `/task`.
- **Fluxo → Issue.** Cada `### Nome do Fluxo` do Comportamento Esperado vira uma issue no projeto, com o nome do fluxo como título.
- **Issue não tem template.** A issue é criada só com o título, vinculada ao projeto e ao time. Não imponha estrutura, passos nem seções no corpo da issue.

## O processo

1. **Leia o brief que ela trouxe.** Pode vir já no formato `/task` ou como brain dump. Extraia tudo que der.
2. **Complete a documentação do projeto** no formato do `/task` (template abaixo). Se faltar informação, marque com `> [a definir: o que falta]` e siga. Não invente dados nem regras de negócio.
3. **Monte o preview e confirme.** Mostre no chat: nome do projeto, a descrição completa e a lista de títulos de issue (um por fluxo). Só crie no Linear depois de ela confirmar.
4. **Crie o projeto** com `save_project`: `name`, `description` (no formato `/task`), `setTeams: ["Random"]`, `lead: "me"` (Luiza) e `state: "Para planejamento"`. Time, leader e status são sempre esses.
5. **Crie as issues** com `save_issue`: `title` = nome do fluxo, `team: "Random"` e `project` = o projeto criado. Uma issue por fluxo, sem corpo obrigatório.
6. **Devolva os links.** Liste o projeto e as issues criadas com seus identificadores/URLs.

## Formato da descrição do projeto (template do /task)

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

### Regras de negócio
- [regra que governa esse fluxo]
- [regra que governa esse fluxo]
```

Regras rápidas das seções: **Oportunidade** é o problema numa frase, não a solução. **Contexto** é concreto (telas, perfis, onde dói). **Consequências** e **Impacto Almejado** em bullets de uma ideia cada. **Solução** em duas frases, sem virar especificação. **Hipótese** sempre no formato `Se fizermos ___, então veremos ___`. **Comportamento Esperado** é o coração: para cada fluxo, um `### Nome do Fluxo`, passos numerados na ótica do usuário, e um `### Regras de negócio` logo embaixo. Repita o par (fluxo → regras) para cada fluxo. (Detalhe completo na skill `/task`.)

## Ferramentas do Linear

- `list_projects` — checar se já existe projeto com o mesmo nome antes de criar, pra evitar duplicata.
- `save_project` — cria o projeto. Campos fixos: `setTeams: ["Random"]`, `lead: "me"` (Luiza) e `state: "Para planejamento"`. Além desses: `name` e `description` (markdown, com quebras de linha e caracteres literais, sem escapar). Opcional: `summary` (resumo curto até 255 chars), `priority` (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low).
- `save_issue` — cria cada issue. Campos: `title`, `team: "Random"` e `project` (nome, id ou slug do projeto criado). Nada além disso é obrigatório.

## Regras

- **Só com /linear.** Não ativar por inferência de contexto.
- **Confirme antes de criar.** Nunca chame `save_project` ou `save_issue` sem o preview aprovado por ela. É ação que escreve no workspace do Linear.
- **Não invente.** Sem dados nem regras de negócio que ela não trouxe ou confirmou. Toda lacuna vira `> [a definir: ...]`.
- **Projeto sempre no time `Random`,** com Luiza como leader (`lead: "me"`) e status `Para planejamento` (`state`). Não pergunte nem varie esses três.
- **Issue enxuta.** Título é o nome do fluxo. Sem template, sem passos, sem seções no corpo.
- **Uma issue por fluxo.** Se o brief tiver vários fluxos, cria várias issues, todas no mesmo projeto.
- **Português do Brasil**, tom objetivo e claro. Nada de travessão (—) no conteúdo do brief; use vírgula, ponto ou parênteses.
