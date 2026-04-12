// Aplica uma otimização específica ao perfil GBP via API
// Tipos suportados: description, categories (TODO: attributes via GBP Attributes API)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

type OptimizationType = 'description'

function createServiceClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const GBP_INFO_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { type: OptimizationType; value: string }
  const { type, value } = body

  if (!type || !value) {
    return NextResponse.json({ error: 'type e value são obrigatórios' }, { status: 400 })
  }

  const admin = createServiceClient()

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id

  const [{ data: tokenRow }, { data: org }] = await Promise.all([
    admin.from('google_tokens').select('access_token').eq('organization_id', orgId).single(),
    admin.from('organizations').select('gbp_location_id').eq('id', orgId).single(),
  ])

  if (!tokenRow?.access_token || !org?.gbp_location_id) {
    return NextResponse.json({ error: 'Token ou location não configurado' }, { status: 500 })
  }

  const locationName = org.gbp_location_id

  if (type === 'description') {
    if (value.length < 50 || value.length > 750) {
      return NextResponse.json({ error: 'Descrição deve ter entre 50 e 750 caracteres' }, { status: 400 })
    }

    const url = `${GBP_INFO_BASE}/${locationName}?updateMask=profile.description`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenRow.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile: { description: value } }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      return NextResponse.json({ error: `GBP API error: ${errBody}` }, { status: 502 })
    }

    // Atualiza localmente também
    await admin
      .from('gbp_profiles')
      .update({ description: value })
      .eq('organization_id', orgId)
      .eq('location_id', locationName)

    return NextResponse.json({ status: 'applied', type })
  }

  return NextResponse.json({ error: `Tipo '${type}' não suportado` }, { status: 400 })
}
