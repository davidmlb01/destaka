export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'
import { populateFromPlaces } from '@/lib/places/populate'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id

  // Audit GBP + populate Places em paralelo
  await inngest.send({
    name: 'destaka/gbp.audit.requested',
    data: { organization_id: orgId },
  })

  // Places API traz fotos e reviews reais (GBP API pode retornar vazio)
  populateFromPlaces(orgId).catch(() => {})

  return NextResponse.json({ status: 'queued' })
}
