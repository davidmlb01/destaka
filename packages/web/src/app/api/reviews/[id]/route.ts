import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { trackEvent } from '@/lib/analytics'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { replyToReview } from '@/lib/gmb/client'

// PATCH /api/reviews/[id]
// Body: { reply, action: 'publish' | 'ignore' }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as { reply?: string; action: 'publish' | 'ignore' }

  const serviceClient = await createServiceClient()

  // Verify ownership — inclui google_review_id para reply via API
  const { data: review } = await serviceClient
    .from('gmb_reviews')
    .select('id, profile_id, google_review_id, gmb_profiles(user_id)')
    .eq('id', id)
    .single()

  if (!review) return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })

  const profileData = (Array.isArray(review.gmb_profiles) ? review.gmb_profiles[0] : review.gmb_profiles) as { user_id: string } | null
  if (!profileData || profileData.user_id !== user.id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  if (body.action === 'publish') {
    if (!body.reply?.trim()) {
      return NextResponse.json({ error: 'Resposta não pode estar vazia' }, { status: 400 })
    }

    // Publica resposta na GBP API (fail gracioso — se API falhar, salva no banco mesmo assim)
    let gbpPublished = false
    if (review.google_review_id) {
      try {
        const accessToken = await getValidGmbToken(user.id)
        await replyToReview(accessToken, review.google_review_id, body.reply)
        gbpPublished = true
      } catch (gbpErr) {
        console.warn(`[reviews/${id}] falha ao publicar na GBP, salvando no banco:`, gbpErr)
      }
    }

    await serviceClient
      .from('gmb_reviews')
      .update({ reply: body.reply, reply_status: 'replied', ai_reply_draft: null })
      .eq('id', id)

    // Evento de engajamento: resposta a avaliação publicada
    trackEvent(serviceClient, user.id, 'review_responded', { profileId: review.profile_id })

    return NextResponse.json({ success: true, status: 'replied', gbpPublished })
  }

  if (body.action === 'ignore') {
    await serviceClient
      .from('gmb_reviews')
      .update({ reply_status: 'ignored' })
      .eq('id', id)

    return NextResponse.json({ success: true, status: 'ignored' })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
