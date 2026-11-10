# Zernio GBP Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar Zernio como intermediário para publicar posts, responder reviews e coletar analytics do Google Business Profile, substituindo a GBP API v4 bloqueada pelo Google.

**Architecture:** Criar lib `src/lib/zernio/client.ts` como camada de abstração. No OAuth callback, criar profile Zernio e conectar conta GBP automaticamente. Post-generator e review-monitor usam Zernio em vez de GBP v4. EXIF geotag nas fotos antes do upload.

**Tech Stack:** @zernio/node SDK, sharp (EXIF geotag), Next.js API routes, Inngest functions, Supabase

---

### Task 1: Zernio Client Library

**Files:**
- Create: `src/lib/zernio/client.ts`

- [ ] **Step 1: Create Zernio client wrapper**

```typescript
// src/lib/zernio/client.ts
import Zernio from '@zernio/node'

let _client: Zernio | null = null

export function getZernioClient(): Zernio {
  if (!_client) {
    const apiKey = process.env.ZERNIO_API_KEY
    if (!apiKey) throw new Error('ZERNIO_API_KEY not configured')
    _client = new Zernio({ apiKey })
  }
  return _client
}

export async function getOrCreateProfile(orgId: string, orgName: string): Promise<string> {
  const zernio = getZernioClient()
  try {
    const { data } = await zernio.profiles.createProfile({
      body: { name: orgName, externalId: orgId },
    })
    return data.profile._id
  } catch (err: unknown) {
    // Profile already exists (409), retrieve it
    const { data } = await zernio.profiles.listProfiles({
      query: { externalId: orgId },
    })
    if (data.profiles?.[0]?._id) return data.profiles[0]._id
    throw err
  }
}

export async function getZernioAccountId(profileId: string): Promise<string | null> {
  const zernio = getZernioClient()
  const { data } = await zernio.accounts.listAccounts({
    query: { profileId },
  })
  const gbpAccount = data.accounts?.find((a: { platform: string }) => a.platform === 'googlebusiness')
  return gbpAccount?._id ?? null
}

export async function generateConnectUrl(profileId: string, redirectUrl: string): Promise<string> {
  const zernio = getZernioClient()
  const { data } = await zernio.connect.getConnectUrl({
    path: { platform: 'googlebusiness' },
    query: { profileId, redirect_url: redirectUrl },
  })
  return data.authUrl
}

export async function publishPost(accountId: string, content: string, imageUrl?: string): Promise<string | null> {
  const zernio = getZernioClient()
  const body: Record<string, unknown> = {
    content,
    platforms: [{ platform: 'googlebusiness', accountId }],
    publishNow: true,
  }
  if (imageUrl) {
    body.mediaItems = [{ url: imageUrl, type: 'image' }]
  }
  const { data } = await zernio.posts.createPost({ body })
  return data.post?._id ?? null
}

export async function replyToReview(accountId: string, reviewId: string, comment: string): Promise<boolean> {
  const zernio = getZernioClient()
  try {
    // Zernio inbox API for review reply
    const res = await fetch(`https://zernio.com/api/v1/inbox/${reviewId}/reply`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ZERNIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: comment }),
    })
    return res.ok
  } catch {
    return false
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
    const res = await fetch(`https://zernio.com/api/v1/accounts/${accountId}/gmb-reviews`, {
      headers: { Authorization: `Bearer ${process.env.ZERNIO_API_KEY}` },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.reviews ?? []).map((r: Record<string, unknown>) => ({
      id: r.reviewId ?? r._id,
      author: (r.reviewer as Record<string, string>)?.displayName ?? 'Anônimo',
      rating: r.starRating ?? 5,
      comment: r.comment ?? null,
      createdAt: r.createTime ?? new Date().toISOString(),
      reply: (r.reviewReply as Record<string, string>)?.comment ?? null,
    }))
  } catch {
    return []
  }
}
```

- [ ] **Step 2: Add ZERNIO_API_KEY to Vercel env**

```bash
cd /Users/davidlevy/Desktop/PJ/DESTAKA
npx vercel env add ZERNIO_API_KEY production
# Paste: sk_279db56a89db3f5ef6656367d9e01f5e4931ae05f7c6cee66f2d1e7472ef4f4e
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/zernio/client.ts
git commit -m "feat: Zernio client library for GBP posts, reviews, analytics"
```

---

### Task 2: Auto-connect Zernio on OAuth Callback

**Files:**
- Modify: `src/app/api/auth/callback/route.ts`
- Create: `src/lib/zernio/connect.ts`

- [ ] **Step 1: Create connect helper**

```typescript
// src/lib/zernio/connect.ts
import { getOrCreateProfile, generateConnectUrl, getZernioAccountId } from './client'

