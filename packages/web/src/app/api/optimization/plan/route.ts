import { NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { buildOptimizationPlan } from '@/lib/gmb/optimizer'
import { calculateScore, type GmbProfileData } from '@/lib/gmb/scorer'
import { MOCK_PROFILE_DATA } from '@/lib/gmb/profile-mock'
import { logger } from '@/lib/logger'

// GET /api/optimization/plan
// Retorna o plano de otimização derivado do último diagnóstico
export async function GET() {
  const auth = await getAuthenticatedProfile('*')
  if (auth.error) return auth.error

  const { profile, serviceClient } = auth

  const { data: diagnostic } = await serviceClient
    .from('diagnostics')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!diagnostic) {
    return NextResponse.json({ error: 'Nenhum diagnóstico encontrado. Execute o diagnóstico primeiro.' }, { status: 404 })
  }

  // Usa snapshot real do diagnóstico; fallback para mock em diagnostics antigos
  const profileData: GmbProfileData = (diagnostic.profile_snapshot as GmbProfileData | null)
    ?? { ...MOCK_PROFILE_DATA, category: profile.category ?? 'dentista' }

  const usingSnapshot = !!diagnostic.profile_snapshot
  logger.info('optimization/plan', 'plano gerado', {
    profileId: profile.id,
    diagnosticId: diagnostic.id,
    usingSnapshot,
  })

  const score = calculateScore(profileData)
  const plan = buildOptimizationPlan(profileData, score)

  return NextResponse.json({
    profileId: profile.id,
    diagnosticId: diagnostic.id,
    ...plan,
  })
}
