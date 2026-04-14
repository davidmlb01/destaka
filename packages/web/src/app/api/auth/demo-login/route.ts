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

    // Garante registro na tabela users
    await serviceClient.from('users').upsert(
      { id: userId, email: DEMO_EMAIL, name: 'Dr. Demo Dentista', plan: 'essencial' },
      { onConflict: 'id' }
    )

    // Corrige perfis órfãos via REST API (service role key novo formato requer fetch direto)
    const MOCK_LOCATION_IDS = ['789012', '345678']
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/gmb_profiles?google_location_id=in.(${MOCK_LOCATION_IDS.join(',')})`,
      {
        method: 'PATCH',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      }
    )

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

  // Upsert na tabela users com o id correto do Supabase Auth
  if (created?.user) {
    await serviceClient.from('users').upsert(
      {
        id: created.user.id,
        email: DEMO_EMAIL,
        name: 'Dr. Demo Dentista',
        plan: 'essencial',
      },
      { onConflict: 'id' }
    )
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

  return NextResponse.json({ success: true })
}
