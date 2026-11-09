export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { replyToReview as zernioReplyToReview } from '@/lib/zernio/client'

function adminDb() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// PATCH /api/reviews/[id]
// Actions: publish (edita texto + publica via Zernio), ignore (marca como ignorado)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { reply?: string; action?: string }
  const { reply, action } = body

  const admin = adminDb()

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

  if (action === 'ignore') {
    // Marca review_response como rejected
    await admin
      .from('review_responses')
      .update({ status: 'rejected' })
      .eq('review_id', reviewId)
      .eq('organization_id', orgId)
      .eq('status', 'pending')
    return NextResponse.json({ status: 'ignored' })
  }

  if (action === 'publish') {
    // Busca review_response pendente
    const { data: resp } = await admin
      .from('review_responses')
      .select('id, generated_text, review_id')
      .eq('review_id', reviewId)
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!resp) {
      return NextResponse.json({ error: 'Nenhuma resposta pendente para este review' }, { status: 404 })
    }

    // Se o usuario editou o texto, usar o editado
    const finalText = reply?.trim() || resp.generated_text

    // Atualizar texto no banco (caso editado)
    if (reply?.trim() && reply.trim() !== resp.generated_text) {
      await admin
        .from('review_responses')
        .update({ generated_text: finalText })
        .eq('id', resp.id)
    }

    // Buscar review_id original do Google
    const { data: review } = await admin
      .from('reviews')
      .select('review_id')
      .eq('id', reviewId)
      .maybeSingle()

    if (!review?.review_id) {
      return NextResponse.json({ error: 'Review não encontrado' }, { status: 404 })
    }

    // Buscar zernio_account_id
    const { data: org } = await admin
      .from('organizations')
      .select('zernio_account_id')
      .eq('id', orgId)
      .maybeSingle()

    if (!org?.zernio_account_id) {
      return NextResponse.json({ error: 'Conta Google Business não conectada. Faça login novamente.' }, { status: 400 })
    }

    // Publicar via Zernio
    try {
      const success = await zernioReplyToReview(org.zernio_account_id, review.review_id, finalText)
      if (!success) {
        return NextResponse.json({ error: 'Falha ao publicar resposta no Google. Tente novamente.' }, { status: 502 })
      }
    } catch (err) {
      console.error('[reviews/patch] Zernio reply error:', err instanceof Error ? err.message : err)
      return NextResponse.json({ error: 'Falha ao publicar resposta no Google. Tente novamente.' }, { status: 502 })
    }

    // Marcar como published
    await admin
      .from('review_responses')
      .update({ status: 'published', generated_text: finalText, published_at: new Date().toISOString() })
      .eq('id', resp.id)

    return NextResponse.json({ status: 'published' })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
