---
name: design-system
description: Use ao criar qualquer tela ou componente novo nesta stack (Rails + Tailwind CDN + Hotwire). Ativa quando o usuário diz "cria a tela de X", "faz o layout de Y", "como estruturo essa página", ou sempre que for escrever HTML com classes Tailwind. Garante que espaçamentos, grids, tipografia e componentes seguem o padrão estabelecido — sem retrabalho de consistência visual.
---

# Design System

Padrões de layout para Rails + Tailwind CDN + Hotwire. Aplique diretamente — sem descrever ou narrar o que está usando.

---

## Espaçamento

- Entre **seções** da página: `mt-6`
- Entre **componentes** dentro de uma seção: `gap-4` / `space-y-4`
- Entre itens densos dentro de um card: `space-y-3`
- Entre título do card e seu conteúdo: `mb-4`
- Entre cabeçalho/breadcrumb/tabs e o conteúdo: `mb-6`

Seção = bloco temático com título próprio. Componente = card, item de lista, campo.

---

## Container de página

`px-6 py-6 max-w-7xl mx-auto` — verificar se o layout já provê antes de adicionar.

---

## Tipografia

| Nível | Classes |
|---|---|
| Título de página (H1) | `text-2xl font-bold text-gray-900` |
| Título de seção (H2) | `text-lg font-semibold text-gray-900` |
| Título de sub-seção / card (H3) | `text-base font-semibold text-gray-800` |
| Texto corrido | `text-sm text-gray-700` |
| Subtítulo abaixo do H1 | `text-sm text-gray-600` |
| Meta / caption | `text-xs text-gray-500` |
| Label de formulário | `text-sm font-medium text-gray-700` |

Não inventar tamanhos intermediários — usar apenas esta escala.

---

## Grids

- 4 colunas (stats compactos): `grid grid-cols-2 lg:grid-cols-4 gap-4`
- 3 colunas (cards médios): `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`
- 2-3 colunas (cards maiores): `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

Regra: quanto mais colunas e menor o card, menor o gap.

---

## Card

Base: `bg-white rounded-xl border border-gray-200 shadow-sm`

Padding interno:
- Padrão: `p-6`
- Compacto (stat): `p-5`
- Estado vazio: `p-12 text-center`

Card de stat: ícone `w-12 h-12` em container `rounded-lg`, número em `text-3xl font-bold`, label em `text-sm text-gray-600`.

**Todo card/background precisa de título e subtítulo.** Nunca renderize um `bg-white rounded-xl` sem um cabeçalho no topo. O espaçamento entre título e subtítulo vem das line-heights — sem margin entre eles:
```erb
<div>
  <p class="text-base font-semibold text-gray-900 leading-6">Título da Seção</p>
  <p class="text-sm text-gray-500 leading-5">Subtítulo descritivo da seção</p>
</div>
```

---

## Selects e date fields

Usar as mesmas classes do `input_field_component` (estado default):
```erb
class: "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-pink-500 focus:border-pink-500 block w-full p-2.5"
```

Aplicar em `f.select`, `f.date_field` e qualquer outro campo nativo que não use `input_field_component`.

---

## Botões

- Primário: `px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg transition-colors`
- Primário grande (CTA): `px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition`
- Secundário: `px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors`
- Destrutivo (ícone): `p-2 text-red-600 hover:bg-red-50 rounded-lg transition`

---

## Outros componentes

**Tabs:** borda inferior `border-b border-gray-200`, ativa em `border-pink-500 text-pink-600`, inativa em `border-transparent text-gray-500`.

**Badge/pill:** `px-3 py-1 rounded-full text-xs font-medium` — verde (ativo), gray (inativo), amber (pendente), pink (destaque).

**Breadcrumb:** `text-sm text-gray-500`, separador `text-gray-300`, item atual `text-gray-700 font-medium`, hover em `text-pink-600`.

**Separador dentro de card:** `border-t border-gray-200 mt-4 pt-4`

**Checkboxes:** sempre usar `checkbox_component` para campos booleanos. Nunca usar `f.check_box` ou `check_box_tag` com classes manuais para campos booleanos.
```erb
<%= checkbox_component(name: "model[field]", id: "model_field", checked: record.field?) do |cb| %>
  <% cb.with_helper_text { "Texto descritivo abaixo do label" } %>
  Label do campo
