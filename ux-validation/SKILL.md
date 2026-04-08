---
name: ux-validation
description: Use ao implementar ou revisar qualquer tela, componente ou fluxo de interface. Ativa quando há mudanças visuais no código, quando o usuário diz "revisa a interface", "tá bom visualmente?", "valida o UX disso" ou quando está construindo um componente novo. Valida componentização, estados de carregamento, mensagens de erro, heurísticas de Nielsen e acessibilidade antes de considerar a UI pronta.
---

# UX Validation

Validação de interface antes de qualquer PR.

## Princípio

Uma interface incompleta é aquela que funciona no happy path mas deixa o usuário perdido quando algo dá errado, quando está carregando ou quando o estado é vazio. Esta skill garante que todos os estados foram considerados, que componentes existentes foram reaproveitados e que a experiência segue padrões estabelecidos de usabilidade.

## Dois modos

### Modo `guide` — ao construir uma tela nova
Use quando o usuário está implementando um componente ou tela pela primeira vez.

### Modo `review` — ao revisar código existente
Use quando o usuário quer revisar uma interface já implementada.

---

## Checklist completo

### 1. Componentização e reaproveitamento

Antes de implementar qualquer elemento visual:

- [ ] Esse elemento (botão, input, card, modal, lista) já existe como componente no projeto?
- [ ] Se existe: está sendo importado e reutilizado, ou foi recriado do zero?
- [ ] Se foi recriado: há uma razão justificável (variação necessária) ou é duplicação desnecessária?
- [ ] Novos componentes criados nesta task são genéricos o suficiente para reaproveitamento futuro?
- [ ] O componente novo foi adicionado ao local correto do projeto (pasta de componentes compartilhados)?

**Regra:** nunca recrie algo que já existe. Antes de escrever qualquer componente, verifique o que o projeto já tem.

---

### 2. Estados obrigatórios de cada elemento interativo

**Botões e ações**
- [ ] Estado padrão (default)
- [ ] Estado hover
- [ ] Estado ativo / pressionado
- [ ] Estado desabilitado — visual claramente diferente do default
- [ ] Estado de carregamento (loading) — enquanto a ação está sendo processada

**Formulários e inputs**
- [ ] Estado vazio (placeholder claro)
- [ ] Estado com foco (focus ring visível)
- [ ] Estado com erro — com mensagem específica (ver seção 4)
- [ ] Estado de sucesso (quando aplicável)
- [ ] Estado desabilitado

**Listas e coleções**
- [ ] Estado vazio (empty state) — mensagem amigável, não tela em branco
- [ ] Estado de carregamento (skeleton ou spinner)
- [ ] Estado de erro — com mensagem e opção de tentar novamente
- [ ] Estado com dados (o caso normal)

---

### 3. Feedback de ações assíncronas

Para qualquer ação que chama uma API ou processa dados:

- [ ] Há indicação visual de que algo está acontecendo?
- [ ] O usuário recebe confirmação quando a ação é concluída?
- [ ] O usuário recebe feedback claro quando algo dá errado?
- [ ] A interface volta ao estado correto após erro? (não fica presa em loading)

---

### 4. Mensagens de erro específicas

Mensagens genéricas ("Algo deu errado", "Erro", "Falha") são inaceitáveis. Toda mensagem de erro deve dizer exatamente o que aconteceu e, quando possível, o que o usuário pode fazer.

- [ ] Cada erro tem uma mensagem própria — não uma mensagem genérica para todos os casos
- [ ] A mensagem identifica o problema de forma que o usuário entenda sem ser desenvolvedor
- [ ] A mensagem indica a ação a tomar quando há solução possível
- [ ] Erros de validação aparecem próximos ao campo problemático
- [ ] Erros de ação aparecem de forma visível e contextualizada
- [ ] Nenhum stack trace ou mensagem técnica é exibida ao usuário

**Exemplos:**

| ❌ Genérico | ✅ Específico |
|---|---|
| "Erro ao salvar" | "Não foi possível salvar. Verifique sua conexão e tente novamente." |
| "Dados inválidos" | "O email informado não é válido. Use o formato nome@dominio.com" |
| "Algo deu errado" | "Não conseguimos processar o pagamento. Tente novamente ou use outro cartão." |
| "Error 422" | "O campo 'nome' é obrigatório." |
| "Falha na operação" | "Você não tem permissão para editar este item." |

---

### 5. Heurísticas de Nielsen

Avalie as 10 heurísticas. As marcadas com 🔍 são verificáveis diretamente pelo código; as com 👁 requerem análise contextual.

**🔍 H1 — Visibilidade do status do sistema**
O usuário sempre sabe o que está acontecendo.
- [ ] Ações com processamento têm feedback visual (loading, progress, spinner)
- [ ] O estado atual é visível (item selecionado, aba ativa, passo do fluxo)
- [ ] Confirmações de ação aparecem em tempo hábil

