import { NextResponse } from 'next/server'
import { getAuthOrg } from '@/lib/api/with-auth'
import { CHECKLIST_ITEMS } from '@/lib/gmb/checklist'

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  // Busca itens marcados como done pelo usuario
  const { data: doneItems } = await supabase
    .from('checklist_progress')
    .select('item_key, done_at')
    .eq('organization_id', orgId)

  const doneMap = new Map(
    (doneItems ?? []).map((d: { item_key: string; done_at: string }) => [d.item_key, d.done_at])
  )

  const items = CHECKLIST_ITEMS.map((item) => ({
    ...item,
    done: doneMap.has(item.key),
    done_at: doneMap.get(item.key) ?? null,
  }))

  const doneCount = items.filter((i) => i.done).length
  const totalCount = items.length
  const currentScore = items.filter((i) => i.done).reduce((sum, i) => sum + i.impact, 0)
  const projectedScore = items.reduce((sum, i) => sum + i.impact, 0)

  return NextResponse.json({
    items,
    currentScore,
    projectedScore,
    doneCount,
    totalCount,
  })
}
