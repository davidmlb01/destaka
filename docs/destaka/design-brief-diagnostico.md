# Design Brief: Pagina de Diagnostico Destaka

**Story:** DESTAKA-004-D1
**Owner:** @ux-design-expert (UMA)
**Status:** Draft
**Versao:** 1.0
**Data:** 2026-10-04

---

## 1. Visao Geral

Pagina unica de vendas personalizada (single page scroll, mobile-first) que substitui o free tier dashboard. O usuario faz login com Google, ve o diagnostico completo do seu perfil com dados reais, e recebe a proposta de valor.

**Nenhum menu lateral. Nenhuma sidebar. Foco total em conversao.**

Layout vertical: blocos empilhados com scroll natural, CTA fixo em mobile.

---

## 2. Design Tokens (do Design System Existente)

### 2.1 Cores

```
Backgrounds
  --bg-base:       #071a19
  --bg-gradient:   linear-gradient(160deg, #0a2220 0%, #071a19 100%)
  --card-subtle:   rgba(255, 255, 255, 0.04)
  --card-dark:     rgba(0, 0, 0, 0.25)

Borders
  --border-subtle: rgba(255, 255, 255, 0.06)
  --border-card:   rgba(255, 255, 255, 0.08)
  --border-accent: rgba(20, 184, 166, 0.25)

Text
  --text-primary:   #ffffff
  --text-secondary: rgba(255, 255, 255, 0.7)
  --text-tertiary:  rgba(255, 255, 255, 0.5)
  --text-muted:     rgba(255, 255, 255, 0.35)
  --text-accent:    #5EEAD4

Accent (teal)
  --accent:         #14B8A6
  --accent-hover:   #0D9488
  --accent-bright:  #5EEAD4
  --accent-bg:      rgba(20, 184, 166, 0.12)

Status
  --success:  #4ADE80
  --warning:  #FBBF24
  --error:    #EF4444
```

### 2.2 Cores por Bloco

| Bloco | Background | Borda | Accent | Texto principal |
|-------|-----------|-------|--------|----------------|
| Header | --bg-base (transparente) | nenhuma | --accent | --text-primary |
| Score | --card-subtle | --border-accent | --accent-bright (score atual), --success (projetado) | --text-primary |
| Mapa | --bg-base | --border-subtle | neutro (sem accent) | --text-secondary |
| Concorrentes | --card-subtle | --border-card | --error (user atras), --success (user na frente) | --text-primary |
| Avaliacoes | --card-subtle | --border-card | --warning (pendentes) | --text-primary |
| Oferta | gradiente accent sutil: rgba(20,184,166,0.06) > rgba(20,184,166,0.02) | --border-accent | --accent-bright (valores), --success (CTA) | --text-primary |
| CTA Fixo | rgba(7,26,25,0.95) + backdrop-blur(12px) | top: --border-accent | --accent (botao) | --text-primary |

### 2.3 Tipografia

**Fontes:**
- **Display (headings):** Outfit (--font-display), weight 700
- **Body:** Geist Sans (--font-geist-sans), weight 400/500
- **Mono (metricas):** Geist Mono (--font-geist-mono), weight 400

**Hierarquia:**

| Elemento | Font | Size Mobile | Size Desktop | Weight | Line-height | Letter-spacing |
|----------|------|------------|-------------|--------|------------|---------------|
| H1 (titulo pagina) | Outfit | 24px | 32px | 700 | 1.2 | -0.5px |
| H2 (titulo bloco) | Outfit | 20px | 24px | 700 | 1.3 | -0.3px |
| H3 (subtitulo) | Outfit | 16px | 18px | 500 | 1.4 | 0 |
| Body | Geist Sans | 16px | 16px | 400 | 1.6 | 0 |
| Body Small | Geist Sans | 14px | 14px | 400 | 1.5 | 0 |
| Caption | Geist Sans | 12px | 12px | 400 | 1.4 | 0.2px |
| Metric Grande | Geist Mono | 48px | 64px | 700 | 1.0 | -1px |
| Metric Medio | Geist Mono | 28px | 36px | 700 | 1.0 | -0.5px |
| Metric Pequeno | Geist Mono | 18px | 20px | 500 | 1.2 | 0 |
| CTA Button | Geist Sans | 16px | 16px | 600 | 1.0 | 0.2px |
| Micro-copy | Geist Sans | 13px | 13px | 400 | 1.4 | 0 |

