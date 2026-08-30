import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 20

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organizacao nao encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id

  // Fetch posts, org info, and scheduled next post in parallel
  const [
    { data: posts, count },
    { data: org },
    { data: gbp },
    { data: scheduledPost },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('id, content, post_type, status, scheduled_for, published_at, created_at', { count: 'exact' })
      .eq('organization_id', orgId)
      .in('status', ['draft', 'published', 'scheduled', 'failed', 'pending'])
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE),
    supabase
      .from('organizations')
      .select('name, specialty, automation_preference')
      .eq('id', orgId)
      .maybeSingle(),
    supabase
      .from('gbp_profiles')
      .select('id')
      .eq('organization_id', orgId)
      .maybeSingle(),
    supabase
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

  return NextResponse.json({
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
