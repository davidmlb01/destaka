export const dynamic = 'force-dynamic'

// Gera sugestão de resposta via IA para um review específico (ação manual do usuário)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { generateReviewResponse, type ReviewTone } from '@/lib/gbp/review-response-engine'
import { hasLgpdConsentForAi } from '@/lib/ai/prompt-sanitizer'
import { z } from 'zod'

const BodySchema = z.object({ reviewId: z.string().uuid() })

function adminDb() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 })

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'reviewId inválido' }, { status: 400 })
  const { reviewId } = parsed.data

  // Resolve user -> org
  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id
  const admin = adminDb()

  // Busca o review
  const { data: review } = await admin
    .from('reviews')
    .select('id, review_id, author_name, rating, comment')
    .eq('id', reviewId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (!review) {
    return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
  }

  // Busca dados da org para o prompt
  const { data: org } = await admin
    .from('organizations')
    .select('name, specialty, tone, lgpd_ai_consent, lgpd_consent_date')
    .eq('id', orgId)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 500 })
  }

  if (!hasLgpdConsentForAi(org)) {
    return NextResponse.json({ error: 'Consentimento LGPD para uso de IA não configurado.' }, { status: 403 })
  }

  // Busca cidade
  const { data: profile } = await admin
    .from('gbp_profiles')
    .select('address')
    .eq('organization_id', orgId)
    .maybeSingle()

  const address = profile?.address as { locality?: string } | null
  const city = address?.locality ?? 'Brasil'

  // Gera resposta
  try {
    const reply = await generateReviewResponse({
      reviewComment: review.comment ?? '',
      starRating: review.rating,
      professionalName: org.name,
      reviewerName: review.author_name ?? '',
      specialty: org.specialty,
      city,
      tone: (org.tone as ReviewTone) ?? 'proximo',
    })

    // Salva como draft pendente (se não existir)
    const { data: existing } = await admin
      .from('review_responses')
      .select('id')
      .eq('review_id', review.id)
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      await admin
        .from('review_responses')
        .update({ generated_text: reply })
        .eq('id', existing.id)
    } else {
      await admin.from('review_responses').insert({
        review_id: review.id,
        organization_id: orgId,
        generated_text: reply,
        status: 'pending',
      })
    }

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[generate-reply] Erro ao gerar resposta:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Não foi possível gerar a resposta. Tente novamente.' }, { status: 500 })
  }
}
