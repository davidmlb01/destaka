# Brand Alignment: Pagina de Diagnostico Destaka

**Story:** DESTAKA-004-D2
**Owner:** @brand-expert
**Status:** Draft
**Versao:** 1.0
**Data:** 2026-10-04

---

## 1. Identidade Destaka: Resumo Executivo

**Tagline:** Quem te procura, te encontra.
**Vertical atual:** Saude (dentistas, fisioterapeutas, medicos, psicologos)
**Posicionamento:** SaaS de presenca digital no Google para profissionais locais que nao entendem de marketing digital.
**Tom de marca:** Profissional-acessivel. Confiante sem ser arrogante. Direto sem ser agressivo.

---

## 2. Principios Visuais para a Pagina de Diagnostico

### 2.1 Tom Visual: Confianca e Clareza

O profissional de saude precisa sentir **seguranca**, nao pressao. A pagina mostra dados reais com autoridade, sem truques visuais ou urgencia artificial. A urgencia vem dos proprios dados do usuario, nao do design.

**Fazer:**
- Usar espacamento generoso (o branco e sinal de organizacao, nao de vazio)
- Metricas grandes e claras (o numero fala por si)
- Hierarquia visual obvia (o olho sabe exatamente para onde ir)
- Transicoes suaves que respeitam o ritmo de leitura

**Nao fazer:**
- Badges piscando, contadores regressivos, "OFERTA POR TEMPO LIMITADO"
- Exclamacoes excessivas na copy ou no visual
- Cores de alerta em excesso (vermelho so quando o dado justifica)
- Sombras pesadas ou gradientes chamativos

### 2.2 Equilibrio: Dados vs. Proposta

A pagina tem dois momentos distintos que precisam de tratamento visual diferente:

| Momento | Proposito | Tratamento Visual |
|---------|----------|------------------|
| **Dados do usuario** (blocos 2-5: score, mapa, concorrentes, avaliacoes) | Mostrar a realidade com neutralidade | Tons neutros, --card-subtle, --text-secondary. Os dados falam. O design nao opina. |
| **Proposta Destaka** (bloco 6: oferta + CTA) | Converter com confianca | Accent sutil no background, --accent-bright nos destaques, CTA com --accent solido. Energia controlada. |

**A transicao entre dados e proposta deve ser gradual.** Os blocos de dados preparam emocionalmente. O bloco de oferta capitaliza. Nao ha ruptura visual, ha crescendo.

---

## 3. Paleta de Cores: Uso Correto

### 3.1 Cores Primarias

| Token | Hex | Uso na pagina de diagnostico |
|-------|-----|------------------------------|
| --bg-base | #071a19 | Background da pagina inteira |
| --accent | #14B8A6 | Botoes CTA, bordas de destaque, icones de check |
| --accent-bright | #5EEAD4 | Score projetado, labels "COM DESTAKA", valores de beneficio |
| --text-primary | #ffffff | Titulos, metricas, texto principal |
| --text-secondary | rgba(255,255,255,0.7) | Body copy, descricoes |

### 3.2 Cores de Status (usar com criterio)

| Token | Hex | Uso permitido |
|-------|-----|---------------|
| --success | #4ADE80 | Score projetado, posicao melhor que concorrente, checks na oferta |
| --warning | #FBBF24 | Avaliacoes pendentes, metricas que precisam atencao |
| --error | #EF4444 | Posicao atras dos concorrentes, score muito baixo (< 30) |

**Regra:** nenhuma cor de status aparece sem contexto. Vermelho so com dado que justifique. Verde so com melhoria real. Amarelo so com pendencia concreta.

### 3.3 Cores Proibidas na Pagina

