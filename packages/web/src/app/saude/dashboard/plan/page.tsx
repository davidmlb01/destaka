import { Badge } from '@/components/ui/Badge'
import { PinIcon } from '@/components/ui/PinIcon'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { CheckoutButton } from './CheckoutButton'

const VALUE_STACK = [
  { label: 'Gestão do Google Meu Negócio', value: 'R$400/mês', desc: 'O que uma agência cobraria para fazer o mesmo' },
  { label: '4 posts mensais no perfil', value: 'R$200/mês', desc: 'Criados por IA, publicados automaticamente' },
  { label: 'Monitoramento de avaliações', value: 'R$150/mês', desc: 'Alertas e histórico de todas as avaliações' },
  { label: 'Análise de concorrentes', value: 'R$250/mês', desc: 'Top 3 concorrentes monitorados em tempo real' },
  { label: 'Relatório de performance mensal', value: 'R$100/mês', desc: 'Score Destaka e evolução mês a mês' },
]

const FEATURES = [
  'Google Meu Negócio no piloto automático',
  'Posts semanais criados por IA',
  'Gestão e monitoramento de avaliações',
  'Score Destaka com evolução mensal',
  'Análise dos 3 maiores concorrentes',
  'Relatório mensal de performance',
  'Setup completo em 15 minutos',
  'Cancele quando quiser, sem multa',
]

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/saude/login')

  const { data: profiles } = await supabase
    .from('gmb_profiles').select('id, name').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)

  if (!profiles?.length) redirect('/saude/onboarding')

  return (
    <DashboardLayout activeHref="/saude/dashboard/plan" profileName={profiles[0].name} userEmail={user.email ?? ''}>
      <div className="px-6 py-10 max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <Badge className="mb-4">Plano Destaka <span style={{ color: 'var(--accent)' }}>✦</span></Badge>

          <h1
            className="font-display font-extrabold text-white"
            style={{ fontSize: 34, letterSpacing: '-0.8px', lineHeight: 1.15 }}
          >
            Tudo que você precisa<br />para aparecer no Google.
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, marginTop: 10, lineHeight: 1.65, maxWidth: 520 }}>
            Enquanto você cuida dos seus pacientes, o Destaka cuida da sua presença digital. Sem agência. Sem complicação.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch">

          {/* ====== CARD DO PLANO ====== */}
          <div className="w-full lg:w-[330px] shrink-0 flex">
            <div
              className="rounded-2xl flex flex-col overflow-hidden w-full"
              style={{
                background: 'rgba(14,165,233,0.07)',
                border: '1px solid rgba(14,165,233,0.4)',
                boxShadow: '0 0 60px rgba(14,165,233,0.12), inset 0 1px 0 rgba(255,255,255,0.07)',
              }}
            >
              {/* Badge "Mais Popular" */}
              <div
                className="flex items-center justify-center gap-2 py-2.5"
                style={{
                  background: 'linear-gradient(90deg, rgba(14,165,233,0.0) 0%, rgba(14,165,233,0.25) 50%, rgba(14,165,233,0.0) 100%)',
                  borderBottom: '1px solid rgba(14,165,233,0.25)',
                }}
              >
                <span style={{ color: 'var(--accent)', fontSize: 10 }}>★</span>
                <span
                  className="font-bold tracking-widest uppercase"
                  style={{ color: 'var(--accent-bright)', fontSize: 10 }}
                >
                  Plano Único
                </span>
                <span style={{ color: 'var(--accent)', fontSize: 10 }}>★</span>
              </div>

              <div className="p-7 flex flex-col flex-1 justify-between">

                {/* Preço */}
                <div className="mb-1">
                  <div className="flex items-baseline gap-1">
                    <span
                      className="font-display font-extrabold"
                      style={{ fontSize: 58, lineHeight: 1, color: 'var(--accent)', letterSpacing: '-2px' }}
                    >
                      R$197
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>/mês</span>
                  </div>
                  <p
                    className="mt-1.5 text-xs font-medium"
                    style={{ color: 'rgba(255,255,255,0.38)' }}
                  >
                    Apenas R$6,57/dia para ter mais pacientes
                  </p>
                </div>

                {/* Divisor */}
                <div className="my-6" style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

                {/* Features */}
                <ul className="flex flex-col mb-8">
                  {FEATURES.map((f, i) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 py-2.5 text-sm"
                      style={{
                        color: 'rgba(255,255,255,0.82)',
                        borderBottom: i < FEATURES.length - 1
                          ? '1px solid rgba(255,255,255,0.05)'
                          : 'none',
                      }}
                    >
                      <span
                        className="shrink-0 rounded-full flex items-center justify-center"
                        style={{
                          width: 18,
                          height: 18,
                          background: 'rgba(52,211,153,0.12)',
                          border: '1px solid rgba(52,211,153,0.25)',
                          color: 'var(--success)',
                          fontSize: 10,
                          marginTop: 1,
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <CheckoutButton />

                <p
                  className="text-center mt-3 text-xs"
                  style={{ color: 'rgba(255,255,255,0.28)' }}
                >
                  Sem fidelidade. Cancele quando quiser.
                </p>

              </div>
            </div>
          </div>

          {/* ====== STACK DE VALOR ====== */}
          <div className="flex-1 min-w-0 flex flex-col">

            {/* Título da seção */}
            <div className="flex items-center gap-3 mb-5">
              <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.07)' }} />
              <p
                className="text-xs font-bold tracking-widest uppercase shrink-0"
                style={{ color: 'rgba(255,255,255,0.38)' }}
              >
                O que você recebe por R$197
              </p>
              <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>

            {/* Itens do stack */}
            <div className="flex flex-col gap-2.5">
              {VALUE_STACK.map((item, i) => (
                <div
                  key={item.label}
                  className="rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Ícone */}
                    <div
                      className="shrink-0 flex items-center justify-center rounded-lg"
                      style={{
                        width: 36,
                        height: 36,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <PinIcon size={16} />
                    </div>
                    {/* Texto */}
                    <div className="min-w-0">
                      <p className="font-display font-bold text-white truncate" style={{ fontSize: 15 }}>{item.label}</p>
                      <p className="mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* Badge de valor */}
                  <span
                    className="text-xs font-bold shrink-0"
                    style={{
                      color: 'var(--accent-bright)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Bloco total vs preço */}
            <div
              className="rounded-xl px-5 py-5 mt-4"
              style={{
                background: 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(14,165,233,0.05) 100%)',
                border: '1px solid rgba(14,165,233,0.3)',
                boxShadow: '0 0 30px rgba(14,165,233,0.08)',
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-display font-bold text-white" style={{ fontSize: 21 }}>
                    Valor total se contratasse separado
                  </p>
                  <p className="mt-1" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>
                    Você paga apenas R$197 por tudo isso
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="line-through"
                    style={{ color: 'rgba(255,255,255,0.28)', fontSize: 18, letterSpacing: '-0.2px' }}
                  >
                    R$1.100/mês
                  </p>
                  <p
                    className="font-display font-extrabold"
                    style={{ color: 'var(--success)', fontSize: 29, letterSpacing: '-0.5px', lineHeight: 1.2 }}
                  >
                    R$197/mês
                  </p>
                </div>
              </div>

              {/* Barra de economia */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 17 }}>Economia mensal</span>
                  <span className="font-bold" style={{ color: 'var(--success)', fontSize: 17 }}>82% de desconto</span>
                </div>
                <div
                  className="rounded-full overflow-hidden"
                  style={{ height: 6, background: 'rgba(255,255,255,0.07)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: '82%',
                      background: 'linear-gradient(90deg, var(--success) 0%, #86EFAC 100%)',
                      boxShadow: '0 0 8px rgba(52,211,153,0.5)',
                    }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
