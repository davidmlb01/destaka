export const dynamic = 'force-dynamic'

import { getDashboardContext } from '@/lib/dashboard/get-dashboard-context'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { KitReviewsContent } from './KitReviewsContent'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function KitReviewsPage() {
  const ctx = await getDashboardContext()
  const db = admin()

  // Buscar place_id via gmb_profiles (mesmo path da landing page)
  const { data: prof } = await db
    .from('professionals')
    .select('user_id')
    .eq('organization_id', ctx.orgId)
    .limit(1)
    .maybeSingle()

  let placeId: string | null = null
  if (prof?.user_id) {
    const { data: gmb } = await db
      .from('gmb_profiles')
      .select('google_place_id')
      .eq('user_id', prof.user_id)
      .maybeSingle()
    placeId = gmb?.google_place_id ?? null
  }

  if (!placeId) {
    return (
      <div className="px-6 py-20 text-center">
        <p style={{ color: 'var(--text-tertiary)' }}>
          QR Code ainda não disponível. O Google Place ID será configurado automaticamente.
        </p>
      </div>
    )
  }

  const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`
  const landingUrl = `https://destaka.com.br/r/${ctx.profileName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`

  // Gerar QR como data URL para o PDF
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 400,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })

  return (
    <KitReviewsContent
      profileName={ctx.profileName}
      reviewUrl={reviewUrl}
      landingUrl={landingUrl}
      qrDataUrl={qrDataUrl}
    />
  )
}
