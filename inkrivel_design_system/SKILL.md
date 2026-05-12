---
name: inkrivel_design_system
description: Use ao criar qualquer tela ou componente novo nesta stack (Rails + Tailwind CDN + Hotwire). Ativa quando o usuário diz "cria a tela de X", "faz o layout de Y", "como estruturo essa página", ou sempre que for escrever HTML com classes Tailwind. Garante que espaçamentos, grids, tipografia e componentes seguem o padrão estabelecido — sem retrabalho de consistência visual.
---

# Inkrivel Design System — Área Admin

Padrões de layout para telas da **área administrativa** (Rails + Tailwind CDN + Hotwire + InkDashboard Engine). Aplique diretamente — sem descrever ou narrar o que está usando. Consulte **COMPONENTS.md** para todos os exemplos de HTML/ERB.

---

## Container de Página

| Contexto | Container |
|---|---|
| **Páginas Admin (padrão)** | `<div class="container mx-auto flex flex-col items-start gap-6 relative pt-[42px]">` |
| **Formulários Admin** | `<div class="container mx-auto flex flex-col items-start gap-6 relative pt-[42px] mb-8">` |
| **Páginas Públicas** | `<div class="w-full">` — o layout já provê o container |
| **Hub (Next.js)** | `pt-[42px]` é específico do admin Rails (compensa o layout engine). No hub, usar `pt-4` — o `<main>` já tem `py-6`. |

---

## Tipografia

| Nível | Classes |
|---|---|
| Título de página (H1/H3) | `font-bold text-xl text-gray-900 dark:text-white` |
| Título de card/seção | `text-gray-900 text-lg font-semibold leading-6` |
| Subtítulo de seção | `text-sm text-gray-500 leading-5` |
| Texto corrido | `text-sm text-gray-700` |
| Label de formulário | `text-sm font-medium text-gray-900` |
| Helper text / caption | `text-xs font-normal text-gray-500` |
| Números de destaque | `text-2xl` |

Escala permitida: `text-[10px]` `text-xs` `text-sm` `text-base` `text-lg` `text-xl` `text-2xl` — nunca inventar intermediários.

---

## Espaçamento

- Entre cards/seções: `gap-6`
- Dentro do card: `gap-4`
- Entre label e input: `gap-2`
- Entre título e sidebar (formulário): `gap-[42px]`
- **Hub (Next.js):** bloco título+breadcrumb recebe `mt-4` na primeira seção abaixo — o `gap-6` do container é o padrão entre as demais seções

---

## Grids

- 4 stats cards: `grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4`
- 3 col desktop / 1 mobile (toolbar): `grid lg:grid-cols-3 grid-cols-1 lg:grid-rows-1 grid-rows-2 gap-6`
- Cards médios (3 col): `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`

---

## Componentes — Referência rápida

**Botões via `button_component`** (preferir sobre Tailwind bruto):
- Link-botão: `button_component(builder: :link_to, url: path, color: :pink, size: :md) { "Texto" }`
- Submit: `button_component(builder: :submit_button, color: :pink, size: :md, type: :submit) { "Salvar" }`
- Botão HTML: `button_component(builder: :button_tag, color: :white, size: :md, type: :button) { "Cancelar" }`
- Com exclusão: adicionar `data: { turbo_method: :delete, turbo_confirm: "Tem certeza?" }`
- Colors: `:pink` (primário) · `:white` (secundário/cancelar) · `:red` (destrutivo) · `:blue` · `:green` · `:dark`
- Sizes: `:xs` · `:sm` · `:md` · `:lg`

**Selects/date fields:**
`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-pink-600 focus:border-pink-600 block w-full p-2.5`

**Cards (base):** `bg-white p-4 flex flex-col gap-4 rounded-lg border border-gray-200` — sempre com título + subtítulo no cabeçalho. Ver também `card_component`.

**Badges:** `badge_component(color: :green/:red/:amber/:pink/:blue/:gray/:dark, size: :xs)` — aceita bloco `{ "Texto" }` ou `text: "Texto"`.

**Ícones:** `icon_component(name: "nome-heroicon", type: :outline/:solid, class: "w-5 h-5")`
- Comuns: `magnifying-glass` · `plus` · `pencil` · `trash` · `eye` · `check` · `x-mark` · `cog-6-tooth` · `user` · `calendar` · `pencil-square`

**Outros helpers:** `alert_component` · `dropdown_component` · `modal_component` · `table_component` — ver COMPONENTS.md.

---

## Regras de Layout

**Index (sem busca):** H1 + subtítulo à esquerda, botão à direita — sem background section.
**Index (com busca):** H3 fora do background + `section` com card header + toolbar — tabela FORA do section.
**Formulários:** com breadcrumb (Lista → Criar/Editar) — índices nunca têm breadcrumb.
**Background (section):** somente quando há busca/filtros — nunca contém tabelas ou cards de dados.
**Páginas multi-seção:** cada seção tem seu próprio section header; conteúdo sempre fora.

---

## Checklist antes de finalizar

- [ ] Container: `pt-[42px]` obrigatório no admin Rails; no hub Next.js usar `pt-4`; formulários adicionam `mb-8`
- [ ] Index sem busca: layout inline, sem section/background
- [ ] Index com busca: H3 + section com toolbar; tabela fora
- [ ] Formulários: breadcrumb obrigatório
- [ ] Section: só cabeçalho — nunca contém dados
- [ ] Cards: título + subtítulo obrigatórios
- [ ] Empty state implementado em toda lista (imagem `navigation_chareacter.png`)
- [ ] Tipografia dentro da escala definida
- [ ] Selects/date fields com classes padrão de input
- [ ] Tabela via `table_component` ou partial `render layout: "universidade/admin/shared/table"`
- [ ] Botões usando `button_component` (não Tailwind bruto)
- [ ] Ícone de busca: `magnifying-glass` (não `search`)
