import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { resend, FROM } from '@/lib/email'
import { sendWelcomeEmail } from '@/lib/email/welcome'
import { logger } from '@/lib/logger'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

// POST /api/stripe/webhook
// Recebe eventos do Stripe e atualiza o plano do usuário
export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Sem assinatura' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()

  // Idempotência: ignora eventos já processados
  const { error: dupError } = await serviceClient
    .from('stripe_webhook_log')
    .insert({ stripe_event_id: event.id })
  if (dupError) {
    // Duplicate key = evento já processado — retorna 200 para o Stripe não retentar
    return NextResponse.json({ received: true, duplicate: true })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan
      const customerId = session.customer as string

      if (!userId || !plan) break

      await serviceClient
        .from('users')
        .update({
          plan,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      // Email de boas-vindas dia 0
      const { data: newUser } = await serviceClient
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .maybeSingle()

      if (newUser?.email) {
        await sendWelcomeEmail({
          to: newUser.email,
          name: newUser.name || 'profissional',
        }).catch((err) => logger.warn('stripe/webhook', 'falha ao enviar welcome email', { err }))
      }

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await serviceClient
        .from('users')
        .update({ plan: 'free', updated_at: new Date().toISOString() })
        .eq('stripe_customer_id', customerId)

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const status = subscription.status

      // Rebaixa para free apenas em cancelamento definitivo ou inadimplência confirmada.
      // past_due = pagamento atrasado, Stripe retentar automaticamente — NÃO downgrader ainda.
      if (status === 'canceled' || status === 'unpaid') {
        await serviceClient
          .from('users')
          .update({ plan: 'free', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', customerId)
      }

      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const attempt = invoice.attempt_count ?? 1

      logger.warn('stripe/webhook', 'pagamento falhou', { customerId, attempt })

      // Busca email do usuário para notificar
      const { data: user } = await serviceClient
        .from('users')
        .select('email, name')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (user?.email) {
        await resend.emails.send({
          from: FROM,
          to: user.email,
          subject: 'Destaka: problema com seu pagamento',
          html: `
            <p>Olá${user.name ? `, ${user.name}` : ''},</p>
            <p>Não conseguimos processar o pagamento da sua assinatura Destaka.</p>
            <p>Vamos tentar novamente nos próximos dias. Se o problema persistir, atualize seu cartão no painel do Stripe.</p>
            <p>Qualquer dúvida, responda este email.</p>
            <p>Equipe Destaka</p>
          `,
        }).catch(() => {})
      }

      break
    }
  }

  return NextResponse.json({ received: true })
}
