---
name: inkrivel_design_system
description: Use ao criar qualquer tela ou componente novo nesta stack (Rails + Tailwind CDN + Hotwire). Ativa quando o usuário diz "cria a tela de X", "faz o layout de Y", "como estruturo essa página", ou sempre que for escrever HTML com classes Tailwind. Garante que espaçamentos, grids, tipografia e componentes seguem o padrão estabelecido — sem retrabalho de consistência visual.
---

# Inkrivel Design System — Área Admin

Padrões de layout para telas da **área administrativa** (Rails + Tailwind CDN + Hotwire + InkDashboard Engine). Aplique diretamente — sem descrever ou narrar o que está usando.

---

## Contexto: Container de Página Admin

| Contexto | Container de página |
|---|---|
| **Páginas Admin (padrão)** | `<div class="container mx-auto flex flex-col items-start gap-6 relative pt-[42px]">` |
| **Formulários Admin** | `<div class="container mx-auto flex flex-col items-start gap-6 relative pt-[42px] mb-8">` |
| **Páginas Públicas** | `<div class="w-full">` — o layout já provê o container, não duplicar |

**IMPORTANTE:**
- O `pt-[42px]` é **obrigatório** em todas as páginas admin para espaçamento superior
- Formulários adicionam `mb-8` ao final

---

## Tipografia

| Nível | Classes |
|---|---|
| Título de página (H1) | `font-bold text-2xl text-gray-900 dark:text-white` |
| Título de card (H4) | `text-gray-900 text-xl font-semibold` |
| Título de seção dentro do card | `text-gray-900 text-base font-semibold leading-6` |
| Subtítulo de seção | `text-sm text-gray-500 leading-5` |
| Texto corrido | `text-sm text-gray-700` |
| Label de formulário | `text-sm font-medium text-gray-900` |
| Helper text / caption | `text-sm font-normal text-gray-500` |

Não inventar tamanhos intermediários — usar apenas esta escala.

---

## Espaçamento

- **Entre cards/seções**: `gap-6` (24px) — usar `flex flex-col gap-6`
- **Dentro do card entre elementos**: `gap-4` (16px)
- **Entre label e input**: `gap-2` (8px) via `flex flex-col gap-2`
- **Entre título e subtítulo do card**: sem margem — line-heights cuidam disso
- **Entre título e sidebar (formulário)**: `gap-[42px]`

---

## Grids

- **4 stats cards**: `grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4`
- **3 colunas desktop, 1 mobile** (toolbar de index): `grid lg:grid-cols-3 grid-cols-1 lg:grid-rows-1 grid-rows-2 gap-6`
- **Cards médios (3 col)**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`

Regra geral: quanto mais colunas e menor o card, menor o gap.

---

## Cards

**Base padrão:**
```erb
<section class="bg-white p-4 flex flex-col gap-4 rounded-lg border border-gray-200">
  <%# Cabeçalho obrigatório — todo card precisa de título + subtítulo %>
  <div>
    <p class="text-gray-900 text-base font-semibold leading-6">Título da Seção</p>
    <p class="text-sm text-gray-500 leading-5">Subtítulo descritivo da seção</p>
  </div>

  <%# Conteúdo %>
</section>
```

**Regras:**
- Padding: `p-4` (16px)
- Border radius: `rounded-lg`
- Background: `bg-white`
- Border: `border border-gray-200` (outline cinza claro)
- Interno: `flex flex-col gap-4` (16px entre elementos)
- **Todo card precisa de título + subtítulo no cabeçalho** — nunca renderize um `bg-white rounded-lg` sem cabeçalho
- **Cada grupo de informações semanticamente distinto = card separado**

---

## Botões

- **Primário**: `inline-flex items-center gap-2 px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg`
- **Primário outline (Cancelar)**: `inline-flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md text-pink-600 text-sm font-medium border border-pink-600`
- **Secundário**: `px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50`
- **Destrutivo (ícone)**: `p-2 text-red-600 hover:bg-red-50 rounded-lg transition`

---

## Selects e date fields

Aplicar as mesmas classes dos inputs em `f.select`, `f.date_field` e campos nativos:
```erb
class: "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-pink-600 focus:border-pink-600 block w-full p-2.5"
```

---

## Breadcrumb

```erb
<%= breadcrumb_component(background: :transparent) do |breadcrumb| %>
  <%= breadcrumb.with_list do |list| %>
    <%= list.with_item do |item| %>
      <% item.with_previous_page(href: index_path) do %>Seção<% end %>
      <%= item.with_separator %>
    <% end %>
    <%= list.with_item(class: "text-sm font-medium text-gray-500") do |item| %>
      <% item.with_current_page do %>Nome da Página<% end %>
    <% end %>
  <% end %>
