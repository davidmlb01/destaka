export const dynamic = 'force-dynamic'

// Aplica otimização ao perfil: salva no banco + tenta GBP API (fallback gracioso)
import { NextRequest, NextResponse } from 'next/server'
import { getAuthOrg } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { z } from 'zod'

const CategorySchema = z.object({ displayName: z.string(), name: z.string() })

const ApplyPayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('description'), value: z.string().min(1).max(750) }),
  z.object({
    type: z.literal('categories'),
    value: z.object({
      primaryCategory: CategorySchema.optional(),
      additionalCategories: z.array(CategorySchema).max(9).optional(),
    }),
  }),
  z.object({ type: z.literal('attributes'), value: z.array(z.object({ name: z.string(), valueType: z.string(), values: z.array(z.string()) })) }),
  z.object({ type: z.literal('services'), value: z.array(z.record(z.string(), z.unknown())) }),
])

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const GBP_INFO_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1'

export async function POST(request: NextRequest) {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { user, orgId } = auth

  const parsed = ApplyPayloadSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
  }
  const { type, value } = parsed.data

  const db = admin()

  const { data: org } = await db
    .from('organizations')
    .select('gbp_location_id')
    .eq('id', orgId)
    .maybeSingle()

  const locationName = org?.gbp_location_id

  // Salvar no banco local primeiro (fonte de verdade)
  if (type === 'description' && typeof value === 'string') {
    await db.from('gbp_profiles').update({ description: value }).eq('organization_id', orgId)
  }

  if (type === 'categories') {
    const cats = value as { primaryCategory?: { displayName: string }; additionalCategories?: Array<{ displayName: string }> }
    const allNames = [cats.primaryCategory?.displayName, ...(cats.additionalCategories ?? []).map(c => c.displayName)].filter(Boolean)
    await db.from('gbp_profiles').update({ categories: allNames }).eq('organization_id', orgId)
  }

  if (type === 'attributes') {
    const attrs = value as Array<{ name: string; values: string[] }>
    const attrNames = attrs.map(a => a.name)
    // Merge com atributos existentes
    const { data: profile } = await db.from('gbp_profiles').select('attributes').eq('organization_id', orgId).maybeSingle()
    const existing = Array.isArray(profile?.attributes) ? profile.attributes as string[] : []
    const merged = [...new Set([...existing, ...attrNames])]
    await db.from('gbp_profiles').update({ attributes: merged }).eq('organization_id', orgId)
  }

  if (type === 'services') {
    const services = value as Array<Record<string, unknown>>
    await db.from('gbp_profiles').update({ services }).eq('organization_id', orgId)
  }

  // Tentar aplicar no Google (fallback gracioso, nao bloqueia)
  let gbpApplied = false
  if (locationName) {
    try {
      const accessToken = await getValidGmbToken(user.id)
      let updateMask = ''
      let body: Record<string, unknown> = {}

      if (type === 'description') {
        updateMask = 'profile.description'
        body = { profile: { description: value } }
      } else if (type === 'categories') {
        updateMask = 'categories'
        body = { categories: value }
      } else if (type === 'attributes') {
        updateMask = 'attributes'
        body = { attributes: value }
      } else if (type === 'services') {
        updateMask = 'serviceItems'
        body = { serviceItems: value }
      }

      const res = await fetch(`${GBP_INFO_BASE}/${locationName}?updateMask=${updateMask}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      gbpApplied = res.ok
      if (!res.ok) {
        console.warn(`[optimize/apply] GBP API ${type} falhou (salvo localmente): ${res.status}`)
      }
    } catch {
      console.warn(`[optimize/apply] GBP API indisponivel para ${type} (salvo localmente)`)
    }
  }

  return NextResponse.json({
    status: 'done',
    type,
    applied_to_google: gbpApplied,
  })
}
