export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { CHECKLIST_ITEMS } from '@/lib/gmb/checklist'

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  // Busca itens marcados manualmente pelo usuario
  const { data: doneItems } = await supabase
    .from('checklist_progress')
    .select('item_key, done_at')
    .eq('organization_id', orgId)

  const doneMap = new Map(
    (doneItems ?? []).map((d: { item_key: string; done_at: string }) => [d.item_key, d.done_at])
  )

  // Busca dados reais do GBP para auto-detectar itens feitos
  const { data: gbpProfile } = await supabase
    .from('gbp_profiles')
    .select('photo_count, description, categories, services, attributes')
    .eq('organization_id', orgId)
    .maybeSingle()

  // Busca contagem de reviews
  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  // Busca reviews respondidas
  const { count: repliedCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .not('response_text', 'is', null)

  const photoCount = (gbpProfile?.photo_count as number) ?? 0

  // Auto-detect: marca como done se dados reais confirmam
  const autoDetected = new Map<string, boolean>()
  if (photoCount >= 1) autoDetected.set('logo_photo', true)
  if (photoCount >= 5) autoDetected.set('space_photos', true)
  if (photoCount >= 2) autoDetected.set('cover_photo', true)
  if ((reviewCount ?? 0) >= 5) autoDetected.set('request_reviews', true)
  if ((repliedCount ?? 0) > 0 && (reviewCount ?? 0) > 0 && (repliedCount ?? 0) >= (reviewCount ?? 1)) {
    autoDetected.set('reply_reviews', true)
  }

  const items = CHECKLIST_ITEMS.map((item) => {
    const manualDone = doneMap.has(item.key)
    const autoDone = autoDetected.get(item.key) ?? false
    const done = manualDone || autoDone
    return {
      ...item,
      done,
      done_at: doneMap.get(item.key) ?? (autoDone ? 'auto' : null),
    }
  })

  const doneCount = items.filter((i) => i.done).length
  const totalCount = items.length
  const currentScore = items.filter((i) => i.done).reduce((sum, i) => sum + i.impact, 0)
  const projectedScore = items.reduce((sum, i) => sum + i.impact, 0)

  return privateJson({
    items,
    currentScore,
    projectedScore,
    doneCount,
    totalCount,
  })
}
