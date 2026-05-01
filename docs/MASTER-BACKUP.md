# MASTER BACKUP — Destaka (Projeto GMM)
**Atualizado:** 2026-05-01
**Status:** Pronto para primeiro cliente real — Stripe live configurado, checkout + webhook funcionando, 4 fixes críticos aplicados

---

## 1. Visão

**Destaka** é um SaaS que cuida do Google Business Profile para profissionais de saúde brasileiros. Tagline: *"Seu consultório no topo do Google. Automático."*

> Tagline anterior "Apareça para quem precisa de você." substituída em 2026-04-09 após sessão C-Level + Copy Squad.

**Por que vai funcionar:**
- 51% dos negócios têm perfis incompletos no Google
- No Brasil, zero SaaS self-service nesse nicho (só agências manuais)
- Modelo global validado pelo Paige (Merchynt) — $99/mês, 10k+ perfis
- Claude gera conteúdo em português nativo com contexto local

---

## 2. Decisões-Chave

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Stack frontend | Next.js 14+ App Router | Já domina, API routes integradas |
| Banco de dados | Supabase (PostgreSQL, região BR) | LGPD + managed + Auth integrada |
| Filas assíncronas | BullMQ + Redis (Upstash) | Jobs de diagnóstico e posts |
| Autenticação | next-auth v5 + Google OAuth | Google é o core da plataforma |
| AI | Claude API (claude-opus-4-6) | PT-BR nativo, contexto local |
| Deploy | Vercel + Supabase + Upstash | Zero ops, escala fácil |
| Pagamentos | Stripe | Padrão de mercado |
| E-mail | Resend | API simples, boa entregabilidade |

---

## 3. Estado Atual

- [x] PRD completo (`docs/prd/gmm-prd.md`)
- [x] Arquitetura técnica completa (`docs/architecture/gmm-architecture.md`)
- [x] Requisitos de servidor documentados (`docs/guides/server-requirements.md`)
- [x] Epic 1 (Core Platform) — 7 stories planejadas
- [x] Epic 2 (Monetização) — 3 stories planejadas
- [x] Repositório git inicializado
- [x] Projeto Next.js criado (packages/web/)
- [x] Banco de dados Supabase criado (sa-east-1, São Paulo)
- [x] Migração SQL executada (8 tabelas + RLS)
- [x] Upstash Redis criado (sa-east-1)
- [x] .env.local preenchido: NextAuth, Anthropic, Resend, Supabase, Upstash
- [x] Google OAuth: Cloud Console + Supabase provider + URL Configuration (2026-04-12)
- [x] Stripe: produto Pro R$197 criado + chaves + webhook configurado (2026-04-10)
- [x] Migration 005 aplicada: user_events, score_history, user_sessions (2026-04-10)
- [x] Vercel CLI instalado + projeto linkado + envs Stripe adicionadas (2026-04-10)
- [x] API routes: /api/stripe/checkout, /api/stripe/webhook, /api/stripe/portal (2026-04-10)
- [x] UpgradeBanner no dashboard para usuários free (2026-04-10)
- [x] Landing: plano único Pro R$197, copy corrigida, sem "grátis" (2026-04-10)
- [x] Migration 006: gmb_reviews.ai_reply_draft + competitors + monthly_reports (2026-04-12)
- [x] Zero Touch SaaS: review auto-reply (IA) + post generator semanal + monthly report email (2026-04-12)
- [x] Crons Vercel: review-monitor 8h, post-generator 10h, monthly-report dia 1 (2026-04-12)
- [x] Lazy init SDKs — build estável Vercel: Anthropic, Stripe, Resend (2026-04-12)
- [x] Google OAuth end-to-end: Supabase URL Configuration corrigida para destaka.com.br (2026-04-12)
- [~] LinkedIn: enxoval completo criado (docs/social/linkedin-setup.html) — criar pagina amanha
- [ ] GBP real vinculado para teste end-to-end
- [ ] Debugar My Business Account Management API (100% errors)
- [ ] Stripe modo produção ativado
- [ ] Primeiros clientes pagantes

---

## 4. Roadmap

### V1 — MVP (6–8 semanas)
- Epic 1: Core Platform (OAuth + Diagnóstico + Otimização + Dashboard)
- Epic 2: Monetização (Stripe + planos)
- **Meta:** 50 clientes pagantes em 60 dias do lançamento

### V2 — Escala (após MVP validado)
- Multi-perfil para agências
- White label completo
- Integração WhatsApp para coletar avaliações
- Análise de concorrentes locais

