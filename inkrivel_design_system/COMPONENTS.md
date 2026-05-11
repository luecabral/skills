# Inkrivel Design System — Componentes e Exemplos

Exemplos de HTML/ERB prontos para uso. Substitua nomes de rotas e variáveis conforme o contexto.

**Sintaxe preferida:** use helpers `_component` em vez de classes Tailwind brutas para botões, tabelas e outros componentes da gem InkComponents.

```erb
<%# ✅ Use helper syntax %>
<%= button_component(builder: :link_to, url: path, color: :pink, size: :md) { "Salvar" } %>

<%# ❌ Não use render direto %>
<%= render InkComponents::Button::Component.new(...) { "Salvar" } %>
```

---

## Botão (`button_component`)

```erb
<%# Link para nova página %>
<%= button_component(builder: :link_to, url: new_admin_item_path, color: :pink, size: :md) do %>
  <%= icon_component(name: "plus", type: :outline, class: "w-4 h-4") %>
  Novo Item
<% end %>

<%# Submit de formulário %>
<%= button_component(builder: :submit_button, color: :pink, size: :md, type: :submit) { "Salvar" } %>

<%# Cancelar (secundário) %>
<%= button_component(builder: :link_to, url: admin_items_path, color: :white, size: :md) { "Cancelar" } %>

<%# Exclusão com confirmação %>
<%= button_component(builder: :link_to, url: admin_item_path(item), color: :red, size: :sm,
      data: { turbo_method: :delete, turbo_confirm: "Tem certeza?" }) do %>
  <%= icon_component(name: "trash", type: :outline, class: "w-4 h-4") %>
<% end %>

<%# Botão HTML genérico (ex: abrir modal) %>
<%= button_component(builder: :button_tag, size: :md, type: :button,
      data: { modal_target: "modal-id", modal_toggle: "modal-id" }) do %>
  <%= icon_component(name: "plus", type: :outline, class: "text-white w-5 h-5") %>
  Criar X
<% end %>
```

**Parâmetros:** `builder` (`:link_to` | `:submit_button` | `:button_tag`), `color` (`:pink` | `:blue` | `:green` | `:red` | `:white` | `:dark`), `size` (`:xs` | `:sm` | `:md` | `:lg`)

---

## Card

```erb
<section class="bg-white p-4 flex flex-col gap-4 rounded-lg border border-gray-200">
  <div>
    <p class="text-gray-900 text-base font-semibold leading-6">Título da Seção</p>
    <p class="text-sm text-gray-500 leading-5">Subtítulo descritivo da seção</p>
  </div>
  <%# Conteúdo %>
</section>
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
<%# Via bloco %>
<%= badge_component(color: :green, size: :xs) { "Ativa" } %>
<%= badge_component(color: :red, size: :xs) { "Pausada" } %>
<%= badge_component(color: :amber, size: :xs) { "Pendente" } %>
<%= badge_component(color: :pink, size: :xs) { "Destaque" } %>

<%# Via parâmetro text: %>
<%= badge_component(text: "Ativo", color: :green, size: :md) %>
<%= badge_component(text: "Inativo", color: :dark, size: :md) %>
<%= badge_component(text: "Pendente", color: :blue, size: :sm) %>
```

**Colors disponíveis:** `:green` · `:red` · `:amber` · `:pink` · `:blue` · `:gray` · `:dark`

---

## Checkboxes

**Booleano (checkbox_component):**
```erb
<%= checkbox_component(name: "model[field]", id: "model_field", checked: record.field?) do |cb| %>
  <% cb.with_helper_text { "Texto descritivo abaixo do label" } %>
  Label do campo
<% end %>
```

**Array de IDs:**
```erb
<%= check_box_tag "ids[]", item.id, selected, id: "item_#{item.id}",
      class: "w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-2 text-pink-600 focus:ring-pink-500" %>
<label for="item_<%= item.id %>" class="ms-2 mb-0 text-sm font-medium text-gray-900"><%= item.nome %></label>
```

