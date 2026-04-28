// =============================================================================
// DESTAKA — Mapper: Places API data → GmbProfileData → ScoreResult
// =============================================================================

import type { PlaceDetails } from './client'
import type { GmbProfileData } from '@/lib/gmb/scorer'
import { calculateScore } from '@/lib/gmb/scorer'

export function placeDetailsToProfileData(place: PlaceDetails): GmbProfileData {
  const photoCount = place.photos?.length ?? 0

  return {
    hasName: !!place.name,
    hasPhone: !!place.formatted_phone_number,
    hasAddress: !!place.formatted_address,
    hasHours: !!place.opening_hours?.weekday_text?.length,
    hasWebsite: !!place.website,
    hasCategory: place.types.length > 0,

    // Fotos: Places API retorna até 10 referências
    // Estimamos: 1 = capa, 1 = logo, resto = espaço
    hasLogoPhoto: photoCount >= 2,
    hasCoverPhoto: photoCount >= 1,
    spacePhotosCount: Math.max(0, photoCount - 2),
    totalPhotosCount: photoCount,

    // Avaliações
    reviewsCount: place.user_ratings_total ?? 0,
    reviewsAvgRating: place.rating ?? 0,
    reviewsRepliedCount: 0, // não disponível via Places API

    // Posts: não disponível via Places API — penaliza
    lastPostDaysAgo: null,

    // Serviços e atributos: não disponíveis via Places API
    servicesCount: 0,
    servicesWithDescCount: 0,
    attributesCount: 0,

    category: place.types[0] ?? 'establishment',
    locationName: place.name,
  }
}

export function scoreFromPlaceDetails(place: PlaceDetails) {
  const profileData = placeDetailsToProfileData(place)
  return { score: calculateScore(profileData), profileData }
}

// Mock para quando a Places API não está configurada
export function getMockPlaceDetails(query: string): PlaceDetails {
  return {
    place_id: 'mock-generic',
    name: query,
    formatted_address: 'Brasil',
    formatted_phone_number: null,
    website: null,
    rating: 3.8,
    user_ratings_total: 12,
    opening_hours: null,
    photos: Array(2).fill({ photo_reference: 'mock' }),
    types: ['establishment'],
    business_status: 'OPERATIONAL',
  }
}
