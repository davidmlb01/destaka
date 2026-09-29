// Webhook do Stripe: recebe eventos de checkout e subscription
// Dispara a regua de email de onboarding via Inngest

import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { inngest } from '@/lib/inngest/client'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET não configurado')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[stripe/webhook] Falha na verificação da assinatura:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object

      // Somente subscriptions (ignora pagamentos avulsos)
      if (session.mode !== 'subscription') break

      const organizationId = session.metadata?.organization_id
      const customerEmail = session.customer_details?.email ?? session.customer_email

      if (!organizationId) {
        console.error('[stripe/webhook] checkout.session.completed sem organization_id no metadata')
        break
      }

      // Dispara sequência de email pós-contratação (idempotente via event.id)
      await inngest.send({
        id: `sub-activated-${event.id}`,
        name: 'destaka/subscription.activated',
        data: {
          organization_id: organizationId,
          user_email: customerEmail ?? '',
        },
      })

      console.log(`[stripe/webhook] Sequencia de onboarding disparada para org ${organizationId}`)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const orgId = subscription.metadata?.organization_id

      if (orgId) {
        // Cancela a sequencia de onboarding em andamento (se houver)
        await inngest.send({
          id: `sub-cancelled-${event.id}`,
          name: 'destaka/subscription.cancelled',
          data: { organization_id: orgId },
        })
      }
      break
    }

    default:
      // Evento não tratado, apenas acknowledge
      break
  }

  return NextResponse.json({ received: true })
}
