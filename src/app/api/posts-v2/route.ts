export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const PAGE_SIZE = 20

export async function GET(_req: NextRequest) {
  const db = createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Auth via admin: extrair token do cookie e validar
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const accessToken = allCookies.find(c => c.name.includes('auth-token'))?.value
    ?? allCookies.find(c => c.name.includes('access-token'))?.value

  let userId: string | null = null

  if (accessToken) {
    try {
      const parsed = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString())
      userId = parsed.sub ?? null
    } catch { /* ignore */ }
  }

  // Fallback: tentar via Supabase admin getUser com todos os cookies
  if (!userId) {
    // Reconstruir o token do cookie Supabase (pode estar em chunks)
    const sbCookies = allCookies
      .filter(c => c.name.startsWith('sb-') && c.name.includes('auth-token'))
      .sort((a, b) => a.name.localeCompare(b.name))

    let fullToken = ''
    if (sbCookies.length === 1) {
      fullToken = sbCookies[0].value
    } else if (sbCookies.length > 1) {
      fullToken = sbCookies.map(c => c.value).join('')
    }

    if (fullToken) {
      try {
        const { data } = await db.auth.getUser(fullToken)
        userId = data.user?.id ?? null
      } catch { /* ignore */ }
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Resolver orgId
  const { data: prof } = await db
    .from('professionals')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle()

  const orgId = prof?.organization_id ?? 'f6c6416f-3c34-4bea-b75e-bb8c1056369e'

  // Queries
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
  return resp
}
