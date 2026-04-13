---
name: design-system
description: Use ao criar qualquer tela ou componente novo nesta stack (Rails + Tailwind CDN + Hotwire). Ativa quando o usuário diz "cria a tela de X", "faz o layout de Y", "como estruturo essa página", ou sempre que for escrever HTML com classes Tailwind. Garante que espaçamentos, grids, tipografia e componentes seguem o padrão estabelecido — sem retrabalho de consistência visual.
---

# Design System

Padrões de layout para Rails + Tailwind CDN + Hotwire baseados no Majestic Monolith. Aplique diretamente — sem descrever ou narrar o que está usando.

---

## Container de página

**Engine (InkDashboard):**
```erb
<div class="container mx-auto flex flex-col items-start gap-6 relative">
  <%# Para formulários, adicionar mb-8 %>
</div>
```

**Monólito (fora da engine):**
```erb
<div class="w-full">
  <%# O layout já provê o container, não duplicar %>
</div>
```

---

## Tipografia

| Nível | Classes |
|---|---|
| Título de página (H1) | `font-bold text-2xl text-gray-900 dark:text-white` |
| Título de card (H4) | `text-gray-900 text-xl font-semibold` |
| Título de seção dentro do card | `text-gray-900 text-base font-semibold leading-6` |
| Subtítulo de seção | `text-sm text-gray-500 leading-5` ou `text-base font-normal text-gray-500` |
| Texto corrido | `text-sm text-gray-700` |
| Label de formulário | `text-sm font-medium text-gray-900` |
| Helper text | `text-sm font-normal text-gray-500` |

Não inventar tamanhos — usar apenas esta escala.

---

## Espaçamento

- **Entre cards/seções**: `gap-6` (usar `flex flex-col gap-6`)
- **Dentro do card entre elementos**: `gap-6` ou `gap-4`
- **Entre campo e label**: `gap-2` (8px)
- **Entre título de card e conteúdo**: sem margem (line-heights cuidam disso)

---

## Grids

- **3 colunas desktop, 1 mobile (toolbar de index)**: `grid lg:grid-cols-3 grid-cols-1 lg:grid-rows-1 grid-rows-2 gap-6`
- **4 stats cards**: `grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4`

---

## Cards

**Base padrão:**
```erb
<section class="bg-white p-4 flex flex-col gap-6 rounded-lg">
  <%# Cabeçalho obrigatório %>
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
- Sem border/shadow por padrão
- Interno: `flex flex-col gap-6` ou `gap-4`
- **Todo card precisa de título + subtítulo no cabeçalho**

---

## Breadcrumb

Usar `breadcrumb_component` (padrão da engine):

```erb
<%= breadcrumb_component(background: :transparent) do |breadcrumb| %>
  <%= breadcrumb.with_list do |list| %>
    <%= list.with_item do |item|%>
      <% item.with_previous_page(href: "#") do %>
        Configurar loja
      <% end %>
      <%= item.with_separator %>
    <% end %>
    <%= list.with_item(class: "text-sm font-medium text-gray-500") do |item| %>
      <% item.with_current_page do %>
        Nome da Página
      <% end %>
    <% end %>
  <% end %>
