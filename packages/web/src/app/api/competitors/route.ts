import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { discoverCompetitors, generateBenchmark } from '@/lib/gmb/competitors'

// GET /api/competitors — lista concorrentes do perfil autenticado
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profiles } = await supabase
    .from('gmb_profiles')
    .select('id, name, avg_rating, review_count')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!profiles?.length) return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })

  const profile = profiles[0]

  const { data: competitors, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('profile_id', profile.id)
    .order('review_count', { ascending: false })

  if (error) return NextResponse.json({ error: 'Erro ao buscar concorrentes' }, { status: 500 })

  return NextResponse.json({ profile, competitors: competitors ?? [] })
}

// POST /api/competitors — descobre concorrentes e gera benchmark
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profiles } = await supabase
    .from('gmb_profiles')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!profiles?.length) return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })

  const profileId = profiles[0].id
  const body = await req.json().catch(() => ({})) as { benchmark?: boolean }

  const serviceDb = await createServiceClient()
  const { discovered, errors } = await discoverCompetitors(serviceDb, profileId)

  if (body.benchmark && discovered > 0) {
    await generateBenchmark(serviceDb, profileId)
  }

  return NextResponse.json({ discovered, errors })
}
