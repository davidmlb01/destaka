export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

const PAGE_SIZE = 20

function adminDb() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth
  const admin = adminDb()

  // Fetch posts, org info, and scheduled next post in parallel
  const [
    { data: posts, count },
    { data: org },
    { data: gbp },
    { data: scheduledPost },
  ] = await Promise.all([
    admin
      .from('posts')
      .select('id, content, post_type, status, scheduled_for, published_at, created_at', { count: 'exact' })
      .eq('organization_id', orgId)
      .in('status', ['draft', 'pending', 'published', 'scheduled', 'failed'])
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE),
    admin
      .from('organizations')
      .select('name, specialty, automation_preference')
      .eq('id', orgId)
      .maybeSingle(),
    admin
      .from('gbp_profiles')
      .select('id')
      .eq('organization_id', orgId)
      .maybeSingle(),
    admin
      .from('posts')
      .select('id, content, post_type, status, scheduled_for, published_at, created_at')
      .eq('organization_id', orgId)
      .eq('status', 'scheduled')
      .order('scheduled_for', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  // Map automation_preference to autoPostMode
  const autoPostMode = org?.automation_preference === 'automatico' ? 'automatic' : 'approval'

  // Map posts to expected shape
  const mappedPosts = (posts ?? []).map((p: {
    id: string
    content: string
    post_type: string
    status: string
    scheduled_for: string | null
    published_at: string | null
    created_at: string
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

  console.log(`[posts-api] orgId=${orgId} count=${mappedPosts.length} raw=${posts?.length ?? 'null'} statuses=${JSON.stringify(mappedPosts.map(p => p.status))}`)

  return privateJson({
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
}
