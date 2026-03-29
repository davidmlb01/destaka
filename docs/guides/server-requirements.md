# Requisitos de Servidor — GMM
**Documento:** Infraestrutura & Deploy

---

## Opção 1 (Recomendada): Deploy Cloud Gerenciado

A opção mais simples, escalável e sem necessidade de gerenciar servidor.

### Componentes

#### Vercel (Frontend + API)
- Plano: **Pro** ($20/mês)
- Deploy do Next.js completo (frontend + API routes)
- SSL automático
- CDN global
- Deploy via `git push` — zero configuração
- Variáveis de ambiente seguras no painel

#### Supabase (Banco de Dados)
- Plano: **Pro** ($25/mês)
- PostgreSQL 15 managed
- Região: **South America (São Paulo)** — LGPD compliance
- Backups automáticos diários
- Auth integrada (alternativa ao next-auth)
- Painel de migrations incluído

#### Redis (Filas de Jobs)
- **Upstash Redis** — $10/mês
- Serverless Redis, paga por uso
- Integração nativa com Vercel
- Perfeito para BullMQ

#### Total: ~$55–75/mês (tudo gerenciado, zero ops)

---

## Opção 2: VPS Único (DigitalOcean / Hetzner)

Para quem quer controle total ou reduzir custo no início.

### Especificações Mínimas (até 500 usuários)
```
CPU:    2 vCPUs
RAM:    4 GB
Disco:  80 GB SSD
OS:     Ubuntu 22.04 LTS
Custo:  ~$24/mês (DigitalOcean) ou ~€8/mês (Hetzner)
```

### Especificações Recomendadas (até 2.000 usuários)
```
CPU:    4 vCPUs
RAM:    8 GB
Disco:  160 GB SSD
OS:     Ubuntu 22.04 LTS
Custo:  ~$48/mês (DigitalOcean) ou ~€14/mês (Hetzner)
```

### Software necessário no VPS
```bash
# Runtime
Node.js 20 LTS (via nvm)
npm / pnpm

# Banco de dados
PostgreSQL 15
Redis 7

# Processo
PM2 (gerenciador de processos Node.js)

# Proxy reverso
Nginx

# SSL
Certbot (Let's Encrypt) — gratuito

# Opcional
Docker + Docker Compose (facilita o setup)
```

### Setup via Docker Compose (recomendado no VPS)
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: gmm
      POSTGRES_USER: gmm_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt

volumes:
  pgdata:
  redisdata:
```

---

## Variáveis de Ambiente Necessárias

```bash
# App
NODE_ENV=production
NEXTAUTH_URL=https://seudominio.com.br
NEXTAUTH_SECRET=<random-32-chars>

# Google OAuth + Business Profile API
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=https://seudominio.com.br/api/auth/callback/google

# Banco de dados
DATABASE_URL=postgresql://user:pass@localhost:5432/gmm

# Redis
REDIS_URL=redis://localhost:6379

# Claude API
ANTHROPIC_API_KEY=<from console.anthropic.com>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ESSENCIAL=price_...
STRIPE_PRICE_PRO=price_...

# E-mail
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@seudominio.com.br

# Criptografia (tokens Google)
ENCRYPTION_KEY=<random-32-bytes-hex>

# Sentry (opcional)
SENTRY_DSN=https://...
```

---

## Configuração Google Cloud Console

### Passo a passo para ativar a API
1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto: `gmm-production`
3. Ative as APIs:
   - **Google Business Profile API**
   - **Google My Business API** (legacy, alguns endpoints ainda usam)
4. Crie credenciais OAuth 2.0:
   - Tipo: Web Application
   - Authorized origins: `https://seudominio.com.br`
   - Redirect URIs: `https://seudominio.com.br/api/auth/callback/google`
5. Em OAuth Consent Screen:
   - App name: GMM - Google Meu Negócio Manager
   - Scopes necessários:
     - `https://www.googleapis.com/auth/business.manage`
     - `email`
     - `profile`
6. **Importante:** A Google Business Profile API requer aprovação para produção. Submeter o app para verificação antes do lançamento.

### Quotas da API (gratuitas)
- 1.000 requests/dia/projeto
- Para escalar: solicitar aumento via Google Cloud Console
- Estratégia: cache agressivo de 24h evita bater o limite até ~500 usuários

---

## Domínio & DNS

### Recomendação de domínio
- `gmmapp.com.br` ou `meugmm.com.br` ou `otimizagmn.com.br`
- Registro: [registro.br](https://registro.br) — ~R$40/ano

### Configuração DNS (exemplo Vercel)
```
A     @     76.76.19.61
CNAME www   cname.vercel-dns.com
MX    @     mx.resend.com (para e-mails)
TXT   @     v=spf1 include:_spf.resend.com ~all
```

---

## Estimativa de Custos por Fase

### Fase 1: Desenvolvimento (sem usuários)
| Item | Custo |
|------|-------|
| Vercel Hobby | $0 |
| Supabase Free | $0 |
| Upstash Redis Free | $0 |
| Google APIs | $0 |
| Claude API (dev) | ~$5 |
| **Total** | **~$5/mês** |

### Fase 2: MVP Lançado (até 50 usuários)
| Item | Custo |
|------|-------|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Upstash Redis | $10 |
| Claude API | ~$10 |
| Resend | $0 (free até 3k/mês) |
| Stripe | 3.99% por transação |
| **Total** | **~$65/mês** |

### Fase 3: Escala (100–500 usuários)
| Item | Custo |
|------|-------|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Redis | $25 |
| Claude API | ~$30–50 |
| Resend | $20 |
| **Total** | **~$120–140/mês** |

**Com 100 clientes em R$197/mês = R$19.700 MRR → margem técnica > 99%**

---

## Checklist de Lançamento

- [ ] Domínio registrado e DNS configurado
- [ ] Google Cloud project criado + APIs ativadas
- [ ] OAuth Consent Screen submetido para verificação
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Banco de dados Supabase criado (região BR)
- [ ] Migrations rodadas: `prisma migrate deploy`
- [ ] Redis configurado (Upstash)
- [ ] Stripe: produtos e prices criados
- [ ] Stripe: webhook configurado
- [ ] Resend: domínio verificado
- [ ] Sentry: projeto criado
- [ ] SSL ativo (Vercel cuida automaticamente)
- [ ] Teste E2E do fluxo completo (OAuth → diagnóstico → pagamento)
