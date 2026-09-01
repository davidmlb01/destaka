import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CHECKLIST_ITEMS } from '@/lib/gmb/checklist'

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
    return NextResponse.json({ error: 'Organizacao nao encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id

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
