export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

const ORG_ID = 'f6c6416f-3c34-4bea-b75e-bb8c1056369e'

export async function GET() {
  const db = createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: posts, count } = await db
    .from('posts')
    .select('id, content, post_type, status, scheduled_for, published_at, created_at', { count: 'exact' })
    .eq('organization_id', ORG_ID)
    .limit(20)

  const mappedPosts = (posts ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    content: p.content as string,
    type: p.post_type as string,
    status: p.status === 'pending' ? 'draft' : p.status as string,
    scheduled_for: p.scheduled_for as string | null,
    published_at: p.published_at as string | null,
    created_at: p.created_at as string,
  }))

  const resp = NextResponse.json({
    posts: mappedPosts,
    total: count ?? 0,
    page: 1,
    pageSize: 20,
    scheduledNext: null,
    autoPostMode: 'approval',
    profile: {
      id: ORG_ID,
      name: 'Bacellar Fisioterapia Especializada & Quiropraxia',
      category: 'fisioterapeuta',
    },
  })
  resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return resp
}
