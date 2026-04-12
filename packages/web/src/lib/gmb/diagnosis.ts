import Anthropic from '@anthropic-ai/sdk'
import { calculateScore, type GmbProfileData, type ScoreResult } from './scorer'
import { MOCK_PROFILE_DATA } from './profile-mock'

let _anthropic: Anthropic | null = null
function getAnthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  return _anthropic
}

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
  accessToken: string | null
): Promise<DiagnosisResult> {
  const useMock = process.env.GMB_MOCK === 'true' || !accessToken

  const profileData: GmbProfileData = useMock
    ? { ...MOCK_PROFILE_DATA, category, locationName: locationId }
    : await fetchRealProfileData(locationId, accessToken!)

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
    model: 'claude-opus-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text : ''
}

async function fetchRealProfileData(
  locationId: string,
  accessToken: string
): Promise<GmbProfileData> {
  // Implementação real será conectada quando o Business Profile API
  // estiver aprovado para o scope business.manage em produção.
  // Por ora retorna mock mesmo com token real.
  return { ...MOCK_PROFILE_DATA }
}
