# EPIC-004: Pagina de Diagnostico como Vendas

**Status:** Aprovado pelo Board
**Priority:** P0
**Owner:** @pm (Morgan)
**Produto:** Destaka
**Board Approval:** 2026-10-04 (CMO + Hormozi Squad + Architect, unanime)
**Origem:** Ideia David (docs/destaka/ideia-pagina-diagnostico-vendas.md)

---

## Visao do Epic

Substituir o free tier dashboard (cards com blur) por uma **pagina de diagnostico personalizada** que funciona como pagina de vendas. O usuario se conecta, ve o resultado completo do seu diagnostico com dados reais, e recebe uma proposta de valor irrecusavel baseada nos gaps identificados no perfil dele.

Uma pagina. Sem menu. Sem distracao. Foco total em conversao.

### Por que mudar

O dashboard com blur comunica "voce nao tem acesso". A pagina de diagnostico comunica "olha o que descobrimos sobre voce". Dashboard mostra features trancadas. Diagnostico mostra resultados personalizados. A diferenca e conversao.

### Meta de Negocio

| Metrica | Meta |
|---------|------|
| Taxa de conversao free > paid | 3x vs atual |
| Tempo na pagina de diagnostico | > 2 minutos |
| Taxa de compartilhamento | > 10% |
| CTA click rate | > 15% |

---

## Decisoes do Board (2026-10-04)

| Decisao | Resolucao |
|---------|-----------|
| Substitui o dashboard free tier? | SIM. Free tier redireciona para /diagnostico |
| Menu lateral? | NAO. Pagina standalone |
| Compartilhavel sem login? | SIM. URL curta destaka.com.br/d/{hash} |
| Dados vazios? | Estado "analisando" + notificacao por email |
| Score projetado calculavel? | SIM. score_atual + soma(impact_gaps) |
| Mapa e keywords no score? | SIM. Rebalancear pesos |
| Nova pagina ou reusar dashboard? | NOVA PAGINA |

---

## Arquitetura de Dados

Todos os dados necessarios ja existem no banco:

| Dado | Fonte | Status |
|------|-------|--------|
| Score total + categorias | tabela scores | Disponivel |
| Nome, endereco, categoria | organizations + gmb_profiles | Disponivel |
| Concorrentes + ratings | competitors | Disponivel |
| Audit (gaps identificados) | gbp_profiles.audit_report | Disponivel |
| Metricas (views, cliques, ligacoes) | GBP Performance API | Disponivel |
| Mapa de posicionamento | geo_snapshots | Disponivel |
| Keywords de busca | keyword_snapshots | Parcial (depende volume) |
| Avaliacoes sem resposta | GBP Reviews API | Disponivel |

---

## Waves e Stories

### Wave 1: Score Rebalanceado + API de Diagnostico (P0, infraestrutura)

---

#### DESTAKA-004-01: Rebalancear Score com Mapa e Keywords

**Como** sistema,
**quero** que o score inclua alcance geografico e visibilidade de busca,
**para que** o diagnostico reflita a realidade completa do perfil.

**Acceptance Criteria:**
- [ ] Score rebalanceado: completude GMB 40%, reputacao 20%, alcance geografico 15%, keywords/visibilidade 15%, conteudo 10%
- [ ] Alcance geografico calculado como ratio de zonas strong vs total
- [ ] Keywords calculado como volume de impressoes vs media estimada do segmento
- [ ] Score projetado calculavel: score_atual + soma(impact dos gaps que Destaka resolve)
- [ ] Retrocompatibilidade: scores historicos nao quebram
- [ ] Migration para adicionar campo `projected_score` na tabela scores

**Arquivos:** `src/lib/gmb/scorer.ts`, migration nova

---

#### DESTAKA-004-02: API Consolidada de Diagnostico

**Como** pagina de diagnostico,
**quero** um unico endpoint que retorne todos os dados necessarios,
**para que** a pagina carregue rapido e sem multiplas chamadas.

**Acceptance Criteria:**
- [ ] GET /api/diagnostico retorna: score atual, score projetado, categorias, gaps com impact, concorrentes (top 3), mapa (zonas, raio), keywords (top 10), metricas de performance, ultima avaliacao, avaliacoes sem resposta, dados do perfil (nome, endereco, categoria)
- [ ] Paywall: retorna dados completos para qualquer usuario autenticado (e a pagina de vendas)
- [ ] Performance: resposta em < 2s
- [ ] Cache: 1 hora (dados nao mudam em tempo real)
- [ ] Endpoint publico para URL compartilhavel: GET /api/diagnostico/{hash}

