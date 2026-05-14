// =============================================================================
// DESTAKA — Redis client com graceful fallback
// rateLimit:          fail-open  — null quando Redis indisponível (rotas baratas)
// rateLimitStrict:    fail-closed — lança erro quando Redis indisponível (rotas de custo LLM)
// =============================================================================

import { Redis } from '@upstash/redis'

let _redis: Redis | null = null

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return _redis
}

/**
 * Incrementa um contador de rate limit.
 * Retorna o valor atual ou null se Redis indisponível (fail-open).
 * Use em rotas que podem funcionar degradadas sem rate limiting.
 */
export async function rateLimit(key: string, ttlSeconds: number): Promise<number | null> {
  const redis = getRedis()
  if (!redis) return null

  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, ttlSeconds)
    return count
  } catch (err) {
    console.error('[redis] rateLimit error:', err)
    return null
  }
}

/**
 * Incrementa um contador de rate limit com comportamento fail-closed.
 * Lança erro se Redis estiver indisponível — use em rotas de custo direto (LLM, billing).
 * O chamador deve tratar o erro retornando 503.
 */
export async function rateLimitStrict(key: string, ttlSeconds: number): Promise<number> {
  const redis = getRedis()
  if (!redis) {
    throw new Error('Rate limiter indisponível. Tente novamente em instantes.')
  }

  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, ttlSeconds)
    return count
  } catch (err) {
    console.error('[redis] rateLimitStrict error:', err)
    throw new Error('Rate limiter indisponível. Tente novamente em instantes.')
  }
}
