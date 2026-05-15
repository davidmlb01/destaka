import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'

// GET /api/posts?page=1
export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedProfile('id, name, category, auto_post_mode')
  if (auth.error) return auth.error

  const { profile, serviceClient } = auth

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
  const pageSize = 10

  const from = (page - 1) * pageSize
  const { data: posts, count } = await serviceClient
    .from('gmb_posts')
    .select('*', { count: 'exact' })
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  // Próximo post agendado
  const { data: scheduled } = await serviceClient
    .from('gmb_posts')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .single()

  return NextResponse.json({
    posts: posts ?? [],
    total: count ?? 0,
    page,
    pageSize,
    scheduledNext: scheduled ?? null,
    autoPostMode: profile.auto_post_mode ?? 'approval',
    profile: { id: profile.id, name: profile.name, category: profile.category },
  })
}
