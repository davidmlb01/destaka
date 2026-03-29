# Design System — Destaka
**Versão:** 1.0
**Data:** 2026-03-29
**Status:** Aprovado para implementação
**Produzido por:** Design Squad (Design Chief + Visual Generator + Design System Architect) × Copy Squad (Cyrus)

---

## PARTE 1 — IDENTIDADE VISUAL

---

## 1. Filosofia Visual

A Destaka transforma o invisível em visível. O design reflete essa promessa:
- **Contraste audacioso** — a marca se destaca visualmente assim como destaca o cliente
- **Clareza cirúrgica** — profissionais de saúde confiam em precisão, não em ruído
- **Energia controlada** — dinâmica sem ser agressiva, moderna sem ser fria

**Princípio-guia:** Se um dentista de 55 anos e uma fundadora de 28 conseguem usar o mesmo produto e se sentir bem-vindos, o design acertou.

---

## 2. Paleta de Cores

### Decisão de Cor — Raciocínio
O violet/roxo profundo foi escolhido por três razões estratégicas:
1. **Zero concorrência visual** no segmento de saúde local — ninguém usa. Isso é distinctive asset puro (Byron Sharp).
2. **Arquétipo do Mago** — violet é a cor universal da transformação, sabedoria e poder.
3. **Contraste perfeito** com o verde esmeralda do resultado/sucesso.

### Paleta Principal

```
VIOLET ESCURO (Primária)
Hex:    #5B21B6
RGB:    91, 33, 182
HSL:    265°, 69%, 42%
Uso:    CTAs principais, hero, elementos de destaque
Nome:   "Mago"

VIOLET MÉDIO (Primária clara)
Hex:    #7C3AED
RGB:    124, 58, 237
HSL:    262°, 83%, 58%
Uso:    Hover states, gradientes, backgrounds secundários
Nome:   "Destaka Purple"

ESMERALDA (Acento)
Hex:    #10B981
RGB:    16, 185, 129
HSL:    160°, 84%, 39%
Uso:    Score positivo, sucesso, CTAs secundários, badges "otimizado"
Nome:   "Visível"

ESMERALDA ESCURO (Acento profundo)
Hex:    #059669
RGB:    5, 150, 105
HSL:    161°, 94%, 30%
Uso:    Texto sobre fundo verde, estados hover do acento
Nome:   "Destaque"
```

### Paleta Neutra

```
DARK NAVY (Dark mode base / textos)
Hex:    #1E1B4B
RGB:    30, 27, 75
HSL:    244°, 47%, 20%
Uso:    Textos principais, fundos dark, headings sobre branco

SLATE (Texto secundário)
Hex:    #475569
RGB:    71, 85, 105
Uso:    Subtítulos, textos de apoio, metadata

GRAY LIGHT (Borders e divisores)
Hex:    #E2E8F0
RGB:    226, 232, 240
Uso:    Bordas de card, divisores, inputs inativos

OFF-WHITE (Background principal)
Hex:    #F8FAFC
RGB:    248, 250, 252
Uso:    Background geral da plataforma

WHITE PURO
Hex:    #FFFFFF
Uso:    Cards, modais, áreas de conteúdo
```

### Paleta Semântica

```
SUCESSO (Score alto / ação concluída)
Hex:    #10B981   →   usa Esmeralda

ATENÇÃO (Score médio / pendências)
Hex:    #F59E0B
RGB:    245, 158, 11
Nome:   "Atenção"

ALERTA (Score baixo / erros)
Hex:    #EF4444
RGB:    239, 68, 68
Nome:   "Urgente"

INFO (Informativos neutros)
Hex:    #3B82F6
RGB:    59, 130, 246
```

### Gradientes

```
GRADIENTE HERO (principal)
De: #7C3AED   Para: #5B21B6
Direção: 135deg
Uso: Hero section, banners principais, cards de destaque

GRADIENTE ACENTO
De: #10B981   Para: #059669
Direção: 135deg
Uso: Score positivo, badges de resultado

GRADIENTE DARK (para seções escuras)
De: #1E1B4B   Para: #2D1B69
Direção: 135deg
Uso: Seções de depoimento, footers, CTAs dark
```

