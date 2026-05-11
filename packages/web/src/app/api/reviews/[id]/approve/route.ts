import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { replyToReview } from '@/lib/gmb/client'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

// POST /api/reviews/[id]/approve - Aprovar e publicar resposta
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await getAuthenticatedProfile('id, google_location_id')
  if ('error' in auth) return auth.error

  const { profile, serviceClient } = auth

  // Buscar review pendente
  const { data: review, error: fetchErr } = await serviceClient
    .from('gmb_reviews')
    .select('*')
    .eq('id', id)
    .eq('profile_id', profile.id)
    .single()

  if (fetchErr || !review) {
    return NextResponse.json({ error: 'Avaliacao nao encontrada' }, { status: 404 })
  }

  if (review.reply_status !== 'pending_approval') {
    return NextResponse.json({ error: 'Avaliacao nao esta pendente de aprovacao' }, { status: 400 })
  }

  const replyText = review.ai_reply_draft || review.reply
  if (!replyText) {
    return NextResponse.json({ error: 'Nenhuma resposta para publicar' }, { status: 400 })
  }

  // Publicar na GBP API
  try {
    const token = await getValidGmbToken(auth.user.id)
    if (token && review.google_review_id) {
      await replyToReview(token, review.google_review_id, replyText)
    }
  } catch (err) {
    logger.error('reviews/approve', 'Erro ao publicar resposta na GBP', { reviewId: id })
  }

  // Atualizar no banco
  await serviceClient
    .from('gmb_reviews')
    .update({ reply: replyText, reply_status: 'approved', ai_reply_draft: null })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}

// DELETE /api/reviews/[id]/approve - Rejeitar resposta
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await getAuthenticatedProfile('id')
  if ('error' in auth) return auth.error

  const { profile, serviceClient } = auth

  await serviceClient
    .from('gmb_reviews')
    .update({ reply_status: 'rejected', ai_reply_draft: null })
    .eq('id', id)
    .eq('profile_id', profile.id)

  return NextResponse.json({ ok: true })
}
