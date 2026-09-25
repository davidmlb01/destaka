// TEMPORARIO: debug endpoint para testar GBP API (remover depois)
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { GBPClient } from '@/lib/google/gbp-client'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const steps: Record<string, unknown> = {}

  // Step 1: Get token
  let token: string
  try {
    token = await getValidGmbToken(user.id)
    steps.token = 'OK (length: ' + token.length + ')'
  } catch (err) {
    steps.token = 'FAILED: ' + (err instanceof Error ? err.message : String(err))
    return NextResponse.json(steps)
  }

  const gbp = new GBPClient(token)

  // Step 2: List accounts
  try {
    const accounts = await gbp.listAccounts()
    steps.accounts = accounts.map(a => ({ name: a.name, accountName: a.accountName, type: a.type }))
  } catch (err) {
    steps.accounts = 'FAILED: ' + (err instanceof Error ? err.message : String(err))
    return NextResponse.json(steps)
  }

  // Step 3: List locations
  const accounts = steps.accounts as Array<{ name: string }>
  if (accounts.length > 0) {
    try {
      const locations = await gbp.listLocations(accounts[0].name)
      steps.locations = locations.map(l => ({ name: l.name, title: l.title }))
    } catch (err) {
      steps.locations = 'FAILED: ' + (err instanceof Error ? err.message : String(err))
    }
  }

  return NextResponse.json(steps)
}
