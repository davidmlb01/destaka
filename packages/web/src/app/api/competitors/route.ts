import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { discoverCompetitors, generateBenchmark } from '@/lib/gmb/competitors'
import { z } from 'zod'

const CompetitorsPostBody = z.object({
  benchmark: z.boolean().optional(),
})

const MOCK_COMPETITORS = [
  {
    id: 'mock-comp-1',
    profile_id: 'mock',
    place_id: 'mock-place-1',
    name: 'Clínica Saúde & Vida',
    avg_rating: 4.2,
    review_count: 87,
    address: 'Av. Paulista, 1500 - Bela Vista, São Paulo',
    photo_count: 12,
    categories: ['health', 'doctor'],
    has_website: true,
    benchmark_data: {
      summary: 'Concorrente bem avaliado com alto volume de reviews, mas sem responder avaliações negativas.',
      strengths: ['Volume alto de avaliações (87)', 'Presença forte no Google Maps'],
      gaps: ['Não responde avaliações negativas: oportunidade de diferenciação', 'Poucas fotos do espaço interno'],
      alerts: ['Nota 4.2 está acima da sua: foco em conseguir mais reviews positivos'],
    },
    last_tracked_at: new Date().toISOString(),
  },
  {
    id: 'mock-comp-2',
    profile_id: 'mock',
    place_id: 'mock-place-2',
    name: 'Centro Médico Bem Estar',
    avg_rating: 3.9,
    review_count: 54,
    address: 'Rua Augusta, 800 - Consolação, São Paulo',
    photo_count: 6,
    categories: ['health', 'medical_clinic'],
    has_website: false,
    benchmark_data: {
      summary: 'Concorrente com nota abaixo de 4.0 e sem site, vulnerável a perder pacientes para quem tem presença digital.',
      strengths: ['Localização central', 'Preço competitivo nas avaliações'],
      gaps: ['Sem website: pacientes não encontram mais informações', 'Nota 3.9 abaixo do ideal: você pode superar'],
      alerts: [],
    },
    last_tracked_at: new Date().toISOString(),
  },
  {
    id: 'mock-comp-3',
    profile_id: 'mock',
    place_id: 'mock-place-3',
    name: 'Consultório Dr. Pinheiro',
    avg_rating: 4.7,
    review_count: 143,
    address: 'Rua Oscar Freire, 340 - Jardins, São Paulo',
    photo_count: 28,
    categories: ['health', 'doctor'],
    has_website: true,
    benchmark_data: {
      summary: 'Líder local com nota 4.7 e 143 avaliações: referência a superar em médio prazo.',
      strengths: ['Nota 4.7 excelente', 'Alto volume de fotos (28): perfil muito completo'],
      gaps: ['Atende faixa de renda mais alta: você pode capturar segmento médio', 'Horário de atendimento limitado'],
      alerts: ['Concorrente 4.7 vs sua nota: prioridade máxima em coleta de reviews positivos'],
    },
    last_tracked_at: new Date().toISOString(),
  },
]

// GET /api/competitors — lista concorrentes do perfil autenticado
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  if (process.env.GMB_MOCK === 'true') {
    const mockProfile = { id: 'mock-profile', name: 'Consultório Demo', avg_rating: 4.5, review_count: 23 }
    return NextResponse.json({ profile: mockProfile, competitors: MOCK_COMPETITORS })
  }

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

  if (process.env.GMB_MOCK === 'true') {
    return NextResponse.json({ discovered: MOCK_COMPETITORS.length, errors: [] })
  }

  const { data: profiles } = await supabase
    .from('gmb_profiles')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!profiles?.length) return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })

  const profileId = profiles[0].id
  const parsed = CompetitorsPostBody.safeParse(await req.json().catch(() => ({})))
  const benchmark = parsed.success ? parsed.data.benchmark : false

  const serviceDb = await createServiceClient()
  const { discovered, errors } = await discoverCompetitors(serviceDb, profileId)

  if (benchmark && discovered > 0) {
    await generateBenchmark(serviceDb, profileId)
  }

  return NextResponse.json({ discovered, errors })
}