---

## Index COM busca

```erb
<div class="container mx-auto flex flex-col items-start gap-6 relative pt-[42px]">

  <%# 1. Título da página %>
  <div class="flex flex-col items-start self-stretch">
    <h3 class="font-bold text-xl text-gray-900 dark:text-white">Título da Página</h3>
  </div>

  <%# 2. Background: card header + toolbar com busca %>
  <section class="w-full bg-white flex flex-col items-start gap-6 p-4 self-stretch rounded-lg border border-gray-200">
    <div class="flex flex-col items-start self-stretch">
      <p class="text-gray-900 text-base font-semibold leading-6">Título do Card/Seção</p>
      <p class="text-sm text-gray-500 leading-5">Descrição do que o usuário pode fazer nesta seção</p>
    </div>

    <div class="w-full flex lg:flex-row flex-col items-center self-stretch gap-6">
      <%= form_with url: admin_recursos_path, method: :get, local: true, class: "relative w-full lg:flex-1" do |f| %>
        <%= f.search_field :q, class: "bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-pink-600 focus:border-pink-600 block w-full pl-11 py-3 px-4", value: params[:q], placeholder: "Buscar..." %>
        <%= icon_component(name: "magnifying-glass", type: :outline, class: "absolute w-5 h-5 left-3 top-3 text-gray-600") %>
      <% end %>

      <%= link_to new_admin_recurso_path,
            class: "inline-flex items-center gap-2 px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg",
            data: { turbo_frame: "modal-content", action: "modal#open" } do %>
        <%= icon_component(name: "plus", type: :outline, class: "text-white w-5 h-5") %>
        Novo Recurso
      <% end %>
    </div>
  </section>

  <%# 3. Tabela FORA do background %>
  <% if @records.empty? %>
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
      <%= link_to new_admin_recurso_path,
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
              <%= link_to record.name, edit_admin_recurso_path(record), class: "text-sm text-gray-900" %>
            </td>
            <td class="px-4 py-3 text-center">
              <%= badge_component(color: :pink, size: :xs) { record.count } %>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <%= link_to edit_admin_recurso_path(record), class: "p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" do %>
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

---

## Index SEM busca

```erb
<div class="container mx-auto flex flex-col items-start gap-6 relative pt-[42px]">

  <%# 1. Cabeçalho inline: título + subtítulo à esquerda, botão à direita %>
  <div class="flex flex-col items-start self-stretch gap-2">
    <div class="flex flex-row items-center justify-between w-full">
      <div>
        <h1 class="font-bold text-xl text-gray-900 dark:text-white">Título da Página</h1>
        <p class="text-sm text-gray-500">Descrição do que o usuário pode fazer nesta seção</p>
      </div>
      <%= link_to new_admin_item_path,
            data: { turbo_stream: true },
            class: "flex items-center justify-center gap-2 px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg" do %>
        <%= icon_component(name: "plus", type: :outline, class: "text-white w-5 h-5") %>
        Novo Item
      <% end %>
    </div>
  </div>

  <%# 2. Info banner opcional %>
  <% if @items.any? %>
    <div class="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-start gap-2">
      <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>Informação contextual sobre os itens.</span>
    </div>
  <% end %>

  <%# 3. Lista/tabela de conteúdo %>
  <div class="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div class="divide-y divide-gray-200" id="items_lista">
      <% if @items.empty? %>
        <div class="px-4 py-16 text-center text-gray-400 text-sm">
          <p class="font-medium mb-1">Nenhum item configurado</p>
          <p class="text-xs text-gray-400 mb-4">Mensagem incentivando criação do primeiro.</p>
          <%= link_to new_admin_item_path,
                data: { turbo_stream: true },
                class: "inline-flex items-center gap-1.5 text-sm text-pink-600 hover:text-pink-700 font-medium" do %>
            <%= icon_component(name: "plus", type: :outline, class: "w-4 h-4") %>
            Criar o primeiro item
          <% end %>
        </div>
      <% else %>
        <% @items.each do |item| %>
          <%= render "item", item: item %>
        <% end %>
      <% end %>
    </div>
  </div>

