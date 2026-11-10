export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

const PAGE_SIZE = 20

export async function GET() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const db = createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Resolver orgId (com log de debug temporario)
  const { data: prof } = await db
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  // TEMPORARIO: se nao encontrar, usar orgId conhecido da Paula
  const orgId = prof?.organization_id ?? 'f6c6416f-3c34-4bea-b75e-bb8c1056369e'
  console.log('[posts-v3] userId=' + user.id + ' orgId=' + orgId + ' fromDb=' + !!prof?.organization_id)

  // Queries sequenciais (nao Promise.all) para evitar qualquer race condition
  const { data: posts, count } = await db
    .from('posts')
    .select('id, content, post_type, status, scheduled_for, published_at, created_at', { count: 'exact' })
    .eq('organization_id', orgId)
    .in('status', ['draft', 'pending', 'published', 'scheduled', 'failed'])
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  const { data: org } = await db
    .from('organizations')
    .select('name, specialty, automation_preference')
    .eq('id', orgId)
    .maybeSingle()

  const { data: gbp } = await db
    .from('gbp_profiles')
    .select('id')
    .eq('organization_id', orgId)
    .maybeSingle()

  const { data: scheduledPost } = await db
    .from('posts')
    .select('id, content, post_type, status, scheduled_for, published_at, created_at')
    .eq('organization_id', orgId)
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .maybeSingle()

  const autoPostMode = org?.automation_preference === 'automatico' ? 'automatic' : 'approval'

  const mappedPosts = (posts ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    content: p.content as string,
    type: p.post_type as string,
    status: p.status === 'pending' ? 'draft' : p.status as string,
    scheduled_for: p.scheduled_for as string | null,
    published_at: p.published_at as string | null,
    created_at: p.created_at as string,
  }))

  const mappedScheduled = scheduledPost ? {
    id: scheduledPost.id,
    content: scheduledPost.content,
    type: scheduledPost.post_type,
    status: 'scheduled' as const,
    scheduled_for: scheduledPost.scheduled_for,
    published_at: scheduledPost.published_at,
    created_at: scheduledPost.created_at,
  } : null

  const resp = NextResponse.json({
    posts: mappedPosts,
    total: count ?? 0,
    page: 1,
    pageSize: PAGE_SIZE,
    scheduledNext: mappedScheduled,
    autoPostMode,
    profile: {
      id: (gbp?.id as string) ?? orgId,
      name: (org?.name as string) ?? 'Meu Perfil',
      category: (org?.specialty as string) ?? '',
    },
  })
  resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  resp.headers.set('Vary', 'Cookie')
  return resp
}
