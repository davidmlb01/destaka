import { NextRequest, NextResponse } from 'next/server'
import { isPlacesAvailable, extractQueryFromUrl, searchPlace, getPlaceDetails } from '@/lib/places/client'
import { scoreFromPlaceDetails, getMockPlaceDetails } from '@/lib/places/scorer'

// POST /api/public/verify
// Body: { input: string }  — URL do Google Maps ou nome do estabelecimento
// Público: sem autenticação
export async function POST(req: NextRequest) {
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
  }

  if (!placeDetails) {
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