<% end %>
```

---

## Badge/Status

```erb
<%= badge_component(color: :green, size: :xs) { "Ativa" } %>
<%= badge_component(color: :red, size: :xs) { "Pausada" } %>
<%= badge_component(color: :amber, size: :xs) { "Pendente" } %>
<%= badge_component(color: :pink, size: :xs) { "Destaque" } %>
```

---

## Checkboxes

Sempre usar `checkbox_component` para campos booleanos:
```erb
<%= checkbox_component(name: "model[field]", id: "model_field", checked: record.field?) do |cb| %>
  <% cb.with_helper_text { "Texto descritivo abaixo do label" } %>
  Label do campo
<% end %>
```

Para checkboxes de array (ex: `ids[]`):
```erb
<%= check_box_tag "ids[]", item.id, selected, id: "item_#{item.id}",
      class: "w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-2 text-pink-600 focus:ring-pink-500" %>
<label for="item_<%= item.id %>" class="ms-2 mb-0 text-sm font-medium text-gray-900"><%= item.nome %></label>
```

---

## Página Index Admin (lista)

**Layout padrão para páginas de índice:**
- **Título da página**: H3 fora do background (contexto da funcionalidade)
- **Background (card branco)**: contém título do card (H4) + subtítulo + toolbar (busca/filtros + botão criar)
- **Tabela ou conteúdo principal**: fica FORA do background, abaixo dele
- **Sem breadcrumb** — índices admin não têm navegação em breadcrumb
- **Container obrigatório:** `pt-[42px]` para espaçamento superior

```erb
<div class="container mx-auto flex flex-col items-start gap-6 relative pt-[42px]">

  <%# 1. Cabeçalho: título da página %>
  <div class="flex flex-col items-start self-stretch">
    <h3 class="font-bold text-2xl text-gray-900 dark:text-white">Título da Página</h3>
  </div>

  <%# 2. Background: título do card + subtítulo + busca + botão de ação %>
  <section class="w-full bg-white flex flex-col items-start gap-6 p-4 self-stretch rounded-lg border border-gray-200">
    
    <%# 2.1 Cabeçalho do card %>
    <div class="flex flex-col items-start self-stretch">
      <h4 class="text-gray-900 text-xl font-semibold">Título do Card/Seção</h4>
      <p class="text-base font-normal text-gray-500">Descrição do que o usuário pode fazer nesta seção</p>
    </div>

    <%# 2.2 Toolbar: busca + botão criar %>
    <div class="w-full flex lg:flex-row flex-col items-center self-stretch gap-6">
      <%= form_with url: admin_categorias_path, method: :get, local: true, class: "relative w-full lg:flex-1" do |f| %>
        <%= f.search_field :q, class: "bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-pink-600 focus:border-pink-600 block w-full pl-11 py-3 px-4", value: params[:q], placeholder: "Buscar categorias..." %>
        <%= icon_component(name: "search", type: :outline, class: "absolute w-5 h-5 left-3 top-3 text-gray-600") %>
      <% end %>

      <%= link_to new_admin_categoria_path,
            class: "inline-flex items-center gap-2 px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg",
            data: { turbo_frame: "modal-content", action: "modal#open" } do %>
        <%= icon_component(name: "plus", type: :outline, class: "text-white w-5 h-5") %>
        Nova Categoria
      <% end %>
    </div>
  </section>

  <%# 3. Tabela (fora do background) %>
  <% if @records.empty? %>
    <%# Empty state %>
    <div class="w-full flex flex-col items-center gap-6 py-8">
      <div class="flex justify-center w-full">
        <%= image_tag "ink_dashboard/navigation_chareacter.png" %>
      </div>
      <p class="text-center text-base text-gray-800 leading-6 font-semibold w-full max-w-[406px]">
        Nenhum registro cadastrado
      </p>
      <p class="leading-tight text-sm font-normal text-center text-gray-500 max-w-[406px]">
        Descrição incentivando o usuário a criar o primeiro registro
      </p>
      <%= link_to new_path,
            class: "inline-flex items-center gap-2 px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg",
            data: { turbo_frame: "modal-content", action: "modal#open" } do %>
        <%= icon_component(name: "plus", type: :outline, class: "text-white w-5 h-5") %>
        Criar Primeiro X
      <% end %>
    </div>
  <% else %>
    <%= render layout: "universidade/admin/shared/table",
                 locals: {
                   columns: [
                     { label: "Coluna 1" },
                     { label: "Coluna 2", align: :center },
                     { label: "Ações", align: :right }
                   ]
                 } do %>
        <tbody>
          <% @records.each do |record| %>
            <tr class="border-b border-gray-200 hover:bg-gray-50">
              <td class="px-4 py-3">
                <%= link_to record.name, edit_path(record), class: "text-sm text-gray-900" %>
              </td>
              <td class="px-4 py-3 text-center">
                <%= badge_component(color: :pink, size: :xs) { record.count } %>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <%= link_to edit_path(record), class: "p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" do %>
                    <%= icon_component(name: "pencil-square", type: :outline, class: "w-4 h-4") %>
                  <% end %>
                </div>
              </td>
            </tr>
          <% end %>
        </tbody>
      <% end %>
  <% end %>

