import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { CHECKLIST_ITEMS } from '@/lib/gmb/checklist'

// PATCH /api/checklist/[key]
// Body: { done: boolean }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params
  const { done } = await req.json() as { done: boolean }

  const validKey = CHECKLIST_ITEMS.some(i => i.key === key)
  if (!validKey) return NextResponse.json({ error: 'Item desconhecido' }, { status: 400 })

  const auth = await getAuthenticatedProfile('id')
  if (auth.error) return auth.error

  const { profile, serviceClient } = auth

  await serviceClient
    .from('checklist_progress')
    .upsert({
      profile_id: profile.id,
      item_key: key,
      done,
      done_at: done ? new Date().toISOString() : null,
    }, { onConflict: 'profile_id,item_key' })

  return NextResponse.json({ success: true, key, done })
}