### Regras de Uso de Cor

| Combinação | Contraste WCAG | Uso permitido |
|------------|---------------|---------------|
| Branco sobre #5B21B6 | 8.2:1 ✅ AAA | Texto em botões, CTAs |
| Branco sobre #7C3AED | 5.1:1 ✅ AA | Texto normal |
| #1E1B4B sobre branco | 16.4:1 ✅ AAA | Texto principal |
| Branco sobre #10B981 | 2.8:1 ⚠️ | Só ícones/bold grande |
| #1E1B4B sobre #F8FAFC | 15.9:1 ✅ AAA | Corpo de texto |

---

## 3. Tipografia

### Filosofia
Duas fontes. Nada mais. Contraste entre expressividade (display) e legibilidade (corpo).

### Fonte de Display — Plus Jakarta Sans
```
Família:   Plus Jakarta Sans
Pesos:     800 (ExtraBold), 700 (Bold), 600 (SemiBold)
Uso:       Headings, títulos de seção, hero text, nome da marca
Download:  Google Fonts (free) / fonts.google.com/specimen/Plus+Jakarta+Sans
Por que:   Geométrica moderna com personalidade. Os ângulos do "k" e "a"
           têm energia visual que combina com "Destaka".
           Distintiva sem ser ostensiva. Lê-se como tecnologia de saúde.
```

### Fonte de Corpo — Inter
```
Família:   Inter
Pesos:     400 (Regular), 500 (Medium), 600 (SemiBold)
Uso:       Parágrafos, labels, metadados, UI texto
Download:  Google Fonts (free) / rsms.me/inter
Por que:   Máxima legibilidade em telas. Padrão de fato para SaaS.
           Familiar sem ser banal. Perfeita a 14px e 16px.
```

### Escala Tipográfica

```
─────────────────────────────────────────────────────
DISPLAY GRANDE
Font:   Plus Jakarta Sans 800
Size:   56px / 3.5rem
Line:   64px / 1.14
Uso:    Hero headline, número principal do score

DISPLAY MÉDIO
Font:   Plus Jakarta Sans 700
Size:   40px / 2.5rem
Line:   48px / 1.2
Uso:    Títulos de seção, headlines de feature

H1
Font:   Plus Jakarta Sans 700
Size:   32px / 2rem
Line:   40px / 1.25
Uso:    Títulos de página

H2
Font:   Plus Jakarta Sans 600
Size:   24px / 1.5rem
Line:   32px / 1.33
Uso:    Subtítulos, títulos de card

H3
Font:   Plus Jakarta Sans 600
Size:   20px / 1.25rem
Line:   28px / 1.4
Uso:    Títulos de seção menor, labels de categoria

BODY LG
Font:   Inter 400
Size:   18px / 1.125rem
Line:   28px / 1.56
Uso:    Lead text, texto de destaque em landing page

BODY MD (padrão)
Font:   Inter 400
Size:   16px / 1rem
Line:   24px / 1.5
Uso:    Corpo de texto geral

BODY SM
Font:   Inter 400
Size:   14px / 0.875rem
Line:   20px / 1.43
Uso:    Labels, metadados, texto de apoio

CAPTION
Font:   Inter 500
Size:   12px / 0.75rem
Line:   16px / 1.33
Uso:    Tags, badges, datas, avisos legais

─────────────────────────────────────────────────────
```

### Regras Tipográficas

- **Nunca** usar mais de 2 pesos da mesma família na mesma tela
- **Nunca** centralizar parágrafos longos (só headings curtos)
- Máximo de **65 caracteres por linha** no corpo de texto
- Espaçamento de letra (letter-spacing): `-0.02em` em headings bold, `0` no corpo

---

## 4. Logo — Direção & Especificações

### Conceito do Logo
**Wordmark primário** com tratamento custom na letra **K**.

O "K" de Destaka recebe um elemento ascendente — a haste diagonal superior do K é extendida e termina com um pin/ponto de localização (mapa), simbolizando: *aparecer no mapa, ser encontrado, se destacar*.

