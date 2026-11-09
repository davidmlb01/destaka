export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getLatestAnalysis } from '@/lib/gmb/competitive-analyzer'

function adminDb() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error

  const analysis = await getLatestAnalysis(adminDb(), auth.orgId)

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
