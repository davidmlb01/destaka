interface PageViewRow {
  pagePath: string
  screenPageViews: number
}

/**
 * Fetch page views from GA4 Data API.
 * Requires GA4_SERVICE_ACCOUNT_KEY env var with service account JSON.
 * Returns null when not configured (graceful fallback).
 *
 * TODO: Configurar service account no Google Cloud com acesso ao GA4.
 * Env vars necessarias:
 *   GA4_SERVICE_ACCOUNT_KEY = JSON da credencial do service account
 *   GA4_PROPERTY_ID = ID da propriedade GA4 (ex: 123456789)
 */
export async function getPageViews(
  _propertyId: string,
  _startDate: string,
  _endDate: string,
): Promise<PageViewRow[] | null> {
  // GA4 Data API requer service account configurado
  // Por enquanto retorna null (graceful fallback)
  // Implementacao completa requer google-auth-library + fetch para GA4 API
  if (!process.env.GA4_SERVICE_ACCOUNT_KEY) return null

  // Implementacao futura: JWT auth + fetch para
  // https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport
  return null
}
