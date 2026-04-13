import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { CompetitorsContent } from '@/components/dashboard/CompetitorsContent'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '📊', href: '/dashboard', active: false },
  { label: 'Avaliacoes', icon: '⭐', href: '/dashboard/reviews', active: false },
  { label: 'Posts', icon: '📝', href: '/dashboard/posts', active: false },
  { label: 'Otimizacoes', icon: '⚡', href: '/dashboard/optimizations', active: false },
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
        <div className="flex items-center gap-2 px-2 mb-8">
          <span style={{ fontSize: 20 }}>🎯</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>Destaka</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(item => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: item.active ? 600 : 400,
                color: item.active ? '#fff' : 'rgba(255,255,255,0.5)',
                background: item.active ? 'rgba(255,255,255,0.08)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="/api/auth/logout"
          style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textDecoration: 'none', padding: '8px 12px' }}
        >
          Sair
        </a>
      </aside>

      {/* Mobile nav */}
      <MobileNav profileName={profile.name} userEmail={user.email ?? ''} />

      {/* Content */}
      <main className="flex-1 lg:ml-56 p-6 pb-24 lg:pb-6 relative z-10">
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <CompetitorsContent />
        </div>
      </main>
    </div>
  )
}
