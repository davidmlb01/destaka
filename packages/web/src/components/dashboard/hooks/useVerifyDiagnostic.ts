import { useState } from 'react'
import type { CategoryScore } from '@/lib/gmb/scorer'

interface PlaceInfo {
  name: string
  address: string
  phone: string | null
  website: string | null
  rating: number | null
  reviewsTotal: number | null
  types: string[]
}

interface VerifyResult {
  place: PlaceInfo
  score: { total: number; categories: CategoryScore[] }
  usingMock: boolean
}

export function useVerifyDiagnostic() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState('')
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  async function handleVerify() {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/public/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: input.trim() }),
    })

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setError(data.error ?? 'Não foi possível analisar este estabelecimento.')
      setLoading(false)
      return
    }

    setResult((await res.json()) as VerifyResult)
    setLoading(false)
  }

  return {
    input,
    setInput,
    loading,
    result,
    error,
    expandedCat,
    setExpandedCat,
    handleVerify,
  }
}
