export interface PageViewRow {
  pagePath: string
  screenPageViews: number
}

/**
 * Fetch page views from GA4 Data API via service account JWT.
 *
 * Env vars necessarias:
 *   GA4_SERVICE_ACCOUNT_KEY = JSON da credencial do service account
 *   GA4_PROPERTY_ID = ID numerico da propriedade GA4 (ex: 123456789)
 *
 * Retorna null quando nao configurado (graceful fallback).
 */
export async function getPageViews(
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<PageViewRow[] | null> {
  const keyJson = process.env.GA4_SERVICE_ACCOUNT_KEY
  if (!keyJson || !propertyId) return null

  try {
    const credentials = JSON.parse(keyJson) as { client_email: string; private_key: string; token_uri?: string }
    const token = await getAccessToken(credentials)

    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 20,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[GA4] API error:', res.status, errBody)
      return null
    }

    const data = await res.json() as {
      rows?: Array<{
        dimensionValues?: Array<{ value?: string }>
        metricValues?: Array<{ value?: string }>
      }>
    }

    return (data.rows ?? []).map(r => ({
      pagePath: r.dimensionValues?.[0]?.value ?? '',
      screenPageViews: parseInt(r.metricValues?.[0]?.value ?? '0', 10),
    }))
  } catch (err) {
    console.error('[GA4] Error fetching page views:', err instanceof Error ? err.message : err)
    return null
  }
}

// JWT auth para Google APIs (sem dependencia externa)
async function getAccessToken(creds: { client_email: string; private_key: string; token_uri?: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: creds.token_uri ?? 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const enc = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const unsigned = `${enc(header)}.${enc(payload)}`

  const { createSign } = await import('node:crypto')
  const sign = createSign('RSA-SHA256')
  sign.update(unsigned)
  const signature = sign.sign(creds.private_key, 'base64url')

  const jwt = `${unsigned}.${signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenRes.json() as { access_token: string }
  return tokenData.access_token
}
