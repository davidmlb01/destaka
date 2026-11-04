export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getDashboardContext } from '@/lib/dashboard/get-dashboard-context'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { CompetitorsContent } from '@/components/dashboard/CompetitorsContent'
import { Badge } from '@/components/ui/Badge'

export default async function CompetitorsPage() {
  const ctx = await getDashboardContext()
  if (!ctx.isSubscriber) redirect('/dashboard/upgrade?feature=competitors')

  return (
    <DashboardLayout activeHref="/dashboard/competitors" profileName={ctx.profileName} userEmail={ctx.user.email}>
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
        <CompetitorsContent specialty={ctx.specialty} />
      </div>
    </DashboardLayout>
  )
}
