import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organizacao nao encontrada' }, { status: 404 })
  }

  await inngest.send({
    name: 'destaka/competitors.discover.requested',
    data: { organization_id: professional.organization_id },
  })

  return NextResponse.json({ status: 'queued' })
}
