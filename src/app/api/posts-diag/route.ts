export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

const ORG_ID = 'f6c6416f-3c34-4bea-b75e-bb8c1056369e'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'MISSING'
  const keyPrefix = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'MISSING').slice(0, 20)

  const db = createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Test 1: raw count
  const { count, error: countErr } = await db
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID)

  // Test 2: full query (same as /api/posts)
  const { data: posts, error: queryErr } = await db
    .from('posts')
    .select('id, content, post_type, status, scheduled_at, published_at, created_at', { count: 'exact' })
    .eq('organization_id', ORG_ID)
    .limit(20)

  // Test 3: unfiltered count of ALL posts
  const { count: totalAll, error: allErr } = await db
    .from('posts')
    .select('id', { count: 'exact', head: true })

  // Test 4: direct fetch to REST API
  let directResult: unknown = null
  let directError: string | null = null
  try {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts?organization_id=eq.${ORG_ID}&select=id,status&limit=5`,
      {
        cache: 'no-store',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      }
    )
    directResult = await resp.json()
  } catch (e) {
    directError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json({
    env: { url, keyPrefix },
    test1_count: { count, error: countErr?.message ?? null },
    test2_query: { postsLength: posts?.length ?? 0, error: queryErr?.message ?? null, firstPostId: posts?.[0]?.id ?? null },
    test3_allPosts: { totalAll, error: allErr?.message ?? null },
    test4_directFetch: { result: directResult, error: directError },
  })
}
