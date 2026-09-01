import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const { data: org } = await supabase
    .from('organizations')
    .select('name, google_place_id')
    .eq('id', orgId)
    .maybeSingle()

  if (!org?.google_place_id) {
    return NextResponse.json({ error: 'Google Place ID nao encontrado' }, { status: 404 })
  }

  const reviewUrl = `https://search.google.com/local/writereview?placeid=${org.google_place_id}`

  // Gera SVG QR code inline (sem dependencia externa)
  const qrSvg = generateSimpleQrPlaceholder(reviewUrl)

  return NextResponse.json({
    reviewUrl,
    qrSvg,
    profileName: org.name ?? 'Meu Perfil',
  })
}

function generateSimpleQrPlaceholder(url: string): string {
  // QR code placeholder - mostra um SVG com icone de QR e a URL
  // Em producao, usar uma lib como 'qrcode' para gerar o QR real
  const escaped = url.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 116 116" fill="none">
    <rect width="116" height="116" rx="8" fill="white"/>
    <rect x="8" y="8" width="36" height="36" rx="4" fill="#333"/>
    <rect x="14" y="14" width="24" height="24" rx="2" fill="white"/>
    <rect x="20" y="20" width="12" height="12" fill="#333"/>
    <rect x="72" y="8" width="36" height="36" rx="4" fill="#333"/>
    <rect x="78" y="14" width="24" height="24" rx="2" fill="white"/>
    <rect x="84" y="20" width="12" height="12" fill="#333"/>
    <rect x="8" y="72" width="36" height="36" rx="4" fill="#333"/>
    <rect x="14" y="78" width="24" height="24" rx="2" fill="white"/>
    <rect x="20" y="84" width="12" height="12" fill="#333"/>
    <rect x="52" y="8" width="8" height="8" fill="#333"/>
    <rect x="52" y="24" width="8" height="8" fill="#333"/>
    <rect x="52" y="52" width="12" height="12" fill="#333"/>
    <rect x="72" y="52" width="8" height="8" fill="#333"/>
    <rect x="88" y="52" width="8" height="8" fill="#333"/>
    <rect x="52" y="72" width="8" height="8" fill="#333"/>
    <rect x="72" y="72" width="8" height="8" fill="#333"/>
    <rect x="88" y="72" width="8" height="8" fill="#333"/>
    <rect x="72" y="88" width="8" height="8" fill="#333"/>
    <rect x="96" y="88" width="12" height="12" fill="#333"/>
    <rect x="52" y="96" width="8" height="12" fill="#333"/>
    <text x="58" y="114" font-size="4" fill="#999" text-anchor="middle">${escaped.slice(0, 40)}</text>
  </svg>`
}
