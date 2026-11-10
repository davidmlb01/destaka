export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

const PAGE_SIZE = 20

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId } = auth
  const db = admin()

  const { data: posts, count } = await db
    .from('posts')
    .select('id, content, post_type, status, scheduled_for, published_at, created_at', { count: 'exact' })
    .eq('organization_id', orgId)
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

  return privateJson({
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
}