**Arquivos:** `src/app/api/diagnostico/route.ts`, `src/app/api/diagnostico/[hash]/route.ts`

---

### Wave 1.5: Design, Brand e Copy (P0, pre-requisito da Wave 2)

**Protocolo:** Nenhum codigo de frontend comeca sem design brief aprovado, brand alignment e copy final.

---

#### DESTAKA-004-D1: Design Brief da Pagina de Diagnostico

**Owner:** @ux-design-expert (UMA)

**Como** equipe de produto,
**quero** um design brief completo da pagina de diagnostico,
**para que** o frontend seja implementado com direcao visual clara.

**Entregavel:** `docs/destaka/design-brief-diagnostico.md`

**Escopo do brief:**
- [ ] Wireframe mobile-first (320px) com hierarquia de blocos
- [ ] Wireframe desktop (1280px) com layout de 2 colunas onde aplicavel
- [ ] Hierarquia tipografica: heading, subheading, body, caption, metric (tamanhos, pesos)
- [ ] Paleta de cores para cada tipo de bloco (score, mapa, concorrentes, oferta, CTA)
- [ ] Espacamento entre blocos (grid 8px)
- [ ] Componentes interativos: barra de progresso score, mapa, cards de concorrentes
- [ ] Estados: loading/analisando, dados vazios, dados parciais, dados completos
- [ ] CTA fixo mobile: posicao, altura, sombra, comportamento no scroll
- [ ] Animacoes: entrada dos blocos no scroll (subtle, 200-300ms)
- [ ] Contraste validado (WCAG AA em todos os textos)

**Quality Gate:** @qa roda Design Quality Gate antes de aprovar.

---

#### DESTAKA-004-D2: Brand Alignment

**Owner:** @brand-expert

**Como** marca Destaka,
**quero** que a pagina de diagnostico esteja alinhada com a identidade visual,
**para que** o usuario sinta confianca e profissionalismo.

**Entregavel:** `docs/destaka/brand-alignment-diagnostico.md`

**Escopo:**
- [ ] Tom visual: profissional-acessivel (nao corporativo frio, nao startup barulhenta)
- [ ] Uso correto das cores primarias Destaka na pagina
- [ ] Tipografia alinhada com o brandbook existente
- [ ] Icones e ilustracoes: estilo definido (outline, filled, ilustrativo?)
- [ ] Logo usage: tamanho, posicao, versao (full vs icon-only)
- [ ] Diferenciacao visual entre "dados do usuario" (neutro) e "proposta Destaka" (accent/destaque)
- [ ] Tom de voz visual: confiante, direto, sem ser agressivo

---

#### DESTAKA-004-D3: Copy Final por Bloco

**Owner:** Hormozi Squad + @brand-expert (review)

**Como** pagina de vendas,
**quero** copy final revisada e aprovada para cada bloco,
**para que** o dev implemente o texto definitivo.

**Entregavel:** `docs/destaka/copy-diagnostico-final.md`

**Escopo:**
- [ ] Bloco Header: titulo, subtitulo
- [ ] Bloco Score: headline, body copy, de-para, ajustes rapidos
- [ ] Bloco Mapa: headline, body copy, comparativo
- [ ] Bloco Concorrentes: headline, body copy, provocacao
- [ ] Bloco Avaliacoes: headline, body copy, urgencia
- [ ] Bloco Oferta: stack de beneficios, ancoragem, preco, garantia
- [ ] CTA principal: texto do botao, micro-copy abaixo
- [ ] CTA secundario (compartilhar): texto
- [ ] Estado "analisando": mensagem de espera
- [ ] Email "diagnostico pronto": subject + body
- [ ] Revisao @brand-expert: tom de voz alinhado, sem travessao, PT-BR correto
- [ ] Copy templates com placeholders claros para dados dinamicos: {nome}, {score}, {radius_km}, etc.

---

### Wave 2: Pagina de Diagnostico (P0, frontend)

**Pre-requisito:** Wave 1.5 completa (design brief aprovado + brand alignment + copy final)

---

#### DESTAKA-004-03: Layout Base da Pagina de Diagnostico

**Como** usuario free tier,
**quero** ver uma pagina limpa sem menu lateral ao fazer login,
**para que** eu foque 100% no resultado do meu diagnostico.

