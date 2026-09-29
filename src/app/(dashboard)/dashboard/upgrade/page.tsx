export const dynamic = 'force-dynamic'

'use client'

import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Suspense } from 'react'

const FEATURE_INFO: Record<string, { title: string; description: string; benefit: string }> = {
  reviews: {
    title: 'Avaliações',
    description: 'O Destaka responde avaliações automaticamente com o tom da sua clínica e monitora sua reputação.',
    benefit: 'Clínicas que respondem avaliações recebem 35% mais contatos.',
  },
  posts: {
    title: 'Posts',
    description: 'Publicação automática de posts semanais no Google com conteúdo relevante para sua especialidade.',
    benefit: 'Perfis com posts recentes aparecem 70% mais em buscas locais.',
  },
  optimizations: {
    title: 'Otimizações',
    description: 'Análise automática do seu perfil com correções aplicadas diretamente na sua conta Google.',
    benefit: 'Perfis otimizados recebem até 3x mais visualizações no Google Maps.',
  },
  competitors: {
    title: 'Concorrentes',
    description: 'Mapeamento dos seus concorrentes na região com análise comparativa de pontos fortes e oportunidades.',
    benefit: 'Identifique o que seus concorrentes fazem que você ainda não faz.',
  },
  plan: {
    title: 'Plano de Melhoria',
    description: 'Plano semanal de 8 semanas com ações automáticas e manuais para elevar seu score.',
    benefit: 'Profissionais que seguem o plano aumentam o score em média 40 pontos em 60 dias.',
  },
}

function UpgradeContent() {
  const searchParams = useSearchParams()
  const feature = searchParams.get('feature') ?? 'reviews'
  const info = FEATURE_INFO[feature] ?? FEATURE_INFO.reviews

  async function handleCheckout() {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('[Upgrade] Checkout error:', err)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Lock icon */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-white mb-2">
          {info.title}
        </h1>

        <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
          {info.description}
        </p>

        <p
          className="text-sm font-medium mb-8 px-4 py-3 rounded-xl"
          style={{
            background: 'rgba(20,184,166,0.08)',
            border: '1px solid rgba(20,184,166,0.15)',
            color: 'var(--accent-bright)',
          }}
        >
          {info.benefit}
        </p>

        <button
          onClick={handleCheckout}
          className="w-full px-6 py-3.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer hover:opacity-90 mb-3"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Ativar Destaka por R$197/mês
        </button>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Cancele quando quiser. Sem multa, sem burocracia.
        </p>
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <DashboardLayout
      activeHref=""
      profileName=""
      userEmail=""
      isSubscriber={false}
    >
      <Suspense>
        <UpgradeContent />
      </Suspense>
    </DashboardLayout>
  )
}
