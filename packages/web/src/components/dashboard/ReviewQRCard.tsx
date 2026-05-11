'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

interface QRData {
  reviewUrl: string
  qrSvg: string
  profileName: string
}

export function ReviewQRCard() {
  const [data, setData] = useState<QRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const svgContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/reviews/qr')
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(err.error ?? 'Erro ao carregar QR code')
        }
        setData(await res.json())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar QR code')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const copyLink = useCallback(async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.reviewUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const input = document.createElement('input')
      input.value = data.reviewUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [data])

  const downloadPNG = useCallback(async () => {
    if (!svgContainerRef.current || !data) return

    const svgEl = svgContainerRef.current.querySelector('svg')
    if (!svgEl) return

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 512
      const padding = 48
      const totalSize = size + padding * 2
      canvas.width = totalSize
      canvas.height = totalSize + 80 // espaço para texto

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Fundo branco
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // QR code (inverter cores para fundo branco)
      ctx.drawImage(img, padding, padding, size, size)

      // Inverter: o SVG usa branco no escuro, precisamos preto no branco
      const imageData = ctx.getImageData(padding, padding, size, size)
      const pixels = imageData.data
      for (let i = 0; i < pixels.length; i += 4) {
        // Inverte RGB
        pixels[i] = 255 - pixels[i]
        pixels[i + 1] = 255 - pixels[i + 1]
        pixels[i + 2] = 255 - pixels[i + 2]
      }
      ctx.putImageData(imageData, padding, padding)

      // Texto
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Avalie no Google', canvas.width / 2, totalSize + 30)
      ctx.font = '14px sans-serif'
      ctx.fillStyle = '#666666'
      ctx.fillText(data.profileName, canvas.width / 2, totalSize + 55)

      canvas.toBlob((blob) => {
        if (!blob) return
        const link = document.createElement('a')
        link.download = `qr-avaliacao-${data.profileName.replace(/\s+/g, '-').toLowerCase()}.png`
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)
      }, 'image/png')

      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [data])

  if (loading) {
    return (
      <Card variant="accent" padding="md">
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card variant="subtle" padding="md">
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {error ?? 'Não foi possível gerar o QR code.'}
        </p>
      </Card>
    )
  }

  return (
    <Card variant="accent" padding="md" className="mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* QR Code */}
        <div
          ref={svgContainerRef}
          className="shrink-0 rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          dangerouslySetInnerHTML={{ __html: data.qrSvg }}
        />

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-display font-bold text-white text-[16px] mb-1.5">
            QR Code para avaliações
          </h3>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            Imprima e coloque na recepção do consultório. Seus pacientes escaneiam e avaliam direto no Google.
          </p>

          {/* Link copiável */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span
              className="text-xs truncate flex-1"
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}
            >
              {data.reviewUrl}
            </span>
            <button
              onClick={copyLink}
              className="shrink-0 text-xs font-medium px-3 py-1 rounded-md transition-all"
              style={{
                background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(14,165,233,0.15)',
                color: copied ? '#4ADE80' : 'var(--accent-bright)',
                border: `1px solid ${copied ? 'rgba(74,222,128,0.25)' : 'rgba(14,165,233,0.25)'}`,
              }}
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          {/* Botão download */}
          <button
            onClick={downloadPNG}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'rgba(14,165,233,0.15)',
              border: '1px solid rgba(14,165,233,0.25)',
              color: 'var(--accent-bright)',
            }}
          >
            📥 Baixar para impressão (PNG)
          </button>
        </div>
      </div>
    </Card>
  )
}