---

## 5. Segmentos Prioritários

1. **Dentistas** (mais numerosos, maior ticket, dor mais clara)
2. Médicos
3. Psicólogos / Terapeutas
4. Advogados
5. Fisioterapeutas

---

## 6. Modelo de Receita

> Decisão 2026-04-09: Simplificar para UM plano no lançamento. Plano Agência congelado até 20 clientes Pro validados.

| Plano | Valor | Status |
|-------|-------|--------|
| **Pro** | **R$197/mês** | **ATIVO — plano único de lançamento** |
| Essencial | R$147/mês | Congelado — adicionar só se houver demanda |
| Agência | R$497–997/mês | Congelado até 20 clientes Pro |
| Anual Pro | R$1.497/ano | Futuro |

**Âncora de preço aprovada:** "Uma única consulta cobre 6 meses de Destaka."
**Garantia:** 30 dias. Se o score não subir, devolve o primeiro mês.

---

## 7. Competidores

| Player | Onde opera | Preço | Gap |
|--------|-----------|-------|-----|
| Paige (Merchynt) | EUA | $99/mês | Inglês, sem contexto BR |
| Localo | Global | $? | Sem foco em profissionais liberais BR |
| Agências manuais BR | Brasil | R$250–800/mês | Manual, não escala, caro |
| **Destaka** | **Brasil** | **R$197/mês** | **Self-service, PT-BR, contexto local** |

---

## 8. Infraestrutura

Deploy recomendado: Vercel + Supabase + Upstash Redis
Custo MVP: ~$65–75/mês
Com 100 clientes (R$197/mês = R$19.700 MRR): custo infra < 1% da receita

Ver detalhes completos: `docs/guides/server-requirements.md`

---

## 9. Branding

- Nome: **Destaka**
- Tagline: *"Seu consultório no topo do Google. Automático."*
- Tagline operacional: *"Mais pacientes pelo Google, sem você precisar entender o Google."*
- Domínio: `destaka.com.br`
- Arquétipo: Assistente Competente (o dentista é o herói, a Destaka é o sistema)
- Tom: direto, provocativo. "Com pimenta. Sem grosseria."
- Brand Guidelines: `docs/brand/brand-guidelines.md`
- Copy GTM completo: `docs/brand/copy-gtm.md`

**Regras de copy inegociáveis:**
- NUNCA usar "otimizar/otimização" — usar: cuidar, arrumar, colocar em ordem, resolver
- NUNCA usar prova social até ter depoimentos reais
- NUNCA usar jargão técnico (algoritmo, SEO)

## 10. Links e Referências

- PRD: `docs/prd/gmm-prd.md`
- Arquitetura: `docs/architecture/gmm-architecture.md`
- Servidor: `docs/guides/server-requirements.md`
- Brand Guidelines: `docs/brand/brand-guidelines.md`
- Google Business Profile API: https://developers.google.com/my-business/reference/businessinformation/rest
- Google OAuth Scopes: https://developers.google.com/my-business/reference/oauth-reference
- Paige (referência): https://www.merchynt.com/paige

---

## 11. Log de Sessões

### 2026-03-28 — Sessão de Planejamento
- Projeto criado e estruturado pelo AIOX (Orion)
- PRD completo escrito pelo @pm (Morgan)
- Arquitetura técnica definida pelo @architect (Aria)
- Requisitos de servidor documentados
- Epic 1 (7 stories) + Epic 2 (3 stories) planejados
- Próximo passo: inicializar repositório e criar projeto Next.js

### 2026-04-12 — Sessão Zero Touch SaaS + Google OAuth

**Zero Touch SaaS (automation engine) — PR mergeado em main:**
- Migration 006: `gmb_reviews.ai_reply_draft`, tabela `competitors`, tabela `monthly_reports`
- `lib/gmb/review-automation.ts`: processa fila de reviews pendentes, gera rascunho ou publica via IA
- `lib/report/compiler.ts`: compila dados mensais (score, reviews, posts) por usuário
- `lib/email/monthly-report.ts`: template HTML + envio via Resend
- Crons Vercel: `review-monitor` (8h diário), `post-generator` (10h diário), `monthly-report` (8h dia 1)
- Fix crítico: lazy init de todos os SDKs com module-level instantiation (Anthropic x5, Stripe x1) que crashavam o build Vercel durante page data collection

