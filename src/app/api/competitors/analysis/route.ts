export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { privateJson } from '@/lib/api/with-auth'
import { createClient } from '@/lib/supabase/server'
import { getLatestAnalysis } from '@/lib/gmb/competitive-analyzer'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const analysis = await getLatestAnalysis(supabase, professional.organization_id)

  if (!analysis) {
    return NextResponse.json({
      gaps: [],
      keyword_opportunities: [],
      summary: 'Análise competitiva ainda não disponível. Será gerada após a próxima sincronização.',
      analyzed_at: null,
    })
  }

  return privateJson(analysis)
}
