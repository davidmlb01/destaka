// Photo Strategy: determines source strategy for GBP photos
// Instagram-first when configured, manual otherwise

import { createClient as createAdminSupa } from '@supabase/supabase-js'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Determina a estrategia de fotos para uma organizacao.
 * Se tem instagram_handle configurado, usa pipeline Instagram (EPIC-007).
 * Se nao, retorna 'manual' para upload pelo usuario.
 */
export async function getPhotoStrategy(
  orgId: string
): Promise<'instagram' | 'manual'> {
  const db = admin()

  const { data: org } = await db
    .from('organizations')
    .select('instagram_handle')
    .eq('id', orgId)
    .maybeSingle()

  if (org?.instagram_handle && org.instagram_handle.trim().length > 0) {
    return 'instagram'
  }

  return 'manual'
}

/**
 * Retorna o gap de fotos comparado com a media dos concorrentes.
 * Retorna null se nao houver dados suficientes.
 */
export async function getPhotoGap(
  orgId: string
): Promise<{ current: number; competitorAvg: number } | null> {
  const db = admin()

  // Buscar contagem de fotos do perfil
  const { data: profile } = await db
    .from('gbp_profiles')
    .select('photo_count')
    .eq('organization_id', orgId)
    .maybeSingle()

  if (!profile) return null

  const currentCount = profile.photo_count ?? 0

  // Buscar gap de fotos da analise competitiva
  const { data: analysis } = await db
    .from('competitive_analyses')
    .select('gaps')
    .eq('organization_id', orgId)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!analysis?.gaps) return null

  const gaps = analysis.gaps as Array<{
    type: string
    competitor_values: string[]
    gap_description: string
  }>

  const photoGap = gaps.find(g => g.type === 'photos')
  if (!photoGap) return null

  // Extrair media dos concorrentes do gap_description
  // Formato: "Seus concorrentes tem em media X fotos. Voce tem Y."
  const match = photoGap.gap_description.match(/media (\d+) fotos/)
  const competitorAvg = match ? parseInt(match[1], 10) : 0

  if (competitorAvg === 0) return null

  return { current: currentCount, competitorAvg }
}