**Acceptance Criteria:**
- [ ] Nova rota /diagnostico (fora do layout de dashboard)
- [ ] Header minimo: logo Destaka + "Diagnostico do seu Perfil no Google"
- [ ] Sem menu lateral, sem sidebar, sem navegacao de dashboard
- [ ] Single page scroll (mobile-first)
- [ ] Redirect: usuario free tier ao fazer login vai para /diagnostico em vez de /dashboard
- [ ] Estado "analisando" com barra de progresso quando dados ainda nao estao prontos
- [ ] Footer com CTA fixo em mobile

**Arquivos:** `src/app/(diagnostico)/diagnostico/page.tsx`, `src/app/(diagnostico)/layout.tsx`

---

#### DESTAKA-004-04: Bloco Score com De-Para

**Como** usuario,
**quero** ver meu score atual e o score projetado lado a lado,
**para que** eu entenda exatamente quanto posso melhorar.

**Acceptance Criteria:**
- [ ] Score atual grande e visivel (ex: 43/100)
- [ ] Score projetado com destaque (ex: "Com Destaka: 78/100")
- [ ] Barra de progresso visual mostrando o gap
- [ ] Copy persuasiva: "Hoje apenas {score}% dos clientes em potencial enxergam voce"
- [ ] Secao "5 ajustes rapidos": lista os 5 gaps de maior impact DAQUELE perfil
- [ ] Copy: "5 ajustes que o Destaka faz em 24h podem aumentar seu score em ate {soma_impact} pontos"

**Arquivos:** `src/components/diagnostico/ScoreBlock.tsx`

---

#### DESTAKA-004-05: Bloco Mapa de Alcance

**Como** usuario,
**quero** ver no mapa de onde vem meus clientes hoje,
**para que** eu entenda visualmente meu alcance limitado.

**Acceptance Criteria:**
- [ ] Mapa Leaflet com zonas do geo_snapshot
- [ ] Bolha visual mostrando raio de alcance atual
- [ ] Copy: "Hoje seus clientes vem de um raio de {radius_km} km"
- [ ] Copy: "Com Destaka, profissionais similares alcancam ate 3x mais bairros"
- [ ] Concorrentes plotados no mapa (se disponivel)

**Arquivos:** `src/components/diagnostico/MapBlock.tsx`

---

#### DESTAKA-004-06: Bloco Concorrentes

**Como** usuario,
**quero** ver como estou comparado aos meus concorrentes diretos,
**para que** eu sinta urgencia de melhorar.

**Acceptance Criteria:**
- [ ] Top 3 concorrentes com nome, rating, numero de avaliacoes
- [ ] Comparacao lado a lado: "Voce vs Concorrentes"
- [ ] Visual de ranking (usuario em vermelho se atras, verde se na frente)
- [ ] Copy: "Seus concorrentes que aparecem primeiro nao sao melhores que voce. Eles so estao mais visiveis."

**Arquivos:** `src/components/diagnostico/CompetitorsBlock.tsx`

---

#### DESTAKA-004-07: Bloco Avaliacoes

**Como** usuario,
**quero** ver o status das minhas avaliacoes,
**para que** eu perceba que estou perdendo oportunidades.

**Acceptance Criteria:**
- [ ] "Voce nao recebeu nenhuma avaliacao desde {data}"
- [ ] "{X} avaliacoes sem resposta"
- [ ] Copy: "Cada avaliacao ignorada e um cliente que se sentiu ignorado"
- [ ] Copy: "Destaka responde avaliacoes com IA em menos de 1 hora"
- [ ] Comparacao com media de avaliacoes dos concorrentes

**Arquivos:** `src/components/diagnostico/ReviewsBlock.tsx`

---

#### DESTAKA-004-08: Bloco Oferta + CTA

**Como** usuario convencido pelo diagnostico,
**quero** ver a oferta completa do Destaka com preco ancorado,
**para que** eu converta imediatamente.

**Acceptance Criteria:**
- [ ] Stack de beneficios com valor percebido:
  - Otimizacao completa do perfil (valor: R$800)
  - Posts semanais automaticos (valor: R$400/mes)
  - Resposta de avaliacoes com IA (valor: R$300/mes)
  - Monitoramento de concorrentes (valor: R$200/mes)
  - Relatorio mensal de performance (valor: R$150/mes)
