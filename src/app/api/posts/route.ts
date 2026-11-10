export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

const PAGE_SIZE = 20

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  // Auth: apenas verificar que o usuario esta logado
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Resolver orgId via admin (bypass RLS)
  const db = admin()
  const { data: professional } = await db
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id
  console.log('[posts] orgId resolved:', orgId)

  // Buscar posts via admin
  const { data: posts, count, error: postsError } = await db
    .from('posts')
    .select('id, content, post_type, status, scheduled_for, published_at, created_at', { count: 'exact' })
    .eq('organization_id', orgId)
    .in('status', ['draft', 'pending', 'published', 'scheduled', 'failed'])
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  // Buscar org info
  const { data: org } = await db
    .from('organizations')
    .select('name, specialty, automation_preference')
    .eq('id', orgId)
    .maybeSingle()

  // Buscar gbp profile
  const { data: gbp } = await db
    .from('gbp_profiles')
    .select('id')
    .eq('organization_id', orgId)
    .maybeSingle()

  // Buscar scheduled next
  const { data: scheduledPost } = await db
    .from('posts')
    .select('id, content, post_type, status, scheduled_for, published_at, created_at')
    .eq('organization_id', orgId)
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .maybeSingle()

  console.log('[posts] query result: count=' + (count ?? 'null') + ' posts=' + (posts?.length ?? 'null') + ' error=' + (postsError?.message ?? 'none'))

  const autoPostMode = org?.automation_preference === 'automatico' ? 'automatic' : 'approval'

  const mappedPosts = (posts ?? []).map((p: {
    id: string; content: string; post_type: string; status: string
    scheduled_for: string | null; published_at: string | null; created_at: string
  }) => ({
    id: p.id,
    content: p.content,
    type: p.post_type,
    status: p.status === 'pending' ? 'draft' : p.status,
    scheduled_for: p.scheduled_for,
    published_at: p.published_at,
    created_at: p.created_at,
  }))

  const mappedScheduled = scheduledPost ? {
    id: scheduledPost.id,
    content: scheduledPost.content,
    type: scheduledPost.post_type,
    status: scheduledPost.status as 'scheduled',
    scheduled_for: scheduledPost.scheduled_for,
    published_at: scheduledPost.published_at,
    created_at: scheduledPost.created_at,
  } : null

  const response = NextResponse.json({
    posts: mappedPosts,
    total: count ?? 0,
    page: 1,
    pageSize: PAGE_SIZE,
    scheduledNext: mappedScheduled,
    autoPostMode,
    profile: {
      id: gbp?.id ?? orgId,
      name: org?.name ?? 'Meu Perfil',
      category: org?.specialty ?? '',
    },
  })
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Vary', 'Cookie')
  return response
}