Subtexto visual: o pin de localização dentro do K comunica Google Maps / local search sem precisar dizer.

### Variações do Logo

```
1. PRINCIPAL (positivo)
   Wordmark "Destaka" em Plus Jakarta Sans 800
   Cor: #5B21B6 (Mago)
   Fundo: Branco ou Off-White
   Uso: Site, documentos, apresentações sobre fundo claro

2. NEGATIVO (sobre fundo escuro)
   Wordmark "Destaka" em branco (#FFFFFF)
   Fundo: #5B21B6 ou #1E1B4B ou gradiente hero
   Uso: Header dark mode, slides dark, stories Instagram

3. MONOCROMÁTICO ESCURO
   Wordmark em #1E1B4B
   Uso: Documentos impressos, fundos brancos formais

4. MONOCROMÁTICO CLARO
   Wordmark em #FFFFFF
   Uso: Fundos escuros sem cor da marca

5. SÍMBOLO ISOLADO (ícone)
   Apenas o "D" estilizado + pin element
   Uso: Favicon, app icon, avatar de redes sociais
   Tamanho mínimo: 32x32px

6. HORIZONTAL COM TAGLINE
   Logo principal + "Apareça para quem precisa de você."
   Tagline: Inter 400, 12px, #475569
   Uso: Apresentações formais, rodapés de e-mail, pitch deck
```

### Zonas de Proteção
```
Espaço mínimo ao redor do logo = altura da letra "D" do wordmark
Nunca aplicar o logo sobre fundos com contraste inferior a 4.5:1
```

### Tamanhos Mínimos
```
Digital: 80px de largura (wordmark completo)
Impresso: 25mm de largura
Ícone isolado: 16px (favicon) a 32px (uso geral)
```

### Proibições de Logo
- Não distorcer proporções
- Não adicionar sombras ou efeitos 3D
- Não aplicar sobre fotos sem overlay escuro
- Não recolorir com cores fora da paleta
- Não usar peso diferente de ExtraBold para o wordmark

---

## 5. Design Tokens (para implementação)

```css
/* ── CORES ── */
--color-primary-900: #2E1065;
--color-primary-800: #3B0764;
--color-primary-700: #5B21B6;   /* primária */
--color-primary-600: #7C3AED;   /* primária clara */
--color-primary-500: #8B5CF6;
--color-primary-100: #EDE9FE;
--color-primary-50:  #F5F3FF;

--color-accent-700:  #059669;   /* acento escuro */
--color-accent-500:  #10B981;   /* acento */
--color-accent-100:  #D1FAE5;
--color-accent-50:   #ECFDF5;

--color-warning:     #F59E0B;
--color-danger:      #EF4444;
--color-info:        #3B82F6;

--color-dark:        #1E1B4B;
--color-text:        #1E1B4B;
--color-text-muted:  #475569;
--color-border:      #E2E8F0;
--color-bg:          #F8FAFC;
--color-surface:     #FFFFFF;

/* ── TIPOGRAFIA ── */
--font-display: 'Plus Jakarta Sans', sans-serif;
--font-body:    'Inter', sans-serif;

--text-xs:   0.75rem;    /* 12px */
--text-sm:   0.875rem;   /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg:   1.125rem;   /* 18px */
--text-xl:   1.25rem;    /* 20px */
--text-2xl:  1.5rem;     /* 24px */
--text-3xl:  2rem;       /* 32px */
--text-4xl:  2.5rem;     /* 40px */
--text-5xl:  3.5rem;     /* 56px */

/* ── ESPAÇAMENTO ── */
--space-1:  0.25rem;   /* 4px  */
--space-2:  0.5rem;    /* 8px  */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-24: 6rem;      /* 96px */

/* ── BORDER RADIUS ── */
--radius-sm:  0.375rem;  /* 6px  */
--radius-md:  0.5rem;    /* 8px  */
--radius-lg:  0.75rem;   /* 12px */
--radius-xl:  1rem;      /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-full: 9999px;   /* pill */

/* ── SOMBRAS ── */
--shadow-sm:  0 1px 2px rgba(30, 27, 75, 0.06);
--shadow-md:  0 4px 12px rgba(30, 27, 75, 0.10);
--shadow-lg:  0 8px 24px rgba(30, 27, 75, 0.14);
--shadow-xl:  0 16px 40px rgba(30, 27, 75, 0.18);

/* ── Z-INDEX ── */
--z-dropdown: 100;
--z-modal:    200;
--z-toast:    300;
```

