# EPIC-REF-001: Programa de Indicacao

**Status:** In Progress
**Created:** 2026-10-20
**Board approval:** 2026-10-20 (CEO + CMO + CFO + CTO + Hormozi)

## Visao

Sistema de indicacao com tres tipos de indicadores (clientes, parceiros, instituicoes)
que recompensa automaticamente via webhook do Stripe.

Dream Outcome: "Indique 5 colegas e nunca mais pague"
North Star: % de novos clientes vindos por indicacao (meta 40% em 6 meses)

## Premissas Fechadas (Board)

- Gatilho do cliente: 2a mensalidade paga do indicado
- Comissao: 30% sobre valor efetivamente pago
- Teto do desconto: 100% (5 indicados ativos)
- Cupons do indicado: 20% permanente, 50% no 1o mes
- Cupons do indicador: 20%, 40%, 60%, 80%, 100% (permanentes, escalonados)
- Lancamento faseado: clientes primeiro (Fases 0-6)

## Stories

### REF-001.1: Schema + Stripe Config (Fases 1-2) -- DONE
- [x] Migration 028: 5 tabelas (partners, referral_codes, referrals, rewards, stripe_events)
- [x] Aplicar migration no Supabase
- [x] Criar cupons no Stripe test mode (indicado: 20% forever, 50% first month)
- [x] Criar cupons escalonados (indicador: 20%, 40%, 60%, 80%, 100%)
- [x] Registrar webhook events adicionais (invoice.paid, charge.refunded)
- [x] Constants centralizadas em src/lib/referral/constants.ts

### REF-001.2: Captura de Codigo (Fase 3) -- DONE
- [x] Proxy.ts para ler ?ref= e salvar cookie 90 dias
- [x] Cupom pre-aplicado no checkout via discounts
- [x] referral_code gravado no metadata da session e subscription
- [x] Bloqueio de autoindicacao
- [x] UTM params capturados no metadata

### REF-001.3: Webhook Core (Fase 4) -- DONE
- [x] Idempotencia via stripe_events (registerStripeEvent helper)
- [x] checkout.session.completed: registrar referral
- [x] invoice.paid: contar mensalidades, ativar na 2a, comissao parceiro
- [x] charge.refunded: marcar reward como reversed, recalcular cupom
- [x] customer.subscription.deleted: cancelar referral, recalcular cupom
- [x] recalculateIndicadorCoupon helper (busca subscription, aplica cupom escalonado)

### REF-001.4: Codigos Automaticos (Fase 5)
- [ ] Gerar codigo no onboarding (nome -> DRANA)
- [ ] Comando Claude Code para criar codigo de parceiro

### REF-001.5: Telas do Indicador (Fase 6)
- [ ] Area do cliente: codigo, link, compartilhar, indicacoes, creditos
- [ ] Relatorio do parceiro

### REF-001.6: Instituicoes + Landing (Fase 7)
- [ ] Codigo de instituicao com regra e cupom de turma
- [ ] Landing destaka.com.br/CODIGO com logo e desconto
- [ ] Relatorio mensal automatico

### REF-001.7: Gatilho Automatico (Fase 8)
- [ ] Disparar pedido no ganho de posicao
- [ ] WhatsApp automatico com prova social
- [ ] Limite 1 pedido/mes

### REF-001.8: Lancamento (Fase 9)
- [ ] Chaves Stripe producao
- [ ] Gerar codigos para base existente
- [ ] Comunicacao aos clientes