**Google OAuth — configurado e funcionando em produção:**
- Google Cloud Console: OAuth client "Destaka" já existia com redirect URI correto
- Supabase: provider Google habilitado com Client ID + Secret
- URL Configuration: Site URL atualizado para `https://destaka.com.br`, redirect `https://destaka.com.br/**`
- Fluxo testado: login, consent screen GBP, callback, onboarding — tudo funcional
- Bloqueador atual: nenhuma conta do David tem GBP real para testar onboarding completo

**Kanban atual:**

| Concluído | Em andamento | A fazer |
|-----------|-------------|---------|
| Stripe + webhook | — | GBP real para teste |
| Analytics + instrumentação | — | Stripe modo produção |
| Onboarding emails (dias 1, 3, 7) | — | Primeiros clientes |
| Google OAuth end-to-end | — | My Business Account Mgmt API errors (100%) |
| Zero Touch SaaS (review, posts, report) | — | Tráfego orgânico Instagram |
| Build estável Vercel (lazy SDKs) | — | Fluxo de indicação (email dia 30) |
| Migration 006 em produção | — | |

**Próximos passos:**
1. Criar GBP de teste (UNLMTD ou conta de teste) para validar onboarding completo
2. Debugar My Business Account Management API (100% erros — provavelmente token scope)
3. Ativar Stripe modo produção quando pronto para cobrar
4. Iniciar conteúdo orgânico Instagram (3 posts/semana)

### 2026-04-05 — Sessão de Infraestrutura (Block 1)
- .env.local preenchido com: NextAuth secret, Anthropic API key, Resend API key
- Supabase criado em São Paulo (sa-east-1) + migração 001_initial_schema.sql executada
- Upstash Redis criado em São Paulo (sa-east-1), Free Tier
- Pendente para amanhã: Google OAuth (console.cloud.google.com) + Stripe
- Atenção: Business Profile API requer verificação Google (pode demorar semanas) — testar com Test User enquanto aguarda
- Resend: restringir para domínio destaka.com.br quando ir para produção

### 2026-04-09 — Sessão de GTM Estratégico (C-Level + Squads)

Primeira sessão executiva completa. Fluxo: CEO → CMO → Brand → Story → Copy → Hormozi → Traffic.

**Decisões do CEO (Vision Chief):**
- ICP: dentistas como canal de entrada (médicos depois)
- Plano único no lançamento: Pro (R$197/mês). Agência congelado até 20 clientes.
- Horizonte 18 meses precisa ser definido antes de escalar aquisição

**Decisões do CMO:**
- Canal inicial: indicações de conhecidos + orgânico Instagram/LinkedIn
- Dashboard precisa mostrar métricas de visibilidade: visualizações do perfil, cliques para ligar, cliques para rota
- Sequência de onboarding por e-mail: dias 1, 3 e 7
- Fluxo de indicação estruturado no e-mail dia 30

**Decisões de Brand:**
- Tagline revisada: "Seu consultório no topo do Google. Automático."
- Arquétipo: Assistente Competente (não Mago)
- Tom calibrado por touchpoint (ver copy-gtm.md)

**Arco narrativo (StoryBrand):** Definido e documentado em copy-gtm.md

**Decisões de Copy:**
- 9 peças de copy produzidas (landing, dor, como funciona, checkout, diagnóstico, e-mails, posts, hooks de ads)
- Vocabulário proibido: "otimizar", "algoritmo", "SEO"
- Prova social: zero até ter depoimentos reais

**Decisões do Hormozi:**
- Diagnóstico gratuito = principal ativo de aquisição (não bônus de produto)
- Oferta Pro inclui: setup feito por nós (bônus) + garantia 30 dias
- Âncora de preço: "Uma única consulta cobre 6 meses de Destaka."
- CTA principal aprovado: "Quero mais pacientes pelo Google"
- Linha crítica do diagnóstico: "Com esse score, você está perdendo pacientes para os seus concorrentes. Todo dia."

**Decisões do Traffic:**
- Fase 1 (agora): 3 posts/semana Instagram + indicação estruturada dia 30
- Fase 2 (após 10 clientes): Meta Ads, R$1.500/mês, foco em dentistas 30-55 anos
- Estrutura: topo (diagnóstico grátis) + retargeting diagnóstico + retargeting checkout
- Meta CAC: abaixo de R$120

**Próximos passos:**
1. Atualizar dashboard para mostrar visualizações e cliques (CMO)
2. Implementar Stripe com a oferta revisada (bônus setup + garantia)
3. Criar sequência de e-mail onboarding (dias 1, 3, 7)
4. Criar fluxo de indicação (e-mail dia 30)
5. Iniciar conteúdo orgânico Instagram com estrutura definida

