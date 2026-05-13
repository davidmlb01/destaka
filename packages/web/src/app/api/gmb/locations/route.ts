import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listGmbLocations } from '@/lib/gmb/client'
import { getValidGmbToken } from '@/lib/gmb/auth'

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

  let accessToken: string
  try {
    accessToken = await getValidGmbToken(user.id)
  } catch (err) {
    console.error('[gmb/locations] token error:', err)
    return NextResponse.json(
      { error: 'Sessão Google expirada. Faça login novamente.' },
      { status: 401 }
    )
  }

  try {
    const locations = await listGmbLocations(accessToken)
    return NextResponse.json({ locations, noProfiles: locations.length === 0 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[gmb/locations] GMB API error:', msg)

    // 403 = scope business.manage não foi concedido no OAuth
    if (msg.includes('403')) {
      return NextResponse.json(
        { error: 'Permissão negada pelo Google. Faça login novamente e autorize o acesso ao Google Meu Negócio.', type: 'permission_denied' },
        { status: 403 }
      )
    }
    // 401 = token inválido mesmo após refresh
    if (msg.includes('401')) {
      return NextResponse.json(
        { error: 'Sessão Google expirada. Faça login novamente.' },
        { status: 401 }
      )
    }
    // 404 = conta Google sem nenhum perfil GMB associado
    if (msg.includes('404')) {
      return NextResponse.json(
        { locations: [], noProfiles: true, type: 'no_account' }
      )
    }
    // Outros erros: loga o detalhe e retorna mensagem acionável
    console.error('[gmb/locations] detalhe do erro:', msg)
    return NextResponse.json(
      { error: `Erro ao buscar perfis do Google (${msg.slice(0, 120)}). Tente novamente ou faça login novamente.`, type: 'api_error', detail: msg.slice(0, 200) },
      { status: 502 }
    )
  }
}
