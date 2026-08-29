// =============================================================================
// DESTAKA — Profile Watch (proteção contra edições não autorizadas)
// Compara snapshot anterior com dados atuais da GBP API
// =============================================================================

import { getLocationDetails, type RawLocationDetail } from './client'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ProfileChange {
  field: string
  oldValue: string | null
  newValue: string | null
}

/** Campos monitorados e como extrair cada um do RawLocationDetail */
const WATCHED_FIELDS: Record<string, (d: RawLocationDetail) => string | null> = {
  name: (d) => d.title ?? null,
  phone: (d) => d.phoneNumbers?.primaryPhone ?? null,
  address: (d) => {
    const a = d.storefrontAddress
    if (!a) return null
    return [...(a.addressLines ?? []), a.locality, a.administrativeArea].filter(Boolean).join(', ')
  },
  categories: (d) => d.categories?.primaryCategory?.displayName ?? null,
  websiteUri: (d) =>
    // Tipos mais específicos não existem no RawLocationDetail, acessar via cast
    (d as Record<string, unknown>).websiteUri as string ?? null,
  regularHours: (d) => {
    if (!d.regularHours?.periods) return null
    return JSON.stringify(d.regularHours.periods)
  },
}

/**
 * Verifica se houve alterações no perfil comparando com o snapshot anterior.
 * Retorna lista de mudanças detectadas. Salva novo snapshot no banco.
 */
export async function checkProfileChanges(
  db: SupabaseClient,
  profileId: string,
  locationName: string,
  accessToken: string
): Promise<ProfileChange[]> {
  // Buscar dados atuais da GBP API
  const current = await getLocationDetails(accessToken, locationName)

  // Extrair valores atuais dos campos monitorados
  const currentValues: Record<string, string | null> = {}
  for (const [field, extractor] of Object.entries(WATCHED_FIELDS)) {
    currentValues[field] = extractor(current)
  }

  // Buscar snapshot anterior
  const { data: previousSnapshot } = await db
    .from('profile_snapshots')
    .select('snapshot_data')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const previousValues = (previousSnapshot?.snapshot_data ?? {}) as Record<string, string | null>

  // Comparar campos
  const changes: ProfileChange[] = []

  if (previousSnapshot) {
    for (const field of Object.keys(WATCHED_FIELDS)) {
      const oldVal = previousValues[field] ?? null
      const newVal = currentValues[field] ?? null

      if (oldVal !== newVal) {
        changes.push({ field, oldValue: oldVal, newValue: newVal })
      }
    }
  }

  // Salvar novo snapshot
  await db.from('profile_snapshots').insert({
    profile_id: profileId,
    snapshot_data: currentValues,
  })

  return changes
}

/** Tradução dos nomes de campo para PT-BR (exibição no alerta) */
export const FIELD_LABELS: Record<string, string> = {
  name: 'Nome do perfil',
  phone: 'Telefone',
  address: 'Endereço',
  categories: 'Categoria principal',
  websiteUri: 'Site',
  regularHours: 'Horário de funcionamento',
}
