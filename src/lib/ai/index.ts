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

/** Tarefas complexas de raciocínio (ex: diagnóstico de perfil) */
export const AI_MODEL = 'claude-opus-4-6'
/** Tarefas de alta frequência (ex: posts, reviews, optimizer) */
export const AI_MODEL_FAST = 'claude-haiku-4-5-20251001'
