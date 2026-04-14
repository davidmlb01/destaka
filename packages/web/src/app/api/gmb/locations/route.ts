import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'
import { listGmbLocations } from '@/lib/gmb/client'

// GET /api/gmb/locations
// Retorna todos os perfis GMB do usuário autenticado.
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Mock: retorna locais simulados sem exigir token Google
  if (process.env.GMB_MOCK === 'true') {
    return NextResponse.json({
      locations: [
        {
          name: 'accounts/123456/locations/789012',
          title: 'Clínica Odontológica Sorriso',
          address: 'Rua das Flores, 123, São Paulo, SP',
          phone: '(11) 99999-9999',
          website: 'https://clinicasorriso.com.br',
          category: 'Dentista',
        },
        {
          name: 'accounts/123456/locations/345678',
          title: 'Consultório Dr. Silva',
          address: 'Av. Paulista, 1000, São Paulo, SP',
          phone: '(11) 88888-8888',
          website: null,
          category: 'Clínica médica',
        },
      ],
    })
  }

  const serviceClient = await createServiceClient()
  const { data: userData, error: userError } = await serviceClient
    .from('users')
    .select('google_access_token_enc')
    .eq('id', user.id)
    .single()

  if (userError || !userData?.google_access_token_enc) {
    return NextResponse.json(
      { error: 'Token Google não encontrado. Refaça a conexão.' },
      { status: 400 }
    )
  }

  let accessToken: string
  try {
    accessToken = decrypt(userData.google_access_token_enc)
  } catch {
    return NextResponse.json({ error: 'Erro ao descriptografar token.' }, { status: 500 })
  }

  try {
    const locations = await listGmbLocations(accessToken)
    return NextResponse.json({ locations })
  } catch (err) {
    console.error('[gmb/locations] GMB API error:', err)
    return NextResponse.json(
      { error: 'Erro ao buscar perfis no Google. Verifique se sua conta tem um Google Meu Negócio.' },
      { status: 502 }
    )
  }
}
