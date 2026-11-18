export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { publishPost as zernioPublishPost } from '@/lib/zernio/client'
import { geotagAndUpload } from '@/lib/media/geotag'
import { getNextPublishSlot, formatScheduleLabel } from '@/lib/posts/schedule'

function adminDb() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/posts/[id]/publish
// Agenda um post pendente para o próximo slot (segunda, quarta ou sexta às 10h BRT)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const body = await request.json().catch(() => ({})) as { content?: string }
  const editedContent = body.content?.trim() || null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 })

  const admin = adminDb()

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id

  // Buscar post pendente
  const { data: post } = await admin
    .from('posts')
    .select('id, content, photo_suggestion')
    .eq('id', postId)
    .eq('organization_id', orgId)
    .in('status', ['pending', 'draft'])
    .maybeSingle()

  if (!post) {
    return NextResponse.json({ error: 'Post não encontrado ou já publicado' }, { status: 404 })
  }

  // Se texto foi editado, atualizar no banco
  const finalContent = editedContent ?? post.content
  if (editedContent) {
    const { error: updateErr } = await admin.from('posts').update({ content: editedContent }).eq('id', postId)
    if (updateErr) {
      console.error('[posts/publish] Falha ao salvar edição:', updateErr.message)
      return NextResponse.json({ error: 'Falha ao salvar a edição. Tente novamente.' }, { status: 500 })
    }
  }

  // Buscar posts já agendados pra evitar conflito de data
  const { data: alreadyScheduled } = await admin
    .from('posts')
    .select('scheduled_at')
    .eq('organization_id', orgId)
    .eq('status', 'scheduled')

  const scheduledDates = (alreadyScheduled ?? [])
    .map(p => (p as { scheduled_at: string | null }).scheduled_at)
    .filter((d): d is string => d !== null)

  // Buscar zernio_account_id (necessário pra publicação imediata)
  const { data: org } = await admin
    .from('organizations')
    .select('zernio_account_id')
    .eq('id', orgId)
    .maybeSingle()

  if (!org?.zernio_account_id) {
    return NextResponse.json({ error: 'Conta Google Business não conectada. Faça login novamente.' }, { status: 400 })
  }

  const slot = getNextPublishSlot(scheduledDates)
  const now = new Date()

  // Se o próximo slot já passou (usuário aprovou atrasado), publicar imediatamente
  if (slot <= now) {
    const rawImage = (post as Record<string, string>).photo_suggestion ?? undefined
    let finalImage = rawImage
    if (rawImage && rawImage.startsWith('http')) {
      finalImage = await geotagAndUpload(orgId, rawImage)
    }

    let gbpPostId: string | null
    try {
      gbpPostId = await zernioPublishPost(org.zernio_account_id, finalContent, finalImage)
    } catch (err) {
      console.error('[posts/publish] Zernio error:', err instanceof Error ? err.message : err)
      return NextResponse.json({ error: 'Falha ao publicar post no Google. Tente novamente.' }, { status: 502 })
    }

    await admin.from('posts').update({
      status: 'published',
      content: finalContent,
      published_at: new Date().toISOString(),
      gbp_post_id: gbpPostId ?? null,
    }).eq('id', postId)

    return NextResponse.json({ status: 'published', gbp_post_id: gbpPostId })
  }

  // Agendar para o próximo slot (cron scheduled-post-publisher publica no horário)
  const label = formatScheduleLabel(slot)

  const { error: scheduleErr } = await admin
    .from('posts')
    .update({
      status: 'scheduled',
      content: finalContent,
      scheduled_at: slot.toISOString(),
    })
    .eq('id', postId)

  if (scheduleErr) {
    console.error('[posts/publish] Falha ao agendar:', scheduleErr.message)
    return NextResponse.json({ error: 'Falha ao agendar o post. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({ status: 'scheduled', scheduled_at: slot.toISOString(), label })
}
