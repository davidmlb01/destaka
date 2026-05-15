import { NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { getReviewLink } from '@/lib/gmb/review-qr'
import { searchPlace } from '@/lib/places/client'
import QRCode from 'qrcode'
import { rateLimit } from '@/lib/redis'

// GET /api/reviews/qr
// Retorna o link de review + QR code como SVG para o perfil autenticado
export async function GET() {
  const auth = await getAuthenticatedProfile('id, name, address, google_place_id')
  if (auth.error) return auth.error

  const count = await rateLimit(`reviews-qr:${auth.user.id}`, 3600)
  if (count !== null && count > 30) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
  }

  const { profile, serviceClient } = auth

  let placeId: string | null = profile.google_place_id ?? null

  // Se o place_id não está salvo, tenta resolver via Places API
  if (!placeId) {
    const query = `${profile.name} ${profile.address ?? ''}`.trim()
    placeId = await searchPlace(query)

    if (!placeId) {
      return NextResponse.json(
        { error: 'Não foi possível encontrar o perfil no Google Places. Verifique o nome e endereço.' },
        { status: 404 }
      )
    }

    // Salva o place_id para uso futuro
    await serviceClient
      .from('gmb_profiles')
      .update({ google_place_id: placeId })
      .eq('id', profile.id)
  }

  const reviewUrl = getReviewLink(placeId)

  const qrSvg = await QRCode.toString(reviewUrl, {
    type: 'svg',
    width: 256,
    margin: 2,
    color: { dark: '#ffffff', light: '#00000000' },
  })

  return NextResponse.json({
    reviewUrl,
    qrSvg,
    profileName: profile.name,
  })
}