- Azul puro (#0EA5E9): usado em emails e verificacao, nao na pagina de diagnostico
- Cores fora da paleta: nenhuma cor ad-hoc. Tudo vem dos tokens.
- Preto puro (#000000): usar --bg-base (#071a19) que e o dark teal da marca

---

## 4. Tipografia

### 4.1 Familias

| Familia | Variavel CSS | Papel |
|---------|-------------|-------|
| **Outfit** | --font-display | Headings (H1, H2, H3), wordmark "Destaka" |
| **Geist Sans** | --font-geist-sans | Body text, labels, buttons, micro-copy |
| **Geist Mono** | --font-geist-mono | Metricas numericas (scores, percentuais, valores em reais) |

### 4.2 Regras de Uso

- **Nunca** usar mais de 2 familias no mesmo bloco visual
- Outfit e exclusivo para headings e branding. Nunca em body text.
- Geist Mono e exclusivo para numeros e metricas. Nunca em copy.
- Pesos permitidos: 400 (regular), 500 (medium), 600 (semibold em botoes), 700 (bold em headings e metricas)
- Letter-spacing negativo (-0.3px a -1px) apenas em headings e metricas grandes

---

## 5. Iconografia

### 5.1 Estilo: Outline Consistente

- **Estilo:** outline (stroke), nunca filled
- **Stroke width:** 1.5px para icones 16px, 2px para icones 20px+
- **Cor padrao:** --text-secondary (rgba(255,255,255,0.7))
- **Cor accent:** --accent (#14B8A6) para icones de acao ou destaque
- **Cor success:** --success (#4ADE80) para checks na lista de beneficios
- **Border-radius nos icones:** 0 (linhas retas, sem arredondamento excessivo)

### 5.2 Icones por Bloco

| Bloco | Icone | Tamanho | Cor |
|-------|-------|---------|-----|
| Header | Logo Destaka (sparkle + wordmark) | 24px mobile, 28px desktop | --accent + --text-primary |
| Score | Gauge/velocimetro | 20px | --accent |
| Mapa | Map pin | 20px | --text-secondary |
| Concorrentes | Users/trophy | 20px | --text-secondary |
| Avaliacoes | Star + message | 20px | --warning |
| Oferta (checks) | Check circle | 20px | --success |
| Oferta (garantia) | Shield | 16px | --text-tertiary |
| Compartilhar | Share/link | 16px | --text-secondary |

### 5.3 Fonte de Icones

Usar icones SVG inline (nao icon font). Permite controle de cor via currentColor e stroke via CSS. Compativel com o padrao existente no codebase (FreeDashboard.tsx ja usa SVG inline).

---

## 6. Logo na Pagina de Diagnostico

### 6.1 Versao e Posicao

- **Versao:** Icone (sparkle) + wordmark "Destaka" (sem "Saude")
- **Posicao:** top-left no header
- **Tamanho do icone:** 24px mobile, 28px desktop
- **Wordmark:** Outfit 700, 18px, --text-primary, letter-spacing 0.5px
- **Sem tagline** no header (espaco limitado, tagline aparece no bloco de oferta se necessario)

### 6.2 Regras de Logo

- Logo e um link para destaka.com.br (pagina inicial)
- Nao adicionar badge, selo ou decoracao ao redor do logo
- Espaco minimo ao redor: 16px em todas as direcoes
- Em estado "analisando", logo fica centralizado no header

---

## 7. Tom de Voz Visual

### 7.1 Principios

| Principio | Significado | Exemplo na pagina |
|-----------|-----------|-------------------|
| **Confiante** | Afirmacoes diretas, sem hedging | "Seu score e 43/100" (nao "Seu score pode estar em torno de 43") |
| **Acessivel** | Linguagem que um dentista entende | "Alcance de 2km" (nao "Radius de geo-positioning 2km") |
| **Direto** | Sem rodeios, cada frase tem proposito | Uma frase por ponto. Sem paragrafos longos nos blocos de dados. |
| **Respeitoso** | Nunca diminuir o profissional | "Seus concorrentes estao mais visiveis" (nao "Voce esta perdendo para concorrentes melhores") |

### 7.2 Anti-patterns de Comunicacao

| Nao fazer | Por que | Alternativa |
|-----------|---------|-------------|
| "URGENTE: seu perfil esta em risco!" | Parece spam | "Seu perfil tem 5 oportunidades de melhoria" |
| "Outros profissionais ja estao usando" | FOMO generico sem prova | "Seus 3 concorrentes mais proximos tem score acima de 70" |
| "Oferta por tempo limitado" | Falsa urgencia, corroi confianca | Nao usar urgencia temporal. Os dados do perfil ja criam urgencia real. |
| "Voce esta perdendo dinheiro" | Agressivo demais | "Clientes que te procuram no Google nao te encontram" |

---

## 8. Diferenciacao Visual: Dados vs. Proposta

### 8.1 Zona de Dados (blocos 2-5)

```
Visual: neutro, factual, respeitoso
Background: --card-subtle (transparente com 4% branco)
Bordas: --border-card (8% branco)
Texto: --text-primary para dados, --text-secondary para contexto
Accent: usado com moderacao (apenas em metricas de destaque)
Tom: "Aqui estao os fatos sobre seu perfil"
```

### 8.2 Zona de Proposta (bloco 6)

```
Visual: confiante, energizado, mas nao gritante
Background: gradiente sutil de accent (6% > 2%)
Bordas: --border-accent (25% teal)
Texto: --text-primary para beneficios, --accent-bright para valores
Accent: uso mais liberal (checks, valores, CTA)
Tom: "Aqui esta o que podemos fazer por voce"
```

### 8.3 Transicao

Entre o ultimo bloco de dados (Avaliacoes) e o bloco de Oferta, inserir um separador visual sutil:

- Linha horizontal: 1px, gradiente de transparente > --border-accent > transparente
- Ou espaco maior (80px em vez de 48px)
- Nenhum elemento de "virada" (sem "Mas agora...", sem banner)

---

## 9. Consistencia com o Dashboard Pago

A pagina de diagnostico e a porta de entrada. O dashboard pago e o destino. Eles precisam compartilhar DNA visual para que a transicao nao cause estranheza.

| Elemento | Diagnostico | Dashboard | Consistente? |
|----------|------------|-----------|-------------|
| Background | --bg-base (#071a19) | --bg-base (#071a19) | SIM |
| Cards | --card-subtle + --border-card | --card-subtle + --border-card | SIM |
| Accent | --accent (#14B8A6) | --accent (#14B8A6) | SIM |
| Tipografia | Outfit + Geist Sans | Outfit + Geist Sans | SIM |
| Metricas | Geist Mono | Geist Mono | SIM |
| Layout | Single page, sem sidebar | Dashboard com sidebar | DIFERENTE (proposital) |
| CTA | Accent solido com sombra | Accent solido com sombra | SIM |

A unica diferenca proposital e o layout: diagnostico e single page, dashboard tem sidebar. Tudo mais e identico para que o usuario sinta que "esta no mesmo lugar" quando converter.

---

## 10. Checklist de Brand Review

Antes de aprovar o design para desenvolvimento:

```
- [ ] Todas as cores usadas existem nos tokens do design system
- [ ] Nenhuma cor ad-hoc ou fora da paleta
- [ ] Outfit usado apenas em headings e wordmark
- [ ] Geist Mono usado apenas em metricas numericas
- [ ] Icones sao outline, stroke 1.5-2px, cores dos tokens
- [ ] Logo na versao correta (icone + wordmark, sem "Saude")
- [ ] Tom visual confiante-acessivel (nao agressivo, nao corporativo)
- [ ] Zona de dados (blocos 2-5) visualmente neutra
- [ ] Zona de proposta (bloco 6) com accent sutil, nao gritante
- [ ] Transicao dados > proposta gradual, sem ruptura
- [ ] Nenhum travessao (—) em nenhum texto visual
- [ ] PT-BR correto com acentos e cedilhas
- [ ] Nenhuma urgencia artificial (sem countdown, sem "limitado")
- [ ] Consistencia visual com o dashboard pago existente
```

---

**Proximo passo:** Este documento alimenta a copy final (DESTAKA-004-D3) e valida o design brief (DESTAKA-004-D1) antes de ir para desenvolvimento.
