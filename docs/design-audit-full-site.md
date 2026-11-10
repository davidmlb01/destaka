# Auditoria Completa de Tipografia e Design Visual - Destaka

**Data:** 2026-11-10
**Escopo:** Todas as paginas e componentes voltados ao usuario
**Referencia de design:** Linear.app (dark mode, minimalista, hierarquia clara)
**Status:** Diagnostico. Nenhuma alteracao implementada.

---

## Resumo Executivo

1. **Nao existe escala tipografica definida.** O site usa mais de 25 tamanhos de fonte diferentes (de 10px a 56px), aplicados via inline style e classes arbitrarias. Nao ha tokens de tipografia reutilizaveis.

2. **Opacidades de texto sao inconsistentes e arbitrarias.** Existem pelo menos 15 valores de opacidade diferentes para texto (0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.68, 0.7, 0.75, 0.8, 0.85, 0.9). O CSS define 4 niveis (`--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`), mas a maioria dos componentes ignora esses tokens e usa `rgba(255,255,255, X)` direto no inline style.

3. **Dois sistemas de estilo concorrem.** As landing pages usam Tailwind classes + inline styles com `rgba()`. O dashboard usa CSS custom properties (`var(--text-secondary)`). Resultado: nenhum dos dois e consistente, e a transicao visual entre areas e perceptivel.

4. **Peso tipografico esta inflacionado.** Praticamente todo texto usa `font-bold` ou `font-extrabold` via `font-display`. Quando tudo e bold, nada e bold. O Linear.app usa pesos leves para 80% do conteudo e reserva bold para numeros e titulos primarios.

5. **Uppercase overuse em labels.** Pelo menos 12 componentes usam `text-xs font-bold tracking-[...] uppercase` para section labels. O tracking e o tamanho variam entre eles (tracking `[2px]`, `[0.12em]`, `[0.08em]`, `[0.05em]`, `widest`). Deveria ser um unico token.

---

## Fontes Carregadas

- **Geist Sans** (`--font-geist-sans`): corpo de texto, UI
- **Geist Mono** (`--font-geist-mono`): declarado, usado raramente (score countup no diagnostico)
- **Outfit** (`--font-display`): titulos, display. Pesos 400, 500, 700

**Problema:** Outfit e usado como "font-display" mas aparece em labels, badges, botoes e textos de corpo tambem. No Linear, a fonte de display e reservada estritamente para titulos.

---

## Tokens de Texto no CSS (globals.css)

```
--text-primary:   #ffffff           (opacidade 1.0)
--text-secondary: rgba(255,255,255, 0.7)
--text-tertiary:  rgba(255,255,255, 0.5)
--text-muted:     rgba(255,255,255, 0.35)
--text-accent:    #5EEAD4
```

**Problema central:** Esses tokens existem mas sao usados por MENOS da metade dos componentes. A maioria usa `rgba(255,255,255, X)` inline com valores arbitrarios.

---

## Pagina por Pagina

### Landing Page (`src/app/page.tsx`)

**Tamanhos encontrados:** 11px, 12px, 13px, 14px, 15px, 16px, 17px, 18px, 52px (stats), `clamp(14px,1.5vw,16px)`, `clamp(16px,1.8vw,18px)`, `clamp(24px,3vw,34px)`, `clamp(24px,3.5vw,36px)`, `clamp(28px,3.5vw,40px)`, `clamp(34px,4.5vw,56px)`, `clamp(72px,10vw,120px)`

**Problemas:**
- Body text oscila entre 14px, 15px, 16px e 17px na mesma pagina, sem razao aparente
- Opacidades de texto: 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.68, 0.70, 0.85 (9 valores diferentes para conteudo de uma unica pagina)
- Stats no hero usam 52px Outfit bold. Labels dos stats usam 15px bold. Descricao usa 14px com opacidade 0.50. Nao ha consistencia entre as 3 stat cards.
- `Nav` links usam `text-[13px]` na landing generica, `text-[14px]` na landing `/saude`
- Section label "O custo da invisibilidade" usa `text-[11px] font-bold tracking-[2px] uppercase`, mas outros section headers nao tem label
- Botoes CTA repetem a mesma estrutura com tamanhos de fonte variados (13px no circulo arrow, 16px no texto)
- Footer usa 4 tamanhos diferentes: 13px, 12px, 12px, 11px

