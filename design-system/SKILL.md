---
name: design-system
description: Use ao criar qualquer tela ou componente novo nesta stack (Rails + Tailwind CDN + Hotwire). Ativa quando o usuário diz "cria a tela de X", "faz o layout de Y", "como estruturo essa página", ou sempre que for escrever HTML com classes Tailwind. Garante que espaçamentos, grids, tipografia e componentes seguem o padrão estabelecido — sem retrabalho de consistência visual.
---

# Design System

Referência de espaçamento, layout e componentes para esta stack.
Todos os valores são Tailwind (CDN). Nenhuma separação por contexto — os padrões são universais.

---

## Sistema de espaçamento

Dois valores base. Toda decisão de espaço deriva deles:

| Situação | Tailwind | px |
|---|---|---|
| Entre **seções** distintas de uma página | `mt-6` | 24px |
| Entre **componentes** dentro de uma seção | `gap-4` / `space-y-4` | 16px |

Seção = bloco temático com título próprio (ex: "Trilhas", "Estatísticas", "Missões").
Componente = card, item de lista, campo de formulário.

---

## Container de página

Todo conteúdo de página vive dentro de um wrapper único:

```html
<div class="px-6 py-6 max-w-7xl mx-auto">
  ...
</div>
```

**Atenção:** se o layout já provê esse container (ex: `<main class="max-w-7xl mx-auto px-6 py-10">`), não adicione outro. Verificar o layout antes de envolver o conteúdo.

---

## Cabeçalho de página

Padrão para título + subtítulo + botão de ação principal:

```html
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Título da Página</h1>
    <p class="text-sm text-gray-600 mt-1">Descrição curta do contexto.</p>
  </div>
  <a href="..." class="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg transition-colors">
    <svg class="w-5 h-5" ...><path .../></svg>
    Ação Principal
  </a>
</div>
```

- `mb-6` separa o cabeçalho do restante da página
- Sem botão de ação: o `<div class="flex ...">` vira `<div class="mb-6">`

---

## Tipografia

| Nível | Classes | Uso |
|---|---|---|
| Título de página | `text-2xl font-bold text-gray-900` | H1 de cada página |
| Título de seção | `text-lg font-semibold text-gray-900` | H2 de seções dentro da página |
| Título de sub-seção | `text-base font-semibold text-gray-800` | H3, cabeçalho de card |
| Texto corrido | `text-sm text-gray-700` | Parágrafos, descrições |
| Subtítulo / contexto | `text-sm text-gray-600` | Linha logo abaixo do H1 |
| Meta / caption | `text-xs text-gray-500` | Datas, contagens, rótulos de tabela |
| Label de formulário | `text-sm font-medium text-gray-700` | `<label>` |

---

## Grids

```html
<!-- 4 colunas — cards de estatísticas compactos -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

<!-- 3 colunas — cards médios (trilhas, recompensas) -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

<!-- 2-3 colunas — cards maiores com mais conteúdo -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

Regra: quanto mais colunas e menor o card, menor o gap.

---

## Card

### Estrutura base

```html
<div class="bg-white rounded-xl border border-gray-200 shadow-sm">
  ...
</div>
```

### Variantes de padding interno

| Variante | Classes | Quando usar |
|---|---|---|
| Padrão | `p-6` | Card com texto, conteúdo descritivo |
| Compacto | `p-5` | Card de stat, card pequeno |
| Estado vazio | `p-12 text-center` | Card que substitui uma lista vazia |

### Espaçamento interno do card

```html
<div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
  <h2 class="text-base font-semibold text-gray-900 mb-4">Título do Card</h2>
  <!-- conteúdo -->
  <div class="space-y-3"> <!-- itens internos -->
    ...
  </div>
</div>
```

- Entre título do card e seu conteúdo: `mb-4`
- Entre itens dentro do card: `space-y-3` (denso) ou `space-y-4` (confortável)

### Card de estatística (ícone + número + label)

```html
<div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
  <div class="flex items-center gap-3">
    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
      <span class="text-2xl">📚</span>
    </div>
    <div>
      <p class="text-3xl font-bold text-gray-900">42</p>
      <p class="text-sm text-gray-600">Label descritivo</p>
    </div>
  </div>
</div>
```

---

## Lista de cards (sem grid)

Cards empilhados verticalmente:

```html
<div class="space-y-4">
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">...</div>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">...</div>
</div>
```

Lista densa (itens simples, sem card completo):

```html
<div class="space-y-2">
  <div>...</div>
  <div>...</div>
</div>
```

---

## Tabela

```html
<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
  <table class="min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Coluna
        </th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          Valor
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Tabs de filtro

```html
<div class="border-b border-gray-200 mb-6">
  <nav class="-mb-px flex space-x-8">
    <!-- ativa -->
    <a href="..." class="py-4 px-1 border-b-2 border-pink-500 text-pink-600 font-medium text-sm whitespace-nowrap">
      Ativa
    </a>
    <!-- inativa -->
    <a href="..." class="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
      Inativa
    </a>
  </nav>
</div>
```

`mb-6` separa as tabs do conteúdo filtrado.

---

## Botões

```html
<!-- Primário -->
<a class="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg transition-colors">
  Ação
</a>

<!-- Primário grande (CTA de estado vazio) -->
<a class="inline-block px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition">
  Criar Primeiro X
</a>

<!-- Secundário / outline -->
<a class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
  Secundário
</a>

<!-- Destrutivo (ícone apenas) -->
<button class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
  <svg class="w-5 h-5" .../>
</button>
```

---

## Estado vazio

Sempre que uma lista pode estar vazia, usar este padrão:

```html
<div class="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
  <div class="text-gray-400 mb-4">
    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <!-- ícone relacionado ao recurso -->
    </svg>
  </div>
  <h3 class="text-lg font-semibold text-gray-700 mb-2">Nenhum X cadastrado</h3>
  <p class="text-gray-500 mb-6">Frase curta de incentivo para começar.</p>
  <a href="..." class="inline-block px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition">
    Criar Primeiro X
  </a>
</div>
```

---

## Breadcrumb

```html
<nav class="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
  <a href="/" class="hover:text-pink-600 transition-colors">Início</a>
  <span class="text-gray-300">/</span>
  <a href="/secao" class="hover:text-pink-600 transition-colors">Seção</a>
  <span class="text-gray-300">/</span>
  <span class="text-gray-700 font-medium">Página atual</span>
</nav>
```

`mb-6` entre breadcrumb e o conteúdo da página.

---

## Badge / pill de status

```html
<!-- positivo -->
<span class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Ativo</span>

<!-- neutro / inativo -->
<span class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Inativo</span>

<!-- alerta -->
<span class="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pendente</span>

<!-- destaque (categoria, tipo) -->
<span class="px-3 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-600">Label</span>
```

---

## Separador visual dentro de card

```html
<div class="border-t border-gray-200 mt-4 pt-4">
  <!-- conteúdo após separador -->
</div>
```

Usado para separar metadados/ações do corpo principal do card.

---

## Checklist antes de finalizar qualquer tela

- [ ] Container único de página com `px-6 py-6 max-w-7xl mx-auto` (ou herdado do layout)
- [ ] Cabeçalho com `mb-6` separando do conteúdo
- [ ] Seções separadas por `mt-6`
- [ ] Componentes separados por `gap-4` ou `space-y-4`
- [ ] Todo card usa `bg-white rounded-xl border border-gray-200 shadow-sm`
- [ ] Estado vazio implementado para toda lista
- [ ] Tipografia seguindo a escala (não inventar tamanhos intermediários)
