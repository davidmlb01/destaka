# MASTER BACKUP — Destaka (Projeto GMM)
**Atualizado:** 2026-04-05
**Status:** Infraestrutura de dev configurada — pendente Google OAuth + Stripe

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
- [ ] Google Cloud project + OAuth configurado (amanhã)
- [ ] Stripe: 3 produtos + price IDs + webhook

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
| **Destaka** | **Brasil** | **R$147–197/mês** | **Self-service, PT-BR, contexto local** |

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
