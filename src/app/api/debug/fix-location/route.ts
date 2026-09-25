// TEMPORARIO: corrige gbp_location_id e remove gbp_profiles duplicado
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Org not found' }, { status: 404 })
  }

  const orgId = professional.organization_id
  const db = createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const gbpLocationId = 'locations/18295123579187724104'

  // 1. Atualizar org.gbp_location_id para o resource name correto
  await db.from('organizations')
    .update({ gbp_location_id: gbpLocationId })
    .eq('id', orgId)

  // 2. Deletar gbp_profiles com location_id errado (Place ID)
  const { count } = await db.from('gbp_profiles')
    .delete({ count: 'exact' })
    .eq('organization_id', orgId)
    .neq('location_id', gbpLocationId)

  return NextResponse.json({
    status: 'fixed',
    gbp_location_id: gbpLocationId,
    deletedOldProfiles: count,
  })
}
