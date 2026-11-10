
import { getDashboardContext } from '@/lib/dashboard/get-dashboard-context'
import { ConfiguracoesContent } from '@/components/dashboard/ConfiguracoesContent'

export default async function ConfiguracoesPage() {
  const ctx = await getDashboardContext()

  return (
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
        userEmail={ctx.user.email}
      />
    </div>
  )
}
