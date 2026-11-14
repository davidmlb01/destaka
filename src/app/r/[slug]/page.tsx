import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getVocab } from '@/lib/vertical-vocab'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface Props {
  params: Promise<{ slug: string }>
}

async function getOrg(slug: string) {
  const db = admin()
  const { data: org } = await db
    .from('organizations')
    .select('id, name, specialty, review_slug')
    .eq('review_slug', slug)
    .maybeSingle()

  if (!org) return null

  // google_place_id está em gmb_profiles, não em organizations
  const { data: gmb } = await db
    .from('gmb_profiles')
    .select('google_place_id')
    .eq('user_id', org.id)
    .maybeSingle()

  // Fallback: buscar via organization_id na tabela gmb_profiles (user_id pode ser o prof user_id)
  let placeId = gmb?.google_place_id ?? null
  if (!placeId) {
    const { data: prof } = await db
      .from('professionals')
      .select('user_id')
      .eq('organization_id', org.id)
      .limit(1)
      .maybeSingle()
    if (prof?.user_id) {
      const { data: gmb2 } = await db
        .from('gmb_profiles')
        .select('google_place_id')
        .eq('user_id', prof.user_id)
        .maybeSingle()
      placeId = gmb2?.google_place_id ?? null
    }
  }

  return { ...org, google_place_id: placeId }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const org = await getOrg(slug)
  if (!org) return { title: 'Avaliar' }
  return {
    title: `Avaliar ${org.name}`,
    description: `Deixe sua avaliação para ${org.name} no Google.`,
    robots: { index: false, follow: false },
  }
}

// Track access then redirect to Google Reviews
async function trackAndGetUrl(orgId: string, placeId: string) {
  const db = admin()
  // Increment access count
  await db.from('review_link_clicks').insert({
    organization_id: orgId,
    clicked_at: new Date().toISOString(),
  })
  return `https://search.google.com/local/writereview?placeid=${placeId}`
}

export default async function ReviewLandingPage({ params }: Props) {
  const { slug } = await params
  const org = await getOrg(slug)

  if (!org?.google_place_id) notFound()

  const reviewUrl = await trackAndGetUrl(org.id, org.google_place_id)
  const vocab = getVocab(org.specialty)

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #071A19 0%, #0A2928 50%, #071A19 100%)' }}
    >
      <div className="text-center max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
            <path d="M14 0L17.5 6L28 8L20 16L22 28L14 23L6 28L8 16L0 8L10.5 6L14 0Z" fill="#14B8A6" />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            Destaka
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h1
            className="font-semibold text-white mb-3"
            style={{ fontSize: 24, letterSpacing: '-0.3px', lineHeight: 1.3 }}
          >
            Como foi sua experiência com {org.name}?
          </h1>
          <p className="mb-6" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.6 }}>
            {vocab.reviewPageCopy} Leva menos de 1 minuto.
          </p>

          {/* Stars visual */}
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} style={{ fontSize: 32, color: '#FBBF24' }}>★</span>
            ))}
          </div>

          {/* CTA */}
          <a
            href={reviewUrl}
            className="inline-block w-full px-6 py-4 rounded-xl font-semibold text-[16px] transition-all hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #14B8A6, #0D9488)',
              color: '#fff',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(20,184,166,0.3)',
            }}
          >
            Avaliar no Google
          </a>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          Você será redirecionado para o Google para deixar sua avaliação.
        </p>
      </div>
    </main>
  )
}