<% end %>
```
Para checkboxes de array (ex: `ids[]`), usar `check_box_tag` com as classes do ink_components:
```erb
<%= check_box_tag "ids[]", item.id, selected, id: "item_#{item.id}",
      class: "w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-2 text-pink-600 focus:ring-pink-500" %>
<label for="item_<%= item.id %>" class="ms-2 mb-0 text-sm font-medium text-gray-900"><%= item.nome %></label>
```

**Ações de formulário (criar/editar):** botão de submit centralizado, sem borda separadora, sem botão Cancelar.
```erb
<div class="flex justify-center">
  <%= f.submit "Criar X", class: "px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg transition-colors" %>
</div>
```

**Estado vazio:** sempre presente em listas que podem estar vazias — ícone `w-16 h-16 mx-auto text-gray-400`, título, frase de incentivo, CTA primário grande.

**Tabela:** wrapper com card base + `overflow-hidden`, `thead bg-gray-50`, células `px-6 py-4`, hover em `hover:bg-gray-50`.

---

## Formulários (páginas de criar/editar)

**Estrutura da página:**
```erb
<div class="px-6 py-6 max-w-7xl mx-auto">
  <%# Título — 20px %>
  <h1 class="text-xl font-bold text-gray-900 mb-1">Editar X</h1>

  <%# Breadcrumb logo abaixo do título %>
  <%= breadcrumb_component do |breadcrumb| %>
    <%= breadcrumb.with_list do |list| %>
      <%= list.with_item do |item| %>
        <% item.with_previous_page(href: index_path) do %>Seção<% end %>
        <%= item.with_separator %>
      <% end %>
      <%= list.with_item do |item| %>
        <% item.with_current_page do %>Editar X<% end %>
      <% end %>
    <% end %>
  <% end %>

  <%= form_with ... class: "mt-6 space-y-6" do |f| %>
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
      <%# Cabeçalho do card — título + subtítulo obrigatórios %>
      <div>
        <p class="text-base font-semibold text-gray-900 leading-6">Informações</p>
        <p class="text-sm text-gray-500 leading-5">Subtítulo descritivo da seção</p>
      </div>

      <%# Cada campo: label + input com gap de 8px %>
      <div class="space-y-2">
        <%= label_component(...) %>
        <%= input_field_component(...) %>
        <%= helper_text_component { "..." } %>
      </div>
    </div>
  <% end %>
</div>
```

**Regras:**
- Título da página: `text-xl font-bold text-gray-900` (20px)
- Breadcrumb: logo abaixo do título, sem margem extra entre eles
- Card padding: `p-6` (24px)
- Entre campos dentro do card: `space-y-4` (16px)
- Entre label e input: `space-y-2` (8px) — usar `<div class="space-y-2">` envolvendo label + input + helper
- **Cada grupo de informações semanticamente distinto deve ser um card separado** — não agrupar tudo em um único card. Ex: "Informações Gerais", "Critérios", "Período", "Configurações" → um card cada.
- Opcional no título do card: `<span class="text-sm font-normal text-gray-500">(Opcional)</span>` inline no `<h2>`

---

## Checklist antes de finalizar

- [ ] Container de página não duplicado
- [ ] Cabeçalho com `mb-6`
- [ ] Seções com `mt-6`, componentes com `gap-4` ou `space-y-4`
- [ ] Cards com `bg-white rounded-xl border border-gray-200 shadow-sm`
- [ ] Estado vazio implementado em toda lista
- [ ] Tipografia dentro da escala definida
