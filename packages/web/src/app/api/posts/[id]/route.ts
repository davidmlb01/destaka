import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/redis'

export const dynamic = 'force-dynamic'

// POST /api/posts/[id]/publish
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const rlCount = await rateLimit(`posts-publish:${user.id}`, 3600)
  if (rlCount !== null && rlCount > 60) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
  }

  const serviceClient = await createServiceClient()

  const { data: post } = await serviceClient
    .from('gmb_posts')
    .select('id, profile_id, gmb_profiles(user_id)')
    .eq('id', id)
    .single()

  if (!post) return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })

  const profile = Array.isArray(post.gmb_profiles) ? post.gmb_profiles[0] : post.gmb_profiles
  if ((profile as { user_id: string } | null)?.user_id !== user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { error: updateError } = await serviceClient
    .from('gmb_posts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: 'Erro ao publicar' }, { status: 500 })

  return NextResponse.json({ success: true })
}
