import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildOptimizationPlan } from '@/lib/gmb/optimizer'
import { calculateScore, type GmbProfileData } from '@/lib/gmb/scorer'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organizacao nao encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id

  // Buscar perfil GBP e reviews para construir o profileData
  const [{ data: gbpProfile }, { data: reviews }, { data: org }] = await Promise.all([
    supabase.from('gbp_profiles').select('*').eq('organization_id', orgId).maybeSingle(),
    supabase.from('reviews').select('id, rating, response_text').eq('organization_id', orgId),
    supabase.from('organizations').select('specialty').eq('id', orgId).single(),
  ])

  if (!gbpProfile) {
    return NextResponse.json({ error: 'Perfil GBP nao encontrado. Sincronize primeiro.' }, { status: 404 })
  }

  const profile = gbpProfile as Record<string, unknown>
  const categories = (profile.categories as string[]) ?? []
  const services = (profile.services as Array<unknown>) ?? []
  const attributes = (profile.attributes as Array<unknown>) ?? []
  const photoCount = (profile.photo_count as number) ?? 0
  const hours = profile.hours as Record<string, unknown> | null
  const reviewList = reviews ?? []
  const repliedCount = reviewList.filter((r: { response_text: string | null }) => !!r.response_text).length

  const profileData: GmbProfileData = {
    hasName: !!profile.name,
    hasPhone: !!profile.phone,
    hasAddress: !!profile.address,
    hasHours: !!hours,
    hasWebsite: true,
    hasCategory: categories.length > 0,
    hasLogoPhoto: photoCount >= 2,
    hasCoverPhoto: photoCount >= 1,
    spacePhotosCount: Math.max(0, photoCount - 2),
    totalPhotosCount: photoCount,
    reviewsCount: reviewList.length,
    reviewsAvgRating: reviewList.length > 0
      ? reviewList.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewList.length
      : 0,
    reviewsRepliedCount: repliedCount,
    lastPostDaysAgo: null,
    servicesCount: services.length,
    servicesWithDescCount: services.length,
    attributesCount: attributes.length,
    category: categories[0] ?? org?.specialty ?? 'establishment',
    locationName: (profile.name as string) ?? '',
  }

  const score = calculateScore(profileData)
  const plan = buildOptimizationPlan(profileData, score)

  return NextResponse.json(plan)
}