### Landing Saude (`src/app/saude/page.tsx`)

**Problemas adicionais:**
- Quase identica a landing generica mas com diferencas sutis de tamanho e opacidade (ex: stat labels sao 14px em vez de 15px, opacidade e 0.55 em vez de 0.50)
- "Como funciona" step titles sao 20px vs 18px na generica
- Badge "Para profissionais de saude" usa mesma Badge component (11px bold uppercase)
- Footer tagline usa 14px (vs 13px na generica)
- Essas diferencas nao parecem intencionais, e sim drift de edicao

### Login (`src/app/(auth)/login/page.tsx`)

**Tamanhos:** `text-2xl` (24px), `text-sm` (14px), `text-xs` (12px)
**Problemas:**
- Usa classes Tailwind (`text-2xl`, `text-sm`) em vez de font-display ou design tokens
- H1 usa `font-semibold` em vez de `font-bold` (unico lugar no site)
- Opacidades: 0.40, 0.45 (subtextos)
- Unica pagina que usa Tailwind classes para tamanhos em vez de valores inline

### Onboarding (`src/app/(dashboard)/onboarding/page.tsx`)

**Tamanhos:** `text-xl` (20px), `text-lg` (18px), `text-sm` (14px), `text-xs` (12px)
**Problemas:**
- Step titles usam `text-lg font-semibold` (18px), nao Outfit. Inconsistente com dashboard que usa `font-display font-bold`
- O welcome step usa `text-xl font-semibold`, diferente de qualquer outro H1 no site
- Progress bar label usa `text-xs` com opacidade 0.4
- Labels de campo usam `text-sm font-medium` com opacidade 0.7
- Campo de input via `<style jsx>` com `font-size: 0.875rem` (14px). Inputs deveriam seguir o mesmo padrao do resto
- Activation steps usam `text-sm` com opacidades variando entre 0.3, 0.9 e accent color

### Diagnostico (`src/app/(diagnostico)/diagnostico/page.tsx`)

**Tamanhos:** 10px, 11px, 12px, 13px, 14px, 16px, 19px, 22px, 26px, 28px, 44px (score no circulo)
**Problemas:**
- Score number usa `font-mono font-bold` 44px. No dashboard ScoreHero, o score usa `text-6xl font-black` (~60px). Incoerencia visual para o mesmo dado
- Section labels usam `fontSize: 13` + `letterSpacing: '0.1em'` + `textTransform: 'uppercase'` inline, enquanto o dashboard usa classe `text-xs font-bold tracking-[0.12em] uppercase`
- H1 (nome do negocio) usa 26px. Hero H2 ("Voce esta perdendo...") usa 22px. Tagline final usa 28px. A hierarquia esta invertida: o bloco de CTA no meio tem titulo menor que a tagline no final
- CTA button usa `fontSize: 16` inline, diferente dos Button components do resto do site
- MapCard legend items usam `fontSize: 11` inline enquanto o dashboard MapCard usa `text-xs` Tailwind
- Quick wins boxes usam 14px bold inline; diagnostico header usa 13px uppercase inline

### Dashboard Principal (`DashboardContent.tsx` + componentes)

