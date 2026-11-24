---
name: ideacao-monolito
description: 'Ideação de uma feature para o majestic_monolith (loja, painel do lojista, checkout ou admin), sem escrever código: levanta a tela e o comportamento de hoje, monta o artefato de ideação (intro → benchmark → proposta), fecha o escopo com quem pediu, faz o handoff de design em alta fidelidade (artefato do tipo Design, uma prancheta por tela e estado) e o handoff de dev, e só então prepara o projeto no Linear. Use quando pedirem "ideação de <X>", "vamos idear <X>", "como ficaria <X>?", "faz o handoff de design", "desenha como ficaria <X> na loja/no painel", ou quando uma sessão for aberta para explorar uma feature e montar o projeto para o time.'
argument-hint: '<feature ou problema> (ex.: lista de favoritos)'
---

# Ideação de feature

Uma sessão de ideação entrega quatro coisas, nesta ordem:

1. **Artefato de ideação** — entende o problema, compara com o mercado e propõe a solução.
2. **Handoff de design** — as telas finais, em alta fidelidade, para o time construir.
3. **Handoff de dev** — o texto com regras, fluxos e componentes de cada tela.
4. **Projeto no Linear** — só quando pedirem.

**Nada de código.** Ideação não edita arquivo do repo. Opção de conserto vira proposta escrita ou tela no artefato. Se ficar em dúvida se é pra implementar, pergunte.

Responda em pt-BR simples, sem jargão: quem pede ideação valida pelo visual.

## 1. Entender o pedido

- Leia o pedido inteiro e diga em uma frase o que vai ser desenhado e onde.
- Se a ideia já existe em algum lugar (protótipo, app externo, tela de outro projeto, concorrente), leia o que ela faz, as configurações e onde aparece para o lojista e para o comprador.
- Traga números quando houver (uso, conversão, volume) e diga de onde vieram. Se não houve teste A/B, os números mostram uso, não ganho de venda.
- Pergunte **só o que muda o desenho**, uma decisão por vez:
  - onde entra (painel do lojista, loja, checkout, configurações);
  - se liga sozinho para todas as lojas ou se o lojista ativa;
  - qual regra de plano vale.
- **Padrão quando não disserem nada:** funcionalidade que aumenta conversão vem ligada para todas as lojas, sem o lojista precisar ativar.

## 2. Levantar o que existe hoje

Antes de propor qualquer tela, olhe a tela real.

- Leia o código em `origin/main`, nunca numa cópia antiga: `git fetch origin main` e `git show origin/main:<caminho>`.
- **Loja:** considere só a página de produto nova (Flipper `new_product_page`) e o card de produto novo (Flipper `new_product_card`). A página e o card antigos não entram em nada.
- **Painel:** ache a tela onde a novidade encaixa e onde ela fica no menu lateral de hoje.
- Procure se o monólito já tem algo parecido. Exemplo: o formulário de cupom já tem um checkbox que mostra o card de desconto na página do produto e no carrinho. Reaproveite o que existe em vez de criar outro.
- Benchmark: como Shopify, Nuvemshop e as lojas grandes resolvem o mesmo problema.

## 3. Artefato de ideação