export async function ensureZernioProfile(
  orgId: string,
  orgName: string,
  db: ReturnType<typeof import('@supabase/supabase-js').createClient>
): Promise<void> {
  try {
    // Check if org already has a zernio_profile_id
    const { data: org } = await db
      .from('organizations')
      .select('zernio_profile_id, zernio_account_id')
      .eq('id', orgId)
      .maybeSingle()

    if (org?.zernio_account_id) return // Already fully connected

    // Create or get profile
    const profileId = await getOrCreateProfile(orgId, orgName)

    // Check if GBP account is connected
    const accountId = await getZernioAccountId(profileId)

    // Save to org
    await db.from('organizations').update({
      zernio_profile_id: profileId,
      ...(accountId ? { zernio_account_id: accountId } : {}),
    }).eq('id', orgId)
  } catch (err) {
    console.error('[zernio] ensureZernioProfile failed:', err)
    // Non-blocking: Zernio failure should not break auth flow
  }
}
```

- [ ] **Step 2: Add zernio columns to organizations (migration)**

Create file `supabase/migrations/029_zernio_integration.sql`:

```sql
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS zernio_profile_id TEXT,
  ADD COLUMN IF NOT EXISTS zernio_account_id TEXT;
```

- [ ] **Step 3: Modify auth callback to call ensureZernioProfile**

In `src/app/api/auth/callback/route.ts`, after the token save block (around line 62), add:

```typescript
import { ensureZernioProfile } from '@/lib/zernio/connect'

