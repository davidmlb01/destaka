import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'

// Slugs reservados que NAO devem ser tratados como landing de indicacao
const RESERVED_SLUGS = new Set([
  'login',
  'dashboard',
  'onboarding',
  'diagnostico',
  'indicar',
  'verificar',
  'saude',
  'admin',
  'api',
  'privacy',
  'termos',
  'configuracoes',
  'd',
])

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Extrai percentual de desconto a partir do ID do cupom Stripe.
 * Ex.: REF_INDICADO_20 -> 20, REF_INDICADO_50_1M -> 50
 */
function parseDiscountFromCoupon(couponId: string | null): number | null {
  if (!couponId) return null
  const match = couponId.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

interface LandingData {
  code: string
  partnerName: string
  logoUrl: string | null
  discountPercent: number | null
}

async function getLandingData(slug: string): Promise<LandingData | null> {
  const admin = getServiceClient()

  // Buscar referral_code pela landing_slug
  const { data: codeRecord } = await admin
    .from('referral_codes')
    .select('code, owner_partner_id, stripe_coupon_id')
    .eq('landing_slug', slug)
    .eq('active', true)
    .maybeSingle()

  if (!codeRecord || !codeRecord.owner_partner_id) return null

  // Buscar dados do parceiro/instituicao
  const { data: partner } = await admin
    .from('partners')
    .select('name, logo_url')
    .eq('id', codeRecord.owner_partner_id)
    .eq('active', true)
    .maybeSingle()

  if (!partner) return null

  return {
    code: codeRecord.code,
    partnerName: partner.name,
    logoUrl: partner.logo_url,
    discountPercent: parseDiscountFromCoupon(codeRecord.stripe_coupon_id),
  }
}

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  if (RESERVED_SLUGS.has(slug)) return {}

  const data = await getLandingData(slug)
  if (!data) return {}

  const title = data.discountPercent
    ? `${data.discountPercent}% de desconto no Destaka para ${data.partnerName}`
    : `Oferta exclusiva Destaka para ${data.partnerName}`

  return {
    title,
    description: `Membros de ${data.partnerName} tem condições especiais no Destaka. Google Meu Negócio no piloto automático.`,
    robots: { index: false, follow: false },
  }
}

export default async function InstitutionLandingPage({ params }: PageProps) {
  const { slug } = await params

  // Slug reservado: delegar para 404
  if (RESERVED_SLUGS.has(slug)) notFound()

  const data = await getLandingData(slug)
  if (!data) notFound()

  const { code, partnerName, logoUrl, discountPercent } = data

  const headline = discountPercent
    ? `Membros de ${partnerName} tem ${discountPercent}% de desconto`
    : `Oferta exclusiva para membros de ${partnerName}`

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* Header */}
      <header className="flex justify-center pt-8 pb-4 px-6">
        <Logo size="md" href="/" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full text-center">
          {/* Partner logo */}
          {logoUrl && (
            <div className="flex justify-center mb-8">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <img
                  src={logoUrl}
                  alt={`Logo ${partnerName}`}
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
          )}

          {/* Badge parceiro */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 text-[12px] font-bold uppercase tracking-[1.5px]"
            style={{
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent-bright)',
            }}
          >
            Parceiro exclusivo
          </div>

          {/* Headline */}
          <h1
            className="font-display font-bold text-white leading-[1.1] tracking-[-1px] mb-6"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}
          >
            {headline}
          </h1>

          {/* Descricao do Destaka */}
          <p
            className="text-[16px] mb-3 max-w-md mx-auto"
            style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}
          >
            O Destaka cuida do seu Google Meu Negócio no piloto automático.
            Posts, avaliações, fotos e otimização, tudo sem você precisar fazer nada.
          </p>
          <p
            className="text-[15px] mb-10 max-w-md mx-auto"
            style={{ color: 'rgba(255,255,255,0.50)', lineHeight: 1.7 }}
          >
            Faça o diagnóstico gratuito e veja a nota do seu perfil em 30 segundos.
          </p>

          {/* CTA */}
          <Button variant="primary" size="lg" href={`/diagnostico?ref=${code}`}>
            Assinar com desconto
            <span
              className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 text-[13px]"
            >
              →
            </span>
          </Button>

          <p className="mt-4 text-[13px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Sem compromisso. Cancele quando quiser.
          </p>

          {/* Garantia */}
          <div
            className="mt-12 p-[2px] rounded-2xl max-w-sm mx-auto"
            style={{
              background: 'rgba(20,184,166,0.10)',
              boxShadow: '0 0 0 1px rgba(20,184,166,0.22)',
            }}
          >
            <div
              className="rounded-[14px] px-6 py-5 flex items-center gap-4"
              style={{
                background: '#071a19',
                boxShadow: 'inset 0 1px 1px rgba(20,184,166,0.10)',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#14B8A6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p className="text-[13px] text-left" style={{ color: 'rgba(255,255,255,0.60)', lineHeight: 1.6 }}>
                <span className="font-display font-bold text-white">Garantia Destaka:</span>{' '}
                seu score sobe no mínimo 15 pontos em 30 dias ou devolvemos 100%.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center">
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Powered by{' '}
          <Link
            href="/"
            className="hover:text-white transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Destaka
          </Link>
        </p>
      </footer>
    </div>
  )
}