<% end %>
```

---

## Botões

- **Primário**: `flex items-center justify-center gap-2 px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg`
- **Primário outline (Cancelar)**: `inline-flex items-center justify-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md text-pink-600 text-sm font-medium border border-pink-600`
- **Secundário**: `px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50`

---

## Página Index (lista)

**Estrutura completa:**

```erb
<div class="container mx-auto flex flex-col items-start gap-6 relative">
  <%# 1. Cabeçalho %>
  <div class="flex flex-col items-start self-stretch gap-2">
    <div class="flex flex-row items-center justify-between">
      <h3 class="font-bold text-2xl text-gray-900 dark:text-white">Título da Página</h3>
    </div>

    <%= breadcrumb_component(background: :transparent) do |breadcrumb| %>
      <%# ... breadcrumb ... %>
    <% end %>

    <%= error_boundary { render InkDashboard::CustomBanner::Component.new(...) } %>
  </div>

  <%# 2. Card principal %>
  <section class="w-full h-full bg-white flex flex-col items-start gap-6 p-4 self-stretch rounded-lg">
    <%# 2.1 Header do card %>
    <div class="w-full flex lg:flex-row flex-col items-start lg:justify-between gap-6 lg:gap-0">
      <div class="flex flex-col items-start self-stretch">
        <h4 class="text-gray-900 text-xl font-semibold">Subtítulo da Lista</h4>
        <p class="text-base font-normal text-gray-500">Descrição com <a href="#" class="text-pink-600 hover:text-pink-700 underline">link de ajuda</a>.</p>
      </div>

      <%= error_boundary { render InkDashboard::CustomTooltip::Component.new(...) } %>
    </div>

    <%# 2.2 Toolbar: busca + botão criar + filtros %>
    <div class="w-full grid lg:grid-cols-3 grid-cols-1 lg:grid-rows-1 grid-rows-2 items-center self-stretch gap-6 px-2">
      <%# Busca (ocupa 2 colunas no desktop) %>
      <%= form_with url: path, method: :get, data: { turbo: true, turbo_frame: :_top }, class: "relative lg:col-span-2" do |f| %>
        <%= f.search_field :query, class: "bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-pink-600 focus:border-pink-600 block w-full pl-11 py-3 px-4", value: params[:query], placeholder: "Busque por..." %>
        <%= icon_component(name: "search", type: :outline, class: "absolute w-5 h-5 left-3 top-3 text-gray-600") %>
      <% end %>

      <%# Botão criar %>
      <button data-modal-target="creating-modal" data-modal-toggle="creating-modal" type="button" class="flex items-center justify-center gap-2 px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg">
        <%= icon_component(name: "plus", type: :outline, class: "text-white w-5 h-5") %>
        Criar X
      </button>
    </div>

    <%# 2.3 Tabela %>
    <%= turbo_frame_tag :search, class: "w-full" do %>
      <%= render InkDashboard::Table::Component.new(class: "w-full h-auto text-left text-gray-500 text-base shadow") do |component| %>
        <% component.with_header do |header| %>
          <% header.with_row(class: "bg-gray-50 font-semibold uppercase border-b border-gray-200") do |row| %>
            <% row.with_cell(class: "p-4 text-sm") { "Coluna 1" } %>
            <% row.with_cell(class: "p-4 text-sm") { "Coluna 2" } %>
            <% row.with_cell(class: "p-4 text-sm text-center") { "Ações" } %>
          <% end %>
        <% end %>

        <% component.with_body do |body| %>
          <% @records.each do |record| %>
            <% body.with_row(class: "border-b border-gray-200 hover:bg-gray-50") do |row| %>
              <% row.with_cell do %>
                <a href="<%= edit_path(record) %>" data-turbo="false" class="w-full block text-left p-4">
                  <%= record.name %>
                </a>
              <% end %>
              <%# ... mais células ... %>
            <% end %>
          <% end %>
        <% end %>

        <% component.with_pagination(data: @records, default_params: params) %>
      <% end %>
    <% end %>
  </section>

  <%# 3. Empty state (quando @records.empty?) %>
  <section class="w-full h-full bg-white flex flex-col items-center gap-6 p-4 self-stretch rounded-lg">
    <div class="flex justify-center w-full">
      <%= image_tag "ink_dashboard/navigation_chareacter.png" %>
    </div>
    <p class="text-center text-base text-gray-800 leading-6 font-semibold w-full max-w-[406px]">
      Título do estado vazio
    </p>
    <p class="leading-tight text-sm font-normal text-center text-gray-500 max-w-[406px]">
      Descrição incentivando o usuário a criar o primeiro registro
    </p>
    <%# Botão criar %>
  </section>
