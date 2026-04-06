import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/posts?page=1
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = 10

  const serviceClient = await createServiceClient()

  const { data: profile } = await serviceClient
    .from('gmb_profiles')
    .select('id, name, category')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!profile) return NextResponse.json({ error: 'Nenhum perfil encontrado' }, { status: 404 })

  const from = (page - 1) * pageSize
  const { data: posts, count } = await serviceClient
    .from('gmb_posts')
    .select('*', { count: 'exact' })
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  // Próximo post agendado
  const { data: scheduled } = await serviceClient
    .from('gmb_posts')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true })
    .limit(1)
    .single()

  return NextResponse.json({
    posts: posts ?? [],
    total: count ?? 0,
    page,
    pageSize,
    scheduledNext: scheduled ?? null,
    autoPostMode: 'approval',
    profile: { id: profile.id, name: profile.name, category: profile.category },
  })
}
