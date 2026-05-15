import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { rateLimit } from '@/lib/redis'

// PATCH /api/posts/settings
// Body: { autoPostMode: 'automatic' | 'approval' }
export async function PATCH(req: NextRequest) {
  const { autoPostMode } = await req.json() as { autoPostMode: 'automatic' | 'approval' }

  if (!['automatic', 'approval'].includes(autoPostMode)) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  const auth = await getAuthenticatedProfile('id')
  if (auth.error) return auth.error

  const count = await rateLimit(`posts-settings:${auth.user.id}`, 3600)
  if (count !== null && count > 20) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
  }

  const { profile, serviceClient } = auth

  await serviceClient
    .from('gmb_profiles')
    .update({ auto_post_mode: autoPostMode })
    .eq('id', profile.id)

  return NextResponse.json({ success: true, autoPostMode })
}
