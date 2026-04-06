import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/gmb/select
// Salva o perfil GMB selecionado pelo usuário.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: {
    locationId?: string
    name?: string
    address?: string
    phone?: string | null
    website?: string | null
    category?: string | null
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { locationId, name, address, phone, website, category } = body

  if (!locationId || !name) {
    return NextResponse.json({ error: 'locationId e name são obrigatórios' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()

  const { data, error } = await serviceClient
    .from('gmb_profiles')
    .insert({
      user_id: user.id,
      google_location_id: locationId,
      name,
      address: address ?? '',
      phone: phone ?? null,
      website: website ?? null,
      category: category ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Este perfil já está conectado.' }, { status: 409 })
    }
    console.error('[gmb/select] insert error:', error)
    return NextResponse.json({ error: 'Erro ao salvar perfil.' }, { status: 500 })
  }

  // Dispara diagnóstico em background (fire-and-forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  fetch(`${appUrl}/api/diagnostic/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({ profileId: data.id }),
  }).catch(err => console.error('[gmb/select] diagnostic trigger error:', err))

  return NextResponse.json({ profile: data }, { status: 201 })
}
