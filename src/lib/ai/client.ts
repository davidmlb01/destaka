import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

const MODELS = [
  'claude-haiku-4-5-20251001',
] as const

export async function generateContent(prompt: string, systemPrompt: string): Promise<string> {
  for (const model of MODELS) {
    try {
      const { text } = await generateText({
        model: anthropic(model),
        system: systemPrompt,
        prompt,
      })
      return text
    } catch {
      continue
    }
  }
  throw new Error('Nenhum modelo Claude disponivel')
}

export { anthropic }
