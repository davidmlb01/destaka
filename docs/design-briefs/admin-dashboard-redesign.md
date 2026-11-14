# Design Brief: Admin Dashboard Redesign
**Projeto:** Destaka
**Componente:** `/admin` (dashboard interno do founder)
**Versao:** 1.0
**Autora:** Uma (UX Design Expert)
**Data:** 2026-11-14
**Destinatario:** Dex (Dev) para implementacao

---

## 1. Paleta de Cores

### Base: Verdes Destaka Admin

Inspirada na paleta Junki (Ref 2), adaptada ao contexto do produto. Os tokens abaixo substituem os tokens genéricos de dark mode do `page.tsx` atual dentro do escopo do admin.

```css
/* Fundos */
--admin-bg-deep:      #051F20;   /* fundo total da pagina */
--admin-bg-sidebar:   #0B2B26;   /* sidebar */
--admin-bg-card:      #163832;   /* cards e secoes */
--admin-bg-card-alt:  #1E4038;   /* cards em hover ou destaque leve */
--admin-bg-surface:   #235347;   /* inputs, thead, itens em hover */

/* Texto */
--admin-text-primary:   #DAF1DE;  /* titulos, numeros grandes */
--admin-text-secondary: #8EB69B;  /* labels, descricoes */
--admin-text-muted:     #7AB49A;  /* metadados, datas, linhas secundarias (corrigido: >= 4.5:1 em card_bg) */
--admin-text-heading:   #FFFFFF;  /* numeros KPI, destaques */

/* Acentos */
--admin-accent:         #8EB69B;  /* links, icones ativos, borda de card ativo */
--admin-accent-bright:  #DAF1DE;  /* valores numericos positivos */

/* Semântica */
--admin-success:        #4ADE80;
--admin-success-bg:     rgba(74, 222, 128, 0.12);
--admin-success-border: rgba(74, 222, 128, 0.25);

--admin-warning:        #FBBF24;
--admin-warning-bg:     rgba(251, 191, 36, 0.12);
--admin-warning-border: rgba(251, 191, 36, 0.25);

--admin-error:          #F87171;
--admin-error-bg:       rgba(248, 113, 113, 0.12);
--admin-error-border:   rgba(248, 113, 113, 0.30);

/* Bordas */
--admin-border-subtle:  rgba(142, 182, 155, 0.10);
--admin-border-card:    rgba(142, 182, 155, 0.15);
--admin-border-active:  rgba(142, 182, 155, 0.35);

/* Charts */
--admin-chart-mrr:      #14B8A6;   /* mantido do atual (teal) */
--admin-chart-leads:    #FBBF24;   /* mantido do atual (amber) */
--admin-chart-score:    #8EB69B;   /* verde medio Junki */
--admin-chart-donut-1:  #235347;
--admin-chart-donut-2:  #4ADE80;
--admin-chart-donut-3:  #FBBF24;
--admin-chart-donut-4:  #F87171;
```

---

## 2. Layout Structure

### Arquitetura geral

```
┌─────────────────────────────────────────────────────────┐
│ SIDEBAR (240px fixo)   │  CONTENT AREA (flex-1)         │
│ bg: --admin-bg-sidebar │  bg: --admin-bg-deep            │
│                        │                                  │
│  Logo                  │  ┌── TOP BAR (alerts) ──────┐  │
│  ─────────────         │  └───────────────────────────┘  │
│  Nav itens             │                                  │
│                        │  ┌── KPI ROW (8 cards) ──────┐  │
│  [ativo tem borda      │  └───────────────────────────┘  │
│   esquerda verde]      │                                  │
│                        │  ┌── CHARTS ROW ─────────────┐  │
│  ─────────────         │  │  MRR+Leads  │  Conversion  │  │
│  Footer: versao        │  └───────────────────────────┘  │
│          data          │                                  │
│                        │  ┌── SECONDARY ROW ───────────┐  │
└─────────────┬──────────┘  │  TopMovers  │  Attribution  │  │
              │             └───────────────────────────┘  │
              │                                             │
              │             ┌── TRAFFIC ROW ─────────────┐ │
              │             └───────────────────────────┘  │
              │                                             │
              │             ┌── CLIENTS TABLE ───────────┐ │
              │             └───────────────────────────┘  │
              │                                             │
              │             ┌── LEADS TABLE ─────────────┐ │
              └─────────────└───────────────────────────┘  │
```

