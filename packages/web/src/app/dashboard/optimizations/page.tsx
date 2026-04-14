import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ChecklistContent } from '@/components/dashboard/ChecklistContent'

export default async function OptimizationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('gmb_profiles').select('id, name').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)

  if (!profiles?.length) redirect('/onboarding')
  const profile = profiles[0]

  return (
    <DashboardLayout activeHref="/dashboard/optimizations" profileName={profile.name} userEmail={user.email ?? ''}>
      <div className="px-6 py-8 max-w-3xl">
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#FCD34D' }}
          >
            <span style={{ color: '#F59E0B', fontSize: 10 }}>✦</span>
            Otimizações
          </div>
          <h1 className="font-display font-extrabold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
            Melhore seu Perfil
          </h1>
          <p className="mt-2" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.6 }}>
            Algumas ações precisam ser feitas por você diretamente no Google. O Destaka identificou o que está faltando e organizou tudo aqui, com instruções claras para cada etapa.
          </p>
        </div>
        <ChecklistContent />
      </div>
    </DashboardLayout>
  )
}
