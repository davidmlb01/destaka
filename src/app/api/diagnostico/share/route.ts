export const dynamic = 'force-dynamic'

import { createHash } from 'crypto'
import { getAuthOrg, privateJson } from '@/lib/api/with-auth'

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId } = auth

  const hash = createHash('sha256')
    .update(orgId + (process.env.ENCRYPTION_KEY ?? ''))
    .digest('hex')
    .slice(0, 16)

  return privateJson({ hash, url: `https://destaka.com.br/d/${hash}` })
}
