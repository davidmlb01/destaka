export const dynamic = 'force-dynamic'

import { getDashboardContext } from '@/lib/dashboard/get-dashboard-context'
import { IndicarContent } from '@/components/dashboard/IndicarContent'

export default async function IndicarPage() {
  const ctx = await getDashboardContext()

  return (
    <div className="px-6 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
          Indique e ganhe
        </h1>
        <p className="mt-2" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>
          Indique 5 colegas e nunca mais pague. Cada indicado ativo vale 20% de desconto permanente.
        </p>
      </div>
      <IndicarContent userId={ctx.user.id} specialty={ctx.specialty} />
    </div>
  )
}
