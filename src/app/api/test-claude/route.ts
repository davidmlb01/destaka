import { generateContent } from '@/lib/ai/client'
export async function GET() {
  try {
    const text = await generateContent('Diga OK', 'Responda em uma palavra')
    return Response.json({ ok: true, text })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message })
  }
}