---

## PARTE 2 — TEMPLATES SOCIAIS

---

## 6. Instagram Feed — Templates

### Dimensões e Especificações Gerais
```
Formato:    1080 × 1080px (quadrado)
Resolução:  72 DPI (digital) / 300 DPI (se imprimir)
Formato:    PNG ou JPG (90% qualidade)
Cores:      sRGB
```

### Template 01 — POST EDUCATIVO (tipo "Você sabia?")

```
┌─────────────────────────────────────┐
│ ░░░░ FUNDO: Gradiente Hero ░░░░░░░░ │
│                                     │
│  [BADGE superior]                   │
│  ┌──────────────┐                   │
│  │ VOCÊ SABIA?  │  ← Inter 500 12px │
│  │ esmeralda    │     em pill verde  │
│  └──────────────┘                   │
│                                     │
│  [NÚMERO / DADO EM DESTAQUE]        │
│  "7x"         ← Jakarta Sans 800   │
│               tamanho: 120px        │
│               cor: branco           │
│                                     │
│  [HEADLINE]                         │
│  "mais chance de aparecer no        │
│   Google com perfil completo"       │
│   Jakarta Sans 700, 26px, branco    │
│                                     │
│  [DIVISOR]   ─────────────          │
│                                     │
│  [SUBTEXTO]                         │
│  "Isso é o que um GMB otimizado     │
│   entrega. A Destaka faz isso       │
│   automaticamente."                 │
│   Inter 400, 14px, branco 80%       │
│                                     │
│  [FOOTER]                           │
│  Logo Destaka (branco) + @destaka   │
│  Inter 500 12px                     │
└─────────────────────────────────────┘

VARIAÇÃO de cor: fundo #1E1B4B (dark navy)
```

### Template 02 — DICA RÁPIDA ("Como fazer")

```
┌─────────────────────────────────────┐
│ ░░░░ FUNDO: Off-White #F8FAFC ░░░░░ │
│                                     │
│  [NÚMERO DA DICA]                   │
│  "Dica 03"   ← Jakarta Sans 700    │
│               20px, #7C3AED         │
│                                     │
│  [HEADLINE]                         │
│  "Como responder avaliações         │
│   negativas no Google"              │
│   Jakarta Sans 800, 30px, #1E1B4B  │
│                                     │
│  [LINHA COLORIDA]  ████  violet     │
│                                     │
│  [CORPO]                            │
│  "1. Responda sempre em 24h         │
│   2. Não seja defensivo             │
│   3. Convide para conversa          │
│      privada                        │
│   4. Assine com seu nome"           │
│   Inter 400, 15px, #475569          │
│                                     │
│  [CTA]                              │
│  ┌──────────────────────────────┐   │
│  │ A Destaka faz isso por você  │   │
│  │ destaka.com.br               │   │
│  └──────────────────────────────┘   │
│  Pill violet, Inter 600 13px        │
│                                     │
│  [LOGO] Destaka (violet) — rodapé  │
└─────────────────────────────────────┘
```

### Template 03 — PROVA SOCIAL / DEPOIMENTO

```
┌─────────────────────────────────────┐
│ ░░░░ FUNDO: #1E1B4B (dark) ░░░░░░░ │
│                                     │
│  [ASPAS GRANDES]                    │
│  "  ← Jakarta Sans 800, 80px       │
│       #7C3AED (violet médio)        │
│                                     │
│  [DEPOIMENTO]                       │
│  "Em 30 dias, saí de 4 para 47     │
│   avaliações e minha agenda         │
│   lotou."                           │
│   Plus Jakarta Sans 700, 22px      │
│   branco                            │
│                                     │
│  [IDENTIFICAÇÃO]                    │
│  Dr. Carlos Lima — Dentista        │
│  Inter 500, 14px, #10B981          │
│                                     │
│  [SCORE ANTES / DEPOIS]             │
│  ┌────────┐  →  ┌────────┐         │
│  │  32    │     │  87    │         │
│  │ antes  │     │ depois │         │
│  └────────┘     └────────┘         │
│  Números: Jakarta 800, 28px         │
│  Antes: #EF4444 / Depois: #10B981  │
│                                     │
│  [LOGO] Destaka branco — rodapé    │
└─────────────────────────────────────┘
```

