import type { GmbProfileData } from './scorer'

// Mock de perfil GMB para desenvolvimento (GMB_MOCK=true)
// Representa uma clínica odontológica com perfil incompleto (score ~42/100)
export const MOCK_PROFILE_DATA: GmbProfileData = {
  hasName: true,
  hasPhone: true,
  hasAddress: true,
  hasHours: false,
  hasWebsite: false,
  hasCategory: true,
  hasLogoPhoto: true,
  spacePhotosCount: 1,
  totalPhotosCount: 2,
  hasCoverPhoto: false,
  reviewsCount: 4,
  reviewsAvgRating: 4.5,
  reviewsRepliedCount: 1,
  lastPostDaysAgo: null,
  servicesCount: 1,
  servicesWithDescCount: 0,
  attributesCount: 2,
  category: 'dentista',
  locationName: 'Clínica Odontológica Teste',
}