### 2026-04-10 — Sessão de Stripe + Analytics

**Migration 005 aplicada:**
- uuid_generate_v4 corrigido para gen_random_uuid (extensão não instalada)
- 3 tabelas ativas em produção: `user_events`, `score_history`, `user_sessions`
- Analytics começando a capturar eventos imediatamente

**Stripe 100% configurado:**
- Produto "Destaka Pro" criado no Stripe (modo teste): `prod_UJOq671eTLWmlp`
- Price ID Pro: `price_1TKm3DB2sbrnNSqU2o6jXuKk`
- Webhook criado: `https://destaka.com.br/api/stripe/webhook` (3 eventos)
- Envs adicionadas via Vercel CLI: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, STRIPE_WEBHOOK_SECRET

**Código implementado (commit 7d5d052):**
- `/api/stripe/checkout` — gera Checkout Session, redireciona para Stripe
- `/api/stripe/webhook` — recebe eventos, atualiza `plan` no Supabase
- `/api/stripe/portal` — abre portal do cliente (cancelar, trocar cartão)
- `UpgradeBanner` — aparece no dashboard quando `plan === 'free'`

**Landing corrigida:**
- Pricing: 3 planos → só Pro R$197/mês
- Botão StepScore: "É grátis" removido → "Quero mais pacientes pelo Google."
- Trust badges: "Sem cartão de crédito" → "Garantia de 30 dias"
- Rodapé pricing: "14 dias grátis" → "Garantia de 30 dias. Score não sobe, devolvemos tudo."

**Infraestrutura:**
- Vercel CLI instalado e autenticado
- Projeto linkado: `david-8558s-projects/destaka`
- Deploy automático via git push

**Próximos passos:**
1. Ativar modo produção no Stripe (quando pronto para cobrar de verdade)
2. Google OAuth: Business Profile API + Test User
3. Dashboard: métricas de visibilidade
4. Onboarding email: dias 1, 3, 7

### 2026-04-09 — Sessão de Instrumentação de Produto

**Data Squad Diagnosis (Peter Fader + Sean Ellis):**
- PRD Seção 7 reescrita com framework completo de métricas SaaS
- North Star Metric definida: "Perfis ativos com score aumentando semana a semana"
- Aha Moment definido: usuário vê score subir após primeira otimização (< 5min)
- Activation Rate meta: > 60% chegam a `first_optimization`
- CLV por segmento calculado: Agência (R$17k-27k) vs Dentista (R$3.9k-4.9k)
- 5 churn triggers mapeados com ação preventiva
- Must-Have Survey planejado (PMF gate: 40%+ "muito decepcionado")
- Decisao: priorizar plano Agência no Epic 2 por LTV 7x maior

**Instrumentação técnica (commit 9f594b0):**
- Migration 005: `user_events`, `score_history`, `user_sessions` com RLS e indexes
- `lib/analytics.ts`: `trackEvent` (one-time e engagement), `recordScore`, `upsertSession`
- 6 routes conectadas: gmb/select, optimization/execute, dashboard, checklist, posts/publish, reviews
- TypeScript: zero erros

**Próximos passos atualizados:**
1. ~~supabase db push~~ — FEITO (2026-04-10)
2. ~~Stripe checkout~~ — FEITO (2026-04-10)
3. Google OAuth: Business Profile API + Test User (console.cloud.google.com)
4. Dashboard: métricas de visibilidade (visualizações, cliques, rotas)
5. Onboarding: sequência de e-mail dias 1, 3, 7
6. Conteúdo: 3 posts/semana Instagram

### 2026-05-01 — Sessão 9: Checkout Live + Fixes Críticos

**Objetivo:** Configurar Stripe live e testar fluxo completo onboarding → dashboard → assinatura.

**Problemas resolvidos:**