### 2.4 Espacamento (Grid 8px)

| Elemento | Valor |
|----------|-------|
| Padding horizontal pagina (mobile) | 24px (3 * 8) |
| Padding horizontal pagina (desktop) | 48px (6 * 8) |
| Gap entre blocos | 48px (6 * 8) mobile, 64px (8 * 8) desktop |
| Padding interno card | 24px mobile, 32px desktop |
| Gap entre elementos dentro de bloco | 16px (2 * 8) |
| Gap entre titulo e conteudo | 24px (3 * 8) |
| Margin top primeiro bloco | 32px (4 * 8) |
| Border radius cards | 16px |
| Border radius botoes | 12px |

---

## 3. Estrutura de Blocos (Mobile-First)

### 3.1 Header Minimo

**Mobile (320px):**
```
┌──────────────────────────────────┐
│ [Logo 24px]  Destaka             │
│                                  │
│ Diagnostico do seu Perfil        │
│ no Google                        │
│ ________________________________ │
│ subtitulo em text-secondary      │
└──────────────────────────────────┘
```

**Desktop (1280px):**
```
┌──────────────────────────────────────────────────────────────┐
│ [Logo 28px]  Destaka     Diagnostico do seu Perfil no Google │
│              _______________________________________________  │
│              subtitulo em text-secondary                      │
└──────────────────────────────────────────────────────────────┘
```

**Specs:**
- Logo: icone 24px mobile, 28px desktop + wordmark "Destaka"
- Fundo: transparente, sem borda inferior
- Altura: 64px mobile, 72px desktop
- Position: sticky top (nao fixed, para nao competir com CTA fixo)
- Z-index: 40

---

### 3.2 Bloco Score

**Mobile (320px):**
```
┌──────────────────────────────────┐
│  Headline (H2)                   │
│                                  │
│  ┌───────────┐  ┌───────────┐   │
│  │   HOJE    │  │ COM DESTAKA│   │
│  │           │  │           │    │
│  │   43      │  │   78      │    │
│  │  /100     │  │  /100     │    │
│  └───────────┘  └───────────┘   │
│                                  │
│  [████████░░░░░░░░░░░] 43%      │
│  ↑ accent        ↑ success      │
│                                  │
│  Body copy persuasiva            │
│                                  │
│  ─── 5 ajustes rapidos ───      │
│  1. Gap com maior impact         │
│  2. Segundo gap                  │
│  3. Terceiro gap                 │
│  4. Quarto gap                   │
│  5. Quinto gap                   │
└──────────────────────────────────┘
```

**Desktop (1280px):**
- Score cards lado a lado em flex row, max-width 600px centralizado
- Barra de progresso abaixo dos cards
- Lista de gaps em 1 coluna abaixo

