import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { trackEvent } from '@/lib/analytics'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/redis'

// POST /api/gmb/select
// Salva o perfil GMB selecionado pelo usuário.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Rate limit: 10 req/hora (onboarding não deve ser chamado repetidamente)
  const count = await rateLimit(`gmb-select:${user.id}`, 3600)
  if (count !== null && count > 10) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
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
      // Perfil já existe — em modo mock, reatribui ao usuário atual
      if (process.env.GMB_MOCK === 'true') {
        await serviceClient
          .from('gmb_profiles')
          .update({ user_id: user.id })
          .eq('google_location_id', locationId)
        return NextResponse.json({ reassigned: true }, { status: 200 })
      }
      return NextResponse.json({ error: 'Este perfil já está conectado.' }, { status: 409 })
    }
    logger.error('gmb/select', 'erro ao inserir perfil', { userId: user.id, err: error.message })
    return NextResponse.json({ error: 'Erro ao salvar perfil.' }, { status: 500 })
  }

  // Evento de ativação: perfil GMB conectado (one-time)
  trackEvent(serviceClient, user.id, 'gmb_connected', { profileId: data.id })

  // Dispara diagnóstico — com timeout e log de falha
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const diagController = new AbortController()
  const diagTimeout = setTimeout(() => diagController.abort(), 30000)
  fetch(`${appUrl}/api/diagnostic/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({ profileId: data.id }),
    signal: diagController.signal,
  })
    .then(async (res) => {
      clearTimeout(diagTimeout)
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        logger.error('gmb/select', 'diagnostic falhou', { profileId: data.id, status: res.status, body })
      }
    })
    .catch(err => {
      clearTimeout(diagTimeout)
      logger.error('gmb/select', 'diagnostic trigger error', { profileId: data.id, err: String(err) })
    })

  return NextResponse.json({ profile: data }, { status: 201 })
}
