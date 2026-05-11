import { useState } from 'react'

interface CaptureParams {
  placeName: string
  score: number
  categories?: unknown[]
}

export function useLeadCapture(params: CaptureParams | null) {
  const [captureEmail, setCaptureEmail] = useState('')
  const [lgpdConsent, setLgpdConsent] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [captureMsg, setCaptureMsg] = useState('')

  async function handleCapture() {
    if (!captureEmail.includes('@') || !lgpdConsent || !params) return
    setCapturing(true)
    setCaptureMsg('')
    const res = await fetch('/api/public/capture-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: captureEmail,
        placeName: params.placeName,
        score: params.score,
        categories: params.categories,
        lgpdConsent: true,
      }),
    })
    const data = (await res.json()) as { ok?: boolean; emailSent?: boolean; error?: string }
    if (data.ok) {
      setCaptureMsg(
        data.emailSent
          ? 'Relatório enviado! Confira sua caixa de entrada.'
          : 'Email registrado com sucesso.',
      )
    } else {
      setCaptureMsg(data.error ?? 'Erro ao enviar. Tente novamente.')
    }
    setCapturing(false)
  }

  return {
    captureEmail,
    setCaptureEmail,
    lgpdConsent,
    setLgpdConsent,
    capturing,
    captureMsg,
    handleCapture,
  }
}
