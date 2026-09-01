import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
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
  const { key } = await params
  const body = await request.json()
  const done = Boolean(body.done)

  if (done) {
    await supabase
      .from('checklist_progress')
      .upsert({ organization_id: orgId, item_key: key, done_at: new Date().toISOString() }, { onConflict: 'organization_id,item_key' })
  } else {
    await supabase
      .from('checklist_progress')
      .delete()
      .eq('organization_id', orgId)
      .eq('item_key', key)
  }

  return NextResponse.json({ ok: true })
}