### Template 04 — CARROSSEL (primeiro slide)

```
┌─────────────────────────────────────┐
│ ░░░░ FUNDO: Gradiente Hero ░░░░░░░░ │
│                                     │
│  [BADGE CARROSSEL]                  │
│  "Deslize para ver →"               │
│  Inter 500, 12px, branco 60%        │
│                                     │
│  [NÚMERO + HEADLINE]                │
│  "5 erros que fazem você            │
│   perder pacientes no Google"       │
│   Jakarta Sans 800, 32px, branco    │
│                                     │
│  [ÍCONE CENTRAL]                    │
│  Emoji ou ícone visual grande       │
│                                     │
│  [SUBTEXTO]                         │
│  "Você comete pelo menos 3 deles"   │
│  Inter 400, 16px, branco 80%        │
│                                     │
│  [LOGO] Destaka branco              │
│  [SETA DESLIZE] →                   │
└─────────────────────────────────────┘
```

---

## 7. Instagram Stories — Templates

### Dimensões
```
Formato:    1080 × 1920px
Zona segura: 250px top / 340px bottom (sem conteúdo importante)
```

### Story 01 — PERGUNTA / QUIZ

```
┌─────────────────┐
│ [LOGO] 60px top │
│                 │
│                 │
│  [PERGUNTA]     │
│  "Seu Google    │
│  Meu Negócio    │
│  tem nota 8     │
│  ou mais?"      │
│  Jakarta 800    │
│  40px, branco   │
│  fundo: violet  │
│  gradiente      │
│                 │
│  [BOTÕES]       │
│  ┌───┐  ┌───┐  │
│  │SIM│  │NÃO│  │
│  └───┘  └───┘  │
│  Pill: verde e  │
│  cinza          │
│                 │
│ [CTA swipe up]  │
│ "Descubra sua   │
│  nota agora"    │
└─────────────────┘
```

### Story 02 — DADO RÁPIDO

```
┌─────────────────┐
│ [LOGO]          │
│                 │
│  FUNDO: #1E1B4B │
│                 │
│  [NÚMERO]       │
│  "51%"          │
│  Jakarta 800    │
│  96px, violet   │
│                 │
│  [TEXTO]        │
│  "dos negócios  │
│  têm perfil     │
│  não            │
│  reivindicado   │
│  no Google"     │
│  Inter 500      │
│  22px, branco   │
│                 │
│  [FONTE]        │
│  Google, 2024   │
│  Inter 400 12px │
│  branco 50%     │
│                 │
│  [SWIPE CTA]    │
│  "O seu está    │
│  ativado?"      │
│  + pill verde   │
└─────────────────┘
```

---

## 8. LinkedIn — Templates

### Dimensões
```
Post imagem única: 1200 × 628px (landscape)
Carrossel:         1080 × 1080px (quadrado)
```

### LinkedIn Template 01 — THOUGHT LEADERSHIP

```
┌────────────────────────────────────────────┐
│ FUNDO: Off-white. Linha violet esquerda.   │
│                                            │
│ [CATEGORIA]                                │
│ GOOGLE MEU NEGÓCIO ← Inter 600, 12px      │
│ tracking: 0.1em, #7C3AED                   │
│                                            │
│ [HEADLINE]                                 │
│ "Por que 9 em 10 dentistas                 │
│  brasileiros estão deixando dinheiro       │
│  na mesa no Google"                        │
│  Jakarta Sans 700, 32px, #1E1B4B           │
│                                            │
│ [LINHA DIVIDER] violet 3px                 │
│                                            │
│ [DADOS] (3 bullets)                        │
│ • 7× mais cliques com perfil completo      │
│ • 51% dos perfis não reivindicados         │
│ • R$0 de custo adicional para mudar isso   │
│ Inter 400, 16px, #475569                   │
│                                            │
│ [LOGO + URL]                               │
│ Destaka | destaka.com.br                   │
└────────────────────────────────────────────┘
```

