export const dynamic = 'force-dynamic'

// Aprova e publica um post pendente via Zernio (modo manual) ou rejeita
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { publishPost as zernioPublishPost } from '@/lib/zernio/client'
import { z } from 'zod'

const PostIdSchema = z.object({ post_id: z.string().uuid() })

function createServiceClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = PostIdSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'post_id invalido' }, { status: 400 })
  const { post_id } = parsed.data

  const admin = createServiceClient()

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const { data: post } = await admin
    .from('posts')
    .select('id, content, image_url, organization_id')
    .eq('id', post_id)
    .eq('organization_id', professional.organization_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (!post) return NextResponse.json({ error: 'Post não encontrado ou já processado' }, { status: 404 })

  // Busca zernio_account_id
  const { data: org } = await admin
    .from('organizations')
    .select('zernio_account_id')
    .eq('id', professional.organization_id)
    .maybeSingle()

  if (!org?.zernio_account_id) {
    return NextResponse.json({ error: 'Conta Zernio não conectada. Faça login novamente.' }, { status: 400 })
  }

  // Publica via Zernio
  let zernioPostId: string | null
  try {
    zernioPostId = await zernioPublishPost(
      org.zernio_account_id,
      post.content,
      (post as Record<string, string>).image_url ?? undefined
    )
  } catch (err) {
    console.error('[posts/approve] Zernio publish error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Falha ao publicar post no Google. Tente novamente.' }, { status: 502 })
  }

  await admin
    .from('posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      gbp_post_id: zernioPostId ?? null,
    })
    .eq('id', post_id)

  return NextResponse.json({ status: 'published', gbp_post_id: zernioPostId })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = PostIdSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'post_id invalido' }, { status: 400 })
  const { post_id } = parsed.data

  const admin = createServiceClient()

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  await admin
    .from('posts')
    .update({ status: 'rejected' })
    .eq('id', post_id)
    .eq('organization_id', professional.organization_id)
    .eq('status', 'pending')

  return NextResponse.json({ status: 'rejected' })
}
