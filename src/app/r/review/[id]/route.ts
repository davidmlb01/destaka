// WhatsApp Review Automation: redirect curto para tracking de cliques
// /r/review/:id -> Google review URL com contagem de clique

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = admin()

  // Buscar request
  const { data: request } = await db
    .from('review_requests')
    .select('id, organization_id, clicked_at')
    .eq('id', id)
    .maybeSingle()

  if (!request) {
    return NextResponse.redirect('https://destaka.com.br')
  }

  // Registrar clique (apenas o primeiro)
  if (!request.clicked_at) {
    await db
      .from('review_requests')
      .update({ clicked_at: new Date().toISOString() })
      .eq('id', request.id)
  }

  // Buscar Google Place ID da org
  const { data: org } = await db
    .from('organizations')
    .select('google_place_id')
    .eq('id', request.organization_id)
    .maybeSingle()

  // Buscar review_settings.google_review_url (se customizado)
  const { data: settings } = await db
    .from('review_settings')
    .select('google_review_url')
    .eq('organization_id', request.organization_id)
    .maybeSingle()

  const reviewUrl = settings?.google_review_url ??
    (org?.google_place_id
      ? `https://search.google.com/local/writereview?placeid=${org.google_place_id}`
      : 'https://destaka.com.br')

  return NextResponse.redirect(reviewUrl)
}