</div>
```

**Estrutura:**
1. **Título da página (H3)**: fora do background, contexto geral da funcionalidade
2. **Background (section)**: título do card (H4) + subtítulo + toolbar (busca + botão criar)
3. **Tabela ou empty state**: fica FORA do background, diretamente no container
4. **Gap de 6 (24px)**: entre todos os elementos principais

**Toolbar de busca/filtros:**
- Flex responsivo: `flex lg:flex-row flex-col items-center gap-6`
- Busca ocupa espaço restante: `w-full lg:flex-1` no formulário
- Botão com largura natural: `inline-flex` (largura "hug" do conteúdo)
- Gap de 6 (24px) entre elementos

**Tabelas — uso do partial:**
- Usar `render layout: "universidade/admin/shared/table"` com locals `columns: []`
- Cada coluna: `{ label: "Nome", align: :left|:center|:right, width: "w-32" }` (align e width opcionais)
- Dentro do bloco: renderizar `<tbody>` e `<tr>` com HTML tradicional
- Header: automaticamente gerado pelo partial (bg-gray-50, uppercase, border)
- Células: `px-4 py-3 text-sm`
- Rows: `border-b border-gray-200 hover:bg-gray-50`
- Coluna sticky (quando necessário): `sticky left-0 z-10 bg-gray-50` (header) / `sticky left-0 z-10 bg-white` (body)

---

## Formulários Admin (criar/editar)

**Regras específicas:**
- **Com breadcrumb** — formulários têm navegação (diferente de índices)
- **Container obrigatório:** `pt-[42px]` + `mb-8`

```erb
<div class="container mx-auto flex flex-col items-start gap-6 relative pt-[42px] mb-8">
  <%# 1. Cabeçalho com breadcrumb %>
  <div class="flex flex-col items-start self-stretch gap-2">
    <h3 class="font-bold text-2xl text-gray-900 dark:text-white">Criar/Editar X</h3>
    <%= breadcrumb_component(background: :transparent) do |breadcrumb| %>
      <%= breadcrumb.with_list do |list| %>
        <%= list.with_item do |item| %>
          <% item.with_previous_page(href: index_path) do %>Lista<% end %>
          <%= item.with_separator %>
        <% end %>
        <%= list.with_item(class: "text-sm font-medium text-gray-500") do |item| %>
          <% item.with_current_page do %>Criar/Editar<% end %>
        <% end %>
      <% end %>
    <% end %>
  </div>

  <%# 2. Layout: form + sidebar opcional %>
  <div class="w-full flex lg:flex-row flex-col gap-[42px] items-start">

    <%= form_with(model: record, url: url, builder: InkComponents::FormBuilder, local: true, class: "w-full flex flex-col gap-6") do |f| %>

      <%# Card por grupo semântico %>
      <section class="bg-white p-4 flex flex-col gap-4 rounded-lg border border-gray-200">
        <div>
          <p class="text-gray-900 text-base font-semibold leading-6">Informações Gerais</p>
          <p class="text-sm text-gray-500 leading-5">Subtítulo descritivo da seção</p>
        </div>

        <%# Campo texto %>
        <div class="flex flex-col gap-2">
          <%= label_component(state: :default, for: "record_name") do %>
            <span class="text-gray-500">*</span> Nome <span class="text-gray-500">(obrigatório)</span>
          <% end %>
          <%= input_field_component(id: "record_name", scale: :md, state: :default, name: "record[name]", value: record.name, placeholder: "Ex: valor", required: true) %>
          <p class="text-gray-500 leading-tight text-sm font-normal">Texto de ajuda</p>
        </div>

        <%# Campo data + hora %>
        <div class="flex flex-col gap-2">
          <label for="starts_date_at" class="text-sm font-medium leading-none text-gray-900 cursor-pointer">Data inicial</label>
          <div class="inline-flex items-center gap-4 w-full">
            <input data-controller="ink-dashboard--date-pick" type="text" name="record[starts_date_at]" id="starts_date_at"
                   value="<%= record.starts_at&.strftime('%d/%m/%Y') %>"
                   class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-pink-600 focus:border-pink-600 block w-full pl-11 p-2.5">
            <input type="time" name="record[starts_time_at]" id="starts_time_at"
                   value="<%= record.starts_at&.strftime('%H:%M') %>"
                   class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-pink-600 focus:border-pink-600 block w-full p-2.5">
          </div>
        </div>
      </section>

      <%# Ações: Cancelar + Salvar centralizados %>
      <section class="w-full flex flex-row gap-4 justify-center">
        <a href="<%= index_path %>" class="inline-flex items-center justify-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md text-pink-600 text-sm font-medium border border-pink-600">
          Cancelar
        </a>
        <button type="submit" class="inline-flex items-center justify-center gap-2 px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg">
          Salvar
        </button>
      </section>
    <% end %>

  </div>
