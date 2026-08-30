import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ConfiguracoesContent } from '@/components/dashboard/ConfiguracoesContent'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('gmb_profiles')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!profiles?.length) redirect('/onboarding')
  const profile = profiles[0]

  const { data: userData } = await supabase
    .from('users')
    .select('plan, gmb_token_invalid')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <DashboardLayout activeHref="/configuracoes" profileName={profile.name} userEmail={user.email ?? ''}>
      <div className="px-6 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display font-extrabold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
            Configurações
          </h1>
          <p className="mt-2" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>
            Gerencie sua conta, conexão e dados pessoais.
          </p>
        </div>
        <ConfiguracoesContent
          plan={userData?.plan ?? 'free'}
          tokenInvalid={userData?.gmb_token_invalid ?? false}
          userEmail={user.email ?? ''}
        />
      </div>
    </DashboardLayout>
  )
}
