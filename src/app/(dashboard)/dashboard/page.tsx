import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default async function DashboardPage() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    const { data: professional } = await supabase
      .from('professionals')
      .select('id, name, organization_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!professional?.organization_id) redirect('/onboarding')

    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', professional.organization_id)
      .maybeSingle()

    return (
      <DashboardLayout
        activeHref="/dashboard"
        profileName={org?.name ?? 'Meu Perfil'}
        userEmail={user.email ?? ''}
      >
        <div className="max-w-3xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-white mb-4">Dashboard</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            Org: {org?.name ?? 'N/A'} | User: {user.email}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
            Componentes sendo restaurados. Se voce ve esta mensagem, o layout funciona.
          </p>
        </div>
      </DashboardLayout>
    )
  } catch (err) {
    // redirect() throws NEXT_REDIRECT - re-throw it
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) throw err
    console.error('[Dashboard] Error:', err)
    return (
      <div style={{ padding: 40, color: 'white', background: '#071a19', minHeight: '100vh' }}>
        <h1 style={{ fontSize: 24 }}>Erro no Dashboard</h1>
        <p style={{ marginTop: 8 }}>{err instanceof Error ? err.message : String(err)}</p>
        <a href="/" style={{ color: '#14B8A6', marginTop: 16, display: 'inline-block' }}>Voltar</a>
      </div>
    )
  }
}
