import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { CompetitorsContent } from '@/components/dashboard/CompetitorsContent'
import { Badge } from '@/components/ui/Badge'

export default async function CompetitorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await supabase
    .from('professionals').select('id, name, organization_id').eq('user_id', user.id).maybeSingle()

  if (!professional?.organization_id) redirect('/onboarding')

  const { data: org } = await supabase
    .from('organizations').select('name').eq('id', professional.organization_id).single()

  const profileName = org?.name ?? 'Meu Perfil'

  return (
    <DashboardLayout activeHref="/dashboard/competitors" profileName={profileName} userEmail={user.email ?? ''}>
      <div className="px-6 py-8 max-w-5xl">
        <div className="mb-8">
          <Badge className="mb-3">Concorrentes</Badge>
          <h1 className="font-display font-extrabold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
            Análise de Concorrentes
          </h1>
          <p className="mt-2" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.6 }}>
            Compare seu perfil com os concorrentes que aparecem nas buscas da sua região. Veja onde você está na frente e onde ainda pode melhorar.
          </p>
        </div>
        <CompetitorsContent />
      </div>
    </DashboardLayout>
  )
}
