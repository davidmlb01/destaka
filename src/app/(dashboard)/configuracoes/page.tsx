export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ConfiguracoesContent } from '@/components/dashboard/ConfiguracoesContent'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) redirect('/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', professional.organization_id)
    .maybeSingle()

  const profileName = org?.name ?? 'Meu Perfil'

  return (
    <DashboardLayout activeHref="/configuracoes" profileName={profileName} userEmail={user.email ?? ''}>
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
          plan="free"
          tokenInvalid={false}
          userEmail={user.email ?? ''}
        />
      </div>
    </DashboardLayout>
  )
}
