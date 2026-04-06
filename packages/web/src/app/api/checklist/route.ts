import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buildChecklist, projectedScore } from '@/lib/gmb/checklist'

// GET /api/checklist
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const serviceClient = await createServiceClient()

  const { data: profile } = await serviceClient
    .from('gmb_profiles')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!profile) return NextResponse.json({ error: 'Nenhum perfil encontrado' }, { status: 404 })

  const { data: progress } = await serviceClient
    .from('checklist_progress')
    .select('item_key, done, done_at')
    .eq('profile_id', profile.id)

  const { data: diagnostic } = await serviceClient
    .from('diagnostics')
    .select('score_total')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const items = buildChecklist(progress ?? [])
  const currentScore = diagnostic?.score_total ?? 0
  const projected = projectedScore(items, currentScore)

  return NextResponse.json({
    items,
    currentScore,
    projectedScore: projected,
    doneCount: items.filter(i => i.done).length,
    totalCount: items.length,
  })
}
