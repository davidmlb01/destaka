# Arquitetura Técnica — GMM
**Versão:** 1.0
**Data:** 2026-03-28
**Architect:** Aria (@architect)

---

## 1. Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                      USUÁRIO                            │
│              (Browser / Mobile Web)                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  FRONTEND                               │
│              Next.js 14+ (App Router)                   │
│           Hosted: Vercel                                │
└────────────────────┬────────────────────────────────────┘
                     │ API Routes / tRPC
┌────────────────────▼────────────────────────────────────┐
│                  BACKEND (API)                          │
│              Next.js API Routes                         │
│         ou Node.js separado (Railway)                   │
└───────┬────────────┬───────────────┬────────────────────┘
        │            │               │
┌───────▼──┐  ┌──────▼──────┐  ┌────▼──────────────────┐
│ Supabase │  │  Job Queue  │  │   External APIs        │
│(Postgres │  │  (BullMQ +  │  │  - Google Business     │
│  + Auth) │  │   Redis)    │  │    Profile API         │
└──────────┘  └─────────────┘  │  - Claude API          │
                               │  - Stripe              │
                               │  - Resend (email)      │
                               └────────────────────────┘
```

---

## 2. Stack Tecnológico

### Frontend
| Tecnologia | Versão | Motivo |
|-----------|--------|--------|
| Next.js | 14+ (App Router) | SSR, performance, API routes |
| TypeScript | 5+ | Segurança de tipos |
| Tailwind CSS | 3+ | Styling rápido e consistente |
| shadcn/ui | Latest | Componentes acessíveis |
| Recharts | Latest | Gráficos do dashboard |
| React Hook Form + Zod | Latest | Formulários com validação |
| TanStack Query | v5 | Data fetching e cache |

### Backend
| Tecnologia | Versão | Motivo |
|-----------|--------|--------|
| Next.js API Routes | 14+ | Monorepo simplificado |
| tRPC | v11 | Type-safe API end-to-end |
| Prisma | 5+ | ORM com migrations |
| BullMQ | Latest | Fila de jobs async |
| Redis | 7+ | Cache + fila |
| Zod | Latest | Validação de schemas |

### Banco de Dados
| Tecnologia | Uso |
|-----------|-----|
| PostgreSQL 15 (Supabase) | Dados principais |
| Redis | Cache + filas de jobs |
| Supabase Storage | Fotos enviadas pelo usuário |

### Serviços Externos
| Serviço | SDK |
|---------|-----|
| Google Business Profile API | REST direto com axios |
| Google OAuth 2.0 | next-auth v5 |
| Claude API | @anthropic-ai/sdk |
| Stripe | stripe (Node SDK) |
| Resend | resend SDK |

---

## 3. Modelo de Dados

### Entidades Principais

```sql
-- Usuário e plano
users (
  id uuid PK,
  email text UNIQUE,
  name text,
  google_id text UNIQUE,
  plan_id uuid FK,
  stripe_customer_id text,
  created_at timestamp
)

-- Planos de assinatura
plans (
  id uuid PK,
  name text,           -- 'essencial' | 'pro' | 'agencia'
  price_cents int,
  max_profiles int,
  features jsonb,
  stripe_price_id text
)

-- Perfis do Google Meu Negócio
gmb_profiles (
  id uuid PK,
  user_id uuid FK,
  google_location_id text UNIQUE,  -- ID da API do Google
  name text,
  address text,
  phone text,
  category text,
  verified boolean,
  access_token_enc text,   -- criptografado
  refresh_token_enc text,  -- criptografado
  last_synced_at timestamp,
  created_at timestamp
)

-- Snapshots de diagnóstico
diagnostics (
  id uuid PK,
  profile_id uuid FK,
  score_total int,          -- 0-100
  score_info int,           -- Informações básicas
  score_photos int,         -- Fotos
  score_reviews int,        -- Avaliações
  score_posts int,          -- Posts
  score_services int,       -- Serviços
  score_attributes int,     -- Atributos
  raw_profile_data jsonb,   -- Snapshot completo da API
  ai_diagnosis text,        -- Diagnóstico gerado pelo Claude
  created_at timestamp
)

-- Ações de otimização
optimization_actions (
  id uuid PK,
  profile_id uuid FK,
  type text,              -- 'auto' | 'manual'
  category text,          -- 'info' | 'photos' | 'posts' | etc.
  action text,            -- descrição da ação
  status text,            -- 'pending' | 'executed' | 'failed' | 'user_done'
  api_payload jsonb,      -- payload enviado para a API
  error_message text,
  executed_at timestamp,
  created_at timestamp
)

-- Posts agendados/publicados
gmb_posts (
  id uuid PK,
  profile_id uuid FK,
  content text,
  call_to_action text,
  status text,            -- 'draft' | 'scheduled' | 'published' | 'failed'
  google_post_id text,
  published_at timestamp,
  scheduled_for timestamp,
  created_at timestamp
)

-- Avaliações
gmb_reviews (
  id uuid PK,
  profile_id uuid FK,
  google_review_id text UNIQUE,
  author_name text,
  rating int,             -- 1-5
  comment text,
  reply text,
  replied_at timestamp,
  ai_suggested_reply text,
  created_at timestamp
)

