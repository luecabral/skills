# UX Validation — Referência

## Estados obrigatórios por tipo de elemento

### Botões e ações
- [ ] Default
- [ ] Hover
- [ ] Ativo / pressionado
- [ ] Desabilitado — visual claramente diferente do default
- [ ] Carregamento (loading) — enquanto a ação está sendo processada

### Formulários e inputs
- [ ] Vazio (placeholder claro)
- [ ] Com foco (focus ring visível)
- [ ] Com erro — mensagem específica próxima ao campo
- [ ] Sucesso (quando aplicável)
- [ ] Desabilitado

### Listas e coleções
- [ ] Vazio (empty state) — mensagem amigável, não tela em branco
- [ ] Carregamento (skeleton ou spinner)
- [ ] Erro — com mensagem e opção de tentar novamente
- [ ] Com dados (o caso normal)

---

## Mensagens de erro: bom e mau uso

| ❌ Genérico | ✅ Específico |
|---|---|
| "Erro ao salvar" | "Não foi possível salvar. Verifique sua conexão e tente novamente." |
| "Dados inválidos" | "O email informado não é válido. Use o formato nome@dominio.com" |
| "Algo deu errado" | "Não conseguimos processar o pagamento. Tente novamente ou use outro cartão." |
| "Error 422" | "O campo 'nome' é obrigatório." |
| "Falha na operação" | "Você não tem permissão para editar este item." |

---

## Heurísticas de Nielsen — lista completa

**🔍 H1 — Visibilidade do status do sistema**
- [ ] Ações com processamento têm feedback visual (loading, spinner)
- [ ] Estado atual é visível (item selecionado, aba ativa, passo do fluxo)

**👁 H2 — Correspondência com o mundo real**
- [ ] Textos usam linguagem do usuário, não jargão técnico
- [ ] Ícones são reconhecíveis e coerentes

**🔍 H3 — Controle e liberdade**
- [ ] Ações destrutivas têm confirmação (deletar, cancelar, sair)
- [ ] Modais têm forma clara de fechar (X, ESC, clique fora)

**🔍 H4 — Consistência e padrões**
- [ ] Componentes reutilizados (não recriados)
- [ ] Nomenclatura consistente ("Salvar" não vira "Confirmar" em outra tela)

**🔍 H5 — Prevenção de erros**
- [ ] Validação antes do envio, não só após
- [ ] Ações irreversíveis têm confirmação explícita
- [ ] Inputs com formato específico têm máscara ou exemplo visível

**🔍 H6 — Reconhecimento em vez de memorização**
- [ ] Campos têm labels visíveis (não apenas placeholder)
- [ ] Contexto da ação visível na tela (ex: "Editando: Produto X")

**👁 H7 — Flexibilidade e eficiência**
- [ ] Fluxos simples para quem usa pela primeira vez
- [ ] Atalhos para tarefas frequentes (quando relevante)

**👁 H8 — Design estético e minimalista**
- [ ] Sem elemento visual que não serve ao usuário neste momento
- [ ] Hierarquia visual clara — o mais importante em destaque

**🔍 H9 — Recuperação de erros**
- [ ] Mensagens identificam o problema claramente
- [ ] Mensagens sugerem solução quando possível

**🔍 H10 — Ajuda e documentação**
- [ ] Campos complexos têm tooltip ou texto de ajuda
- [ ] Fluxos não-óbvios têm instrução inline