Siga o roteiro do artefato **Loja personalizada INK** (https://claude.ai/artifact/WyMsWwoJxaBXZRtfxBTKKq). Abra e espelhe a ordem das seções:

1. **Cabeçalho:** introdução, etiquetas de público, 4 resumos e um callout "Recomendação:".
2. **Benchmark:** uma caixa por produto, tabela lado a lado, "O que ninguém faz ainda" e "O que vale copiar".
3. **Proposta**, nesta ordem:
   - Como funciona (começa por "Hoje a loja...", depois os modos, o glossário, a tabela por página e as regras Pode/Não pode);
   - Fluxograma;
   - Telas;
   - Qual IA? (com custo, quando tiver IA);
   - seções de preocupação específica do tema;
   - Plano B e trade-offs;
   - Infra no monólito;
   - Fases e entregáveis.

Não copie a estrutura do projeto do Linear (problema, contexto, consequências, hipótese). As regras entram dentro da proposta, como afirmações firmes, sem seção de "decisões pra discutir".

As telas da ideação podem ser rascunho, mas já usam as fotos da loja modelo e os botões de canto 8px (ver seção 5).

## 4. Fechar o escopo

- Leve as decisões em aberto uma por vez, com a sua recomendação primeiro.
- Escreva as **regras de exibição** sem deixar caso de fora: quando aparece, quando some, o que acontece com dois itens iguais ao mesmo tempo (ex.: dois cupons com a mesma opção ligada).
- Pense no lojista que já está no plano mais alto: não mostre a ele chamada de upgrade.
- Quando a mecânica serve para mais de um tipo (ex.: cupom progressivo, tradicional e "compre X leve Y"), desenhe para todos.
- Divida em fases só quando houver dependência real. Se der pra entregar de uma vez, proponha uma fase.
- Quando a ideia vem pronta de outro lugar, mantenha o comportamento de lá, a não ser que decidam outra coisa. O visual sempre segue o da INK: loja como a loja, painel como o painel.

## 5. Handoff de design

Crie como artefato do tipo **Design** (canvas), com uma prancheta por tela e por estado. Nunca como página HTML comum: comece pelo quickstart com intent `design` e use o design system da INK.

### Fidelidade

- **Parta da tela real de hoje**, desktop e celular, igual ao que está no ar: layout, cores, fontes, espaçamentos, ícones e textos. Por cima dela, encaixe só a novidade. Quem olha tem que reconhecer a tela de hoje.
- **Nunca wireframe.** Nada de caixa cinza, bloco genérico ou imagem de exemplo.
- **Só telas.** Ficam os títulos de seção. Nada de nota, post-it, legenda explicando estado ou nome de componente desenhado sobre a tela. Essa explicação vai no handoff de dev.
- **Sem marcar o que mudou.** Nada de contorno tracejado, selo "Novo" ou destaque. A tela aparece limpa, como vai ficar.
- **Estados:** vazio, carregando, erro e sucesso, mais os estados próprios da feature, cada um na sua prancheta.
- Quando a tela de destino ainda vai ser construída por outro projeto, traga essa tela já com a novidade e mostre na sua página só a parte que é sua (ex.: só o formulário).

### Componentes

- Todo elemento com equivalente no `ink_components` (botão, badge, ícone, card, modal, tabela, campo) é desenhado exatamente como ele aparece de verdade: mesma variante, tamanho, cor, canto, fonte e ícone.
- Confira na fonte: a skill `ink-components`, os templates e o CSS da gem (`bin/bundle info ink_components`) e, se der, uma tela real que já usa o componente.
- Não invente componente parecido nem variante que não existe. Quando nenhum atende, diga isso no handoff de dev.
- **Botões e selects com canto de 8px**, nunca pílula, mesmo quando o componente vem arredondado de fábrica. O resto do componente fica igual. Selos que já são pílula na loja continuam iguais.
- Siga onde cada informação já aparece hoje. Exemplo: no card de produto, a informação de desconto fica embaixo do preço, não como selo.
- Cores: use as que a loja já usa para a mesma ideia (ex.: o verde do "+5% OFF" do Pix para desconto), não cores de referência externa.

### Conteúdo

- Fotos, nomes e preços vêm da loja modelo: https://reserva.ink/lojamodelo2.
- Campo que já existe no monólito usa o título e o texto de apoio de lá. Procure com `git grep` antes de escrever um rótulo.
- Copy da loja fala em primeira pessoa ("te enviamos"), nunca "a loja". Na loja nunca aparece "INK" ou "Reserva INK"; a INK só aparece em texto para o lojista.
- Na vitrine, filtros de cor, coleção e preço não existem mais: só ordenar e grade.

### Antes de mostrar

Abra cada prancheta e tire print, no desktop e no celular. Confira:

- espaçamento e alinhamento: componentes distribuídos por igual, sem sobra estranha à direita nem elementos espremidos;
- texto legível (sem texto escuro em fundo escuro);
- nada cortado ou sobrando fora da prancheta.

Só diga que está pronto depois de olhar. Se não conseguiu tirar o print, diga isso.

## 6. Handoff de dev

Texto para o time, em pt-BR:

- o que construir e onde (arquivo, engine, tela);
- regras de negócio e regras de exibição;
- fluxos, inclusive os de erro;
- componentes do `ink_components` usados em cada tela, e o aviso quando nenhum serve;
- flag e regra de plano;
- fora de escopo;
- riscos (custo de IA, dados pessoais e LGPD, desempenho).

## 7. Projeto no Linear

- Só crie quando pedirem. Mostre o texto antes.
- O projeto leva o link do artefato de ideação e do handoff de design.
- Não preencha "impacto almejado" se não pedirem.

## Resumo das regras da loja

| Regra | Valor |
|---|---|
| Página de produto | só a nova (`new_product_page`) |
| Card de produto | só o novo (`new_product_card`) |
| Fotos, nomes e preços | https://reserva.ink/lojamodelo2 |
| Botão e select | canto 8px |
| Copy | 1ª pessoa, sem citar INK |
| Componentes | `ink_components`, fiel ao real |
