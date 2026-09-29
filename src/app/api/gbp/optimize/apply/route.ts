export const dynamic = 'force-dynamic'

// Aplica uma otimização específica ao perfil GBP via API
// Tipos suportados: description, categories, attributes
import { NextRequest, NextResponse } from 'next/server'
import { getAuthOrg } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getValidGmbToken } from '@/lib/gmb/auth'

type OptimizationType = 'description' | 'categories' | 'attributes' | 'services'

function createServiceClient() {
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

  const body = await request.json() as { type: OptimizationType; value: unknown }
  const { type, value } = body

  if (!type || !value) {
    return NextResponse.json({ error: 'type e value são obrigatórios' }, { status: 400 })
  }

  const admin = createServiceClient()

  const { data: org } = await admin
    .from('organizations')
    .select('gbp_location_id')
    .eq('id', orgId)
    .single()

  if (!org?.gbp_location_id) {
    return NextResponse.json({ error: 'Location GBP não configurado' }, { status: 500 })
  }

  let accessToken: string
  try {
    accessToken = await getValidGmbToken(user.id)
  } catch {
    return NextResponse.json({ error: 'Token Google expirado. Reconecte sua conta.' }, { status: 401 })
  }

  const locationName = org.gbp_location_id

  // --- PATCH: description ---
  if (type === 'description') {
    if (typeof value !== 'string') {
      return NextResponse.json({ error: 'value deve ser string para description' }, { status: 400 })
    }
    if (value.length < 50 || value.length > 750) {
      return NextResponse.json({ error: 'Descrição deve ter entre 50 e 750 caracteres' }, { status: 400 })
    }

    const url = `${GBP_INFO_BASE}/${locationName}?updateMask=profile.description`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile: { description: value } }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[gbp/optimize] GBP API error:', errBody)
      return NextResponse.json({ status: 'failed', type, error: 'Falha ao aplicar otimizacao no Google. Tente novamente.' }, { status: 502 })
    }

    await admin
      .from('gbp_profiles')
      .update({ description: value })
      .eq('organization_id', orgId)
      .eq('location_id', locationName)

    return NextResponse.json({ status: 'done', type })
  }

  // --- PATCH: categories ---
  if (type === 'categories') {
    if (!value || typeof value !== 'object') {
      return NextResponse.json({ error: 'value deve ser objeto com primaryCategory e/ou additionalCategories' }, { status: 400 })
    }

    const categoriesPayload = value as {
      primaryCategory?: { displayName: string; name: string }
      additionalCategories?: Array<{ displayName: string; name: string }>
    }

    const url = `${GBP_INFO_BASE}/${locationName}?updateMask=categories`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categories: categoriesPayload }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      return NextResponse.json({ status: 'failed', type, error: `GBP API error: ${errBody}` }, { status: 502 })
    }

    const allCatNames = [
      categoriesPayload.primaryCategory?.displayName,
      ...(categoriesPayload.additionalCategories ?? []).map(c => c.displayName),
    ].filter(Boolean)

    await admin
      .from('gbp_profiles')
      .update({ categories: allCatNames })
      .eq('organization_id', orgId)
      .eq('location_id', locationName)

    return NextResponse.json({ status: 'done', type })
  }

  // --- PATCH: attributes ---
  if (type === 'attributes') {
    if (!Array.isArray(value)) {
      return NextResponse.json({ error: 'value deve ser array de atributos' }, { status: 400 })
    }

    const attributesPayload = value as Array<{
      name: string
      valueType: string
      values: string[]
    }>

    const url = `${GBP_INFO_BASE}/${locationName}?updateMask=attributes`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attributes: attributesPayload }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      return NextResponse.json({ status: 'failed', type, error: `GBP API error: ${errBody}` }, { status: 502 })
    }

    return NextResponse.json({ status: 'done', type })
  }

  // --- PATCH: services ---
  if (type === 'services') {
    if (!Array.isArray(value)) {
      return NextResponse.json({ error: 'value deve ser array de serviceItems' }, { status: 400 })
    }

    const serviceItems = value as Array<{
      structuredServiceItem?: { serviceTypeId: string; description: string }
      freeFormServiceItem?: { category: string; label: { displayName: string; description: string } }
    }>

    const url = `${GBP_INFO_BASE}/${locationName}?updateMask=serviceItems`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serviceItems }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[gbp/optimize] GBP API services error:', errBody)
      return NextResponse.json({ status: 'failed', type, error: 'Falha ao atualizar servicos no Google' }, { status: 502 })
    }

    return NextResponse.json({ status: 'done', type })
  }

  return NextResponse.json(
    { status: 'not_implemented', type, error: `Tipo '${type}' ainda não possui implementação` },
    { status: 422 }
  )
}
