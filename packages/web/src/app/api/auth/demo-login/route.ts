import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const DEMO_EMAIL = 'demo@destaka.com.br'
const DEMO_PASSWORD = 'Destaka@Demo2026'

// POST /api/auth/demo-login
// Cria (ou reutiliza) o usuário demo e retorna sessão autenticada.
// Disponível apenas quando GMB_MOCK=true.
export async function POST() {
  if (process.env.GMB_MOCK !== 'true') {
    return NextResponse.json({ error: 'Demo não disponível' }, { status: 403 })
  }

  const serviceClient = await createServiceClient()
  const supabase = await createClient()

  // Tenta login direto primeiro (usuário já existe)
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })

  if (!signInError && signInData.session) {
    const userId = signInData.session.user.id
    await ensureDemoData(userId)
    return NextResponse.json({ success: true })
  }

  // Usuário não existe — cria via service role
  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Dr. Demo Dentista' },
  })

  if (createError) {
    console.error('[demo-login] createUser error:', createError)
    return NextResponse.json({ error: 'Erro ao criar usuário demo: ' + createError.message }, { status: 500 })
  }

  // Sign in após criação
  const { data, error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })

  if (error || !data.session) {
    console.error('[demo-login] signIn after create error:', error)
    return NextResponse.json({ error: 'Erro ao fazer login demo' }, { status: 500 })
  }

  await ensureDemoData(data.session.user.id)
  return NextResponse.json({ success: true })
}

async function ensureDemoData(userId: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const h = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  // Garante registro na tabela users
  await fetch(`${base}/rest/v1/users`, {
    method: 'POST',
    headers: { ...h, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: userId, email: DEMO_EMAIL, name: 'Dr. Demo Dentista', plan: 'essencial' }),
  })

  // Reassigna perfis existentes para este userId
  for (const locId of ['789012', '345678']) {
    await fetch(`${base}/rest/v1/gmb_profiles?google_location_id=eq.${locId}`, {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ user_id: userId }),
    })
  }

  // Garante que os perfis existem (insere se não houver nenhum)
  const check = await fetch(`${base}/rest/v1/gmb_profiles?user_id=eq.${userId}&select=id`, {
    headers: { ...h, Accept: 'application/json' },
  })
  const existing = await check.json() as Array<{ id: string }>

  if (!existing?.length) {
    const profiles = [
      {
        user_id: userId,
        google_location_id: '789012',
        name: 'Clínica Odontológica Sorriso',
        address: 'Rua das Flores, 123, São Paulo, SP',
        phone: '(11) 99999-9999',
        website: 'https://clinicasorriso.com.br',
        category: 'dentist',
        avg_rating: 4.5,
        review_count: 23,
      },
      {
        user_id: userId,
        google_location_id: '345678',
        name: 'Consultório Dr. Silva',
        address: 'Av. Paulista, 1000, São Paulo, SP',
        phone: '(11) 88888-8888',
        website: null,
        category: 'doctor',
        avg_rating: 4.2,
        review_count: 11,
      },
    ]
    await fetch(`${base}/rest/v1/gmb_profiles`, {
      method: 'POST',
      headers: { ...h, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(profiles),
    })
  }
}
