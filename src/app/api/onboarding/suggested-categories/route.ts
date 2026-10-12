export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { z } from 'zod'

const ApplyCategoriesSchema = z.object({
  categories: z.array(z.object({
    displayName: z.string(),
    name: z.string(),
  })).min(1).max(10),
})

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organizacao nao encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id

  // Buscar categorias atuais do perfil GBP
  const { data: profile } = await supabase
    .from('gbp_profiles')
    .select('categories')
    .eq('organization_id', orgId)
    .maybeSingle()

  const currentCategories: string[] = Array.isArray(profile?.categories)
    ? (profile.categories as string[])
    : []

  // Buscar gaps de categorias da analise competitiva
  const { data: analysis } = await supabase
    .from('competitive_analyses')
    .select('gaps, keyword_opportunities')
    .eq('organization_id', orgId)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const suggested: Array<{ displayName: string; name: string; reason: string }> = []

  if (analysis?.gaps) {
    const gaps = analysis.gaps as Array<{
      type: string
      missing: string[]
      gap_description: string
    }>

    const categoryGap = gaps.find(g => g.type === 'categories')
    if (categoryGap?.missing) {
      for (const cat of categoryGap.missing.slice(0, 5)) {
        suggested.push({
          displayName: cat,
          name: cat.toLowerCase().replace(/\s+/g, '_'),
          reason: 'Categoria usada por 2+ concorrentes na sua regiao.',
        })
      }
    }
  }

  return NextResponse.json({
    current: currentCategories,
    suggested,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organizacao nao encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id
  const parsed = ApplyCategoriesSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
  }

  const admin = createServiceClient()

  // Buscar categorias atuais do perfil GBP
  const { data: profile } = await admin
    .from('gbp_profiles')
    .select('location_id, categories')
    .eq('organization_id', orgId)
    .maybeSingle()

  if (!profile?.location_id) {
    return NextResponse.json({ error: 'Perfil GBP nao encontrado' }, { status: 404 })
  }

  const existingCategories: string[] = Array.isArray(profile.categories)
    ? (profile.categories as string[])
    : []

  // Merge categorias existentes com novas (evitar duplicatas)
  const newDisplayNames = parsed.data.categories.map(c => c.displayName)
  const merged = [
    ...existingCategories,
    ...newDisplayNames.filter(n => !existingCategories.some(
      e => e.toLowerCase() === n.toLowerCase()
    )),
  ]

  // Atualizar categorias no perfil GBP local
  const { error: updateError } = await admin
    .from('gbp_profiles')
    .update({ categories: merged })
    .eq('organization_id', orgId)
    .eq('location_id', profile.location_id)

  if (updateError) {
    console.error('[suggested-categories] Falha ao atualizar categorias:', updateError.message)
    return NextResponse.json({ error: 'Falha ao salvar categorias' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, categories: merged })
}
