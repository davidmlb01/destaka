// POST /api/dashboard/populate
// Popula o dashboard com dados reais do Google Places API
// Requer autenticacao. Chamado pelo PopulateTrigger no dashboard.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { populateFromPlaces } from '@/lib/places/populate'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organizacao nao encontrada' }, { status: 404 })
  }

  const result = await populateFromPlaces(professional.organization_id)

  if (result.status === 'error') {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
