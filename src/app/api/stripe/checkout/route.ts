export const dynamic = 'force-dynamic'

// Cria sessao de checkout no Stripe
// Inclui logica de indicacao (referral): aplica cupom e armazena codigo no metadata
import { NextRequest, NextResponse } from 'next/server'
import { getAuthOrg } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getStripe, PLAN } from '@/lib/stripe'
import { REFERRAL_COOKIE_NAME } from '@/lib/referral/constants'

function createServiceClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { user, orgId } = auth

  const admin = createServiceClient()
  const stripe = getStripe()

  // Buscar ou criar customer no Stripe
  const { data: org } = await admin
    .from('organizations')
    .select('stripe_customer_id, name')
    .eq('id', orgId)
    .maybeSingle()

  let customerId = (org as Record<string, unknown>)?.stripe_customer_id as string | null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: (org as Record<string, unknown>)?.name as string ?? user.email!,
      metadata: { organization_id: orgId },
    })
    customerId = customer.id

    await admin
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', orgId)
  }

  // --- Referral: verificar cookie de indicacao ---
  let referralCode: string | null = null
  let referralCouponId: string | null = null

  const refCookie = request.cookies.get(REFERRAL_COOKIE_NAME)
  if (refCookie?.value) {
    try {
      const { data: codeRecord } = await admin
        .from('referral_codes')
        .select('code, owner_type, owner_user_id, stripe_coupon_id')
        .eq('code', refCookie.value)
        .eq('active', true)
        .maybeSingle()

      if (codeRecord) {
        // Bloquear auto-indicacao: se o dono do codigo e o mesmo usuario
        const isSelfReferral =
          codeRecord.owner_type === 'client' &&
          codeRecord.owner_user_id === user.id

        if (isSelfReferral) {
          console.log(`[referral] Auto-indicacao bloqueada: user=${user.id}, code=${codeRecord.code}`)
        } else {
          referralCode = codeRecord.code
          referralCouponId = codeRecord.stripe_coupon_id ?? null
          console.log(`[referral] Codigo valido: ${referralCode}, cupom=${referralCouponId ?? 'nenhum'}`)
        }
      } else {
        console.log(`[referral] Codigo do cookie nao encontrado ou inativo: ${refCookie.value}`)
      }
    } catch (refErr) {
      console.error('[referral] Erro ao verificar codigo de indicacao:', refErr)
    }
  }

  // Criar checkout session
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'

  // Metadata com referral e UTMs
  const sessionMetadata: Record<string, string> = { organization_id: orgId }
  const subscriptionMetadata: Record<string, string> = { organization_id: orgId }

  if (referralCode) {
    sessionMetadata.referral_code = referralCode
    subscriptionMetadata.referral_code = referralCode
  }

  // Capturar UTM params do query string
  const url = new URL(request.url)
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
  for (const param of utmParams) {
    const value = url.searchParams.get(param)
    if (value) {
      sessionMetadata[param] = value
    }
  }

  // Se tem cupom de indicacao, usar discounts (nao pode usar allow_promotion_codes junto)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkoutParams: any = {
    customer: customerId,
    mode: 'subscription' as const,
    line_items: [{ price: PLAN.priceId, quantity: 1 }],
    success_url: `${origin}/onboarding?checkout=success`,
    cancel_url: `${origin}/diagnostico`,
    metadata: sessionMetadata,
    subscription_data: {
      metadata: subscriptionMetadata,
    },
  }

  if (referralCouponId) {
    checkoutParams.discounts = [{ coupon: referralCouponId }]
  } else {
    checkoutParams.allow_promotion_codes = true
  }

  const session = await stripe.checkout.sessions.create(checkoutParams)

  return NextResponse.json({ url: session.url })
}
