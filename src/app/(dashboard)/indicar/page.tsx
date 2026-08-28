import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { IndicarContent } from '@/components/dashboard/IndicarContent'

export default async function IndicarPage() {
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

  return (
    <DashboardLayout activeHref="/indicar" profileName={profile.name} userEmail={user.email ?? ''}>
      <div className="px-6 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display font-extrabold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
            Indicar Destaka
          </h1>
          <p className="mt-2" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>
            Cada profissional que você indicar e assinar dá 1 mês grátis para você.
          </p>
        </div>
        <IndicarContent userId={user.id} />
      </div>
    </DashboardLayout>
  )
}
