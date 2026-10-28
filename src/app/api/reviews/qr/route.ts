export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

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
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id

  const { data: org } = await supabase
    .from('organizations')
    .select('name, google_place_id')
    .eq('id', orgId)
    .maybeSingle()

  if (!org?.google_place_id) {
    return NextResponse.json({ error: 'Google Place ID não encontrado' }, { status: 404 })
  }

  const reviewUrl = `https://search.google.com/local/writereview?placeid=${org.google_place_id}`

  const qrSvg = await QRCode.toString(reviewUrl, {
    type: 'svg',
    width: 256,
    margin: 2,
    color: { dark: '#333333', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })

  return NextResponse.json({
    reviewUrl,
    qrSvg,
    profileName: org.name ?? 'Meu Perfil',
  })
}