### LinkedIn Template 02 — ANTES / DEPOIS

```
┌────────────────────────────────────────────┐
│ FUNDO: Gradiente Hero                      │
│                                            │
│ [TÍTULO]                                   │
│ "Perfil GMB: Antes × Depois Destaka"       │
│ Jakarta 800, 28px, branco                  │
│                                            │
│ ┌──────────────┐    ┌──────────────┐       │
│ │   ANTES      │    │   DEPOIS     │       │
│ │              │    │              │       │
│ │   Score: 31  │ →  │   Score: 89  │       │
│ │   2 fotos    │    │   18 fotos   │       │
│ │   0 posts    │    │   4 posts/mês│       │
│ │   3 aval.    │    │   41 aval.   │       │
│ └──────────────┘    └──────────────┘       │
│ Antes: fundo cinza / Depois: fundo verde   │
│                                            │
│ [TEMPO]                                    │
│ "Resultado em 30 dias"                     │
│ Inter 600, 16px, esmeralda                 │
│                                            │
│ [LOGO] Destaka branco                      │
└────────────────────────────────────────────┘
```

---

## PARTE 3 — TOM DE VOZ

*(Produzido em parceria com Copy Squad — Cyrus × David Ogilvy × Donald Miller)*

---

## 9. Princípios de Tom de Voz

### A Destaka fala como um colega que entende do assunto

Não como uma empresa de software. Não como um consultor caro. Como alguém que já trabalhou com dentistas, sabe a dor, e tem a solução na ponta da língua.

**5 princípios:**

1. **Claro antes de inteligente** — Se você precisou de duas leituras para entender, reescreva.
2. **Específico antes de vago** — "3 pacientes a mais por mês" bate "mais resultados".
3. **Ativo antes de passivo** — "A Destaka otimiza" > "A otimização é feita pela Destaka".
4. **Humano antes de técnico** — "aparecer no Google" > "indexação no SERP local".
5. **Confiante sem ser arrogante** — Afirmações com evidência. Nunca hipérbole vazia.

---

## 10. Do's & Don'ts — Tom de Voz

### LINGUAGEM

| ✅ USE | ❌ EVITE |
|--------|---------|
| "aparecer no Google" | "ranquear no SERP" |
| "pacientes novos" | "leads qualificados" |
| "seu perfil no Google" | "seu Google Business Profile" |
| "a gente faz isso por você" | "nossa solução automatiza o processo" |
| "em 5 minutos" | "em poucos instantes" |
| "isso custa 1 consulta por mês" | "ROI comprovado" |
| "veja o que mudou" | "acompanhe as métricas" |
| "ligações, rotas, cliques" | "conversões" |

### SOBRE O PRODUTO

| ✅ USE | ❌ EVITE |
|--------|---------|
| "a Destaka lê seu perfil e já começa a corrigir" | "nossa IA avançada analisa seus dados" |
| "você cuida dos pacientes, a Destaka cuida do Google" | "automatizamos o gerenciamento do GMB" |
| "score de 0 a 100" | "KPI de maturidade digital" |
| "checklist do que você precisa fazer" | "guia de implementação" |
| "aviso quando sair uma avaliação nova" | "notificações em tempo real" |

### SOBRE RESULTADOS

| ✅ USE | ❌ EVITE |
|--------|---------|
| "3 pacientes novos por mês só do Google" | "aumento significativo na conversão" |
| "agenda que encheu em 30 dias" | "melhoria mensurável nos resultados" |
| "saiu de nota 32 para 87" | "melhora expressiva no score" |
| "R$197 que se paga com um paciente" | "solução custo-benefício" |

### TOM EMOCIONAL

