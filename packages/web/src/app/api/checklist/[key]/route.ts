import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CHECKLIST_ITEMS } from '@/lib/gmb/checklist'

// PATCH /api/checklist/[key]
// Body: { done: boolean }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { key } = await params
  const { done } = await req.json() as { done: boolean }

  const validKey = CHECKLIST_ITEMS.some(i => i.key === key)
  if (!validKey) return NextResponse.json({ error: 'Item desconhecido' }, { status: 400 })

  const serviceClient = await createServiceClient()

  const { data: profile } = await serviceClient
    .from('gmb_profiles')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

  await serviceClient
    .from('checklist_progress')
    .upsert({
      profile_id: profile.id,
      item_key: key,
      done,
      done_at: done ? new Date().toISOString() : null,
    }, { onConflict: 'profile_id,item_key' })

  return NextResponse.json({ success: true, key, done })
}
