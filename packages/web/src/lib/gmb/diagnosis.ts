import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateScore, type GmbProfileData, type ScoreResult } from './scorer'
import { MOCK_PROFILE_DATA } from './profile-mock'
import { getAnthropic, AI_MODEL } from '@/lib/ai'
import { getLocationDetails, getLocationMedia } from './client'

const SEGMENT_LABELS: Record<string, string> = {
  dentista: 'dentista',
  médico: 'médico',
  advogado: 'advogado',
  psicólogo: 'psicólogo',
  fisioterapeuta: 'fisioterapeuta',
}

function detectSegment(category: string): string {
  const lower = category.toLowerCase()
  for (const [key, label] of Object.entries(SEGMENT_LABELS)) {
    if (lower.includes(key)) return label
  }
  return 'profissional de saúde'
}

export interface DiagnosisResult {
  profileData: GmbProfileData
  score: ScoreResult
  aiDiagnosis: string
}

export async function runDiagnosis(
  locationId: string,
  category: string,
  accessToken: string | null,
  db?: SupabaseClient,
  profileId?: string
): Promise<DiagnosisResult> {
  const useMock = process.env.GMB_MOCK === 'true' || !accessToken

  const profileData: GmbProfileData = (useMock || !db || !profileId)
    ? { ...MOCK_PROFILE_DATA, category, locationName: locationId }
    : await fetchRealProfileData(locationId, accessToken!, profileId, db)

  const score = calculateScore(profileData)
  const segment = detectSegment(category)
  const aiDiagnosis = await generateDiagnosis(profileData, score, segment)

  return { profileData, score, aiDiagnosis }
}

async function generateDiagnosis(
  profile: GmbProfileData,
  score: ScoreResult,
  segment: string
): Promise<string> {
  const issuesSummary = Object.values(score.categories)
    .flatMap(c => c.issues)
    .filter(i => i.severity === 'critical' || i.severity === 'warning')
    .map(i => `- ${i.message}`)
    .join('\n')

  const prompt = `Você é especialista em Google Meu Negócio para ${segment}s brasileiros.

Analise este perfil e escreva um diagnóstico direto e acionável em português.

Score total: ${score.total}/100
Scores por categoria:
- Informações Básicas: ${score.categories.info.score}/${score.categories.info.maxScore}
- Fotos: ${score.categories.photos.score}/${score.categories.photos.maxScore}
- Avaliações: ${score.categories.reviews.score}/${score.categories.reviews.maxScore}
- Posts: ${score.categories.posts.score}/${score.categories.posts.maxScore}
- Serviços: ${score.categories.services.score}/${score.categories.services.maxScore}
- Atributos: ${score.categories.attributes.score}/${score.categories.attributes.maxScore}

Problemas identificados:
${issuesSummary || 'Nenhum problema crítico identificado.'}

Escreva um diagnóstico com:
1. Uma frase de abertura direta sobre o estado atual do perfil
2. Os 3 problemas mais impactantes para esse ${segment} específico
3. O que o paciente perde concretamente por causa desses problemas
4. Uma frase de fechamento motivadora

Tom: direto, sem rodeios, linguagem acessível para quem não entende de SEO.
Tamanho: 150 a 200 palavras.
Sem usar travessão (use vírgulas ou dois-pontos).
Sem bullet points.`

  const message = await getAnthropic().messages.create({
    model: AI_MODEL,
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text : ''
}

async function fetchRealProfileData(
  locationName: string,
  accessToken: string,
  profileId: string,
  db: SupabaseClient
): Promise<GmbProfileData> {
  // 1. Dados básicos + horários + serviços + atributos via Business Profile API
  const location = await getLocationDetails(accessToken, locationName)

  // 2. Fotos (fail gracioso se endpoint não disponível)
  const mediaItems = await getLocationMedia(accessToken, locationName)
  const photoItems = mediaItems.filter(m => m.mediaFormat === 'PHOTO')
  const hasLogoPhoto = photoItems.some(m => m.locationAssociation?.category === 'PROFILE')
  const hasCoverPhoto = photoItems.some(m => m.locationAssociation?.category === 'COVER')
  const spacePhotosCount = photoItems.filter(m =>
    ['INTERIOR', 'EXTERIOR', 'AT_WORK', 'COMMON_AREA', 'ROOMS'].includes(m.locationAssociation?.category ?? '')
  ).length
  const totalPhotosCount = photoItems.length

  // 3. Estatísticas de reviews do banco (sincronizadas pelo cron)
  const { data: reviews } = await db
    .from('gmb_reviews')
    .select('rating, reply_status')
    .eq('profile_id', profileId)
  const reviewsCount = reviews?.length ?? 0
  const reviewsAvgRating = reviewsCount > 0
    ? reviews!.reduce((s: number, r: { rating?: number }) => s + (r.rating ?? 0), 0) / reviewsCount
    : 0
  const reviewsRepliedCount = reviews?.filter((r: { reply_status?: string }) => r.reply_status === 'replied').length ?? 0

  // 4. Último post publicado do banco
  const { data: lastPost } = await db
    .from('gmb_posts')
    .select('published_at')
    .eq('profile_id', profileId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const lastPostDaysAgo = lastPost?.published_at
    ? Math.floor((Date.now() - new Date(lastPost.published_at).getTime()) / 86_400_000)
    : null

  // 5. Mapear para GmbProfileData
  const services = location.serviceItems ?? []
  const attributes = location.attributes ?? []

  return {
    hasName: !!location.title,
    hasPhone: !!location.phoneNumbers?.primaryPhone,
    hasAddress: !!(location.storefrontAddress?.addressLines?.length || location.storefrontAddress?.locality),
    hasHours: !!(location.regularHours?.periods?.length || location.openInfo?.status === 'OPEN'),
    hasWebsite: !!location.websiteUri,
    hasCategory: !!location.categories?.primaryCategory?.displayName,
    hasLogoPhoto,
    spacePhotosCount,
    totalPhotosCount,
    hasCoverPhoto,
    reviewsCount,
    reviewsAvgRating,
    reviewsRepliedCount,
    lastPostDaysAgo,
    servicesCount: services.length,
    servicesWithDescCount: services.filter((s: { freeFormServiceItem?: { label?: { description?: string } }; structuredServiceItem?: { description?: string } }) =>
      s.freeFormServiceItem?.label?.description || s.structuredServiceItem?.description
    ).length,
    attributesCount: attributes.length,
    category: location.categories?.primaryCategory?.displayName ?? 'saúde',
    locationName: location.title ?? locationName,
  }
}
