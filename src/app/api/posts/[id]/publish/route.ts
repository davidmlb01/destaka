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
    .select('id, content, photo_suggestion, scheduled_at')
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

  // Buscar zernio_account_id
  const { data: org } = await admin
    .from('organizations')
    .select('zernio_account_id')
    .eq('id', orgId)
    .maybeSingle()

  if (!org?.zernio_account_id) {
    return NextResponse.json({ error: 'Conta Google Business não conectada. Faça login novamente.' }, { status: 400 })
  }

  // Se o post já tem scheduled_at do gerador, usar esse valor
  const existingSchedule = (post as Record<string, string | null>).scheduled_at
  let slot: Date

  if (existingSchedule) {
    slot = new Date(existingSchedule)
  } else {
    // Calcula novo slot se não tiver agenda
    const { data: alreadyScheduled } = await admin
      .from('posts')
      .select('scheduled_at')
      .eq('organization_id', orgId)
      .eq('status', 'scheduled')

    const scheduledDates = (alreadyScheduled ?? [])
      .map(p => (p as { scheduled_at: string | null }).scheduled_at)
      .filter((d): d is string => d !== null)

    slot = getNextPublishSlot(scheduledDates)
  }

  const now = new Date()

  // Se o slot já passou, agendar para o próximo slot disponível
  if (slot <= now) {
    const { data: alreadyScheduled } = await admin
      .from('posts')
      .select('scheduled_at')
      .eq('organization_id', orgId)
      .eq('status', 'scheduled')

    const scheduledDates = (alreadyScheduled ?? [])
      .map(p => (p as { scheduled_at: string | null }).scheduled_at)
      .filter((d): d is string => d !== null)

    slot = getNextPublishSlot(scheduledDates)

    // Se ainda assim já passou (nenhum slot futuro), agendar para amanhã 13h UTC
    if (slot <= now) {
      slot = new Date(now)
      slot.setUTCDate(slot.getUTCDate() + 1)
      slot.setUTCHours(13, 0, 0, 0)
    }
  }

  // Agendar para o slot (cron scheduled-post-publisher publica no horário)
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
