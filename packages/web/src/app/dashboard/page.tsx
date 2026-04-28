import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { UpgradeBanner } from '@/components/dashboard/UpgradeBanner'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profiles }, { data: dbUser }] = await Promise.all([
    supabase.from('gmb_profiles').select('id, name').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
    supabase.from('users').select('plan').eq('id', user.id).single(),
  ])

  if (!profiles?.length) redirect('/onboarding')
  const profile = profiles[0]

  return (
    <DashboardLayout activeHref="/dashboard" profileName={profile.name} userEmail={user.email ?? ''}>
      <div className="px-6 py-8 max-w-5xl">
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#FCD34D' }}
          >
            <span style={{ color: '#F59E0B', fontSize: 10 }}>✦</span>
            Dashboard
          </div>
          <h1 className="font-display font-extrabold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
            {profile.name}
          </h1>
          <p className="mt-2" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.6 }}>
            Seu Google Meu Negócio no piloto automático. Veja seu score e as próximas ações para subir no ranking.
          </p>
        </div>
        {dbUser?.plan === 'free' && <UpgradeBanner />}
        <DashboardContent />
      </div>
    </DashboardLayout>
  )
}
