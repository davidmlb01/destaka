import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ChecklistContent } from '@/components/dashboard/ChecklistContent'
import { Badge } from '@/components/ui/Badge'

export default async function OptimizationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/saude/login')

  const { data: profiles } = await supabase
    .from('gmb_profiles').select('id, name').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)

  if (!profiles?.length) redirect('/saude/onboarding')
  const profile = profiles[0]

  return (
    <DashboardLayout activeHref="/saude/dashboard/optimizations" profileName={profile.name} userEmail={user.email ?? ''}>
      <div className="px-6 py-8 max-w-3xl">
        <div className="mb-8">
          <Badge className="mb-3">Otimizações</Badge>
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