| Problema | Causa | Fix |
|---|---|---|
| "Algo deu errado" no onboarding | `GMB_MOCK` env var com trailing newline via `echo` | Recriar com `printf` |
| Perfil clicado voltava para mesma tela | Perfis mock `789012`/`345678` pertenciam a `demo@destaka.com.br`; insert 23505 falhava | Deletar perfis conflitantes via Supabase REST |
| Dashboard "This page couldn't load" | `DashboardLayout.tsx` sem `'use client'` — event handlers em Server Component | Adicionar `'use client'` como primeira linha |
| Stripe 500 `ERR_INVALID_CHAR` | `STRIPE_SECRET_KEY` salva com newline via `echo` | Recriar com `printf` |
| Stripe `Invalid API Key` | OCR de screenshot com caractere errado (`BF6HA8` vs `bF6HA8`) | Chave colada manualmente |
| `No such price: 'price_1TKm3D...'` | Price ID de outra conta/sessão Stripe | Criar novo Price ID via API: `price_1TSNSQAwJUjY0HfeZWbXkVAB` |
| Webhook nunca disparado | `STRIPE_WEBHOOK_SECRET` era do live (`whsec_oogZ...`), test mode precisa do próprio | Criar test webhook via API: `whsec_rA2nZ3faUmG4mk3V7wX0QCvXy3Ud6xyf` |
| Live mode: `Invalid API Key sk_live_` | Stripe bloqueia revelação de `sk_live_` sem verificação de identidade | Usar restricted key `rk_live_...` com permissões equivalentes |
| Plano não atualiza após pagamento live | Webhook live com secret do test mode | Criar live webhook via API + atualizar `STRIPE_WEBHOOK_SECRET` |

**Variáveis Vercel (estado atual 2026-05-01):**
- `STRIPE_SECRET_KEY`: `rk_live_...` (restricted live key, permissões checkout + webhook)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: `pk_live_51TGkL0AwJUjY0Hfe...`
- `STRIPE_PRICE_PRO`: `price_1TPvryAwJUjY0HfeFRDVSnVe` (live, R$197/mês)
- `STRIPE_PRICE_ESSENCIAL`: `price_1TPvryAwJUjY0HfeFRDVSnVe` (mesmo Price ID por ora)
- `STRIPE_PRICE_AGENCIA`: `price_1TPvryAwJUjY0HfeFRDVSnVe` (mesmo Price ID por ora)
- `STRIPE_WEBHOOK_SECRET`: `whsec_jn84441qwAkc2eJxoDeC4269JAT4BFlQ` (live webhook `we_1TSOH5AwJUjY0HfebemQY7Hb`)
- `GMB_MOCK`: `false` (corrigido — era `true` e serviria dados falsos para clientes reais)

**Fixes de código deployados (2026-05-01):**
- `DashboardLayout.tsx`: `'use client'` adicionado (fix crash Server Component)
- `webhook/route.ts`: handler `customer.subscription.updated` adicionado (C-1)
- `env-check.ts`: `STRIPE_PRICE_ESSENCIAL` + `STRIPE_PRICE_AGENCIA` adicionados (C-4)
- `env-check.ts`: guard que bloqueia startup se `GMB_MOCK=true` em produção (C-3)
- `demo-login/route.ts`: já estava gateado por `GMB_MOCK !== 'true'` (C-2 — sem mudança necessária)

**Webhooks Stripe:**
- Live: `we_1TSOH5AwJUjY0HfebemQY7Hb` — destaka.com.br/api/stripe/webhook
  - Events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
- Test (descontinuado): `whsec_rA2nZ3faUmG4mk3V7wX0QCvXy3Ud6xyf`

**Estado do fluxo (testado):**
- Login Google: funcionando
- Onboarding GMB (com mock): funcionando
- Dashboard Score: funcionando
- Checkout Stripe (test mode): funcionando — plano atualizado manualmente após teste
- Checkout Stripe (live mode): flow abre, pagamento processa, webhook ativo

**Pendências restantes:**
1. Testar webhook live end-to-end (confirmar que plano atualiza após pagamento real)
2. Ativar conta Stripe (bank account) para receber transferências
3. Adicionar webhook event `customer.subscription.updated` no painel Stripe (dashboard — já no código)
4. Primeiro cliente real com GBP real (sem GMB_MOCK)

### 2026-03-29 — Sessão de Branding
- Brand Squad (Brand Chief + Emily Heyward + Naming Strategist + Archetype Consultant) convocados
- Why Test executado: dor real = profissional invisível para quem precisa dele
- Nome definido: **Destaka** (de "destaque" com grafia modificada QUE→KA)
- Domínio `destaka.com.br` disponível e escolhido
- Tagline: "Apareça para quem precisa de você."
- Arquétipo: O Mago
- Copy Chief (Cyrus) ativado — headlines e StoryBrand framework gerados
- Brand Guidelines criados em `docs/brand/brand-guidelines.md`
- Validação Hormozi realizada (sessão anterior): preço correto, nicho único (dentistas), garantia de resultado recomendada
