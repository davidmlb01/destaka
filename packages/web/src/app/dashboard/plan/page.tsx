import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const PLANS = [
  {
    name: 'Visibilidade',
    price: 'R$297',
    period: '/mês',
    badge: null,
    features: [
      'GMB automatizado',
      'Gestão de avaliações',
      'Score Destaka',
      'Relatório mensal',
      'Posts semanais automáticos',
    ],
    cta: 'Começar agora',
    highlight: false,
  },
  {
    name: 'Crescimento',
    price: 'R$597',
    period: '/mês',
    badge: 'Mais popular',
    features: [
      'Tudo do Visibilidade',
      'Google Ads gerenciado',
      'Landing page médica',
      'Relatório de campanhas',
      'Suporte prioritário',
    ],
    cta: 'Escolher Crescimento',
    highlight: true,
  },
  {
    name: 'Plataforma',
    price: 'R$997',
    period: '/mês',
    badge: null,
    features: [
      'Tudo do Crescimento',
      'CRM de pacientes',
      'Automações WhatsApp',
      'Reativação de inativos',
      'Lembretes de retorno',
    ],
    cta: 'Escolher Plataforma',
    highlight: false,
  },
]

export default async function PlanPage() {
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

  const NAV_ITEMS = [
    { label: 'Dashboard', icon: '📊', href: '/dashboard' },
    { label: 'Avaliações', icon: '⭐', href: '/dashboard/reviews' },
    { label: 'Posts', icon: '📝', href: '/dashboard/posts' },
    { label: 'Otimizações', icon: '⚡', href: '/dashboard/optimizations' },
    { label: 'Concorrentes', icon: '🎯', href: '/dashboard/competitors' },
    { label: 'Plano', icon: '💎', href: '/dashboard/plan' },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(160deg, #14532D 0%, #0A2E18 100%)' }}>
      <div className="fixed pointer-events-none blur-[160px] rounded-full" style={{ width: 600, height: 600, background: 'rgba(217,119,6,0.08)', top: -200, right: -200 }} />

      <aside
        className="hidden lg:flex flex-col w-56 shrink-0 fixed top-0 left-0 bottom-0 z-40 px-4 py-6"
        style={{ background: 'rgba(10,46,24,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center gap-2 px-2 mb-8">
          <span style={{ color: '#F59E0B', fontSize: 20 }}>✦</span>
          <span className="font-display font-extrabold text-white" style={{ fontSize: 18 }}>
            Desta<span style={{ color: '#F59E0B' }}>ka</span>
          </span>
        </div>

        <div className="rounded-xl px-3 py-2.5 mb-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-medium text-white truncate">{profiles[0].name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Perfil ativo</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(item => (
            <a key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: item.href === '/dashboard/plan' ? 'rgba(217,119,6,0.15)' : 'transparent',
                color: item.href === '/dashboard/plan' ? '#FCD34D' : 'rgba(255,255,255,0.5)',
                border: item.href === '/dashboard/plan' ? '1px solid rgba(217,119,6,0.2)' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="px-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{user.email}</p>
        </div>
      </aside>

      <main className="flex-1 lg:ml-56 relative z-10 px-6 py-8 max-w-5xl">
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#FCD34D' }}
          >
            <span style={{ color: '#F59E0B', fontSize: 10 }}>✦</span>
            Plano
          </div>
          <h1 className="font-display font-extrabold text-white" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>
            Escolha seu plano
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 6 }}>
            Setup em 15 minutos. Cancele quando quiser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className="rounded-2xl p-6 flex flex-col"
              style={{
                background: plan.highlight ? 'rgba(217,119,6,0.1)' : 'rgba(255,255,255,0.04)',
                border: plan.highlight ? '1px solid rgba(217,119,6,0.4)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {plan.badge && (
                <span className="inline-block mb-3 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', width: 'fit-content' }}>
                  {plan.badge}
                </span>
              )}
              <p className="font-display font-bold text-white mb-1">{plan.name}</p>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="font-display font-extrabold text-white" style={{ fontSize: 32 }}>{plan.price}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>{plan.period}</span>
              </div>

              <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ color: '#34D399', marginTop: 1, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className="w-full rounded-xl font-display font-bold text-sm py-3 transition-all"
                style={{
                  background: plan.highlight ? '#D97706' : 'rgba(255,255,255,0.08)',
                  color: plan.highlight ? '#fff' : 'rgba(255,255,255,0.6)',
                  border: 'none',
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm font-medium text-white mb-1">Site Destaka</p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            Landing page médica otimizada para conversão. R$800 setup + R$57/mês.
          </p>
        </div>
      </main>
    </div>
  )
}
