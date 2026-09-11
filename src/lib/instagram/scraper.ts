// Instagram Scraper via Apify
// Puxa posts recentes de um perfil publico do Instagram

const APIFY_BASE = 'https://api.apify.com/v2'

export interface InstagramPost {
  id: string
  shortCode: string
  caption: string
  imageUrl: string
  timestamp: string
  likesCount: number
  type: 'Image' | 'Sidecar' | 'Video'
}

interface ApifyRunResponse {
  data: {
    id: string
    defaultDatasetId: string
    status: string
  }
}

interface ApifyPostRaw {
  id?: string
  shortCode?: string
  caption?: string
  displayUrl?: string
  url?: string
  timestamp?: string
  likesCount?: number
  type?: string
  ownerUsername?: string
}

function getApifyToken(): string {
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_API_TOKEN not configured')
  return token
}

export async function scrapeInstagramPosts(
  handle: string,
  maxPosts: number = 10
): Promise<InstagramPost[]> {
  const token = getApifyToken()
  const cleanHandle = handle.replace('@', '')

  // Run the Instagram Post Scraper Actor
  const runRes = await fetch(
    `${APIFY_BASE}/acts/apify~instagram-post-scraper/run-sync-get-dataset-items?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: [cleanHandle],
        resultsLimit: maxPosts,
      }),
    }
  )

  if (!runRes.ok) {
    const errText = await runRes.text()
    throw new Error(`Apify scraper failed (${runRes.status}): ${errText}`)
  }

  const rawPosts = (await runRes.json()) as ApifyPostRaw[]

  return rawPosts
    .filter((p) => {
      // Apenas Image e Sidecar (carrossel). Ignorar Video/Reel.
      const type = p.type ?? 'Image'
      return type === 'Image' || type === 'Sidecar'
    })
    .filter((p) => {
      // Apenas posts dos ultimos 30 dias
      if (!p.timestamp) return true
      const postDate = new Date(p.timestamp)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return postDate >= thirtyDaysAgo
    })
    .map((p) => ({
      id: p.id ?? p.shortCode ?? '',
      shortCode: p.shortCode ?? '',
      caption: p.caption ?? '',
      imageUrl: p.displayUrl ?? p.url ?? '',
      timestamp: p.timestamp ?? new Date().toISOString(),
      likesCount: p.likesCount ?? 0,
      type: (p.type ?? 'Image') as 'Image' | 'Sidecar',
    }))
    .filter((p) => p.id && p.imageUrl)
}