- [ ] Ancoragem: "Uma agencia cobra R$2.000/mes para fazer metade disso"
- [ ] Preco: "Tudo isso por menos de R$7/dia"
- [ ] CTA principal: botao grande que leva ao checkout Stripe
- [ ] Copy emocional: "Voce investiu anos estudando. Nao deixe seu Google te fazer parecer amador."
- [ ] Copy resultado: "Deixe seu Google Meu Negocio com o Destaka enquanto voce cuida dos seus pacientes"
- [ ] Garantia: "Melhore seu score em 30 dias ou devolvemos seu dinheiro"

**Arquivos:** `src/components/diagnostico/OfferBlock.tsx`

---

### Wave 3: Compartilhamento + Redirect (P1)

---

#### DESTAKA-004-09: URL Compartilhavel

**Como** usuario,
**quero** compartilhar meu diagnostico com meu socio ou recepcionista,
**para que** eles vejam os resultados sem precisar fazer login.

**Acceptance Criteria:**
- [ ] Gerar hash curto unico por org (base62, 8 chars)
- [ ] Rota publica: destaka.com.br/d/{hash}
- [ ] Pagina identica ao diagnostico, mas read-only (sem CTA de checkout, com CTA de "Criar sua conta")
- [ ] Hash armazenado em organizations (coluna `diag_share_hash`)
- [ ] Migration para adicionar coluna
- [ ] Botao "Compartilhar" na pagina de diagnostico (copia link)
- [ ] og:image e og:title personalizados para preview no WhatsApp

**Arquivos:** `src/app/(diagnostico)/d/[hash]/page.tsx`, migration nova

---

#### DESTAKA-004-10: Redirect Free Tier + Email de Diagnostico Pronto

**Como** sistema,
**quero** redirecionar usuarios free tier para /diagnostico e notificar quando dados estiverem prontos,
**para que** o fluxo de conversao seja automatico.

**Acceptance Criteria:**
- [ ] Middleware: usuario autenticado sem subscription ativa vai para /diagnostico
- [ ] Usuario com subscription ativa vai para /dashboard normalmente
- [ ] Quando audit completa (Inngest gbp-audit), disparar email "Seu diagnostico esta pronto"
- [ ] Email com link direto para /diagnostico
- [ ] Template de email alinhado com brand Destaka

**Arquivos:** `src/middleware.ts`, Inngest function nova ou hook no gbp-audit

---

## Dependencias

| Story | Depende de |
|-------|-----------|
| 004-02 (API) | 004-01 (Score rebalanceado) |
| 004-D1 (Design) | 004-02 (API pronta, para saber quais dados existem) |
| 004-D2 (Brand) | Nenhuma (pode comecar em paralelo com Wave 1) |
| 004-D3 (Copy) | 004-D2 (Brand alignment define tom de voz) |
| 004-03 a 004-08 (Frontend) | 004-D1 (Design aprovado) + 004-D3 (Copy final) + 004-02 (API) |
| 004-09 (Compartilhamento) | 004-03 (Pagina existe) |
| 004-10 (Redirect) | 004-03 (Pagina existe) + 004-D3 (Copy do email) |

## Ordem de Execucao

```
Wave 1:   004-01 > 004-02 (sequencial, infraestrutura)
Wave 1.5: 004-D2 (paralelo com Wave 1) > 004-D1 + 004-D3 (apos API + Brand)
          004-D1 passa pelo Design Quality Gate (@qa)
Wave 2:   004-03 > 004-04, 004-05, 004-06, 004-07 (paralelo) > 004-08
Wave 3:   004-09, 004-10 (paralelo)
```

## Protocolo de Qualidade

| Gate | Responsavel | Quando |
|------|------------|--------|
| Design Quality Gate | @qa (Quinn) | Apos 004-D1, antes de qualquer frontend |
| Brand Review | @brand-expert | Apos 004-D3, valida tom de voz e visual |
| Copy Review | @brand-expert | Apos 004-D3, valida PT-BR, sem travessao, acentos |
| QA Gate Final | @qa (Quinn) | Apos Wave 2 completa, antes de deploy |

---

**Criado:** 2026-10-04 por Orion (AIOX Master)
**Board:** CMO + Hormozi Squad + Architect (aprovacao unanime)
**Squads envolvidos:** Design (@ux-design-expert), Brand (@brand-expert), Copy (Hormozi), Dev (@dev), QA (@qa)
