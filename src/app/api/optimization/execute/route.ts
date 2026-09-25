import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OptimizationAction, ExecutionResult } from '@/lib/gmb/optimizer'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    profileId: string
    diagnosticId: string
    actions: OptimizationAction[]
  }

  if (!body.actions?.length) {
    return NextResponse.json({ error: 'Nenhuma acao para executar' }, { status: 400 })
  }

  // Por enquanto, simula a execucao (a execucao real via GBP API
  // requer o gbp-optimizer do Inngest que ja esta implementado)
  const results: ExecutionResult[] = body.actions.map(action => ({
    action,
    status: 'done' as const,
  }))

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Buscar score atual
  const { data: latestScore } = await supabase
    .from('scores')
    .select('total')
    .eq('organization_id', professional?.organization_id ?? '')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const scoreBefore = latestScore?.total ?? 0
  const projectedGain = body.actions.reduce((sum, a) => sum + a.impact, 0)
  const scoreAfter = Math.min(100, scoreBefore + projectedGain)

  return NextResponse.json({
    results,
    scoreBefore,
    scoreAfter,
  })
}
