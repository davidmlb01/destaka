// =============================================================================
// DESTAKA — Google Business Profile API client
// Docs: https://developers.google.com/my-business/reference/businessinformation/rest
// =============================================================================

const ACCOUNT_MGMT_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1'
const BUSINESS_INFO_URL = 'https://mybusinessbusinessinformation.googleapis.com/v1'

export interface GmbLocation {
  name: string           // "accounts/{accountId}/locations/{locationId}"
  title: string
  address: string        // formatted
  phone: string | null
  website: string | null
  category: string | null
}

interface RawAccount {
  name: string
  accountName: string
  type: string
}

interface RawLocation {
  name: string
  title: string
  storefrontAddress?: {
    addressLines?: string[]
    locality?: string
    administrativeArea?: string
  }
  phoneNumbers?: {
    primaryPhone?: string
  }
  websiteUri?: string
  categories?: {
    primaryCategory?: {
      displayName?: string
    }
  }
}

function formatAddress(raw: RawLocation): string {
  const addr = raw.storefrontAddress
  if (!addr) return ''
  const lines = addr.addressLines ?? []
  const parts = [...lines, addr.locality, addr.administrativeArea].filter(Boolean)
  return parts.join(', ')
}

async function fetchJson<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GMB API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export async function listGmbLocations(accessToken: string): Promise<GmbLocation[]> {
  const accountsData = await fetchJson<{ accounts?: RawAccount[] }>(
    `${ACCOUNT_MGMT_URL}/accounts`,
    accessToken
  )

  const accounts = accountsData.accounts ?? []
  if (accounts.length === 0) return []

  const READ_MASK = 'name,title,storefrontAddress,phoneNumbers,websiteUri,categories'
  const allLocations: GmbLocation[] = []

  for (const account of accounts) {
    const locData = await fetchJson<{ locations?: RawLocation[] }>(
      `${BUSINESS_INFO_URL}/${account.name}/locations?readMask=${READ_MASK}`,
      accessToken
    )

    for (const loc of locData.locations ?? []) {
      allLocations.push({
        name: loc.name,
        title: loc.title,
        address: formatAddress(loc),
        phone: loc.phoneNumbers?.primaryPhone ?? null,
        website: loc.websiteUri ?? null,
        category: loc.categories?.primaryCategory?.displayName ?? null,
      })
    }
  }

  return allLocations
}
