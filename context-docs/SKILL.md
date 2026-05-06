---
name: context-docs
description: Use quando o usuário diz "documenta isso", "cria o AGENTS.md", "registra essa feature", "explica como funciona pra IA". Cria e mantém documentação dual-audience — legível para humanos leigos e usada como contexto por agentes de IA.
---

# Context Docs

Documentação que serve dois públicos ao mesmo tempo:
- **Humanos não-tech:** entender o que o projeto faz e como funciona
- **Agentes de IA:** contexto suficiente para codar com qualidade e não quebrar o que já existe

## Estrutura de arquivos

```
projeto/
├── AGENTS.md               ← Contexto mestre para agentes (lido primeiro)
├── README.md               ← Visão geral humana
└── docs/
    ├── features/           ← Uma doc por feature
    ├── flows/              ← Fluxos e jornadas de usuário
    └── changelog.md        ← Registro em linguagem humana
```

Para projetos pequenos, `AGENTS.md` + `README.md` já são suficientes.

## Processo

### Caso 1 — Projeto existente sem documentação

1. Explore o repositório e gere rascunho do `AGENTS.md` (ver REFERENCE.md para estrutura)
2. Revise com o usuário: corrija nomes, adicione contexto de negócio que o código não mostra
3. Para cada feature principal, crie `docs/features/<nome>.md` (ver REFERENCE.md para template)
4. Adicione Regras de Negócio e Histórico de Decisões manualmente — isso o agente não infere
5. Documente fluxos principais em `docs/flows/`

### Caso 2 — Projeto novo

1. Escreva o `AGENTS.md` antes de codar qualquer coisa
2. Para cada feature planejada, crie `docs/features/<nome>.md` com status `planejada`
3. Atualize conforme o desenvolvimento avança

### Caso 3 — Atualizando após mudanças

Documentação desatualizada é pior que nenhuma — confunde agentes e humanos.

Rode o checklist ao fim de qualquer task (ver REFERENCE.md para checklist completo):
- `AGENTS.md` ainda reflete o estado atual?
- Algum arquivo/pasta foi criado, movido ou removido?
- Nova feature, modificação ou remoção que precisa de doc?
- `changelog.md` atualizado?

## Regras

- Leia os arquivos existentes antes de criar — nunca sobrescreva sem verificar
- Pergunte antes de inferir regras de negócio — o humano sabe o porquê
- Separe claramente o que é para humanos do que é para agentes
- Tom simples na seção humana: sem jargão, sem siglas sem explicação
- Caminhos e nomes reais na seção técnica — nada genérico
- Confirme com o humano o que foi gerado e peça para validar regras de negócio
