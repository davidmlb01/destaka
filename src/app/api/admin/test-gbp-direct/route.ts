export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getValidTokenForOrg } from '@/lib/google/token-refresh'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Paula's org ID
const PAULA_ORG = 'f6c6416f-3c34-4bea-b75e-bb8c1056369e'

export async function GET() {
  const db = admin()
  const results: Record<string, unknown> = {}

  // 1. Get valid token
  const token = await getValidTokenForOrg(db, PAULA_ORG)
  results.tokenAvailable = !!token
  if (!token) {
    return NextResponse.json({ ...results, error: 'No valid token' })
  }

  // 2. Get location name
  const { data: org } = await db
    .from('organizations')
    .select('gbp_location_id')
    .eq('id', PAULA_ORG)
    .single()

  const locationName = org?.gbp_location_id as string
  results.locationName = locationName

  // 3. Test: List reviews (READ)
  try {
    const reviewsRes = await fetch(
      `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=3`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const reviewsData = await reviewsRes.json()
    results.listReviews = {
      status: reviewsRes.status,
      ok: reviewsRes.ok,
      reviewCount: reviewsData.reviews?.length ?? 0,
      error: reviewsData.error?.message ?? null,
    }
  } catch (e) {
    results.listReviews = { error: e instanceof Error ? e.message : 'unknown' }
  }

  // 4. Test: List posts (READ)
  try {
    const postsRes = await fetch(
      `https://mybusiness.googleapis.com/v4/${locationName}/localPosts?pageSize=3`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const postsData = await postsRes.json()
    results.listPosts = {
      status: postsRes.status,
      ok: postsRes.ok,
      postCount: postsData.localPosts?.length ?? 0,
      error: postsData.error?.message ?? null,
    }
  } catch (e) {
    results.listPosts = { error: e instanceof Error ? e.message : 'unknown' }
  }

  // 5. Test: Create a DRAFT post (WRITE) - won't actually publish, just tests permission
  try {
    const createRes = await fetch(
      `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languageCode: 'pt-BR',
          summary: 'Teste de acesso direto via GBP API. Este post sera deletado.',
          topicType: 'STANDARD',
        }),
      }
    )
    const createData = await createRes.json()
    results.createPost = {
      status: createRes.status,
      ok: createRes.ok,
      postName: createData.name ?? null,
      state: createData.state ?? null,
      error: createData.error?.message ?? null,
    }

    // Se criou, deleta imediatamente
    if (createData.name) {
      const deleteRes = await fetch(
        `https://mybusiness.googleapis.com/v4/${createData.name}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      results.deleteTestPost = { status: deleteRes.status, ok: deleteRes.ok }
    }
  } catch (e) {
    results.createPost = { error: e instanceof Error ? e.message : 'unknown' }
  }

  return NextResponse.json(results)
}