</div>
```

---

## Formulários (criar/editar)

**Estrutura completa:**

```erb
<div class="container mx-auto flex flex-col items-start gap-6 relative mb-8">
  <%# 1. Cabeçalho %>
  <div class="flex flex-col items-start self-stretch gap-2">
    <div class="flex flex-row items-center justify-between">
      <h3 class="font-bold text-2xl text-gray-900 dark:text-white">Criar/Editar X</h3>
    </div>

    <%= breadcrumb_component(background: :transparent) do |breadcrumb| %>
      <%= breadcrumb.with_list do |list| %>
        <%= list.with_item do |item|%>
          <% item.with_previous_page(href: "#") do %>Seção<% end %>
          <%= item.with_separator %>
        <% end %>
        <%= list.with_item do |item|%>
          <% item.with_previous_page(href: index_path) do %>Lista<% end %>
          <%= item.with_separator %>
        <% end %>
        <%= list.with_item(class: "text-sm font-medium text-gray-500") do |item| %>
          <% item.with_current_page do %>Criar/Editar<% end %>
        <% end %>
      <% end %>
    <% end %>
  </div>

  <%# 2. Layout: form à esquerda, sidebar opcional à direita %>
  <div class="w-full flex lg:flex-row flex-col gap-7 items-start">
    
    <%# 2.1 Formulário %>
    <%= form_with(model: record, url: url, builder: InkComponents::FormBuilder, local: true, data: { controller: "..." }, class: "w-full flex flex-col gap-6") do |f| %>
      
      <%# Card de seção 1 %>
      <section class="bg-white p-4 flex flex-col gap-6 rounded-lg">
        <div>
          <p class="text-gray-900 text-base font-semibold leading-6">Informações Gerais</p>
          <p class="text-sm text-gray-500 leading-5">Subtítulo descritivo da seção</p>
        </div>

        <%# Campo 1 %>
        <div class="flex flex-col gap-2">
          <%= label_component(state: :default, for: "record_name", class: "text-sm font-normal") do %>
            <span class="text-gray-500">*</span> Nome <span class="text-gray-500">(obrigatório)</span>
          <% end %>
          <%= input_field_component(id: "record_name", scale: :md, state: :default, name: "record[name]", value: record.name, placeholder: "Ex: valor", required: true) %>
          <p class="text-gray-500 leading-tight text-sm font-normal">Texto de ajuda</p>
        </div>

        <%# Checkbox %>
        <%= checkbox_component(id: "show_banner", name: "record[show_banner]", checked: record.show_banner?) do |checkbox| %>
          <% checkbox.with_helper_text { "Texto descritivo abaixo do checkbox" } %>
          Label do checkbox
        <% end %>
      </section>

      <%# Card de seção 2 %>
      <section class="bg-white p-4 flex flex-col gap-6 rounded-lg">
        <div>
          <p class="text-gray-900 text-base font-semibold leading-6">Datas Ativas</p>
          <p class="text-sm text-gray-500 leading-5">Defina o período de validade</p>
        </div>

        <%# Date + Time fields %>
        <div class="relative gap-2 w-full flex flex-col">
          <label for="starts_date_at" class="text-sm font-medium leading-none text-gray-900 cursor-pointer">Data inicial</label>
          <div class="inline-flex items-center gap-4 w-full">
            <input data-controller="ink-dashboard--date-pick" type="text" name="record[starts_date_at]" id="starts_date_at" value="<%= record.starts_at&.strftime('%d/%m/%Y') %>" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-pink-600 focus:border-pink-600 block w-full pl-11 p-2.5">
            <input type="time" name="record[starts_time_at]" id="starts_time_at" value="<%= record.starts_at&.strftime('%H:%M') %>" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-pink-600 focus:border-pink-600 block w-full p-2.5">
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

    <%# 2.2 Sidebar opcional (ex: simulação de desconto) %>
    <%# ... %>
  </div>
</div>
```

**Regras:**
- Container: `container mx-auto flex flex-col gap-6 mb-8`
- Formulário: `flex flex-col gap-6` entre cards
- Card: `bg-white p-4 rounded-lg` com `flex flex-col gap-6` interno
- Cada seção semanticamente distinta = card separado
- Botões: Cancelar (outline) + Salvar (primário), centralizados
- Campos condicionais: usar `data-controller="ink-dashboard--toggle-input"` + checkbox que mostra/esconde campo

---

## Selects e date fields

Aplicar as mesmas classes dos inputs:
```erb
class: "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-pink-600 focus:border-pink-600 block w-full p-2.5"
```

---

## Tabelas

Usar sempre `InkDashboard::Table::Component`:
- Header: `bg-gray-50 font-semibold uppercase border-b border-gray-200`
- Cell: `p-4 text-sm`
- Rows: `border-b border-gray-200 hover:bg-gray-50`
- Primeira coluna sticky: `class: "p-4 text-sm sticky left-0 z-10 bg-gray-50"` (header) e `sticky left-0 z-10 bg-white` (body)

---

## Badge/Status

Usar `badge_component` ou `InkDashboard::Badge::Component`:
```erb
<%= badge_component(color: :green, size: :xs) { "Ativa" } %>
<%= badge_component(color: :red, size: :xs) { "Pausada" } %>
```

---

## Modal de criação com seleção de tipo

Padrão para recursos com subtipos (ex: Promoções, Regras de Frete):

```erb
<%= modal_component(modal_id: "creating-modal", max_width: :lg) do |component| %>
  <% component.with_trigger do %>
    <%= button_component(builder: :button_tag, size: :md, type: :button, data: { modal_target: "creating-modal", modal_toggle: "creating-modal" }) do %>
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
        <a href="<%= new_type1_path %>" data-turbo="false" class="w-full inline-flex items-center justify-start p-3 gap-3 hover:bg-gray-50 rounded-lg">
          <%= icon_component(name: "icon1", type: :outline, class: "text-pink-600 w-6 h-6") %>
          <p class="text-sm font-normal text-gray-900">Tipo 1</p>
        </a>
      </li>
    </ul>
  <% end %>
<% end %>
```

---

## Checklist antes de finalizar

- [ ] Container correto (engine: `container mx-auto flex flex-col gap-6`, monólito: `w-full`)
- [ ] Cabeçalho: título + breadcrumb (sem margem entre eles)
- [ ] Cards: `bg-white p-4 rounded-lg` com `flex flex-col gap-6`
- [ ] Todo card tem título + subtítulo
- [ ] Formulário: cards separados por seção semântica, `gap-6` entre eles
- [ ] Botões: Cancelar + Salvar centralizados
- [ ] Tabela via `InkDashboard::Table::Component`
- [ ] Empty state quando lista vazia
- [ ] Tipografia dentro da escala definida
