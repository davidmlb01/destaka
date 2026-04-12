import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

// Modelo padrão para geração de conteúdo do Destaka
const DEFAULT_MODEL = 'claude-sonnet-4.6'

export async function generateContent(prompt: string, systemPrompt: string): Promise<string> {
  const { text } = await generateText({
    model: anthropic(DEFAULT_MODEL),
    system: systemPrompt,
    prompt,
  })
  return text
}

export { anthropic }