</div>
```

---

## Página com múltiplas seções (ex: Dashboard)

```erb
<div class="container mx-auto flex flex-col items-start gap-6 relative pt-[42px]">

  <h3 class="font-bold text-xl text-gray-900 dark:text-white">Título da Página</h3>

  <%# Section 1: Header com toolbar %>
  <section class="w-full bg-white flex flex-col items-start gap-6 p-4 self-stretch rounded-lg border border-gray-200">
    <div class="flex flex-col items-start self-stretch">
      <p class="text-gray-900 text-base font-semibold leading-6">Visão Geral</p>
      <p class="text-sm text-gray-500 leading-5">Descrição da seção</p>
    </div>
    <%# Toolbar/filtros aqui %>
  </section>

  <%# Conteúdo da Section 1 (FORA do section) %>
  <div class="w-full grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
    <%# Cards de stats %>
  </div>

  <%# Section 2: Header %>
  <section class="w-full bg-white flex flex-col items-start gap-6 p-4 self-stretch rounded-lg border border-gray-200">
    <div class="flex flex-col items-start self-stretch">
      <p class="text-gray-900 text-base font-semibold leading-6">Subtítulo da Seção 2</p>
      <p class="text-sm text-gray-500 leading-5">Descrição</p>
    </div>
  </section>

  <%# Conteúdo da Section 2 (FORA) %>
  <div class="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    <%# Cards %>
  </div>

</div>
```

---

## Formulário Admin (criar/editar)

```erb
<div class="container mx-auto flex flex-col items-start gap-6 relative pt-[42px] mb-8">

  <%# 1. Cabeçalho com breadcrumb %>
  <div class="flex flex-col items-start self-stretch gap-2">
    <h3 class="font-bold text-xl text-gray-900 dark:text-white">Criar/Editar X</h3>
    <%= breadcrumb_component(background: :transparent) do |breadcrumb| %>
      <%= breadcrumb.with_list do |list| %>
        <%= list.with_item do |item| %>
          <% item.with_previous_page(href: admin_recursos_path) do %>Lista<% end %>
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

    <%= form_with(model: @record, url: admin_recursos_path, builder: InkComponents::FormBuilder, local: true, class: "w-full flex flex-col gap-6") do |f| %>

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
          <%= input_field_component(id: "record_name", scale: :md, state: :default, name: "record[name]", value: @record.name, placeholder: "Ex: valor", required: true) %>
          <p class="text-gray-500 leading-tight text-sm font-normal">Texto de ajuda</p>
        </div>

        <%# Campo data + hora %>
        <div class="flex flex-col gap-2">
          <label for="starts_date_at" class="text-sm font-medium leading-none text-gray-900 cursor-pointer">Data inicial</label>
          <div class="inline-flex items-center gap-4 w-full">
            <input data-controller="ink-dashboard--date-pick" type="text" name="record[starts_date_at]" id="starts_date_at"
                   value="<%= @record.starts_at&.strftime('%d/%m/%Y') %>"
                   class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-pink-600 focus:border-pink-600 block w-full pl-11 p-2.5">
            <input type="time" name="record[starts_time_at]" id="starts_time_at"
                   value="<%= @record.starts_at&.strftime('%H:%M') %>"
                   class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-pink-600 focus:border-pink-600 block w-full p-2.5">
          </div>
        </div>
      </section>

      <%# Ações: Cancelar + Salvar centralizados %>
      <section class="w-full flex flex-row gap-4 justify-center">
        <a href="<%= admin_recursos_path %>" class="inline-flex items-center justify-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md text-pink-600 text-sm font-medium border border-pink-600">
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

---

## Modal de seleção de tipo

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

## Busca com ícone

