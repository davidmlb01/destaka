# MASTER BACKUP — Destaka (Projeto GMM)
**Atualizado:** 2026-03-29
**Status:** Planejamento completo + Branding definido — pronto para desenvolvimento

---

## 1. Visão

**Destaka** é um SaaS que automatiza a otimização do Google Business Profile para profissionais liberais brasileiros. Tagline: *"Apareça para quem precisa de você."*

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
- [ ] Repositório git inicializado
- [ ] Projeto Next.js criado
- [ ] Banco de dados Supabase criado
- [ ] Google Cloud project + APIs ativadas

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

| Plano | Valor | Diferencial |
|-------|-------|-------------|
| Setup Único | R$497 | Entrada sem fricção |
| Essencial | R$147/mês | 1 perfil, monitoramento |
| Pro | R$197/mês | + respostas automáticas + relatório PDF |
| Agência | R$497–997/mês | Multi-perfil, white label |
| Anual Pro | R$1.497/ano | Desconto ~37% |

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
- Tagline: *"Apareça para quem precisa de você."*
- Domínio: `destaka.com.br`
- Arquétipo: O Mago (com influência do Cuidador)
- Brand Guidelines: `docs/brand/brand-guidelines.md`

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
