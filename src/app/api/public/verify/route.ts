import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { isPlacesAvailable, resolveInput, searchPlace, getPlaceDetails } from '@/lib/places/client'
import { scoreFromPlaceDetails, getMockPlaceDetails } from '@/lib/places/scorer'
import { rateLimit } from '@/lib/redis'
import { z } from 'zod'

const MAX_VERIFY_PER_IP_PER_DAY = 20

const VerifyBody = z.object({
  input: z.string().min(1).max(500),
})

// POST /api/public/verify
// Body: { input: string }  — URL do Google Maps ou nome do estabelecimento
// Publico: sem autenticacao
export async function POST(req: NextRequest) {
  // Rate limiting por IP para nao esgotar quota do Google Places
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ipHash = createHash('sha256').update(ip + (process.env.ENCRYPTION_KEY ?? '')).digest('hex').slice(0, 16)
  const count = await rateLimit(`ratelimit:verify:${ipHash}`, 86400)
  if (count !== null && count > MAX_VERIFY_PER_IP_PER_DAY) {
    return NextResponse.json(
      { error: 'Limite de verificacoes diarias atingido. Tente novamente amanha.' },
      { status: 429 }
    )
  }

  const parsed = VerifyBody.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Informe o link ou nome do estabelecimento.' }, { status: 400 })
  }

  // Resolve input UMA vez: short URL → URL completa → query + coordenadas
  const input = parsed.data.input.trim()
  const resolved = await resolveInput(input)

  console.log('[verify] resolved:', { query: resolved.query, lat: resolved.lat, lng: resolved.lng, resolvedUrl: resolved.resolvedUrl.slice(0, 100) })

  let placeDetails = null
  const usingMock = !isPlacesAvailable()

  if (!usingMock) {
    // Passa query + coordenadas para busca com location bias
    const placeId = await searchPlace(resolved.query, resolved.lat, resolved.lng)
    if (placeId) {
      placeDetails = await getPlaceDetails(placeId)
    }
    if (!placeDetails) {
      return NextResponse.json(
        { error: 'Estabelecimento nao encontrado. Verifique o link ou tente pesquisar pelo nome e cidade.' },
        { status: 404 }
      )
    }
  } else {
    placeDetails = getMockPlaceDetails(resolved.query)
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
