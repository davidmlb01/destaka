import { NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { getSearchKeywords, aggregateKeywords } from '@/lib/gmb/keywords'

// GET /api/keywords
export async function GET() {
  const auth = await getAuthenticatedProfile('id, user_id, name, category, location_name')
  if (auth.error) return auth.error

  const { user, profile } = auth

  try {
    const accessToken = await getValidGmbToken(user.id)

    // location_name formato: "locations/{id}" ou "accounts/{id}/locations/{id}"
    const locationId = profile.location_name as string
    if (!locationId) {
      return NextResponse.json({ error: 'Perfil sem location vinculado' }, { status: 400 })
    }

    const rawKeywords = await getSearchKeywords(locationId, accessToken)
    const keywords = aggregateKeywords(rawKeywords)

    return NextResponse.json({ keywords })
  } catch (err) {
    console.error('[api/keywords] Erro:', err)
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
