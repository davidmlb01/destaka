# EPIC-005: Destaka Core Delivery

**Status:** 10/11 Stories Done (Story 5.1 blocked by Meta API approval)
**Owner:** Morgan (PM)
**Sprint:** 6 semanas (3 waves de 2 semanas)
**Objetivo:** Implementar tudo que e fundamental para entregar a promessa do produto: colocar o usuario em primeiro lugar nas buscas do Google.
**Referencia:** docs/estrategia-ranking-primeiro-lugar.md

---

## Contexto

O Destaka promete: "Quem te procura, te encontra." Para entregar isso, 3 capacidades sao inegociaveis:
1. Acelerar reviews (o fator #1 que o profissional controla)
2. Saber ONDE o profissional aparece e onde nao (geo-grid)
3. Mostrar progresso claro vs concorrentes (velocity, previsao, alertas)

Tudo mais (QR Code, CTA, fotos IA) e polimento. Este epic foca no que entrega valor real.

---

## Wave 1: Fundacao (Semana 1-2)

> Sem isso, o produto nao entrega a promessa.

### Story 5.1: Solicitacao de Reviews via WhatsApp [BLOCKED - Meta API approval]
**Prioridade:** P0 | **Esforco:** 5 dias | **Agente:** @dev
**Pilar:** Avaliacoes

**Como funciona:**
- Apos cada consulta, o Destaka envia WhatsApp ao paciente com link direto de review do Google
- Mensagem personalizada com nome do profissional e do paciente
- Timing configuravel (imediato, 2h apos, 24h apos)
- Tracking de envio + conversao (enviou, abriu, avaliou)

**Requisitos tecnicos:**
- Integrar Meta WhatsApp Business API (Cloud API)
- Criar `src/lib/whatsapp/client.ts` (envio de mensagem template)
- Criar `src/lib/inngest/functions/review-solicitation-whatsapp.ts`
- Template de mensagem aprovado pela Meta
- Webhook de status (enviado, entregue, lido)
- Dashboard: taxa de envio e conversao

**Dependencias externas:**
- Meta Business API approval (1-2 semanas)
- Numero WhatsApp Business verificado
- Template de mensagem aprovado

**Criterios de aceite:**
- [ ] Mensagem WhatsApp enviada automaticamente apos evento de consulta
- [ ] Link direto para review do Google no corpo da mensagem
- [ ] Tracking de status (enviado/entregue/lido/avaliou)
- [ ] Dashboard mostra taxa de conversao
- [ ] Fallback para email se WhatsApp falhar
- [ ] Respeita horario comercial (nao envia de madrugada)
- [ ] LGPD: opt-in obrigatorio do paciente

**Acceptance test:**
Profissional marca consulta como realizada. Em ate 2h, paciente recebe WhatsApp com "Ola [nome], como foi sua consulta com [profissional]? Sua avaliacao nos ajuda muito: [link]". Paciente clica, avalia no Google. Dashboard mostra +1 na taxa de conversao.

---

### Story 5.2: Geo-Grid Rank Tracking [DONE]
**Prioridade:** P0 | **Esforco:** 7 dias | **Agente:** @dev + @ux-design-expert
**Pilar:** Geo

**Como funciona:**
- Semanalmente, verifica a posicao do profissional em 16 pontos (grid 4x4) ao redor do endereco
- Para cada ponto, busca a keyword principal e anota a posicao
- Resultado: mapa de calor mostrando onde e forte (top 3), medio (4-10), fraco (11+) ou invisivel
- Historico semanal para ver evolucao do raio de visibilidade

**Requisitos tecnicos:**
- Criar `src/lib/ranking/geo-grid-tracker.ts`
  - Input: coordenadas centrais, raio (2-5km), keyword
  - Grid: 4x4 pontos equidistantes
  - Para cada ponto: Google Places textSearch com location bias
  - Output: array de {lat, lng, position, competitors_above}
- Criar `src/lib/inngest/functions/geo-grid-tracker.ts` (cron semanal)
- Tabela `geo_grid_snapshots`: org_id, keyword_id, grid_data (JSONB), week_start
- Componente `GeoGridMap.tsx`: mapa Leaflet com pins coloridos (verde/amarelo/vermelho/cinza)
- Integrar no dashboard abaixo do MapCard atual

**Limites de API:**
- 16 pontos x 4 keywords = 64 calls por semana por usuario
- Places API: $0.032 por textSearch = ~$2/usuario/mes
- Aceitavel para o modelo de negocio

**Criterios de aceite:**
- [ ] Grid 4x4 (16 pontos) gerado a partir do endereco do profissional
- [ ] Posicao verificada para keyword principal em cada ponto
- [ ] Mapa de calor visual no dashboard (verde/amarelo/vermelho/cinza)
- [ ] Historico semanal (comparar semana atual vs anterior)
- [ ] Raio configuravel (default 3km, ajustavel)
- [ ] Nao excede quota da Places API

**Acceptance test:**
Dashboard mostra mapa com 16 pontos ao redor de Copacabana. Pontos verdes onde Paula e top 3, amarelos onde e 4-10, vermelhos onde e 11+, cinza onde nao aparece. Ao passar o mouse, mostra "Posicao 3 para quiropraxia Copacabana". Semana seguinte, 2 pontos mudam de amarelo para verde.

---

## Wave 2: Inteligencia Competitiva (Semana 3-4)

> Transforma dados em acoes. Profissional ve progresso e sabe o que fazer.

### Story 5.3: Dashboard Review Velocity vs Concorrentes [DONE]
**Prioridade:** P1 | **Esforco:** 4 dias | **Agente:** @dev
**Pilar:** Avaliacoes + Competitivo

**Como funciona:**
- Grafico mostrando reviews/semana do usuario vs cada concorrente ao longo do tempo
- Atualizado semanalmente (junto com o competitor-monitor)
- Mostra claramente quem esta ganhando terreno

**Requisitos tecnicos:**
- Atualizar `competitor-monitor.ts`: salvar review_count historico por semana
- Tabela `competitor_snapshots`: competitor_id, review_count, snapshot_date
- Componente `ReviewVelocityChart.tsx`: grafico de linhas (Recharts)
- API `/api/dashboard/velocity`: retorna series temporais

**Criterios de aceite:**
- [ ] Grafico com linhas para usuario + top 3 concorrentes
- [ ] Eixo X: semanas. Eixo Y: reviews acumuladas
- [ ] Tooltip mostra velocidade (reviews/semana) de cada um
- [ ] Dados coletados semanalmente automaticamente
- [ ] Visivel na pagina de Concorrentes

---

### Story 5.4: Alertas de Movimento dos Concorrentes [DONE]
**Prioridade:** P1 | **Esforco:** 3 dias | **Agente:** @dev
**Pilar:** Competitivo

**Como funciona:**
- Quando um concorrente ganha 5+ reviews na semana ou sobe de posicao, envia email
- Formato: "Studio Jun ganhou 8 reviews esta semana (voce ganhou 3). Continue pedindo!"

**Requisitos tecnicos:**
- Criar `src/lib/inngest/functions/competitor-alert.ts`
- Comparar snapshots semanais de review_count e posicao
- Template email com Resend
- Threshold configuravel (default: 5+ reviews ou mudanca de posicao)

**Criterios de aceite:**
- [ ] Email enviado quando concorrente ganha 5+ reviews na semana
- [ ] Email enviado quando concorrente muda de posicao
- [ ] Tom motivacional (nao alarmista)
- [ ] Inclui acao sugerida ("Peca a 5 pacientes esta semana")
- [ ] Nao envia mais de 1 alerta por semana por concorrente

---

### Story 5.5: Previsao de Ultrapassagem [DONE]
**Prioridade:** P1 | **Esforco:** 2 dias | **Agente:** @dev
**Pilar:** Competitivo

**Como funciona:**
- "No ritmo atual, voce ultrapassa CMT em 6 meses"
- Calcula baseado na velocity de ambos (reviews/semana)
- Atualiza semanalmente

**Requisitos tecnicos:**
- Criar `src/lib/ranking/overtake-predictor.ts`
- Input: user velocity, competitor velocity, gap atual
- Output: semanas estimadas para empatar, com intervalo de confianca
- Componente no GapAnalysisCard ou card proprio

**Criterios de aceite:**
- [ ] Mostra estimativa de tempo para ultrapassar cada concorrente
- [ ] Baseado em velocidade real (nao projecao estatica)
- [ ] Atualiza semanalmente
- [ ] Mostra no dashboard de forma clara

---

### Story 5.6: QR Code Personalizado [DONE - pre-existing]
**Prioridade:** P1 | **Esforco:** 2 dias | **Agente:** @dev
**Pilar:** Avaliacoes

**Como funciona:**
- Gera QR Code com link direto de review do Google
- Template visual com logo Destaka + nome do profissional
- Profissional imprime e coloca na recepcao

**Requisitos tecnicos:**
- Biblioteca `qrcode` (ja existe dependencia)
- Endpoint `/api/reviews/qr` (ja existe parcial)
- Template SVG com branding
- Download como PNG/PDF

**Criterios de aceite:**
- [ ] QR Code gera link direto para review do Google
- [ ] Visual com marca Destaka + nome do profissional
- [ ] Download como imagem (PNG) e PDF
- [ ] Acessivel no dashboard (pagina de Avaliacoes)

---

### Story 5.7: Monitoramento de Edicoes nao Autorizadas [DONE]
**Prioridade:** P1 | **Esforco:** 2 dias | **Agente:** @dev
**Pilar:** Perfil

**Como funciona:**
- Google permite que qualquer pessoa sugira edicoes no perfil
- O Destaka detecta quando dados do perfil mudam sem acao do profissional
- Alerta por email com o que mudou

**Requisitos tecnicos:**
- Adicionar snapshot comparison no `gbp-audit.ts`
- Comparar campos criticos: nome, endereco, telefone, horarios, categorias, descricao
- Se algum mudou sem acao do Destaka: email de alerta
- Log de alteracoes no banco

**Criterios de aceite:**
- [ ] Detecta mudancas em nome, endereco, telefone, horarios, categorias
- [ ] Email de alerta com campo alterado (antes vs depois)
- [ ] Log de historico de alteracoes
- [ ] Nao alerta para mudancas feitas pelo proprio Destaka

---

## Wave 3: Polimento (Semana 5-6)

> Melhora a experiencia. Nao e bloqueador mas diferencia o produto.

### Story 5.8: Mapa de Calor Visual (Geo-Grid Dashboard) [DONE]
**Prioridade:** P1 | **Esforco:** 3 dias | **Agente:** @dev + @ux-design-expert
**Depende de:** Story 5.2 (geo-grid tracking)
**Pilar:** Geo

**Criterios de aceite:**
- [ ] Mapa interativo com 16 pontos coloridos
- [ ] Comparativo semana a semana (slider temporal)
- [ ] Integrado na pagina de Dashboard (abaixo do MapCard)

---

### Story 5.9: Landing Page de Review com Marca [DONE]
**Prioridade:** P2 | **Esforco:** 2 dias | **Agente:** @dev
**Pilar:** Avaliacoes

**Como funciona:**
- URL personalizada: destaka.com.br/r/paula
- Pagina com nome e foto do profissional, CTA para avaliar
- Redireciona pro Google Reviews
- Tracking de cliques

**Criterios de aceite:**
- [ ] URL unica por profissional
- [ ] Visual com marca do profissional
- [ ] Redirect para Google Reviews
- [ ] Tracking de acessos e conversao

---

### Story 5.10: CTA nos Posts + Fotos IA [DONE - CTA only, photos TBD]
**Prioridade:** P2 | **Esforco:** 3 dias | **Agente:** @dev
**Pilar:** Posts

**Criterios de aceite:**
- [ ] Posts incluem CTA (agendar, ligar, saber mais)
- [ ] Posts de IA (nao Instagram) incluem foto relevante (stock ou gerada)
- [ ] Zernio createPost suporta actionType/actionLink

---

### Story 5.11: Comparativo Visual Concorrentes ao Longo do Tempo [DONE]
**Prioridade:** P2 | **Esforco:** 3 dias | **Agente:** @dev
**Pilar:** Competitivo
**Depende de:** Story 5.3 (velocity dashboard)

**Criterios de aceite:**
- [ ] Grafico de evolucao: reviews + posicao vs concorrentes (timeline)
- [ ] Integrado na pagina de Concorrentes
- [ ] Dados historicos de pelo menos 4 semanas

---

## Resumo de Waves

| Wave | Semana | Stories | Status |
|------|--------|---------|--------|
| 1 | 1-2 | 5.1 (WhatsApp) + 5.2 (Geo-Grid) | 5.2 DONE, 5.1 BLOCKED (Meta API) |
| 2 | 3-4 | 5.3 + 5.4 + 5.5 + 5.6 + 5.7 | ALL DONE |
| 3 | 5-6 | 5.8 + 5.9 + 5.10 + 5.11 | ALL DONE |

---

## Dependencias Externas

| Dependencia | Wave | Risco | Mitigacao |
|-------------|------|-------|-----------|
| Meta WhatsApp Business API approval | Wave 1 | Alto (1-2 semanas) | Solicitar AGORA, dev começa pelo geo-grid |
| Google Places API quota | Wave 1 | Baixo | 64 calls/semana/usuario = ~$2/mes |
| Template WhatsApp aprovado pela Meta | Wave 1 | Medio | Preparar template antes do approval |

---

## Metricas de Sucesso do Epic

| Metrica | Baseline (hoje) | Meta Wave 1 | Meta Wave 3 |
|---------|-----------------|-------------|-------------|
| Review velocity Paula | ~1/semana | 3-5/semana | 3-5/semana |
| Bairros top 3 | ~1 | Medido (baseline) | 3+ |
| Score Destaka | 66 | 75+ | 85+ |
| Posicao ranking | 3a | 3a | 2a |
| Features P0 implementadas | 0/2 | 2/2 | 2/2 |
| Features P1 implementadas | 0/7 | 0/7 | 7/7 |

---

## Notas para @dev

- Todos os endpoints DEVEM usar admin client (nao supabase user client). RLS bloqueou metade das features na sessao anterior
- Todas as colunas novas: usar `npx supabase db query --remote --yes`
- Vercel build: `VERCEL_FORCE_NO_BUILD_CACHE=1` esta ativo (cache corrompido)
- Inngest: fazer PUT /api/inngest apos deploy para registrar novas functions
- Zernio: publishPost precisa de `platform: 'googlebusiness'` no array
- Posts: coluna real e `scheduled_at` (nao `scheduled_for`)
- CompetitorsContent: usar optional chaining em TUDO que vem de JSON (gaps?.map, alerts?.map)

---

*Criado por Morgan (PM) em 2026-11-11*
*Referencia: docs/estrategia-ranking-primeiro-lugar.md*
*Projeto: Destaka*
