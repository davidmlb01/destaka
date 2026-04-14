import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { CompetitorsContent } from '@/components/dashboard/CompetitorsContent'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '📊', href: '/dashboard', active: false },
  { label: 'Avaliações', icon: '⭐', href: '/dashboard/reviews', active: false },
  { label: 'Posts', icon: '📝', href: '/dashboard/posts', active: false },
  { label: 'Otimizações', icon: '⚡', href: '/dashboard/optimizations', active: false },
  { label: 'Concorrentes', icon: '🎯', href: '/dashboard/competitors', active: true },
  { label: 'Plano', icon: '💎', href: '/dashboard/plan', active: false },
]

export default async function CompetitorsPage() {
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
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(160deg, #14532D 0%, #0A2E18 100%)' }}
    >
      <div
        className="fixed pointer-events-none blur-[160px] rounded-full"
        style={{ width: 600, height: 600, background: 'rgba(217,119,6,0.08)', top: -200, right: -200 }}
      />

      {/* Sidebar desktop */}
      <aside
        className="hidden lg:flex flex-col w-56 shrink-0 fixed top-0 left-0 bottom-0 z-40 px-4 py-6"
        style={{
          background: 'rgba(10,46,24,0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-8">
          <span style={{ color: '#F59E0B', fontSize: 20 }}>✦</span>
          <span className="font-display font-extrabold text-white" style={{ fontSize: 18 }}>
            Desta<span style={{ color: '#F59E0B' }}>ka</span>
          </span>
        </div>

        {/* Perfil ativo */}
        <div
          className="rounded-xl px-3 py-2.5 mb-6"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-medium text-white truncate">{profile.name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Perfil ativo</p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: item.active ? 'rgba(217,119,6,0.15)' : 'transparent',
                color: item.active ? '#FCD34D' : 'rgba(255,255,255,0.5)',
                border: item.active ? '1px solid rgba(217,119,6,0.2)' : '1px solid transparent',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Email */}
        <div className="px-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{user.email}</p>
        </div>
      </aside>

      {/* Mobile nav */}
      <MobileNav profileName={profile.name} userEmail={user.email ?? ''} />

      {/* Content */}
      <main className="flex-1 lg:ml-56 relative z-10 px-6 py-8 max-w-5xl">
        <CompetitorsContent />
      </main>
    </div>
  )
}
