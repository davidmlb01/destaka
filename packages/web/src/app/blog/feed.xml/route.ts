import { generateRssFeed } from '@/lib/blog/feed'

export async function GET() {
  const xml = generateRssFeed()

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  })
}
