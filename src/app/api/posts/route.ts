export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

function adminClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId } = auth
  const db = adminClient()

  const { data: posts, count, error: queryErr } = await db
    .from('posts')
    .select('id, content, post_type, status, scheduled_at, published_at, created_at', { count: 'exact' })
    .eq('organization_id', orgId)
    .limit(20)

  if (queryErr) {
    console.error('[posts] query error:', queryErr.message, queryErr.code, queryErr.details)
  }

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

  const mappedPosts = (posts ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    content: p.content as string,
    type: p.post_type as string,
    status: p.status === 'pending' ? 'draft' : p.status as string,
    scheduled_at: p.scheduled_at as string | null,
    published_at: p.published_at as string | null,
    created_at: p.created_at as string,
  }))

  return privateJson({
    posts: mappedPosts,
    total: count ?? 0,
    page: 1,
    pageSize: 20,
    scheduledNext: null,
    autoPostMode: org?.automation_preference === 'automatico' ? 'automatic' : 'approval',
    profile: {
      id: (gbp?.id as string) ?? orgId,
      name: (org?.name as string) ?? 'Meu Perfil',
      category: (org?.specialty as string) ?? '',
    },
  })
}
