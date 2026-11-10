export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { publishPost as zernioPublishPost } from '@/lib/zernio/client'

function adminDb() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/posts/[id]/publish
// Publica um post pendente via Zernio
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const body = await request.json().catch(() => ({})) as { content?: string }
  const editedContent = body.content?.trim() || null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    .select('id, content, image_url')
    .eq('id', postId)
    .eq('organization_id', orgId)
    .in('status', ['pending', 'draft'])
    .maybeSingle()

  if (!post) {
    return NextResponse.json({ error: 'Post não encontrado ou já publicado' }, { status: 404 })
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

  // Se texto foi editado, atualizar no banco antes de publicar
  const finalContent = editedContent ?? post.content
  if (editedContent) {
    await admin.from('posts').update({ content: editedContent }).eq('id', postId)
  }

  // Publicar via Zernio
  let zernioPostId: string | null
  try {
    zernioPostId = await zernioPublishPost(
      org.zernio_account_id,
      finalContent,
      (post as Record<string, string>).image_url ?? undefined
    )
  } catch (err) {
    console.error('[posts/publish] Zernio error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Falha ao publicar post no Google. Tente novamente.' }, { status: 502 })
  }

  await admin
    .from('posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      gbp_post_id: zernioPostId ?? null,
    })
    .eq('id', postId)

  return NextResponse.json({ status: 'published', gbp_post_id: zernioPostId })
}
