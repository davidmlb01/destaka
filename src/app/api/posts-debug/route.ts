export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

export async function GET() {
  const db = createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error, count } = await db
    .from('posts')
    .select('id, status, post_type, content', { count: 'exact' })
    .eq('organization_id', 'f6c6416f-3c34-4bea-b75e-bb8c1056369e')
    .limit(10)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    posts_count: count,
    posts: data?.map(p => ({ id: p.id, status: p.status, type: p.post_type, content_preview: (p.content ?? '').substring(0, 50) })),
    error: error?.message ?? null,
  })
}
