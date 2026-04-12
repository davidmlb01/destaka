import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Olá, {user?.email}
        </h1>
        <p className="text-slate-500 mb-8">
          Seu painel Destaka está sendo preparado.
        </p>
        {/* TODO Story 010: implementar dashboard completo */}
      </div>
    </main>
  )
}
