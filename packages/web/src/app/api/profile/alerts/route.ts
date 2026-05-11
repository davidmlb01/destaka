import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'

// GET /api/profile/alerts
// Retorna alertas não reconhecidos do perfil do usuário
export async function GET() {
  const auth = await getAuthenticatedProfile('id')
  if (auth.error) return auth.error

  const { profile, serviceClient } = auth

  const { data: alerts, error } = await serviceClient
    .from('profile_alerts')
    .select('id, field, old_value, new_value, acknowledged, created_at')
    .eq('profile_id', profile.id)
    .eq('acknowledged', false)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar alertas' }, { status: 500 })
  }

  return NextResponse.json({ alerts: alerts ?? [] })
}

// PATCH /api/profile/alerts
// Marca alerta como reconhecido
export async function PATCH(req: NextRequest) {
  const auth = await getAuthenticatedProfile('id')
  if (auth.error) return auth.error

  const { profile, serviceClient } = auth

  let body: { alertId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  if (!body.alertId) {
    return NextResponse.json({ error: 'alertId é obrigatório' }, { status: 400 })
  }

  const { error } = await serviceClient
    .from('profile_alerts')
    .update({ acknowledged: true })
    .eq('id', body.alertId)
    .eq('profile_id', profile.id)

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar alerta' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