**Tamanhos encontrados:** 10px, 11px, 12px, 13px, 14px, 15px, 18px, 20px, 22px, 28px, 30px, 36px, 48px, 56px, text-6xl (~60px)
**Problemas:**
- `SectionTitle` usa `text-xs font-bold tracking-[0.12em] uppercase` com opacidade 0.38. Bom padrao, mas so existe aqui
- `ScoreHero`: score usa `text-6xl font-black`, label "Score Destaka" usa `text-xs font-semibold uppercase tracking-wide`. O `/100` usa `text-xl font-light`. Sao 3 estilos diferentes em 3 linhas
- `MetricCard`: numero usa `font-display font-extrabold` 30px. Label usa `text-xs`. Hint usa `text-xs`. Zero-state usa `text-[10px]`. 4 tamanhos em um card compacto
- `ScoreCard` (detalhe por categoria): score number usa `font-display font-extrabold` 20px inline. Label usa `text-sm` Tailwind. Issues usam `text-sm` e `text-xs`. Toggle "ocultar" usa `text-xs`
- `TotalScoreBadge`: score usa 56px inline. Confunde com o ScoreHero que usa 60px
- `MapCard` (dashboard): usa `text-base font-semibold text-zinc-100` para titulo e `text-sm text-zinc-400` para descricao. Estas sao classes Tailwind com cores Zinc, nao design tokens! O resto do dashboard usa `var(--text-*)` ou `rgba()`. Inconsistencia total
- `RankingCard`: position number usa `font-display font-extrabold` 36px. Keyword label usa `text-sm font-medium`. Delta usa `text-xs font-medium`. "Fora do top 20" usa `text-xs px-2 py-1`
- `PatientFunnelCard`: nivel 1 numero usa 32px, nivel 2 e 3 usam 28px. Section label usa 0.38 opacidade. Bom exemplo de hierarquia dentro de um card, mas os tamanhos nao seguem a escala geral
- `GapAnalysisCard`: section label usa tracking `[0.12em]` com 0.38 opacidade (consistente com SectionTitle). Mas comparativos usam `text-sm font-medium text-white` vs `text-xs` para "Voce:" e "vs"
- `NextActionsPanel`: "O Destaka cuida disso" label usa `text-xs font-semibold` com accent. Action message usa `text-sm text-white`. Hint usa `text-xs` com 0.5 opacidade
- `ProfileAlerts`: usa emoji (⚠️) 20px como icone. Inconsistente com PinIcon usado em todo o resto
- Error state: H2 usa `font-display font-bold text-white text-[22px]`. Descricao usa `text-[15px]`. Botao usa `font-display font-semibold text-[15px]`

### Reviews (`ReviewsContent.tsx`)

**Problemas:**
- Filter buttons usam `text-xs font-medium`. Badge de contagem usa `fontSize: 10` inline
- Review author usa `text-sm font-bold text-white`. Consistente
- Review text usa `text-sm` com opacidade 0.65 e lineHeight 1.6
- Modal header usa `font-display font-bold text-white` (sem tamanho especificado, herda default). Inconsistente com inline sizes usados em todo lugar
- "Sua resposta" label usa `text-xs font-medium` com 0.5 opacidade
- Textarea counter usa `text-xs` com 0.25 opacidade
- Status badges: `text-xs font-medium` com dot de 6px. Bom padrao

### Checklist (`ChecklistContent.tsx`)

**Problemas:**
- "X de Y tarefas" usa `font-display font-bold text-white text-sm`. "Concluir tudo..." usa `text-xs` com 0.5 opacidade
- Progresso porcentagem usa `font-display font-extrabold` 28px em verde
- "Pendentes (N)" label usa `font-display font-bold text-white text-sm` com opacidade 0.7
- Task title usa `font-medium text-white text-sm`. Priority badge usa `text-xs`
- Impact usa `text-xs font-bold` em verde. Inconsistente com MetricCard que usa `font-extrabold` para numeros

### Optimizations (`OptimizationsPage.tsx`)

**Tamanhos:** 10px, 11px, 12px, 13px, 14px, 15px, 18px (text-lg), 28px
**Problemas:**
- H1 usa `font-display font-bold` 28px inline. Subtitulo usa 15px inline. Consistente internamente, mas diferente do diagnostico (26px) e do dashboard error (22px) para H1
- Section headers usam `font-display font-bold text-white text-lg` (18px). Bom, mas nao reutiliza SectionTitle
- "Descricao atual" label usa `text-[10px] font-bold uppercase tracking-widest`. O tracking e `tracking-widest` aqui, mas `tracking-[0.12em]` no dashboard e `tracking-[2px]` na landing. Tres valores diferentes para o mesmo padrao visual
- Variant text usa `text-[13px]`. Focus badges usam `text-[10px]` com background colorido
- Character count usa `text-[10px]` vs `text-xs` (12px) usado em todo outro lugar para hints
- Score projecao: "Score atual:" usa `text-sm` com 0.5, numero usa `font-display font-bold text-lg`. Arrow usa caracter unicode com 0.3 opacidade