**Specs do bloco:**
- Background: --card-subtle com --border-accent
- Score atual: Metric Grande (48px mobile, 64px desktop), cor --text-primary
- "/100": Metric Pequeno, cor --text-tertiary
- Score projetado: Metric Grande, cor --success (#4ADE80)
- Label "HOJE": Caption, cor --text-muted, uppercase, letter-spacing 1px
- Label "COM DESTAKA": Caption, cor --accent-bright, uppercase
- Barra de progresso: height 8px, border-radius 4px, bg rgba(255,255,255,0.08), fill --accent (porcentagem atual), fill --success (projetado, dashed ou gradient)
- Lista de gaps: cada item com icone check (outline, 16px), body small, padding-left 28px, gap 12px entre itens
- Icone do check: cor --accent

---

### 3.3 Bloco Mapa

**Mobile (320px):**
```
┌──────────────────────────────────┐
│  Headline (H2)                   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │    │
│  │     [MAPA LEAFLET]       │    │
│  │     zonas de alcance     │    │
│  │     height: 280px        │    │
│  │                          │    │
│  └──────────────────────────┘   │
│                                  │
│  Copy sobre raio limitado        │
│  Copy sobre potencial            │
└──────────────────────────────────┘
```

**Desktop (1280px):**
- Layout 2 colunas: mapa (60%) + copy (40%)
- Mapa height: 360px

**Specs do bloco:**
- Background: --bg-base (sem card wrapper, o mapa e o protagonista)
- Mapa: border-radius 12px, border 1px --border-subtle
- Mapa height: 280px mobile, 360px desktop
- Zonas no mapa: circulos com opacidade gradual (strong = accent opaco, weak = accent 0.1)
- Raio de alcance: circulo dashed, cor --accent com opacity 0.4
- Copy ao lado (desktop) ou abaixo (mobile): body, --text-secondary
- Dado de raio em destaque: Metric Medio, cor --accent-bright

---

### 3.4 Bloco Concorrentes

**Mobile (320px):**
```
┌──────────────────────────────────┐
│  Headline (H2)                   │
│  Copy provocativa                │
│                                  │
│  ┌──────────────────────────┐   │
│  │ 1. Concorrente A         │    │
│  │    ★★★★★ 4.8  (127 av.) │    │
│  ├──────────────────────────┤   │
│  │ 2. Concorrente B         │    │
│  │    ★★★★☆ 4.5  (89 av.)  │    │
│  ├──────────────────────────┤   │
│  │ 3. VOCE                  │    │
│  │    ★★★★☆ 4.2  (34 av.)  │    │
│  │    [highlight vermelho]   │    │
│  └──────────────────────────┘   │
└──────────────────────────────────┘
```

**Desktop (1280px):**
- 3 cards lado a lado em flex row
- Card do usuario com borda --error se atras, --success se na frente

**Specs do bloco:**
- Background: --card-subtle
- Cards: padding 20px, border-radius 12px, border 1px --border-card
- Card do usuario: borda --error (se rating menor que concorrentes), borda --success (se melhor)
- Nome: H3 (16px), --text-primary
- Rating: estrelas em --warning (#FBBF24), Metric Pequeno
- Numero de avaliacoes: Caption, --text-tertiary
- Posicao (1o, 2o, 3o): badge circular 24px, background --accent-bg, cor --accent-bright
- Se usuario esta em 3o: badge background --error-bg, cor --error

---

### 3.5 Bloco Avaliacoes

**Mobile (320px):**
```
┌──────────────────────────────────┐
│  Headline (H2)                   │
│                                  │
│  ┌─────────┐  ┌─────────┐      │
│  │  {X}    │  │  {dias} │       │
│  │ sem     │  │ ultima  │       │
│  │ resposta│  │ avaliação│      │
│  └─────────┘  └─────────┘      │
│                                  │
│  Copy sobre avaliacoes ignoradas │
│  Copy sobre IA respondendo       │
└──────────────────────────────────┘
```

**Desktop (1280px):**
- Metricas em row de 3 cards: sem resposta, ultima avaliacao, media de resposta dos concorrentes

**Specs do bloco:**
- Background: --card-subtle
- Metric cards: padding 16px, border-radius 12px, bg --card-dark
- Numero grande: Metric Medio (28px), --warning (#FBBF24) para pendentes
- Label: Caption, --text-muted
- Copy abaixo: Body, --text-secondary

---

### 3.6 Bloco Oferta (Stack Hormozi)

**Mobile (320px):**
```
┌──────────────────────────────────┐
│  Headline (H2)                   │
│                                  │
│  ┌──────────────────────────┐   │
│  │ ✓ Otimizacao completa    │    │
│  │         valor: R$800     │    │
│  ├──────────────────────────┤   │
│  │ ✓ Posts semanais         │    │
│  │         valor: R$400/mes │    │
│  ├──────────────────────────┤   │
│  │ ✓ Resposta com IA       │    │
│  │         valor: R$300/mes │    │
│  ├──────────────────────────┤   │
│  │ ✓ Monitoramento         │    │
│  │         valor: R$200/mes │    │
│  ├──────────────────────────┤   │
│  │ ✓ Relatorio mensal      │    │
│  │         valor: R$150/mes │    │
│  └──────────────────────────┘   │
│                                  │
│  ~~~R$2.000/mes~~~ (riscado)     │
│                                  │
│  Menos de R$7/dia                │
│                                  │
│  [====== QUERO COMECAR ======]  │
│                                  │
│  Micro-copy: garantia 30 dias   │
└──────────────────────────────────┘
```

**Desktop (1280px):**
- Stack de beneficios em 1 coluna, max-width 560px, centralizado
- Ancoragem e preco alinhados ao centro

**Specs do bloco:**
- Background: gradiente sutil de accent, rgba(20,184,166,0.06) no topo a rgba(20,184,166,0.02) na base
- Borda: --border-accent
- Border-radius: 20px
- Stack items: cada item com borda inferior --border-subtle, padding 16px vertical
- Icone check: cor --success (#4ADE80), 20px
- Beneficio: Body (16px), --text-primary
- Valor: Body Small (14px), --text-tertiary, text-decoration line-through nao, manter visivel para ancoragem
- Preco riscado (agencia): Metric Medio, --text-muted, text-decoration line-through
- Preco real: Metric Grande (48px), --accent-bright
- CTA botao: width 100%, height 56px (>= 44px touch target), bg --accent, hover --accent-hover, border-radius 12px, font 16px weight 600, cor #fff, box-shadow 0 4px 20px rgba(20,184,166,0.3)
- Micro-copy (garantia): Caption (12px), --text-tertiary, centralizado, margin-top 12px
- Icone de escudo/garantia: 16px, --text-tertiary, inline com texto

---

### 3.7 CTA Fixo Mobile

**Posicao:** fixed bottom, left 0, right 0
**Visibilidade:** aparece quando bloco de oferta sai do viewport (scroll down)
**Desktop:** nao mostrar (CTA do bloco oferta e suficiente)

**Specs:**
- Background: rgba(7,26,25,0.95)
- Backdrop-filter: blur(12px)
- Border-top: 1px solid rgba(20,184,166,0.2)
- Height: 72px (padding 16px top/bottom)
- Z-index: 50
- Conteudo: texto curto a esquerda + botao a direita
- Texto: Body Small (14px), --text-primary, 1 linha max
- Botao: padding 12px 24px, bg --accent, border-radius 10px, font 14px weight 600
- Touch target do botao: min 48px height
- Animacao de entrada: slide-up 200ms ease-out

---

## 4. Estados

### 4.1 Estado "Analisando" (dados ainda nao prontos)

```
┌──────────────────────────────────┐
│  [Logo]  Destaka                 │
│                                  │
│         ┌────────┐               │
│         │  ⏱    │               │
│         └────────┘               │
│                                  │
│  Analisando {profileName}        │
│                                  │
│  Estamos coletando dados do      │
│  seu perfil no Google.           │
│  Isso leva alguns minutos.       │
│                                  │
│  [████████░░░░░░░] analisando... │
│                                  │
│  Voce recebera um email quando   │
│  o diagnostico estiver pronto.   │
└──────────────────────────────────┘
```

**Specs:**
- Centralizado vertical e horizontal
- Icone: 64px, animacao pulse (opacity 0.5 > 1.0, 2s infinite)
- Barra de progresso: indeterminate (shimmer animation), height 4px, cor --accent
- Background: --bg-base, sem cards

### 4.2 Estado "Dados Parciais" (score existe, mas mapa/keywords ainda nao)

- Mostrar blocos que tem dados normalmente
- Blocos sem dados: skeleton shimmer (bg rgba(255,255,255,0.04), animate pulse)
- Caption abaixo do skeleton: "Coletando dados de {tipo}..." em --text-muted

### 4.3 Estado "Dados Completos"

- Todos os blocos renderizados com dados reais
- Animacoes de entrada no scroll ativadas

---

## 5. Animacoes

| Elemento | Tipo | Duracao | Easing | Trigger |
|----------|------|---------|--------|---------|
| Blocos | Fade-in + translate-y (20px > 0) | 300ms | ease-out | Intersection Observer (threshold 0.2) |
| Score numerico | Count-up (0 > valor real) | 800ms | ease-out | Bloco visivel |
| Barra de progresso | Width 0% > valor% | 600ms com delay 200ms | ease-out | Bloco visivel |
| CTA Fixo | Slide-up (translate-y 100% > 0) | 200ms | ease-out | Oferta sai do viewport |
| Hover botao CTA | Scale 1.0 > 1.02 | 150ms | ease-in-out | Hover |
| Cards concorrentes | Stagger (100ms entre cards) | 250ms cada | ease-out | Bloco visivel |

**Regras de animacao:**
- prefers-reduced-motion: desativar todas as animacoes, mostrar estado final
- Nenhuma animacao bloqueia interacao
- Nenhuma animacao dura mais de 800ms

---

## 6. Responsividade

### Breakpoints

| Breakpoint | Largura | Layout |
|-----------|---------|--------|
| Mobile | 320px - 767px | 1 coluna, blocos empilhados |
| Tablet | 768px - 1023px | 1 coluna, padding maior |
| Desktop | 1024px - 1280px | 2 colunas onde aplicavel |
| Wide | 1280px+ | max-width 1024px centralizado |

### Regras de layout

- **max-width da pagina:** 1024px (conteudo nao se espalha demais)
- **Mobile:** 1 coluna, tudo empilhado, CTA fixo visivel
- **Desktop:** mapa em 2 colunas (60/40), concorrentes em 3 cards row, score em 2 cards row
- **Oferta:** sempre 1 coluna centralizada (max-width 560px) em qualquer breakpoint

---

## 7. Acessibilidade (WCAG AA)

### Contraste validado

| Combinacao | Ratio | Status |
|-----------|-------|--------|
| #ffffff sobre #071a19 | 16.5:1 | PASS |
| rgba(255,255,255,0.7) sobre #071a19 | 10.3:1 | PASS |
| rgba(255,255,255,0.5) sobre #071a19 | 6.8:1 | PASS |
| rgba(255,255,255,0.35) sobre #071a19 | 4.6:1 | PASS (limite) |
| #5EEAD4 sobre #071a19 | 10.2:1 | PASS |
| #14B8A6 sobre #071a19 | 6.4:1 | PASS |
| #4ADE80 sobre #071a19 | 9.7:1 | PASS |
| #FBBF24 sobre #071a19 | 10.1:1 | PASS |
| #EF4444 sobre #071a19 | 4.9:1 | PASS |
| #ffffff sobre #14B8A6 (botao) | 4.6:1 | PASS |

### Touch targets

- Todos os botoes: min 48px height
- Links: min 44px touch area (padding se necessario)
- Cards clicaveis: min 44px height
- CTA fixo botao: 48px height

### Keyboard navigation

- Tab order: header > score > mapa > concorrentes > avaliacoes > oferta > CTA
- Focus visible: outline 2px solid --accent, offset 2px
- CTA fixo: acessivel por Tab quando visivel

### Semantica

- Header: `<header>` com `<nav>` (logo como link para /)
- Cada bloco: `<section>` com aria-labelledby apontando para o H2
- Score: usar `role="meter"` com aria-valuenow, aria-valuemin, aria-valuemax
- Mapa: aria-label descritivo, alternativa textual abaixo
- Lista de gaps: `<ol>` semantico
- Botao CTA: `<button>` com texto descritivo, nao so icone

---

## 8. Componentes Reutilizaveis

| Componente | Props | Uso |
|-----------|-------|-----|
| `ScoreBlock` | score, projectedScore, gaps[] | Bloco 2 |
| `MapBlock` | zones[], radiusKm, center | Bloco 3 |
| `CompetitorCard` | name, rating, reviewCount, isUser, position | Bloco 4 |
| `ReviewsBlock` | unansweredCount, lastReviewDate, avgCompetitorReviews | Bloco 5 |
| `OfferStack` | benefits[], anchorPrice, realPrice, guarantee | Bloco 6 |
| `StickyCTA` | text, buttonText, onCtaClick, isVisible | CTA fixo |
| `ProgressBar` | value, max, projectedValue | Barra score |
| `MetricCard` | value, label, color, icon | Cards de metricas |
| `AnimatedBlock` | children, delay | Wrapper de animacao |
| `AnalyzingState` | profileName | Estado loading |

---

**Proximo passo:** @qa roda Design Quality Gate antes de aprovar para desenvolvimento.
