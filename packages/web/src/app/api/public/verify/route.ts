import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { isPlacesAvailable, extractQueryFromUrl, searchPlace, getPlaceDetails } from '@/lib/places/client'
import { scoreFromPlaceDetails, getMockPlaceDetails } from '@/lib/places/scorer'
import { rateLimit } from '@/lib/redis'

const MAX_VERIFY_PER_IP_PER_DAY = 20

// POST /api/public/verify
// Body: { input: string }  — URL do Google Maps ou nome do estabelecimento
// Público: sem autenticação
export async function POST(req: NextRequest) {
  // Rate limiting por IP para não esgotar quota do Google Places
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ipHash = createHash('sha256').update(ip + (process.env.ENCRYPTION_KEY ?? '')).digest('hex').slice(0, 16)
  const count = await rateLimit(`ratelimit:verify:${ipHash}`, 86400)
  if (count !== null && count > MAX_VERIFY_PER_IP_PER_DAY) {
    return NextResponse.json(
      { error: 'Limite de verificacoes diarias atingido. Tente novamente amanha.' },
      { status: 429 }
    )
  }

  const body = await req.json() as { input?: string }

  if (!body.input?.trim()) {
    return NextResponse.json({ error: 'Informe o link ou nome do estabelecimento.' }, { status: 400 })
  }

  const input = body.input.trim()
  const query = await extractQueryFromUrl(input)

  let placeDetails = null
  const usingMock = !isPlacesAvailable()

  if (!usingMock) {
    const placeId = await searchPlace(query)
    if (placeId) {
      placeDetails = await getPlaceDetails(placeId)
    }
    if (!placeDetails) {
      return NextResponse.json(
        { error: 'Estabelecimento não encontrado. Verifique o link ou tente pesquisar pelo nome e cidade.' },
        { status: 404 }
      )
    }
  } else {
    placeDetails = getMockPlaceDetails(query)
  }

  const { score, profileData } = scoreFromPlaceDetails(placeDetails)

  return NextResponse.json({
    place: {
      name: placeDetails.name,
      address: placeDetails.formatted_address,
      phone: placeDetails.formatted_phone_number,
      website: placeDetails.website,
      rating: placeDetails.rating,
      reviewsTotal: placeDetails.user_ratings_total,
      types: placeDetails.types,
    },
    score: {
      total: score.total,
      categories: Object.values(score.categories),
    },
    profileData,
    usingMock,
  })
}
