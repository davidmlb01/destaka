import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// POST /api/stripe/portal
// Cria sessão no Stripe Customer Portal para o usuário gerenciar a assinatura
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const serviceClient = await createServiceClient()
  const { data: dbUser } = await serviceClient
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!dbUser?.stripe_customer_id) {
    return NextResponse.json({ error: 'Sem assinatura ativa' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://destaka.com.br'

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripe_customer_id,
    return_url: `${appUrl}/saude/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