```erb
<%= form_with url: admin_items_path, method: :get do |f| %>
  <div class="relative">
    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
      <%= icon_component(name: "magnifying-glass", type: :outline, class: "w-5 h-5 text-gray-500") %>
    </div>
    <%= f.search_field :search, value: params[:search], placeholder: "Buscar...",
        class: "block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm" %>
  </div>
<% end %>
```

---

## Tabela via `table_component`

```erb
<%= table_component do |table| %>
  <% table.with_header do |header| %>
    <% header.with_cell { "Nome" } %>
    <% header.with_cell { "Status" } %>
    <% header.with_cell { "Ações" } %>
  <% end %>

  <% @items.each do |item| %>
    <% table.with_row do |row| %>
      <% row.with_cell { item.name } %>
      <% row.with_cell do %>
        <%= badge_component(text: item.status, color: item.status_color, size: :sm) %>
      <% end %>
      <% row.with_cell do %>
        <%= button_component(builder: :link_to, url: edit_admin_item_path(item), color: :blue, size: :sm) do %>
          <%= icon_component(name: "pencil", type: :outline, class: "w-4 h-4") %>
        <% end %>
      <% end %>
    <% end %>
  <% end %>
<% end %>
```

---

## Tabela via partial

```erb
<%= render layout: "universidade/admin/shared/table",
             locals: {
               columns: [
                 { label: "Nome" },
                 { label: "Status", align: :center },
                 { label: "Ações", align: :right }
               ]
             } do %>
  <tbody>
    <% @records.each do |record| %>
      <tr class="border-b border-gray-200 hover:bg-gray-50">
        <td class="px-4 py-3 text-sm text-gray-900"><%= record.name %></td>
        <td class="px-4 py-3 text-center"><%= badge_component(color: :green, size: :xs) { "Ativo" } %></td>
        <td class="px-4 py-3">
          <div class="flex items-center justify-end gap-1">
            <%= link_to edit_admin_recurso_path(record), class: "p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" do %>
              <%= icon_component(name: "pencil-square", type: :outline, class: "w-4 h-4") %>
            <% end %>
          </div>
        </td>
      </tr>
    <% end %>
  </tbody>
<% end %>
```

Coluna sticky (quando necessário): `sticky left-0 z-10 bg-gray-50` no header, `sticky left-0 z-10 bg-white` no body.

---

## Alert (`alert_component`)

```erb
<%# Info %>
<%= alert_component(color: :blue) do %>
  Informação contextual para o usuário.
<% end %>

<%# Sucesso %>
<%= alert_component(color: :green) do %>
  Operação realizada com sucesso.
<% end %>

<%# Atenção %>
<%= alert_component(color: :yellow) do %>
  Atenção: esta ação não pode ser desfeita.
<% end %>

<%# Erro %>
<%= alert_component(color: :red) do %>
  Ocorreu um erro. Tente novamente.
<% end %>
```

---

## Dropdown (`dropdown_component`)

```erb
<%= dropdown_component do |dropdown| %>
  <% dropdown.with_trigger do %>
    <%= button_component(builder: :button_tag, color: :white, size: :md, type: :button) do %>
      <%= icon_component(name: "cog-6-tooth", type: :outline, class: "w-4 h-4") %>
      Ações
    <% end %>
  <% end %>

  <% dropdown.with_menu do |menu| %>
    <% menu.with_item do %>
      <%= link_to edit_admin_item_path(@item), class: "flex items-center gap-2 text-sm text-gray-700" do %>
        <%= icon_component(name: "pencil", type: :outline, class: "w-4 h-4") %>
        Editar
      <% end %>
    <% end %>
    <% menu.with_item do %>
      <%= link_to admin_item_path(@item), class: "flex items-center gap-2 text-sm text-red-600",
            data: { turbo_method: :delete, turbo_confirm: "Tem certeza?" } do %>
        <%= icon_component(name: "trash", type: :outline, class: "w-4 h-4") %>
        Excluir
      <% end %>
    <% end %>
  <% end %>
<% end %>
```