</div>
```

**Regras:**
- Formulário: `flex flex-col gap-6` entre cards
- Cada seção semanticamente distinta = card separado (ex: "Informações Gerais", "Período", "Configurações")
- Campos condicionais: `data-controller="ink-dashboard--toggle-input"` + checkbox que mostra/esconde campo
- Título de card com campo opcional: `Título <span class="text-sm font-normal text-gray-500">(Opcional)</span>`

---

## Modal de criação com seleção de tipo

Padrão para recursos com subtipos (ex: Promoções, Regras de Frete):

```erb
<%= modal_component(modal_id: "creating-modal", max_width: :lg) do |component| %>
  <% component.with_trigger do %>
    <%= button_component(builder: :button_tag, size: :md, type: :button,
          data: { modal_target: "creating-modal", modal_toggle: "creating-modal" }) do %>
      <%= icon_component(name: "plus", type: :outline, class: "text-white w-5 h-5") %>
      Criar X
    <% end %>
  <% end %>
  <% component.with_header(modal_id: "creating-modal", title: "Criar X", subtitle: "Selecione o tipo desejado") do |header| %>
    <% header.with_close_button %>
  <% end %>
  <% component.with_body do %>
    <ul class="w-full flex flex-col items-start gap-3">
      <li class="w-full">
        <a href="<%= new_tipo_path %>" data-turbo="false"
           class="w-full inline-flex items-center justify-start p-3 gap-3 hover:bg-gray-50 rounded-lg">
          <%= icon_component(name: "icon", type: :outline, class: "text-pink-600 w-6 h-6") %>
          <p class="text-sm font-normal text-gray-900">Tipo 1</p>
        </a>
      </li>
    </ul>
  <% end %>
<% end %>
```

---

## Checklist antes de finalizar — Páginas Admin

- [ ] Container: `container mx-auto flex flex-col items-start gap-6 relative pt-[42px]`
- [ ] Formulários: adicionar `mb-8` ao container (além do `pt-[42px]`)
- [ ] **Index:** sem breadcrumb, apenas H3 no cabeçalho
- [ ] **Formulários:** com breadcrumb (Lista → Criar/Editar)
- [ ] Card principal: sempre com título (H4) + subtítulo obrigatórios
- [ ] Cards internos: `bg-white p-4 rounded-lg border border-gray-200` com `flex flex-col gap-4`
- [ ] Formulário: cards separados por seção semântica, `gap-6` entre eles
- [ ] Botões de formulário: Cancelar (outline) + Salvar (primário), centralizados
- [ ] Tabela via partial `render layout: "universidade/admin/shared/table"`
- [ ] Empty state implementado em toda lista (com imagem `navigation_chareacter.png`)
- [ ] Tipografia dentro da escala definida
- [ ] Selects/date fields com as classes padrão de input
