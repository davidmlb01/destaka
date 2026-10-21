// Webhook do Stripe: recebe eventos de checkout, subscription, invoice e charge
// Persiste status no banco e dispara regua de email via Inngest
// Inclui logica do programa de indicacao (referral)

import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { inngest } from '@/lib/inngest/client'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cacheSet } from '@/lib/redis'
import {
  REFERRAL_TRIGGER_INVOICE,
  PARTNER_COMMISSION_RATE,
  PARTNER_COMMISSION_MONTHS,
  getCouponForActiveReferrals,
} from '@/lib/referral/constants'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ============================================================================
// Helpers de idempotencia e referral
// ============================================================================

/** Registra evento do Stripe para idempotencia. Retorna true se e novo. */
async function registerStripeEvent(
  admin: ReturnType<typeof getAdmin>,
  eventId: string,
  eventType: string
): Promise<boolean> {
  const { data, error } = await admin
    .from('stripe_events')
    .insert({ id: eventId, event_type: eventType })
    .select('id')
    .single()

  if (error?.code === '23505') return false // ja processado
  if (error) {
    console.error('[referral] Erro ao registrar stripe_event:', error.message)
    return false
  }
  return !!data
}

/** Recalcula e aplica o cupom escalonado do indicador (cliente). */
async function recalculateIndicadorCoupon(
  admin: ReturnType<typeof getAdmin>,
  userId: string
): Promise<void> {
  const stripe = getStripe()

  // Contar indicados ativos via funcao do banco
  const { data: countResult } = await admin
    .rpc('count_active_referrals', { p_user_id: userId })

  const activeCount = countResult ?? 0
  const couponId = getCouponForActiveReferrals(activeCount)

  console.log(`[referral] Indicador ${userId}: ${activeCount} indicados ativos, cupom=${couponId ?? 'nenhum'}`)

  // Buscar subscription ativa do indicador
  const { data: orgMember } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .maybeSingle()

  if (!orgMember) {
    console.warn('[referral] Indicador sem organizacao encontrada:', userId)
    return
  }

  const { data: org } = await admin
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', orgMember.organization_id)
    .maybeSingle()

  if (!org?.stripe_customer_id) {
    console.warn('[referral] Organizacao sem stripe_customer_id:', orgMember.organization_id)
    return
  }

  // Buscar subscription ativa do customer
  const subscriptions = await stripe.subscriptions.list({
    customer: org.stripe_customer_id,
    status: 'active',
    limit: 1,
  })

  const sub = subscriptions.data[0]
  if (!sub) {
    console.warn('[referral] Nenhuma subscription ativa para customer:', org.stripe_customer_id)
    return
  }

  // Aplicar ou remover cupom via discounts
  if (couponId) {
    await stripe.subscriptions.update(sub.id, { discounts: [{ coupon: couponId }] })
    console.log(`[referral] Cupom ${couponId} aplicado na subscription ${sub.id}`)
  } else {
    await stripe.subscriptions.update(sub.id, { discounts: [] })
    console.log(`[referral] Cupom removido da subscription ${sub.id}`)
  }
}