### Configuracoes (`ConfiguracoesContent.tsx`)

**Problemas:**
- Section title usa `font-display font-bold text-white text-sm`. Diferente da SectionTitle do dashboard (`text-xs uppercase tracking`)
- Email usa `text-sm` com 0.55 opacidade. Plano label usa `text-xs` com 0.45
- Paragrafos de LGPD usam `text-xs` com 0.4 opacidade e lineHeight 1.6
- Botoes de acao usam `text-sm font-bold` vs `text-sm font-medium`. Sem padrao claro

### Privacidade e Termos (`privacy/page.tsx`, `termos/page.tsx`)

**Problemas:**
- Usam classes Tailwind puras (`text-3xl font-bold`, `text-lg font-semibold`, `text-sm`)
- Secao headings usam cor teal inline (`style={{ color: teal }}`), nao variavel CSS
- "Voltar ao inicio" usa `text-sm` com cor teal inline
- Body text usa `text-white/80` e `text-white/40` (notacao Tailwind de opacidade), diferente de `rgba()` usado em todo lugar
- Background hardcoded como `#071a19` no JSX em vez de `var(--bg-base)`
- Sao as unicas paginas que usam `text-white/X` do Tailwind. Todo o resto usa `rgba(255,255,255,X)` ou tokens

### 404 (`not-found.tsx`)

**Problemas:**
- "404" usa `fontFamily: 'var(--font-display)'` com `fontSize: '6rem'` e `fontWeight: 400`. Unico lugar que usa Outfit weight 400 para display
- Card background usa `#0d2b29`, cor unica nao usada em nenhum outro lugar
- "Voltar ao inicio" botao usa `background: teal, color: '#071a19'` (texto escuro em fundo teal). Unico botao no site com texto escuro
- H1 usa `text-xl font-semibold`. Mesma classe do login, diferente do padrao `font-display font-bold` do resto

### Verificar (`verificar/page.tsx`)

**Problemas:**
- H1 usa `font-display font-extrabold` com `clamp(28px, 5vw, 42px)`. Unico lugar com `font-extrabold` no Outfit
- Subtitulo usa `text-base` (16px) com opacidade 0.5. `text-base` raramente e usado no resto do site

---

## Catalogo de Inconsistencias Criticas

### 1. Opacidades de Texto (15+ valores)

| Opacidade | Onde aparece | Deveria ser |
|-----------|-------------|-------------|
| 0.2 | Footer copyright, timestamps | `--text-muted` (0.35) |
| 0.25 | Zero-state hints, counters | `--text-muted` (0.35) |
| 0.3 | Disabled, placeholders | `--text-muted` (0.35) |
| 0.35 | Muted labels | `--text-muted` (0.35) |
| 0.38 | SectionTitle no dashboard | `--text-muted` (0.35) |
| 0.4 | Onboarding, hints, timestamps | `--text-muted` (0.35) |
| 0.45 | Login subtexto, footer links | `--text-tertiary` (0.5) |
| 0.5 | Hero subtexto, hints | `--text-tertiary` (0.5) |
| 0.55 | Saude descricoes, config email | `--text-tertiary` (0.5) |
| 0.6 | Body secundario, cards | `--text-secondary` (0.7) |
| 0.65 | Hero body, review text | `--text-secondary` (0.7) |
| 0.68 | Saude hero body | `--text-secondary` (0.7) |
| 0.7 | Descricoes principais | `--text-secondary` (0.7) |
| 0.75 | Saude descricoes | `--text-secondary` (0.7) |
| 0.8 | Manifesto destaque | `--text-primary` (1.0) |
| 0.85 | Manifesto linha, textarea | `--text-primary` (1.0) |
| 0.9 | Manifesto linha 2 | `--text-primary` (1.0) |

### 2. Tamanhos de Fonte (25+ valores)

