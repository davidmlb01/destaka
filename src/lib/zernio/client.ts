import { Zernio } from '@zernio/node'

export function getZernioClient(): InstanceType<typeof Zernio> {
  const apiKey = process.env.ZERNIO_API_KEY
  if (!apiKey) throw new Error('ZERNIO_API_KEY not configured')
  return new Zernio({ apiKey })
}

export async function getOrCreateProfile(orgId: string, orgName: string): Promise<string> {
  const zernio = getZernioClient()
  try {
    const { data } = await zernio.profiles.createProfile({
      body: { name: orgName, externalId: orgId },
    })
    if (!data?.profile?._id) throw new Error('No profile ID in response')
    return data.profile._id
  } catch (err: unknown) {
    // Only retry on 409 conflict (profile already exists)
    const status = (err as { status?: number })?.status
    if (status !== 409) throw err
    const { data } = await zernio.profiles.listProfiles({
      query: { externalId: orgId },
    })
    if (data?.profiles?.[0]?._id) return data.profiles[0]._id
    throw new Error('Failed to create or find Zernio profile')
  }
}

export async function getZernioAccountId(profileId: string): Promise<string | null> {
  const zernio = getZernioClient()
  const { data } = await zernio.accounts.listAccounts({
    query: { profileId, platform: 'googlebusiness' },
  })
  const gbpAccount = data?.accounts?.find((a: { platform: string; _id: string }) => a.platform === 'googlebusiness')
  return gbpAccount?._id ?? null
}

export async function generateConnectUrl(profileId: string, redirectUrl: string): Promise<string> {
  const zernio = getZernioClient()
  const { data } = await zernio.connect.getConnectUrl({
    path: { platform: 'googlebusiness' },
    query: { profileId, redirect_url: redirectUrl },
  })
  if (!data?.authUrl) throw new Error('No authUrl in Zernio connect response')
  return data.authUrl
}

export async function publishPost(accountId: string, content: string, imageUrl?: string): Promise<string | null> {
  try {
    const zernio = getZernioClient()
    const body: {
      content: string
      platforms: Array<{ accountId: string; platform: string }>
      publishNow: boolean
      mediaItems?: Array<{ url: string; type: 'image' }>
    } = {
      content,
      platforms: [{ accountId, platform: 'googlebusiness' }],
      publishNow: true,
    }
    if (imageUrl) {
      body.mediaItems = [{ url: imageUrl, type: 'image' }]
    }
    const { data } = await zernio.posts.createPost({ body })
    return data?.post?._id ?? null
  } catch (err) {
    console.error('[zernio] publishPost failed:', err)
    throw err
  }
}

export async function replyToReview(accountId: string, reviewId: string, comment: string): Promise<boolean> {
  try {
    const zernio = getZernioClient()
    await zernio.accounts.replyToGoogleBusinessReview({
      path: { accountId, reviewId },
      body: { comment },
    })
    return true
  } catch {
    return false
  }
}

/**
 * Testa se Zernio retorna metricas agregadas de performance para a conta GBP.
 * Chamado automaticamente apos conexao para avaliar se podemos usar como fonte de dados.
 */
export async function probeAnalytics(accountId: string): Promise<{
  available: boolean
  metrics: Record<string, number> | null
  raw: unknown
}> {
  try {
    const zernio = getZernioClient()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data } = await zernio.analytics.getAnalytics({
      query: {
        accountId,
        fromDate: sevenDaysAgo.toISOString().split('T')[0],
        platform: 'googlebusiness',
      },
    })

    const hasData = !!data && typeof data === 'object'
    console.log(`[zernio-analytics] Probe result for account ${accountId}:`, JSON.stringify(data).slice(0, 500))

    return {
      available: hasData,
      metrics: hasData ? (data as Record<string, number>) : null,
      raw: data,
    }
  } catch (err) {
    console.error('[zernio-analytics] Probe failed:', err)
    return { available: false, metrics: null, raw: null }
  }
}

/**
 * Busca analytics agregadas da conta GBP via Zernio.
 * Retorna metricas no formato esperado pelo dashboard, ou null se indisponivel.
 */
export async function getPerformanceViaZernio(accountId: string): Promise<{
  viewsSearch: number
  viewsMaps: number
  clicksWebsite: number
  clicksCall: number
  impressions: number
} | null> {
  try {
    const zernio = getZernioClient()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data } = await zernio.analytics.getAnalytics({
      query: {
        accountId,
        fromDate: thirtyDaysAgo.toISOString().split('T')[0],
        platform: 'googlebusiness',
      },
    })

    if (!data) return null

    // Mapear resposta do Zernio para formato do dashboard
    const raw = data as Record<string, unknown>
    const asList = raw?.posts ?? raw?.analytics ?? raw?.data
    if (!Array.isArray(asList)) {
      console.warn('[zernio-analytics] Estrutura inesperada. Keys:', Object.keys(raw).join(', '), 'Amostra:', JSON.stringify(raw).slice(0, 300))
      return null
    }
    if (asList.length > 0) {
      let impressions = 0, clicks = 0, reach = 0
      for (const item of asList) {
        const r = item as Record<string, number>
        impressions += r.impressions ?? 0
        clicks += r.clicks ?? r.website_clicks ?? 0
        reach += r.reach ?? 0
      }
      return {
        viewsSearch: impressions,
        viewsMaps: reach,
        clicksWebsite: clicks,
        clicksCall: 0,
        impressions,
      }
    }

    return null
  } catch (err) {
    console.error('[zernio-analytics] getPerformanceViaZernio failed:', err)
    return null
  }
}

export async function listReviews(accountId: string): Promise<Array<{
  id: string
  author: string
  rating: number
  comment: string | null
  createdAt: string
  reply: string | null
}>> {
  try {
    const zernio = getZernioClient()
    const { data } = await zernio.accounts.getGoogleBusinessReviews({
      path: { accountId },
      query: { pageSize: 50 },
    })
    type GBReview = { id?: string; reviewer?: { displayName?: string }; rating?: number; comment?: string; createTime?: string; reviewReply?: { comment?: string } }
    return (data?.reviews ?? []).map((r: GBReview) => ({
      id: r.id ?? '',
      author: r.reviewer?.displayName ?? 'Anônimo',
      rating: r.rating ?? 5,
      comment: r.comment ?? null,
      createdAt: r.createTime ?? new Date().toISOString(),
      reply: r.reviewReply?.comment ?? null,
    }))
  } catch {
    return []
  }
}
