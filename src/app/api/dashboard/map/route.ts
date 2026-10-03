export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'

import { isActiveSubscriber } from '@/lib/subscription'

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  // Paywall: nao-assinantes recebem flag, nao dados completos
  const subscribed = await isActiveSubscriber(orgId)
  if (!subscribed) {
    return privateJson({ paywall: true })
  }

  // Buscar snapshot mais recente
  const { data: snapshot } = await supabase
    .from('geo_snapshots')
    .select('center_lat, center_lng, radius_km, regions, week_start')
    .eq('org_id', orgId)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!snapshot) {
    return privateJson({
      empty: true,
      message: 'Coletando dados de alcance. Volte na proxima semana.',
    })
  }

  const regions = (snapshot.regions as Array<{
    lat: number
    lng: number
    label: string
    count: number
    status: 'strong' | 'medium' | 'weak'
  }>) ?? []

  return privateJson({
    center: { lat: snapshot.center_lat, lng: snapshot.center_lng },
    zones: regions,
    radius_km: snapshot.radius_km ?? 5,
    total_neighborhoods: regions.length,
    week_start: snapshot.week_start,
  })
}
