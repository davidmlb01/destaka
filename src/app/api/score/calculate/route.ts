// Calcula e retorna o Score Destaka atual da organização
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  // Dispara cálculo via Inngest (assíncrono)
  await inngest.send({
    name: 'destaka/score.calculate.requested',
    data: { organization_id: professional.organization_id },
  })

  return NextResponse.json({ status: 'queued' })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  // Retorna o score mais recente + histórico dos últimos 30 dias
  const [{ data: latest }, { data: history }] = await Promise.all([
    supabase
      .from('scores')
      .select('*')
      .eq('organization_id', professional.organization_id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('scores')
      .select('total, gmb_completude, reputacao, visibilidade, retencao, conversao, faixa, tendencia, snapshot_date')
      .eq('organization_id', professional.organization_id)
      .order('snapshot_date', { ascending: false })
      .limit(30),
  ])

  return NextResponse.json({
    current: latest ?? null,
    history: history ?? [],
  })
}