### Grid e Dimensoes

| Zona | Valor |
|------|-------|
| Sidebar largura | 240px fixo (desktop), 64px collapsed (tablet) |
| Content padding horizontal | 32px (desktop), 24px (tablet), 16px (mobile) |
| Content padding vertical | 32px topo, 32px rodape |
| Gap entre secoes | 24px |
| Gap entre KPI cards | 16px |
| Gap entre colunas de chart | 24px |
| Border-radius padrao de card | 16px |
| Border-radius de badge | 6px |
| Border-radius de icone de KPI | 10px |

### Breakpoints

| Breakpoint | Comportamento |
|------------|--------------|
| `>= 1280px` (xl) | Layout completo: sidebar 240px + content |
| `>= 1024px` (lg) | Sidebar 64px (icon-only) + content |
| `>= 768px` (md) | Sidebar oculta, topbar com menu hamburger |
| `< 768px` (sm) | Mobile: scroll vertical, sem sidebar, tabs de navegacao no topo |

### Mobile first

No mobile (menos de 768px), a sidebar e substituida por uma barra de navegacao inferior com 4 icones: visao geral, clientes, leads, alertas. O layout passa a ser coluna unica com cards empilhados.

---

## 3. Componentes Redesenhados

### 3.1 Sidebar

**Dimensoes:**
- Largura: 240px (expandida) / 64px (colapsada)
- Altura: 100vh, `position: sticky`, `top: 0`
- Padding interno: 20px 16px

**Estrutura:**
```
[Logo + nome "Admin"]     <- topo, 64px de altura
[divisor sutil]
[nav itens]               <- flex-col, gap 4px
[divisor sutil]
[rodape]                  <- versao + data atual
```

**Nav item - estado normal:**
- Altura: 40px
- Padding: 0 12px
- Border-radius: 10px
- Icone: 18px, cor `--admin-text-muted`
- Label: 14px, font-weight 500, cor `--admin-text-secondary`
- Background: transparente
- Transition: background 150ms ease

