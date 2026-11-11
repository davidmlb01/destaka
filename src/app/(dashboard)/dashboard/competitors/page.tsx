export const dynamic = 'force-dynamic'

import { getDashboardContext } from '@/lib/dashboard/get-dashboard-context'
import { CompetitorsContent } from '@/components/dashboard/CompetitorsContent'
import { Badge } from '@/components/ui/Badge'

export default async function CompetitorsPage() {
  const ctx = await getDashboardContext()

  return (
    <div className="px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <Badge className="mb-3">Concorrentes</Badge>
        <h1 className="font-display font-semibold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
          Análise de Concorrentes
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-tertiary)', fontSize: 15, lineHeight: 1.6 }}>
          Compare seu perfil com os concorrentes que aparecem nas buscas da sua região.
        </p>
      </div>
      <CompetitorsContent specialty={ctx.specialty} />
    </div>
  )
}
