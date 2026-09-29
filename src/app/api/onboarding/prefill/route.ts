import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { listGmbLocations } from '@/lib/gmb/client'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get Google token from user_metadata (available before onboarding completes)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: userData } = await admin.auth.admin.getUserById(user.id)
  const meta = userData?.user?.user_metadata ?? {}
  const accessToken = meta.gbp_access_token

  if (!accessToken) {
    return NextResponse.json({ location: null })
  }

  try {
    const locations = await listGmbLocations(accessToken)

    if (locations.length === 0) {
      return NextResponse.json({ location: null })
    }

    // Use first location as prefill
    const loc = locations[0]
    return NextResponse.json({
      location: {
        name: loc.title || '',
        phone: loc.phone || '',
        address: loc.address || '',
        category: loc.category || '',
      },
    })
  } catch (err) {
    console.warn('[onboarding/prefill] Falha ao buscar dados GBP:', err)
    return NextResponse.json({ location: null })
  }
}
