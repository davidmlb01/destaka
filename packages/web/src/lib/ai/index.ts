import Anthropic from '@anthropic-ai/sdk'

let _anthropic: Anthropic | null = null
export function getAnthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  return _anthropic
}

// Compatibilidade com imports existentes (lazy proxy)
export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    return (getAnthropic() as never)[prop]
  },
})

export const AI_MODEL = 'claude-opus-4-6'
