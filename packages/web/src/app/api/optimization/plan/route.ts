import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buildOptimizationPlan } from '@/lib/gmb/optimizer'
import { calculateScore } from '@/lib/gmb/scorer'
import { MOCK_PROFILE_DATA } from '@/lib/gmb/profile-mock'

// GET /api/optimization/plan
// Retorna o plano de otimização derivado do último diagnóstico
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const serviceClient = await createServiceClient()

  const { data: profile } = await serviceClient
    .from('gmb_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Nenhum perfil conectado' }, { status: 404 })
  }

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

  // Em modo mock usamos os dados mock; em produção virão do diagnostic
  const profileData = { ...MOCK_PROFILE_DATA, category: profile.category ?? 'dentista' }
  const score = calculateScore(profileData)
  const plan = buildOptimizationPlan(profileData, score)

  return NextResponse.json({
    profileId: profile.id,
    diagnosticId: diagnostic.id,
    ...plan,
  })
}
