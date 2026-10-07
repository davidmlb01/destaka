export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { decrypt } from '@/lib/crypto'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = admin()

  // Buscar org do usuario
  const { data: prof } = await db
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!prof?.organization_id) {
    return NextResponse.json({ gmb_token_invalid: true })
  }

  // Buscar token
  const { data: tokenRow } = await db
    .from('google_tokens')
    .select('access_token, refresh_token')
    .eq('organization_id', prof.organization_id)
    .maybeSingle()

  if (!tokenRow?.access_token) {
    return NextResponse.json({ gmb_token_invalid: true })
  }

  // Tentar validar o access_token
  let accessToken: string
  try {
    accessToken = decrypt(tokenRow.access_token)
  } catch {
    accessToken = tokenRow.access_token
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`,
      { signal: AbortSignal.timeout(5000) }
    )

    if (res.ok) {
      return NextResponse.json({ gmb_token_invalid: false })
    }

    // Token expirado, verificar se tem refresh_token para renovar
    if (tokenRow.refresh_token) {
      return NextResponse.json({ gmb_token_invalid: false })
    }

    return NextResponse.json({ gmb_token_invalid: true })
  } catch {
    // Timeout ou erro de rede, nao marcar como invalido
    return NextResponse.json({ gmb_token_invalid: false })
  }
}