| ✅ USE | ❌ EVITE |
|--------|---------|
| "você merece aparecer para quem procura" | "maximize sua presença digital" |
| "não perca mais paciente por causa disso" | "otimize sua estratégia de aquisição" |
| "enquanto você atende, a Destaka trabalha" | "operamos de forma assíncrona" |
| "simples assim" | "intuitivo e fácil de usar" |

---

## 11. Voz por Canal

### Site (Landing Page)
- Tom: Direto, confiante, focado em dor e solução
- Sentenças curtas no hero. Evidência nos depoimentos. Urgência no CTA.
- Headline padrão: problema + número + solução em 2 linhas

### Instagram Feed
- Tom: Educativo, acessível, sem jargão
- Dados que surpreendem. Dicas que funcionam mesmo sem a Destaka.
- Gera confiança antes de vender.

### Instagram Stories
- Tom: Conversacional, rápido, interativo
- Perguntas, quizzes, bastidores, dados rápidos
- CTA claro em todo story

### LinkedIn
- Tom: Profissional, dados-driven, thought leadership
- Fala com dentistas e médicos que usam LinkedIn para networking
- Posts mais longos, insights mais profundos

### E-mail
- Tom: Colega que manda uma mensagem, não empresa disparando campanha
- Remetente: "David da Destaka" (não "Equipe Destaka")
- Assunto: pergunta ou dado, nunca anúncio
- Exemplo: "Seu perfil recebeu 3 avaliações essa semana (e 2 sem resposta)"

### WhatsApp / Suporte
- Tom: Caloroso, rápido, resolutivo
- Primeira resposta em até 2 horas
- Nunca resposta de bot sem identificação
- Termina com próximo passo claro

---

## 12. Frases de Marca

### Assinaturas para fechar conteúdo
- "Apareça para quem precisa de você."
- "Você cuida dos pacientes. A Destaka cuida do resto."
- "Seu Google Meu Negócio no piloto automático."
- "Cada horário vago é um paciente que não te encontrou."

### Frases proibidas (banidas da comunicação)
- ❌ "Revolucionário"
- ❌ "Disruptivo"
- ❌ "Solução inovadora"
- ❌ "De forma simples e eficaz"
- ❌ "Plataforma robusta"
- ❌ "Ecossistema digital"
- ❌ "Potencialize sua presença"
- ❌ "Alavancar resultados"
- ❌ Qualquer coisa que um banco ou seguradora também diria

---

## 13. Prompts de IA para Geração de Conteúdo

### Prompt base para posts educativos (Instagram)
```
Você escreve para a Destaka, SaaS brasileiro de otimização de Google Meu Negócio
para dentistas e médicos. Tom: colega que entende do assunto, direto, sem jargão,
nunca corporativo. Dados concretos quando possível.

Gere um post educativo de Instagram sobre [TEMA] com:
- Badge de abertura (máx 3 palavras)
- Número ou dado de destaque
- Headline impactante (máx 12 palavras)
- Corpo explicativo (máx 60 palavras)
- CTA natural (não "siga para mais dicas")
- Tom: falando com um dentista de 40 anos que não tem tempo
```

### Prompt base para LinkedIn
```
Você escreve para a Destaka. Formato: LinkedIn thought leadership para
profissionais de saúde brasileiros (dentistas, médicos, psicólogos).

Escreva um post sobre [TEMA] com:
- Hook (primeira linha que para o scroll)
- Contexto/dado (2-3 linhas)
- Insight principal (3-5 bullets)
- Conclusão com CTA suave
- Máximo 1.200 caracteres
- Nenhum emoji excessivo (máx 3)
```

---

## Referências e Próximos Passos

**Implementação do design system:**
1. Criar projeto no Figma com os tokens documentados aqui
2. Exportar arquivo de variáveis CSS/Tailwind do token system
3. Construir logo no Figma/Illustrator seguindo o concept do K com pin
4. Montar templates de post em Canva Pro (com as cores e fontes exatas)
5. Criar pasta de assets no Google Drive / Notion da marca

**Arquivos a criar:**
- `destaka-logo.svg` (todas as variações)
- `destaka-colors.json` (tokens exportados)
- `destaka-templates.fig` (Figma com todos os templates)
- `destaka-canva-templates` (links dos templates no Canva)
