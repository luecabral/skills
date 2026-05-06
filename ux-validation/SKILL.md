---
name: ux-validation
description: Use ao implementar ou revisar qualquer tela, componente ou fluxo de interface. Ativa quando há mudanças visuais no código, quando o usuário diz "revisa a interface", "tá bom visualmente?", "valida o UX disso" ou ao construir um componente novo.
---

# UX Validation

Validação de interface antes de qualquer PR.

## Dois modos

- **`guide`** — ao construir uma tela nova
- **`review`** — ao revisar código existente

## Checklist

### 1. Componentização
- [ ] Esse elemento já existe como componente no projeto?
- [ ] Se recriou: há razão justificável ou é duplicação desnecessária?
- [ ] Novo componente vai para a pasta de componentes compartilhados?

**Regra:** nunca recrie algo que já existe — verifique antes de escrever.

### 2. Estados obrigatórios

Para botões, inputs e listas, todos os estados precisam estar implementados: default, hover, ativo, desabilitado, carregamento, erro, vazio, sucesso. Ver REFERENCE.md para checklist detalhado por tipo de elemento.

### 3. Feedback de ações assíncronas
- [ ] Indicação visual de que algo está processando?
- [ ] Confirmação quando a ação é concluída?
- [ ] Feedback claro quando algo dá errado?
- [ ] Interface volta ao estado correto após erro? (não fica presa em loading)

### 4. Mensagens de erro específicas

"Algo deu errado" e "Erro" são sempre bloqueantes. Toda mensagem deve dizer o que aconteceu e, quando possível, o que fazer. Ver REFERENCE.md para exemplos de bom e mau uso.

### 5. Heurísticas de Nielsen

Pontos críticos verificáveis no código (ver REFERENCE.md para lista completa):
- **H1:** feedback visual para ações com processamento
- **H3:** confirmação em ações destrutivas; como fechar modais
- **H4:** componentes reutilizados; nomenclatura consistente
- **H5:** validação antes do envio; confirmação em ações irreversíveis
- **H9:** mensagens de erro identificam problema e sugerem solução

### 6. Acessibilidade
- [ ] Imagens têm `alt` descritivo
- [ ] Botões com ícone têm `aria-label`
- [ ] Inputs têm `label` (não só placeholder)
- [ ] Navegação por Tab em ordem lógica
- [ ] Contraste WCAG AA (4.5:1 texto normal)

## Modo review — análise de código

### Passo 1 — Identificar arquivos de interface alterados

### Passo 2 — Analisar na ordem

Componentização → erros → estados → heurísticas → acessibilidade

### Passo 3 — Apresentar relatório

```
🎨 REVISÃO DE UX — N achados

[1] 🚨 BLOQUEANTE | arquivo.ext — Linha X
Princípio: [seção ou heurística]
Problema: [descrição] | Correção: [o que mudar]
```

- **🚨 BLOQUEANTE** — erro genérico, componente duplicado sem justificativa, estado obrigatório ausente, H1/H3/H5/H9 violados
- **⚠️ SUGESTÃO** — heurística menos crítica, consistência
- **💡 NITPICK** — polish ou preferência estética

### Passo 4 — Aplicar correções

Pergunte quais aplicar. Execute com confirmação, um por vez.

## Regras

- Mensagens de erro genéricas são sempre bloqueantes
- Componente recriado sem justificativa é sempre bloqueante
- Heurísticas contextuais (👁) → sinalize como sugestão quando houver dúvida