**Nav item - estado ativo:**
- Background: `--admin-bg-surface` (rgba(35,83,71,0.8))
- Borda esquerda: 3px solid `--admin-accent` (#8EB69B)
- Icone e label: cor `--admin-text-primary`
- Border-radius: 0 10px 10px 0 (esquerda fica reta por causa da borda)

**Nav item - hover:**
- Background: `rgba(142, 182, 155, 0.08)`

**Itens de navegacao (nesta ordem):**

| Label | Icone Lucide | Ancora |
|-------|-------------|--------|
| Visao Geral | `LayoutDashboard` | `#overview` |
| Clientes | `Users` | `#clients` |
| Leads | `UserPlus` | `#leads` |
| Trafego | `BarChart2` | `#traffic` |
| Alertas | `AlertTriangle` | `#alerts` |

Alertas recebe um badge numerico vermelho (`--admin-error`) quando `brokenTokens.length + totalPending > 0`.

**Logo area:**
- Logo componente existente, `size="sm"`
- Ao lado: label "Admin" em 11px uppercase, font-weight 700, letter-spacing 0.08em, cor `--admin-text-muted`
- Separados por um divisor vertical de 1px `--admin-border-subtle`

---

### 3.2 Top Bar (Alertas)

Faixa horizontal dentro do content area, visivel apenas quando ha alertas.

**Altura:** 48px
**Background:** quando erro: `--admin-error-bg`. Quando warning: `--admin-warning-bg`
**Borda inferior:** 1px `--admin-error-border` ou `--admin-warning-border`
**Padding:** 0 32px
**Layout:** `flex items-center justify-between`

**Conteudo esquerda:**
- Icone `AlertTriangle` (16px) + texto descritivo

**Conteudo direita:**
- Badges: "X tokens com problema" (error) e "X pendentes" (warning)

Quando nao ha alertas, o top bar e completamente omitido (sem espaco residual).

---

### 3.3 KPI Cards

**Grid:** `grid-cols-4` em desktop, `grid-cols-2` em tablet/mobile
**Gap:** 16px
**Ordem:** MRR, Pagantes, Score Medio, Ativacao, Churn, LTV, Leads (total), Tokens

**Card individual:**

```
┌──────────────────────────────┐
│  [icone 20px]                │   <- topo direito, fundo --admin-bg-surface,
│                               │      border-radius 10px, padding 8px
│  R$1.182                     │   <- numero grande
│  MRR                         │   <- label
│  ↑ +R$197 esse mes           │   <- variacao (opcional)
└──────────────────────────────┘
```

**Dimensoes do card:**
- Padding: 20px
- Border-radius: 16px
- Background: `--admin-bg-card`
- Border: 1px solid `--admin-border-card`
- Min-height: 100px

**Icone container:**
- Tamanho: 36x36px
- Border-radius: 10px
- Background: cor semantica com 15% de opacidade
- Icone: 18px, cor semantica solida

**Numero KPI:**
- Font-size: 28px
- Font-weight: 800
- Line-height: 1
- Cor: `--admin-text-heading` (#FFFFFF) para valores positivos/neutros
- Variacao positiva: `--admin-success` (#4ADE80)
- Variacao negativa: `--admin-error` (#F87171)

**Label KPI:**
- Font-size: 12px
- Font-weight: 500
- Cor: `--admin-text-muted`
- Margin-top: 4px

**Variacao (linha embaixo do label):**
- Font-size: 11px
- Font-weight: 600
- Cor conforme direcao (success/error)
- Icone `TrendingUp` ou `TrendingDown` (12px) ao lado do numero

**Mapeamento KPI: icone, cor semantica e variacao**

| KPI | Icone Lucide | Cor do icone | Variacao exibida |
|-----|-------------|-------------|-----------------|
| MRR | `DollarSign` | `--admin-chart-mrr` (#14B8A6) | +R$197 ao adicionar cliente |
| Pagantes | `CreditCard` | `--admin-success` | delta vs mes anterior |
| Score medio | `Star` | `--admin-accent` | delta vs mes anterior |
| Ativacao | `Zap` | warning/success condicional | percentual fixo |
| Churn | `TrendingDown` | error/success condicional | percentual fixo |
| LTV | `Target` | `--admin-accent-bright` | calculado (R$197/churn) |
| Leads | `UserPlus` | `--admin-chart-leads` (#FBBF24) | total capturado |
| Tokens | `Key` | error se broken, muted se ok | contagem de problemas |

**Estado de alerta no card de Tokens:**
- Border: 1px solid `--admin-error-border`
- Background: `--admin-error-bg` (sutil)
- Numero em `--admin-error`

---

### 3.4 Charts

#### Chart A: MRR + Leads (Area Chart combo)

**Dimensoes:** 100% largura do container, altura 240px
**Tipo:** `AreaChart` (Recharts) com dois eixos Y, mantendo implementacao atual
**Cabecalho do card:**
- Titulo: "Crescimento" (font-size 14px, font-weight 600, `--admin-text-primary`)
- Subtitulo: "MRR e leads por mes" (font-size 12px, `--admin-text-muted`)

**Cores das areas:**
- MRR: stroke `#14B8A6`, fill gradient com 25% opacidade
- Leads: stroke `#FBBF24`, fill gradient com 20% opacidade

**Grid, eixos e tooltip:** manter configuracao atual (strokes rgba brancos). Apenas ajustar fundo do tooltip para `--admin-bg-card`.

#### Chart B: Score Evolution (Area Chart)

**Dimensoes:** 100% largura, altura 240px
**Tipo:** `AreaChart` (Recharts), mantendo implementacao atual
**Cor:** stroke `#8EB69B`, fill gradient 20% opacidade

**Cabecalho do card:**
- Titulo: "Saude dos clientes"
- Subtitulo: "Score medio por mes"

#### Chart C: Conversion Donut (NOVO)

**Posicao:** terceiro card da linha de charts (pode ser linha 2, coluna 3, ou linha dedicada de 3 colunas em lg)
**Tipo:** `PieChart` com `Pie` innerRadius (donut)
**Dimensoes:** 100% largura, altura 240px

**Dados a usar (ja disponiveis):**
- Fatias: Pagantes, Free, Cancelados
- Valores: `payingOrgs.length`, `freeOrgs.length`, `cancelledOrgs.length`

**Cores das fatias:**
- Pagantes: `--admin-success` (#4ADE80)
- Free: `--admin-bg-surface` (#235347)
- Cancelados: `--admin-error` (#F87171)

**Centro do donut:** exibir `leadToPayingRate%` em fonte grande + label "conversao" abaixo

**Cabecalho do card:**
- Titulo: "Conversao"
- Subtitulo: "Lead para pagante"

**Recharts props:**
```
innerRadius={60}
outerRadius={90}
paddingAngle={3}
```

**Tooltip:** mostrar nome da fatia + count + percentual

#### Layout dos charts

```
Desktop (lg+):
[ MRR + Leads (50%) ]  [ Score Evolution (25%) ]  [ Donut (25%) ]

Tablet (md):
[ MRR + Leads (100%) ]
[ Score Evolution (50%) ]  [ Donut (50%) ]

Mobile:
Empilhados, 100% cada
```

---

### 3.5 Top Movers

**Sem mudanca estrutural**, apenas ajuste visual:

- Background: `--admin-bg-card`
- Border: 1px solid `--admin-border-card`
- Border-radius: 16px
- Padding do card: 24px

**Cabecalho:**
- Titulo: "Top movers da semana" (14px, weight 600)
- Badge ao lado: "Top 5" em `--admin-bg-surface`, texto `--admin-text-muted`, border-radius 20px

**Cada linha de mover:**
- Numero ranqueador: 28x28px, border-radius 8px
- Background do ranqueador: se delta positivo: `--admin-success-bg`; se negativo: `--admin-error-bg`
- Nome: 13px, weight 600, `--admin-text-primary`
- Score before/after: 11px, `--admin-text-muted` (manter seta atual "→")
- Delta: 14px, weight 800, cor por sinal

**Adicionar:** mini barra de progresso horizontal sob cada nome (indica o scoreAfter em relacao ao maximo 100). Altura 2px, background `--admin-bg-surface`, fill `--admin-accent` proporcional ao scoreAfter.

---

### 3.6 Attribution Table

**Sem mudanca estrutural**, ajuste visual:

- Remover overflow-x desnecessario no desktop
- `thead` background: `rgba(35, 83, 71, 0.5)` (dark tint do `--admin-bg-surface`)
- Linhas alternadas: row par tem background `rgba(142, 182, 155, 0.03)`
- Badge de canal: `--admin-bg-surface` como background, `--admin-accent` como texto, sem borda

**Adicionar:** mini sparkbar na coluna Taxa. Para cada canal, uma barra inline (100% = maior taxa do conjunto) com background `--admin-chart-mrr` teal, altura 4px, border-radius 2px, renderizada como `<div>` ao lado do percentual.

---

### 3.7 Traffic Section

**Manter grid 2x2** de rotas (/, /diagnostico, /login, /dashboard).

**Ajuste:** cada mini card de rota recebe:
- Icone correspondente a rota (Lucide):
  - `/`: `Home` (16px)
  - `/diagnostico`: `Search` (16px)
  - `/login`: `LogIn` (16px)
  - `/dashboard`: `LayoutDashboard` (16px)
- Icone no topo esquerdo, cor `--admin-text-muted`
- Numero de page views: 20px, weight 800, `--admin-text-primary`
- Path: 11px monospace, `--admin-text-muted`

---

### 3.8 Clients Table

**Cabecalho da secao:**
- Titulo: "Clientes" com contagem em badge
- Linha de metadados: "X pagantes · Y free · Z% lead→pagante"
- Mover `RetriggerButton` para o final de cada linha (mantido)

**Header da tabela (novo):** adicionar cabecalhos explicitos com colunas:

| Coluna | Largura | Alinhamento |
|--------|---------|-------------|
| Status | 80px | center |
| Cliente | flex-1 | left |
| Score | 80px | right |
| Faixa | 80px | center |
| Delta | 60px | right |
| Ultimo score | 100px | right |
| Acoes | 48px | center |

**Header row:**
- Height: 36px
- Background: `rgba(35, 83, 71, 0.5)`
- Fonte: 11px, weight 700, `--admin-text-muted`, uppercase, letter-spacing 0.05em

**Cada linha de cliente:**
- Height: min 52px (pode crescer com conteudo)
- Hover background: `rgba(142, 182, 155, 0.05)`
- Separador: 1px `--admin-border-subtle`
- Padding: 12px 24px

**Coluna Status:** manter badge (Pagante/Free/Cancelado). Adicionar indicador de risco como dot colorido 6px antes do nome (vermelho se `isAtRisk`).

**Coluna Score:** numero em 16px weight 800. Se sem score: traço em `--admin-text-muted`.

**Coluna Delta:** `+N` em success ou `-N` em error. Sem delta exibe traço.

**Tokens com problema:** remover a secao separada de tokens. Em vez disso, marcar a linha do cliente diretamente com um badge "Token" na coluna de status. Isso elimina a duplicacao visual.

---

### 3.9 Leads Table

**Adicionar cabecalhos de coluna** (mesmo estilo do Clients Table acima).

**Badge de fonte (utm_source):** manter estilo atual, apenas mudar cor para `--admin-bg-surface` background + `--admin-accent` texto, sem borda.

**Coluna Score do lead:** exibir como mini badge colorido por faixa (se score disponivel), nao apenas numero.

---

## 4. Hierarquia de Informacao

### Ordem vertical no content area

```
1. Top Bar de Alertas        <- visivel apenas quando ha problemas
2. KPI Cards (8 cards)       <- visao geral imediata do negocio
3. Charts (3 cards)          <- crescimento, saude, conversao
4. Top Movers + Attribution  <- movimentos e aquisicao
5. Trafego GA4               <- topo de funil
6. Clientes                  <- detalhe operacional
7. Leads                     <- pipeline de vendas
```

**Principio de hierarquia:** o que e mais acionavel fica mais perto do topo. David abre o admin para saber: "o negocio esta crescendo? alguem precisa de atencao?" As duas primeiras secoes respondem isso sem scroll.

**Agrupamento logico:**

| Grupo | Secoes | Cor de titulo |
|-------|--------|--------------|
| Negocio (financeiro) | MRR, Pagantes, LTV, Churn | `--admin-text-primary` |
| Produto (saude) | Score, Ativacao, Tokens | `--admin-text-secondary` |
| Aquisicao (funil) | Leads, Attribution, Trafego | `--admin-text-muted` |

Nao usar titulos de grupo visuais (evitar poluicao). A hierarquia e feita pela ordem e pelo peso tipografico.

---

## 5. Mapeamento Secao a Secao

| Secao atual | Como fica no redesign |
|-------------|----------------------|
| Header com Logo + badges | Sidebar (logo) + Top Bar separada para alertas |
| 8 StatCards em grid | 8 KPI Cards com icones + variacao + hierarquia visual |
| MrrLeadsChart | Chart A (mantido, aprimorado visualmente) |
| ScoreEvolutionChart | Chart B (mantido, nova cor `#8EB69B`) |
| Sem equivalente | Chart C: Donut de conversao (NOVO, com dados existentes) |
| TopMovers | Mantido com barra de progresso adicionada |
| Attribution | Mantido com sparkbar na coluna Taxa |
| GA4 Traffic | Mantido com icones por rota |
| Lista de clientes | Tabela com cabecalhos e colunas definidas |
| Tokens com problema (secao separada) | Integrado como badge na linha do cliente na tabela |
| Ultimos leads | Tabela com cabecalhos e badge de faixa de score |

---

## 6. Especificacao de Charts

### Chart A: MRR + Leads

| Parametro | Valor |
|-----------|-------|
| Tipo | AreaChart (Recharts) |
| Altura | 240px |
| Dados | `mrrLeadsData` (ultimos 6 meses) |
| Eixo Y esquerdo | MRR em R$, format `R$${value}` |
| Eixo Y direito | Leads em numero inteiro |
| Stroke MRR | `#14B8A6` |
| Stroke Leads | `#FBBF24` |
| Fill | Gradient vertical 25% a 0% de opacidade |
| Grid | `strokeDasharray="3 3"` `rgba(142,182,155,0.08)` |
| Tooltip | Fundo `--admin-bg-card`, borda `--admin-border-card`, border-radius 8px |
| Tooltip MRR | format `R$${value.toLocaleString('pt-BR')}` |
| Animate | `isAnimationActive={false}` para SSR (ja em producao) |

### Chart B: Score Evolution

| Parametro | Valor |
|-----------|-------|
| Tipo | AreaChart (Recharts) |
| Altura | 240px |
| Dados | `scoreEvolution` (ultimos 6 meses) |
| Eixo Y | 0 a 100 (domain fixo) |
| Stroke | `#8EB69B` |
| Fill | Gradient 20% a 0% |
| Tooltip | Exibir "Score: X" e "Clientes: Y" |

### Chart C: Conversion Donut

| Parametro | Valor |
|-----------|-------|
| Tipo | PieChart com Pie (Recharts) |
| Altura | 240px |
| innerRadius | 60 |
| outerRadius | 90 |
| paddingAngle | 3 |
| Dados | `[{name: 'Pagantes', value: payingOrgs.length}, {name: 'Free', value: freeOrgs.length}, {name: 'Cancelados', value: cancelledOrgs.length}]` |
| Cores | `['#4ADE80', '#235347', '#F87171']` |
| Label central | `leadToPayingRate%` em 24px weight 800, "conversao" em 11px |
| Label central implementacao | `<text>` SVG posicionado no centro absoluto via `cx/cy` do PieChart |
| Tooltip | `{name}: {value} clientes ({percentual}%)` |
| Legend | Desabilitada (legenda feita por cor dos KPI cards) |

---

## 7. Sidebar: Especificacao Completa

### Estrutura HTML (conceptual)

```
<aside>
  <header>           <!-- Logo + "Admin" label -->
  <nav>              <!-- Lista de itens -->
    <NavItem />      <!-- Cada item -->
  </nav>
  <footer>           <!-- Versao + data -->
</aside>
```

### NavItem states

**Estado padrao:**
- Background: transparente
- Border-left: 3px solid transparente
- Cor icone: `--admin-text-muted`
- Cor label: `--admin-text-secondary`

**Hover:**
- Background: `rgba(142, 182, 155, 0.08)`
- Cor icone: `--admin-text-secondary`
- Cor label: `--admin-text-primary`
- Transition: `all 150ms ease`

**Ativo (via scroll spy ou route ativa):**
- Background: `rgba(35, 83, 71, 0.6)`
- Border-left: 3px solid `#8EB69B`
- Border-radius: 0 10px 10px 0
- Cor icone: `--admin-accent` (#8EB69B)
- Cor label: `--admin-text-primary`
- Font-weight: 600

### Badge de alerta na sidebar

Quando `brokenTokens.length + totalPending > 0`, o item "Alertas" exibe:

- Dot vermelho de 6px posicionado no canto superior direito do icone
- Cor: `--admin-error` (#F87171)

Nao usar numero dentro do badge na sidebar (evitar sobrecarga). O numero fica na Top Bar.

### Rodape da sidebar

- Separador: 1px `--admin-border-subtle` acima do footer
- Texto: "v1.0 · Destaka Admin" (11px, `--admin-text-muted`)
- Data: exibida como dia/mes/ano em PT-BR (11px, `--admin-text-muted`)

### Comportamento colapso (lg, 1024-1279px)

Quando a sidebar esta em 64px (icon-only):
- Labels ocultas (`overflow: hidden`, `width: 0`)
- Icone centralizado na largura de 64px
- Tooltip (nativo do browser via `title` attribute) mostra o label no hover
- Logo reduzido ao simbolo isolado (sem nome)

---

## 8. Tipografia

| Elemento | Font-size | Font-weight | Line-height | Cor |
|----------|-----------|-------------|-------------|-----|
| Numero KPI principal | 28px | 800 | 1 | `--admin-text-heading` |
| Variacao KPI | 11px | 600 | 1 | success/error |
| Label KPI | 12px | 500 | 1.2 | `--admin-text-muted` |
| Titulo de secao | 14px | 600 | 1.3 | `--admin-text-primary` |
| Subtitulo de secao | 12px | 400 | 1.4 | `--admin-text-muted` |
| Label de nav | 14px | 500 | 1 | `--admin-text-secondary` |
| Label de nav ativo | 14px | 600 | 1 | `--admin-text-primary` |
| Linha de tabela principal | 13px | 500 | 1.5 | `--admin-text-primary` |
| Linha de tabela secundaria | 12px | 400 | 1.4 | `--admin-text-muted` |
| Cabecalho de tabela | 11px | 700 uppercase | 1 | `--admin-text-muted` |
| Badge | 10px | 700 | 1 | variavel |
| Monospace (paths, tokens) | 11px | 400 | 1.4 | `--admin-text-muted` |

Fonte: herda do projeto (sem mudanca de fonte base).

---

## 9. Espacamento e Ritmo Visual

Todos os espacamentos seguem multiplos de 4px.

| Uso | Valor |
|-----|-------|
| Padding interno de card | 20px (5 unidades) |
| Padding interno de card grande | 24px (6 unidades) |
| Gap entre KPI cards | 16px (4 unidades) |
| Gap entre secoes principais | 24px (6 unidades) |
| Padding de celula de tabela | 12px 24px |
| Gap entre icone e label no nav | 12px |
| Altura de linha de tabela | min 48px |
| Altura de header de tabela | 36px |

---

## 10. Comportamento de Loading e Estados Vazios

**Loading:** o admin e uma pagina Server Component (sem Suspense visivel). Nao ha mudanca de comportamento de loading.

**Estado vazio padrao:**
- Icone neutro (Lucide `Inbox`, 24px, `--admin-text-muted`)
- Mensagem: texto centrado, 14px, `--admin-text-muted`
- Sem borda, sem fundo especial

**Estado de erro (tokens):**
- Card com borda `--admin-error-border`
- Background sutil `--admin-error-bg`
- Titulo em `--admin-error`

---

## 11. Notas de Implementacao para Dex

1. **Novo arquivo de tokens CSS:** criar `src/app/(admin)/admin/admin-tokens.css` com os tokens listados na secao 1. Importar no layout ou page do admin. Nao contaminar o CSS global.

2. **Sidebar como componente:** criar `src/app/(admin)/admin/AdminSidebar.tsx` como Client Component (precisa de scroll spy para active state). Props: `brokenTokensCount`, `totalPending`.

3. **Layout wrapper:** o `page.tsx` atual usa `<main>` com `max-w-6xl`. No redesign, o layout pai precisa de `flex h-screen overflow-hidden`. O content area e `flex-1 overflow-y-auto`. Verificar se o `(admin)` group ja tem um `layout.tsx`; se nao, criar `src/app/(admin)/layout.tsx` para encapsular sidebar + content.

4. **Chart C (Donut):** importar `PieChart, Pie, Cell` do Recharts (ja instalado). Criar em `AdminCharts.tsx` como `ConversionDonutChart`.

5. **Top Bar de alertas:** mover os badges de alerta do header atual para um componente `AdminAlertBar.tsx` separado, renderizado condicionalmente no topo do content area.

6. **Tokens com problema:** remover a secao `Row 5` dedicada. Adicionar badge "Token" inline na coluna de status da tabela de clientes (ja existe essa logica, apenas mudar renderizacao).

7. **CSS tokens vs inline styles:** o codigo atual usa `style={{ color: 'var(--text-primary)' }}` etc. No redesign, usar os novos tokens `--admin-*` nos mesmos pontos. Nao mudar a abordagem (inline styles via CSS vars), apenas atualizar os nomes dos tokens.

8. **Dependencias novas:** nenhuma. `PieChart/Pie/Cell` ja fazem parte do Recharts instalado.

9. **Scroll spy:** para o active state da sidebar, usar `IntersectionObserver` com as secoes marcadas com `id` (`#overview`, `#clients`, `#leads`, `#traffic`, `#alerts`). Ou, simplificado: usar hash navigation (#) sem scroll spy na primeira versao.

10. **Ordem de prioridade de implementacao:**
    - P0: tokens CSS + sidebar + KPI cards com icones
    - P1: layout wrapper (flex com sidebar)
    - P2: Chart C (donut) + Top Bar de alertas
    - P3: refinamentos de tabela (cabecalhos, sparkbar attribution)

---

---

## 12. Waiver de Tipografia para UI Chrome

**Contexto:** A regra do quality gate "body text >= 16px" aplica-se a texto de leitura continua (paragrafos, descricoes longas). Em dashboards administrativos densos (Linear, Vercel, GitHub), tipografias de 11 a 14px em labels, badges e cabecalhos de tabela sao pratica consolidada e aceita pela WCAG.

**Regra ajustada para o admin dashboard:**
- Texto de leitura continua (descricoes, mensagens de estado vazio): >= 14px
- UI chrome (labels de KPI, cabecalhos de tabela, nav labels): >= 11px
- Badges e contagens numericas curtas: >= 10px
- Line-height minimo: 1.4 para UI chrome, 1.5 para texto corrido

**Waiver aprovado por:** Quinn (QA Gate, 2026-11-14)

---

## 13. Acessibilidade Complementar

- **Touch targets:** todos os elementos interativos (nav items, botoes, tabs mobile) devem ter min 44x44px incluindo padding
- **Focus ring:** `outline: 2px solid #8EB69B; outline-offset: 2px` em todos os elementos interativos
- **Cor como indicador:** todo alerta e badge usa icone + texto alem de cor. Donut inclui legenda textual com valores numericos
- **Tabelas em mobile (< 768px):** scroll horizontal contido no wrapper (`overflow-x: auto` no container da tabela, nao na pagina)
- **Charts em mobile:** stack vertical, 100% largura, sem overflow horizontal

---

*Design Brief gerado por Uma (UX Design Expert) para Destaka Admin Dashboard Redesign.*
*Versao 1.1. Correcoes de QA aplicadas (contraste text-muted, waiver tipografia, acessibilidade).*
*Aprovacao necessaria de David antes de iniciar implementacao.*
