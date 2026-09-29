# Destaka: Pendências para Go-to-Market

**Criado:** 2026-09-29
**Contexto:** Após sessão de auditoria completa (17 commits). Produto funcional, seguro, build passando.

---

## BLOQUEANTES (fazer antes de abrir para clientes)

- [ ] **Supabase Pro ($25/mês)**: free tier NANO pausa após 7 dias sem atividade. Se pausar, app inteiro cai. Dashboard: supabase.com > destaka > Settings > Subscription
- [ ] **Score da Pola**: logar no dashboard dela (ou pedir pra ela) e clicar "Sincronizar" para forçar re-populate com dados reais do Places API. Score deve subir de 23 para valor real
- [ ] **Testar fluxo novo usuário end-to-end**: logar com um email Google novo (terceiro usuário), confirmar: tela "Analisando...", depois score real aparece ao recarregar

## IMPORTANTES (fazer na primeira semana)

- [ ] **Stripe webhook verificar no dashboard**: confirmar que o endpoint `https://destaka.com.br/api/stripe/webhook` está registrado no Stripe dashboard (Developers > Webhooks) e recebendo eventos
- [ ] **Inngest Cloud verificar**: confirmar que os 10 jobs estão registrados e rodando em inngest.com (destaka app)
- [ ] **Testar pagamento completo**: fazer checkout teste com cartão de teste no Stripe, confirmar que subscription_status muda para "active" no banco e dashboard desbloqueia features
- [ ] **WhatsApp WABA**: resolver Meta Business Manager (conta Facebook do David desabilitada). Opção recomendada: pessoa de confiança cria Business Manager para UNLMTD

## MELHORIAS (próximas sessões)

- [ ] **Sentry/observability**: integrar logger.ts com serviço externo para alertas de erro em produção
- [ ] **Cache Redis para GBP/Places API**: cacheGet/cacheSet já existem, aplicar em métricas do dashboard (TTL 24h) e dados de concorrentes (TTL 7 dias)
- [ ] **Dashboard SSR completo**: passar dados SSR como initialData para DashboardContent (useDashboard já aceita fallbackData, falta conectar no page.tsx)
- [ ] **Migrar Anthropic SDK para AI Gateway**: sugerido pelo Vercel, melhor observabilidade e failover
- [ ] **Consolidar gmb/auth.ts**: getValidGmbToken(userId) usa .maybeSingle() que pode retornar professional errado se usuário tiver múltiplos. Trocar para receber orgId diretamente
- [ ] **Compliance de vertical**: antes de abrir Pet, revisar copy "pacientes" → "clientes/pets". Antes de Jurídico, compliance OAB

## REFERÊNCIA

- **Supabase project**: jbxnwdaflccytrcfnkek (sa-east-1)
- **Stripe**: dashboard.stripe.com (conta UNLMTD)
- **Inngest**: inngest.com (app destaka)
- **Vercel**: destaka.com.br (projeto destaka)
- **Último commit**: 2c33b5a (build OK, 17 commits na sessão)