-- Métricas (daily snapshot)
gmb_metrics (
  id uuid PK,
  profile_id uuid FK,
  date date,
  views_search int,
  views_maps int,
  clicks_website int,
  clicks_phone int,
  clicks_directions int,
  photos_count int
)
```

---

## 4. Fluxos Principais

### 4.1 Onboarding
```
1. Usuário acessa GMM → clica "Conectar Google Meu Negócio"
2. Google OAuth → retorna access_token + refresh_token
3. GMM chama Business Profile API → lista todos os locais do usuário
4. Usuário seleciona qual perfil gerenciar
5. Job na fila: full_diagnostic_job(profile_id)
6. Full diagnostic executa em background (< 30s)
7. Usuário recebe e-mail: "Seu diagnóstico ficou pronto!"
8. Dashboard carrega com score + plano de ação
```

### 4.2 Diagnóstico (Job Assíncrono)
```
full_diagnostic_job:
  1. Buscar dados completos do perfil via API
  2. Calcular score por categoria (algoritmo interno)
  3. Enviar dados para Claude API → gerar diagnóstico em PT-BR
  4. Gerar lista de ações automáticas possíveis
  5. Gerar checklist manual priorizado
  6. Salvar diagnostic snapshot no banco
  7. Notificar usuário
```

### 4.3 Otimização Automática
```
auto_optimize_job:
  1. Ler diagnostic mais recente
  2. Para cada ação automática pendente:
     a. Executar via Google Business Profile API
     b. Salvar status (executed/failed)
     c. Logar para auditoria
  3. Atualizar score após execução
  4. Notificar usuário com resumo
```

### 4.4 Posts Automáticos (Cron semanal)
```
weekly_posts_job:
  1. Para cada perfil ativo no plano Pro+:
     a. Buscar contexto do negócio (segmento, nome, serviços)
     b. Chamar Claude: gerar post semanal contextualizado
     c. Publicar via API (ou enviar para aprovação)
  2. Salvar post no banco
  3. Notificar usuário
```

---

## 5. Integração Google Business Profile API

### Endpoints Utilizados
```
GET  /v1/accounts → lista contas do usuário
GET  /v1/accounts/{id}/locations → lista perfis
GET  /v1/{name} → detalhes do perfil
PATCH /v1/{name} → atualizar campos do perfil
GET  /v1/{name}/media → listar fotos
POST /v1/{name}/media → fazer upload de foto
GET  /v1/{name}/localPosts → listar posts
POST /v1/{name}/localPosts → criar post
GET  /v1/{name}/reviews → listar avaliações
PUT  /v1/{name}/reviews/{id}/reply → responder avaliação
GET  /v1/{name}/reportInsights → métricas
```

### Quotas (free tier)
- 1.000 requisições/dia por projeto
- 5 requisições/segundo
- Estratégia: cache de 24h + batch requests

---

## 6. Integração Claude API

### Uso Principal
```typescript
// Diagnóstico de perfil
const diagnosis = await claude.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 2000,
  system: `Você é um especialista em otimização de Google Meu Negócio
           para profissionais de saúde no Brasil. Analise o perfil e
           gere um diagnóstico em português claro e acionável.
           Segmento: ${segment}`,
  messages: [{
    role: "user",
    content: `Perfil: ${JSON.stringify(profileData)}\nScore: ${score}`
  }]
})

// Geração de post semanal
const post = await claude.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 500,
  system: `Você gera posts para Google Meu Negócio de ${segment} brasileiros.
           Posts devem ser profissionais, locais, com CTA claro.
           Máximo 300 caracteres.`,
  messages: [...]
})
```

---

## 7. Scoring Algorithm

### Pesos por categoria
```
Informações Básicas:  25 pontos
  - Nome completo:     5pts
  - Telefone:          5pts
  - Endereço:          5pts
  - Horários:          5pts
  - Website:           3pts
  - Categoria correta: 2pts

Fotos:               20 pontos
  - 1+ foto logo:      5pts
  - 3+ fotos espaço:   5pts
  - 5+ fotos total:    5pts
  - Foto capa:         5pts

Avaliações:          25 pontos
  - 10+ avaliações:   10pts
  - Rating >= 4.0:    10pts
  - 80%+ respondidas:  5pts

Posts:               15 pontos
  - Post nos últimos 7 dias:  10pts
  - Post no último mês:        5pts

Serviços:            10 pontos
  - 3+ serviços listados:     5pts
  - Descrições completas:      5pts

Atributos:            5 pontos
  - 5+ atributos relevantes:   5pts

TOTAL: 100 pontos
```

---

## 8. Infraestrutura de Produção

### Stack de Deploy (Recomendado)

| Componente | Serviço | Custo/mês |
|-----------|---------|-----------|
| Frontend + API | Vercel Pro | $20 |
| Banco de Dados | Supabase Pro (Brasil) | $25 |
| Cache + Filas | Redis Cloud (Railway) | $10 |
| Domínio | Registro.br | R$40/ano |
| SSL | Vercel (incluso) | $0 |
| E-mail | Resend | $20 |
| **Total** | | **~$75/mês** |

### Alternativa: VPS Único (DigitalOcean)
Ver `docs/guides/server-requirements.md` para instruções detalhadas.

---

## 9. Segurança

- Tokens Google armazenados criptografados (AES-256-GCM)
- Chave de criptografia no ambiente (nunca no banco)
- Rate limiting: 100 req/min por usuário
- Validação Zod em todos os inputs
- CORS restrito ao domínio da aplicação
- Audit log de todas as ações na API do Google
- LGPD: dados de clientes brasileiros em região BR

---

## 10. Monitoramento

- Sentry: error tracking (plano free suficiente para MVP)
- Vercel Analytics: métricas de performance
- Logs de jobs: salvos no banco com TTL de 90 dias
- Alertas: e-mail para jobs com falha repetida