// ============================================================================
// Handler principal
// ============================================================================

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET nao configurado')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[stripe/webhook] Falha na verificacao da assinatura:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = getAdmin()
  const stripe = getStripe()

  switch (event.type) {
    // ========================================================================
    // CHECKOUT CONCLUIDO
    // ========================================================================
    case 'checkout.session.completed': {
      const session = event.data.object

      if (session.mode !== 'subscription') break

      const organizationId = session.metadata?.organization_id
      const customerEmail = session.customer_details?.email ?? session.customer_email

      if (!organizationId) {
        console.error('[stripe/webhook] checkout.session.completed sem organization_id no metadata')
        break
      }

      // Persiste status ativo no banco (evita chamar Stripe API no SSR)
      await admin
        .from('organizations')
        .update({
          subscription_status: 'active',
          stripe_customer_id: session.customer,
        })
        .eq('id', organizationId)

      // Invalida cache de subscription
      await cacheSet(`sub:${organizationId}`, true, 300)

      // Dispara sequencia de email pos-contratacao (idempotente via event.id)
      await inngest.send({
        id: `sub-activated-${event.id}`,
        name: 'destaka/subscription.activated',
        data: {
          organization_id: organizationId,
          user_email: customerEmail ?? '',
        },
      })

      console.log(`[stripe/webhook] Assinatura ativada para org ${organizationId}`)

      // --- Referral: criar registro de indicacao se houver codigo ---
      try {
        const referralCode = session.metadata?.referral_code
          ?? session.subscription_data?.metadata?.referral_code

        if (referralCode) {
          console.log(`[referral] Checkout com codigo de indicacao: ${referralCode}`)

          // Buscar codigo no banco
          const { data: codeRecord } = await admin
            .from('referral_codes')
            .select('id, owner_type, owner_user_id, owner_partner_id')
            .eq('code', referralCode)
            .eq('active', true)
            .maybeSingle()

          if (codeRecord) {
            // Buscar o user_id do comprador via organization
            const { data: members } = await admin
              .from('organization_members')
              .select('user_id')
              .eq('organization_id', organizationId)
              .eq('role', 'owner')
              .limit(1)

            const referredUserId = members?.[0]?.user_id

            if (referredUserId) {
              // Buscar stripe_subscription_id da session
              const stripeSubId = typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription?.id

              await admin.from('referrals').insert({
                referral_code_id: codeRecord.id,
                referred_user_id: referredUserId,
                referred_org_id: organizationId,
                stripe_subscription_id: stripeSubId ?? null,
                status: 'pending',
              })

              console.log(`[referral] Indicacao criada: user=${referredUserId}, code=${referralCode}, sub=${stripeSubId}`)
            }
          } else {
            console.warn(`[referral] Codigo de indicacao nao encontrado ou inativo: ${referralCode}`)
          }
        }
      } catch (refErr) {
        console.error('[referral] Erro ao processar indicacao no checkout:', refErr)
      }

      break
    }

    // ========================================================================
    // INVOICE PAGA (gatilho de ativacao de indicacao + comissao)
    // ========================================================================
    case 'invoice.paid': {
      const invoice = event.data.object

      // Idempotencia
      const isNew = await registerStripeEvent(admin, event.id, 'invoice.paid')
      if (!isNew) {
        console.log(`[referral] Evento ${event.id} ja processado, ignorando`)
        break
      }

      try {
        const subscriptionId = invoice.subscription
        if (!subscriptionId) break

        // Buscar indicacao vinculada a essa subscription
        const { data: referral } = await admin
          .from('referrals')
          .select('id, referral_code_id, status, referred_user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle()

        if (!referral) break // sem indicacao vinculada

        // Contar invoices pagas dessa subscription
        const invoices = await stripe.invoices.list({
          subscription: subscriptionId,
          status: 'paid',
          limit: 100,
        })
        const paidCount = invoices.data.length

        console.log(`[referral] Invoice paga #${paidCount} para subscription ${subscriptionId}`)

        // Buscar dados do codigo de indicacao
        const { data: codeRecord } = await admin
          .from('referral_codes')
          .select('id, owner_type, owner_user_id, owner_partner_id')
          .eq('id', referral.referral_code_id)
          .single()

        if (!codeRecord) break

        // --- Ativacao na 2a invoice ---
        if (paidCount >= REFERRAL_TRIGGER_INVOICE && referral.status === 'pending') {
          await admin
            .from('referrals')
            .update({ status: 'active', activated_at: new Date().toISOString() })
            .eq('id', referral.id)

          console.log(`[referral] Indicacao ${referral.id} ativada (invoice #${paidCount})`)

          if (codeRecord.owner_type === 'client' && codeRecord.owner_user_id) {
            // Recalcular cupom escalonado do indicador
            await recalculateIndicadorCoupon(admin, codeRecord.owner_user_id)

            // Criar reward de desconto para tracking
            await admin.from('rewards').insert({
              referral_id: referral.id,
              type: 'discount',
              stripe_invoice_id: invoice.id,
              amount_cents: 0, // desconto e aplicado via cupom
              status: 'applied',
            })
          }
        }

        // --- Comissao para parceiro/instituicao ---
        if (
          codeRecord.owner_type !== 'client' &&
          codeRecord.owner_partner_id
        ) {
          // Buscar regra de recompensa do parceiro
          const { data: partner } = await admin
            .from('partners')
            .select('reward_rule')
            .eq('id', codeRecord.owner_partner_id)
            .single()

          if (partner?.reward_rule === 'commission' && paidCount <= PARTNER_COMMISSION_MONTHS) {
            const amountPaid = invoice.amount_paid ?? 0 // em centavos
            const commissionCents = Math.round(amountPaid * PARTNER_COMMISSION_RATE)

            await admin.from('rewards').insert({
              referral_id: referral.id,
              type: 'commission',
              stripe_invoice_id: invoice.id,
              amount_cents: commissionCents,
              status: 'pending',
            })

            console.log(`[referral] Comissao de ${commissionCents} centavos criada para parceiro ${codeRecord.owner_partner_id} (invoice #${paidCount})`)
          }
        }
      } catch (refErr) {
        console.error('[referral] Erro ao processar invoice.paid:', refErr)
      }

      break
    }

    // ========================================================================
    // CHARGE REEMBOLSADA
    // ========================================================================
    case 'charge.refunded': {
      const charge = event.data.object

      // Idempotencia
      const isNew = await registerStripeEvent(admin, event.id, 'charge.refunded')
      if (!isNew) break

      try {
        const invoiceId = charge.invoice
        if (!invoiceId) break

        // Buscar rewards vinculados a essa invoice
        const { data: rewards } = await admin
          .from('rewards')
          .select('id, referral_id, type, status')
          .eq('stripe_invoice_id', invoiceId)

        if (!rewards || rewards.length === 0) break

        for (const reward of rewards) {
          if (reward.status === 'reversed') continue

          await admin
            .from('rewards')
            .update({ status: 'reversed', reversed_at: new Date().toISOString() })
            .eq('id', reward.id)

          console.log(`[referral] Reward ${reward.id} revertido (charge refunded)`)

          // Se era desconto (indicador cliente), recalcular cupom
          if (reward.type === 'discount') {
            const { data: referral } = await admin
              .from('referrals')
              .select('referral_code_id')
              .eq('id', reward.referral_id)
              .single()

            if (referral) {
              const { data: codeRecord } = await admin
                .from('referral_codes')
                .select('owner_user_id')
                .eq('id', referral.referral_code_id)
                .single()

              if (codeRecord?.owner_user_id) {
                await recalculateIndicadorCoupon(admin, codeRecord.owner_user_id)
              }
            }
          }
        }
      } catch (refErr) {
        console.error('[referral] Erro ao processar charge.refunded:', refErr)
      }

      break
    }

    // ========================================================================
    // SUBSCRIPTION CANCELADA
    // ========================================================================
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const orgId = subscription.metadata?.organization_id

      if (orgId) {
        // Marca como cancelada no banco
        await admin
          .from('organizations')
          .update({ subscription_status: 'cancelled' })
          .eq('id', orgId)

        // Invalida cache
        await cacheSet(`sub:${orgId}`, false, 300)

        await inngest.send({
          id: `sub-cancelled-${event.id}`,
          name: 'destaka/subscription.cancelled',
          data: { organization_id: orgId },
        })
      }

      // --- Referral: marcar indicacao como cancelada e recalcular cupom ---
      try {
        const { data: referral } = await admin
          .from('referrals')
          .select('id, referral_code_id, status')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle()

        if (referral && referral.status !== 'cancelled') {
          await admin
            .from('referrals')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('id', referral.id)

          console.log(`[referral] Indicacao ${referral.id} cancelada (subscription deleted)`)

          // Buscar dono do codigo para recalcular cupom
          const { data: codeRecord } = await admin
            .from('referral_codes')
            .select('owner_type, owner_user_id')
            .eq('id', referral.referral_code_id)
            .single()

          if (codeRecord?.owner_type === 'client' && codeRecord.owner_user_id) {
            await recalculateIndicadorCoupon(admin, codeRecord.owner_user_id)
          }
        }
      } catch (refErr) {
        console.error('[referral] Erro ao processar cancelamento de indicacao:', refErr)
      }

      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
