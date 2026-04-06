import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// PATCH /api/posts/settings
// Body: { autoPostMode: 'automatic' | 'approval' }
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { autoPostMode } = await req.json() as { autoPostMode: 'automatic' | 'approval' }

  if (!['automatic', 'approval'].includes(autoPostMode)) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

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
    .from('gmb_profiles')
    .update({ auto_post_mode: autoPostMode })
    .eq('id', profile.id)

  return NextResponse.json({ success: true, autoPostMode })
}
