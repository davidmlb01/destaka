// Claude client via SDK direta (@anthropic-ai/sdk)
// AI SDK (@ai-sdk/anthropic) tinha bug de dependencia (lazySchema crash)
// SDK direta funciona e e mais estavel

import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-haiku-4-5-20251001'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  return _client
}

export async function generateContent(prompt: string, systemPrompt: string): Promise<string> {
  const client = getClient()
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = response.content[0]
    if (block.type === 'text') {
      return block.text
    }
    throw new Error('Claude retornou conteudo nao-texto')
  } catch (err) {
    console.error(`[ai-client] ERRO Claude:`, err instanceof Error ? err.message : err)
    throw err
  }
}