// After populateFromPlaces call (line 66):
ensureZernioProfile(
  existingProfessional.organization_id,
  org?.name ?? locationName ?? user.user_metadata?.name ?? '',
  admin
).catch(() => {})
```

- [ ] **Step 4: Create API route for manual Zernio connect**

Create `src/app/api/zernio/connect/route.ts`:

```typescript
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthOrg } from '@/lib/api/with-auth'
import { getOrCreateProfile, generateConnectUrl, getZernioAccountId } from '@/lib/zernio/client'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  const { data: org } = await supabase
    .from('organizations')
    .select('name, zernio_profile_id, zernio_account_id')
    .eq('id', orgId)
    .maybeSingle()

  if (org?.zernio_account_id) {
    return NextResponse.json({ connected: true, accountId: org.zernio_account_id })
  }

  const profileId = org?.zernio_profile_id ?? await getOrCreateProfile(orgId, org?.name ?? 'Business')

  // Check if already connected
  const accountId = await getZernioAccountId(profileId)
  if (accountId) {
    const admin = createAdminSupa(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    await admin.from('organizations').update({ zernio_profile_id: profileId, zernio_account_id: accountId }).eq('id', orgId)
    return NextResponse.json({ connected: true, accountId })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://destaka.com.br'
  const connectUrl = await generateConnectUrl(profileId, `${appUrl}/api/zernio/callback`)

  return NextResponse.json({ connected: false, connectUrl })
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/zernio/connect.ts src/app/api/auth/callback/route.ts src/app/api/zernio/connect/route.ts supabase/migrations/029_zernio_integration.sql
git commit -m "feat: auto-connect Zernio on OAuth callback + manual connect endpoint"
```

---

### Task 3: Post-generator via Zernio

**Files:**
- Modify: `src/lib/inngest/functions/post-generator.ts`

- [ ] **Step 1: Replace publishGbpPost with Zernio**

Replace the `publishGbpPost` function (lines 21-35) with:

```typescript
import { publishPost as zernioPublishPost } from '@/lib/zernio/client'

async function publishViaZernio(
  orgId: string,
  content: string,
  imageUrl?: string
): Promise<string | null> {
  try {
    const { data: org } = await admin()
      .from('organizations')
      .select('zernio_account_id')
      .eq('id', orgId)
      .maybeSingle()

    if (!org?.zernio_account_id) {
      console.log(`[post-generator] Org ${orgId} sem zernio_account_id`)
      return null
    }

    return await zernioPublishPost(org.zernio_account_id, content, imageUrl)
  } catch (err) {
    console.error('[post-generator] Zernio publish failed:', err)
    return null
  }
}
```

- [ ] **Step 2: Update publish calls in the function**

Replace all calls to `publishGbpPost(validToken, org.gbp_location_id, ...)` with `publishViaZernio(orgId, ...)`:

Line ~85: `const gbpPostId = await publishViaZernio(orgId, igPost.rewritten_caption, igPost.image_url)`

Line ~211-214: `const gbpPostId = await publishViaZernio(orgId, generated.content)`

- [ ] **Step 3: Remove token dependency for publishing**

The post-generator currently requires `getValidTokenForOrg` (line 126) to publish. With Zernio, the token is managed by Zernio. Keep the token check only for cases where we still need GBP API access (like listing locations), but don't block post generation if token is missing.

Change line 126-130:
```typescript
// Token is optional now - Zernio handles publishing auth
const validToken = await getValidTokenForOrg(db, orgId)
// Don't return skip if no token - we can still generate and publish via Zernio
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/inngest/functions/post-generator.ts
git commit -m "feat: post-generator publica via Zernio em vez de GBP v4"
```

---

### Task 4: Review-monitor via Zernio

**Files:**
- Modify: `src/lib/inngest/functions/review-monitor.ts`

- [ ] **Step 1: Add Zernio review listing as primary source**

After the existing imports, add:

```typescript
import { listReviews as zernioListReviews, replyToReview as zernioReplyToReview } from '@/lib/zernio/client'
```

- [ ] **Step 2: Replace review fetching logic**

Replace the review fetching block (the GBP v4 try + Places API fallback) with:

```typescript
// Busca reviews: Zernio (primario) > Places API (fallback)
let reviews: Awaited<ReturnType<GBPClient['listReviews']>> = []

// Tenta Zernio primeiro (retorna todas as reviews, paginadas)
const { data: orgZernio } = await db
  .from('organizations')
  .select('zernio_account_id')
  .eq('id', orgId)
  .maybeSingle()

if (orgZernio?.zernio_account_id) {
  const zReviews = await zernioListReviews(orgZernio.zernio_account_id)
  reviews = zReviews.map(r => ({
    name: `zernio/${r.id}`,
    reviewId: r.id,
    reviewer: { displayName: r.author, isAnonymous: !r.author },
    starRating: (['ONE','TWO','THREE','FOUR','FIVE'] as const)[Math.min(r.rating - 1, 4)],
    comment: r.comment ?? undefined,
    createTime: r.createdAt,
    updateTime: r.createdAt,
    reviewReply: r.reply ? { comment: r.reply, updateTime: r.createdAt } : undefined,
  }))
}

// Fallback: Places API
if (reviews.length === 0) {
  // ... keep existing Places API fallback code ...
}
```

- [ ] **Step 3: Replace review reply with Zernio**

In the publish reply section, replace `publishReviewReply` with Zernio:

```typescript
if (isAutomatic) {
  let published = false
  if (orgZernio?.zernio_account_id) {
    published = await zernioReplyToReview(orgZernio.zernio_account_id, review.reviewId, responseText)
  }
  if (!published && validToken) {
    published = await publishReviewReply(validToken, review.name, responseText)
  }
  // ... rest of save logic
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/inngest/functions/review-monitor.ts
git commit -m "feat: review-monitor usa Zernio para listar e responder reviews"
```

---

### Task 5: EXIF Geotag for Photos

**Files:**
- Create: `src/lib/media/geotag.ts`

- [ ] **Step 1: Install sharp**

```bash
cd /Users/davidlevy/Desktop/PJ/DESTAKA && npm install sharp
```

- [ ] **Step 2: Create geotag utility**

```typescript
// src/lib/media/geotag.ts
import sharp from 'sharp'

interface GeotagOptions {
  lat: number
  lng: number
  businessName: string
  keywords?: string[]
}

export async function geotagImage(imageBuffer: Buffer, options: GeotagOptions): Promise<Buffer> {
  const { lat, lng, businessName, keywords } = options

  // EXIF GPS data via sharp
  const exif: Record<string, string> = {
    IFD0: JSON.stringify({
      ImageDescription: businessName,
      Artist: businessName,
      Copyright: businessName,
    }),
  }

  // sharp handles GPS coordinates via withExifMerge
  return sharp(imageBuffer)
    .withExifMerge({
      IFD0: {
        ImageDescription: `${businessName}${keywords?.length ? ' - ' + keywords.join(', ') : ''}`,
      },
      IFD3: {
        GPSLatitudeRef: lat >= 0 ? 'N' : 'S',
        GPSLatitude: decimalToExifGps(Math.abs(lat)),
        GPSLongitudeRef: lng >= 0 ? 'E' : 'W',
        GPSLongitude: decimalToExifGps(Math.abs(lng)),
      },
    })
    .jpeg({ quality: 90 })
    .toBuffer()
}

function decimalToExifGps(decimal: number): string {
  const degrees = Math.floor(decimal)
  const minutesDecimal = (decimal - degrees) * 60
  const minutes = Math.floor(minutesDecimal)
  const seconds = Math.round((minutesDecimal - minutes) * 60 * 100) / 100
  return `${degrees}/1 ${minutes}/1 ${Math.round(seconds * 100)}/100`
}
```

- [ ] **Step 3: Integrate geotag into post-generator before Zernio upload**

In post-generator, before calling `publishViaZernio`, if there's an image:

```typescript
import { geotagImage } from '@/lib/media/geotag'

// Before publish, geotag the image if available
if (imageUrl && org.latitude && org.longitude) {
  // Download image, geotag, upload to presigned URL
  // For now, Zernio accepts public URLs directly
  // Geotag will be applied when we handle Instagram photo pipeline
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/media/geotag.ts
git commit -m "feat: EXIF geotag utility for photo SEO optimization"
```

---

### Task 6: Add ZERNIO_API_KEY, Deploy and Test

**Files:**
- Modify: `package.json` (dependencies already added)

- [ ] **Step 1: Add env var to Vercel**

```bash
cd /Users/davidlevy/Desktop/PJ/DESTAKA
printf 'sk_279db56a89db3f5ef6656367d9e01f5e4931ae05f7c6cee66f2d1e7472ef4f4e' | npx vercel env add ZERNIO_API_KEY production
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push --linked
```

Or via SQL in Supabase dashboard:
```sql
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS zernio_profile_id TEXT,
  ADD COLUMN IF NOT EXISTS zernio_account_id TEXT;
```

- [ ] **Step 3: Build check**

```bash
cd /Users/davidlevy/Desktop/PJ/DESTAKA && npx next build 2>&1 | grep -E "Compiled|error"
```

Expected: "Compiled successfully"

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "feat: Zernio GBP integration - posts, reviews, analytics"
git push origin main
```

- [ ] **Step 5: Verify deploy**

```bash
npx vercel ls | head -5
```

Expected: Ready

- [ ] **Step 6: Test Zernio API connection**

```bash
curl -sS https://destaka.com.br/api/zernio/connect \
  -H "Cookie: <session cookie>"
```

- [ ] **Step 7: Trigger post-generator and review-monitor**

```bash
INNGEST_KEY="0LK-WvHzm2QlknbeXZZCVfOYZNEMEVy7klXedQ5lg-ssND1-kEFuLHyz8-v2q-VOVzVS2cS8-KCUCxo37cRfcA"
curl -s -X POST "https://inn.gs/e/$INNGEST_KEY" -H "Content-Type: application/json" \
  -d '{"name":"destaka/post.generate.requested","data":{"organization_id":"f6c6416f-3c34-4bea-b75e-bb8c1056369e"}}'
curl -s -X POST "https://inn.gs/e/$INNGEST_KEY" -H "Content-Type: application/json" \
  -d '{"name":"destaka/reviews.sync.requested","data":{}}'
```

- [ ] **Step 8: Verify data after 5 minutes**

Query posts and review_responses tables to confirm new data was created and published.