| Tamanho | Ocorrencias | Proposito |
|---------|-------------|-----------|
| 10px | ~8 | Micro labels, character counts |
| 11px | ~6 | Section labels uppercase, legends |
| 12px | ~15 | xs: hints, timestamps, badges |
| 13px | ~8 | Nav links, descricao variants |
| 14px | ~20 | sm: body secundario, labels |
| 15px | ~12 | Body entre sm e base, stats |
| 16px | ~10 | Body principal, CTA |
| 17px | ~6 | Body enfatizado (saude) |
| 18px | ~5 | Step titles, section headers |
| 19px | ~1 | Tagline subtitle (diagnostico) |
| 20px | ~3 | Step titles (saude), score card detail |
| 22px | ~2 | Dashboard error H2, diagnostico CTA H2 |
| 24px | ~1 | Login H1 (text-2xl) |
| 26px | ~1 | Diagnostico H1 |
| 28px | ~4 | Optimizations H1, funnel levels, checklist % |
| 30px | ~2 | MetricCard numbers |
| 32px | ~1 | Funnel level 1 |
| 36px | ~1 | Ranking position |
| 40px | ~0 | (em clamp max, nunca standalone) |
| 44px | ~1 | Diagnostico score circle |
| 48px | ~2 | Como funciona bg numbers |
| 52px | ~2 | Landing stats |
| 56px | ~1 | TotalScoreBadge |
| ~60px | ~1 | ScoreHero (text-6xl) |
| 96px | ~1 | 404 number (6rem) |

### 3. Font Weight Inflation

| Peso | Onde deveria ser usado | Onde esta sendo usado |
|------|----------------------|---------------------|
| 400 (regular) | Body text, descricoes | Quase nunca (so 404 "404" number) |
| 500 (medium) | Labels, nav links, botoes | Nav, field labels, buttons |
| 600 (semibold) | Subtitulos, enfase | Login H1, onboarding H1, section titles |
| 700 (bold) | Titulos, headlines | Tudo: labels, badges, section titles, H1-H3, stats |
| 800 (extrabold) | Numeros hero, score | MetricCard, ScoreCard, RankingCard, verificar H1 |
| 900 (black) | Nunca (reserva emergencial) | ScoreHero score, ReviewsCard stats |

**O Linear.app usa regular (400) para 80% do texto, medium (500) para labels, semibold (600) para titulos, e bold (700) apenas para numeros de destaque.**

### 4. Tracking (Letter Spacing)

| Valor | Onde |
|-------|------|
| `tracking-[-4px]` | AparecerPrimeiro "1o" (120px) |
| `tracking-[-3px]` | Stats pct (52px) |
| `tracking-[-2px]` | Como funciona bg numbers |
| `tracking-[-1.5px]` | Hero H1 |
| `tracking-[-1px]` | H2 sections |
| `tracking-[-0.5px]` | MetricCard, funnel numbers |
| `tracking-[-0.3px]` | Diagnostico H1 |
| `tracking-tight` | ScoreHero score |
| `tracking-[0.05em]` | Checklist step label |
| `tracking-[0.06em]` | WeeklyHighlights label |
| `tracking-[0.08em]` | Badge component |
| `tracking-[0.1em]` | Diagnostico section label |
| `tracking-[0.12em]` | SectionTitle, RankingCard label |
| `tracking-[2px]` | Landing section label |
| `tracking-wide` | ScoreHero "Score Destaka" |
| `tracking-widest` | OptimizationsPage labels |

Sao 16 valores de tracking diferentes. O Linear.app usa no maximo 3 (negativo para display, normal para body, positivo para uppercase micro labels).

---

## Escala Tipografica Recomendada

Baseada no Linear.app, com 8 niveis em vez de 25+:

| Token | Tamanho | Peso | Uso |
|-------|---------|------|-----|
| `--type-display` | clamp(32px, 4vw, 48px) | 700 Outfit | Hero H1 unico |
| `--type-h1` | 24px | 600 Outfit | Titulos de pagina |
| `--type-h2` | 18px | 600 Geist | Section headers |
| `--type-h3` | 15px | 600 Geist | Card headers |
| `--type-body` | 14px | 400 Geist | Corpo de texto padrao |
| `--type-body-sm` | 13px | 400 Geist | Corpo secundario |
| `--type-caption` | 12px | 500 Geist | Labels, hints, timestamps |
| `--type-micro` | 11px | 600 Geist | Uppercase section labels, badges |