**👁 H2 — Correspondência com o mundo real**
A interface usa linguagem e conceitos familiares ao usuário.
- [ ] Textos usam linguagem do usuário, não jargão técnico
- [ ] Ícones são reconhecíveis e coerentes com seu significado

**🔍 H3 — Controle e liberdade do usuário**
O usuário pode desfazer ações e sair de estados indesejados.
- [ ] Ações destrutivas têm confirmação (deletar, cancelar, sair)
- [ ] Há como cancelar ou voltar em processos multi-etapa
- [ ] Modais e drawers têm forma clara de fechar (X, ESC, clique fora)

**🔍 H4 — Consistência e padrões**
Elementos iguais se comportam e parecem iguais em todo o sistema.
- [ ] Componentes reutilizáveis são usados em vez de recriados (ver seção 1)
- [ ] Nomenclatura de ações é consistente ("Salvar" não vira "Confirmar" em outra tela)
- [ ] Cores e estilos seguem o padrão do projeto

**🔍 H5 — Prevenção de erros**
Melhor prevenir que remediar.
- [ ] Validação acontece antes do envio, não só após
- [ ] Ações irreversíveis têm confirmação explícita
- [ ] Inputs com formato específico têm máscara ou exemplo visível

**🔍 H6 — Reconhecimento em vez de memorização**
O usuário não precisa lembrar informações entre telas.
- [ ] Campos têm labels visíveis (não apenas placeholder)
- [ ] O contexto da ação é visível na tela (ex: "Editando: Produto X")
- [ ] Ações disponíveis estão visíveis, não escondidas

**👁 H7 — Flexibilidade e eficiência**
O sistema serve tanto novatos quanto usuários avançados.
- [ ] Fluxos principais são simples para quem usa pela primeira vez
- [ ] Atalhos existem para tarefas frequentes (quando relevante)

**👁 H8 — Design estético e minimalista**
Nada além do necessário.
- [ ] Não há elemento visual que não serve ao usuário neste momento
- [ ] Hierarquia visual está clara — o que é mais importante está em destaque

**🔍 H9 — Ajuda a reconhecer, diagnosticar e recuperar de erros**
(coberta pela seção 4 — Mensagens de erro específicas)
- [ ] Mensagens de erro identificam o problema claramente
- [ ] Mensagens de erro sugerem solução quando possível

**🔍 H10 — Ajuda e documentação**
Quando necessário, o suporte está disponível.
- [ ] Campos complexos têm tooltip ou texto de ajuda
- [ ] Fluxos não-óbvios têm instrução inline

---

### 6. Acessibilidade básica

- [ ] Imagens têm `alt` descritivo (ou `alt=""` se decorativas)
- [ ] Botões com apenas ícone têm `aria-label`
- [ ] Formulários têm `label` associado a cada input (não apenas placeholder)
- [ ] Navegação por teclado segue ordem lógica (Tab)
- [ ] Contraste atende WCAG AA mínimo (4.5:1 texto normal, 3:1 texto grande)

---

## Modo review — análise de código

### Passo 1 — Identificar arquivos de interface

Liste todos os arquivos de componente, view ou template alterados.

### Passo 2 — Analisar contra o checklist

Verifique cada seção. Priorize nesta ordem:
1. Componentização — está duplicando algo que já existe?
2. Mensagens de erro — são específicas?
3. Estados obrigatórios — algum faltando?
4. Heurísticas de Nielsen — alguma violação clara?
5. Acessibilidade — algum item ausente?

### Passo 3 — Apresentar relatório

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 REVISÃO DE UX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
N achado(s): X bloqueante(s) · Y sugestão(ões) · Z nitpicks

[1] 🚨 BLOQUEANTE | arquivo.ext — Linha X
Princípio violado: [seção ou heurística]
Problema: [descrição clara]
Correção: [o que adicionar ou mudar]

[2] ⚠️ SUGESTÃO | arquivo.ext — Linha X
Princípio: [seção ou heurística]
Problema: [descrição]
Correção: [o que melhorar]
```

Classifique:
- **🚨 BLOQUEANTE** — mensagem de erro genérica, componente duplicado sem justificativa, estado obrigatório ausente, heurística crítica violada (H1, H3, H5, H9)
- **⚠️ SUGESTÃO** — heurística violada mas não crítica, melhoria de consistência
- **💡 NITPICK** — detalhe de polish ou preferência estética

### Passo 4 — Aplicar correções

Apresente o relatório e pergunte quais itens aplicar. Aplique com confirmação, um por vez.

## Regras

- Mensagens de erro genéricas são sempre bloqueantes — sem exceção
- Componente recriado sem justificativa é sempre bloqueante
- Não invente padrões — valide contra o que já existe no projeto
- Se não encontrar o design system do projeto, pergunte antes de assumir
- Heurísticas 👁 requerem julgamento contextual — sinalize como sugestão, não bloqueante, quando houver dúvida
