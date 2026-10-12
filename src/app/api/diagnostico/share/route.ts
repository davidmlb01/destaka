export const dynamic = 'force-dynamic'

import { createHash } from 'crypto'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { getAuthOrg, privateJson } from '@/lib/api/with-auth'

function getServiceDb() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId } = auth

  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) {
    console.error('[security] ENCRYPTION_KEY not configured')
    return privateJson({ error: 'Server configuration error' }, { status: 500 })
  }

  const hash = createHash('sha256')
    .update(orgId + encryptionKey)
    .digest('hex')
    .slice(0, 16)

  // Persist share_hash in organizations table for direct lookup
  const db = getServiceDb()
  await db
    .from('organizations')
    .update({ share_hash: hash })
    .eq('id', orgId)
    .is('share_hash', null)

  return privateJson({ hash, url: `https://destaka.com.br/d/${hash}` })
}
