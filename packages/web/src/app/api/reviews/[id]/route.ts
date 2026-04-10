import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { trackEvent } from '@/lib/analytics'

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

  // Verify ownership
  const { data: review } = await serviceClient
    .from('gmb_reviews')
    .select('id, profile_id, gmb_profiles(user_id)')
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

    // Em produção: chamar GMB API para publicar a resposta
    // Por ora persiste no banco e marca como replied
    await serviceClient
      .from('gmb_reviews')
      .update({ reply: body.reply, reply_status: 'replied' })
      .eq('id', id)

    // Evento de engajamento: resposta a avaliação publicada
    trackEvent(serviceClient, user.id, 'review_responded', { profileId: review.profile_id })

    return NextResponse.json({ success: true, status: 'replied' })
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