**Tracking padronizado:**
- Display/H1: `-0.02em`
- Body: `0` (normal)
- Micro/uppercase: `0.08em`

**Numeros de destaque (scores, metricas):**
- Score hero: 48px, 700, Outfit, tracking `-0.02em`
- Metric numbers: 28px, 700, Outfit, tracking `-0.02em`
- Inline numbers: herdam do corpo

---

## Hierarquia de Cor/Opacidade Recomendada

Consolidar os 15+ valores em 4 tokens ja existentes:

| Token | Opacidade | Uso |
|-------|-----------|-----|
| `--text-primary` | 1.0 (#fff) | Titulos, numeros de destaque, dados primarios |
| `--text-secondary` | 0.65 | Body text, descricoes, conteudo principal |
| `--text-tertiary` | 0.45 | Labels, hints, timestamps, metadados |
| `--text-muted` | 0.3 | Placeholders, disabled, separadores, copyright |

**Ajuste sugerido:** Os valores atuais (0.7, 0.5, 0.35) sao muito proximos entre si. A recomendacao acima (1.0, 0.65, 0.45, 0.3) cria mais distancia entre os niveis, facilitando a percepcao de hierarquia.

---

## Prioridade de Correcao (Maior Impacto Visual Primeiro)

### P0: Impacto imediato, toda pagina melhora

1. **Criar tokens tipograficos reutilizaveis** e aplicar em todo o projeto. Eliminar inline `fontSize` e `style={{ color: 'rgba(...)' }}`. Isso sozinho resolve 70% dos problemas.

2. **Reduzir pesos para body text.** Trocar `font-bold` por peso regular (400) em todo texto de corpo. Reservar bold para titulos e numeros.

3. **Padronizar opacidades.** Substituir todos os `rgba(255,255,255, X)` inline pelos 4 tokens. Uma busca e replace resolve a maioria.

### P1: Consistencia entre areas

4. **Unificar MapCard.** Atualmente usa classes Tailwind Zinc (`text-zinc-100`, `text-zinc-400`, `bg-zinc-900/50`). Deve usar tokens do design system.

5. **Padronizar section labels.** Criar um componente `SectionLabel` unico para o padrao `11px / 600 / uppercase / tracking 0.08em / opacidade 0.3`. Substituir as 12+ variantes.

6. **Alinhar diagnostico com dashboard.** Score de 44px (diagnostico) vs 60px (dashboard) para o mesmo dado. Unificar para um unico tamanho.

### P2: Polimento

7. **Alinhar landings generica e saude.** Corrigir os drifts de 1px e 0.05 de opacidade entre as duas paginas.

8. **Unificar paginas legais (privacidade/termos).** Trocar `text-white/X` Tailwind por tokens, trocar `#071a19` por `var(--bg-base)`.

9. **Corrigir 404.** Trocar cor de fundo unica, alinhar botao com design system, usar peso 700 em vez de 400 para o "404".

10. **Eliminar font-display de labels e badges.** Outfit deve aparecer apenas em display, H1 e numeros de destaque. Labels, badges e botoes devem usar Geist.

---

## Notas Adicionais

- O componente `Button` usa `font-display font-bold rounded-full`. No Linear, botoes usam a fonte do sistema com peso medium, cantos arredondados sutis (8px), e nao display font. Considerar alinhar.
- O componente `Badge` usa `text-[11px] font-bold tracking-[0.08em] uppercase`. Bom padrao, mas o mesmo padrao visual aparece em 12 outros lugares com valores diferentes, porque nao reutilizam o Badge.
- A `Card` component tem 5 variantes (`subtle`, `glass`, `accent`, `light`, `dark`), mas a maioria dos cards no dashboard usa inline style em vez do componente. Oportunidade de consolidacao.
- Nenhuma animacao de entrada e padronizada. Existem `animate-fade-in-up`, `stagger-1`, `stagger-2` como classes, mas nao ha definicao CSS correspondente visivel no `globals.css`.

---

**Proximo passo:** Revisar este documento com o time de design, definir a escala tipografica final, e criar um token file (`design-tokens.css`) antes de implementar qualquer correcao.
