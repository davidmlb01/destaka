# GMM — Google Meu Negócio Manager

## Projeto
SaaS para automatizar otimização do Google Business Profile para profissionais liberais brasileiros.

## Stack
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth)
- BullMQ + Redis (Upstash)
- next-auth v5
- Stripe
- Claude API (@anthropic-ai/sdk)
- Resend

## Documentação
- PRD: `docs/prd/gmm-prd.md`
- Arquitetura: `docs/architecture/gmm-architecture.md`
- Servidor: `docs/guides/server-requirements.md`
- Stories: `docs/stories/`

## Processos de Sessão
Ao fim de cada sessão importante:
1. Atualizar `docs/MASTER-BACKUP.md`
2. Fazer git commit + push
