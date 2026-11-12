'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { PinIcon } from '@/components/ui/PinIcon'
import { getVocab } from '@/lib/vertical-vocab'

// HIGH-04: sanitiza SVG do QR code antes de injetar no DOM
// Aceita apenas elementos e atributos SVG legítimos — sem scripts, eventos ou hrefs externos
function sanitizeQrSvg(raw: string): string {
  const sized = raw.replace('<svg ', '<svg width="116" height="116" ')
  return sized
    .replace(/\s+on\w+=['"][^'"]*['"]/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<a[\s\S]*?<\/a>/gi, '')
    .replace(/<use[\s\S]*?<\/use>/gi, '')
    .replace(/\s+href=['"][^'"]*['"]/gi, '')
    .replace(/\s+xlink:href=['"][^'"]*['"]/gi, '')
}

interface QRData {
  reviewUrl: string
  qrSvg: string
  profileName: string
}

export function ReviewQRCard({ specialty }: { specialty?: string | null }) {
  const vocab = getVocab(specialty)
  const [data, setData] = useState<QRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const svgContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/reviews/qr')
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(err.error ?? 'Erro ao carregar QR code')
        }
        const json = await res.json()
        if (mounted) setData(json)
      } catch {
        // Se Place ID não existe, esconde o card silenciosamente
        if (mounted) setData(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
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

  const shareWhatsApp = useCallback(() => {
    if (!data) return
    const message = `Oi! Obrigado(a) pela confiança. Se puder deixar sua opinião no Google, ajuda muito quem está procurando um profissional de confiança na região. É rapidinho: ${data.reviewUrl}`

    if (navigator.share) {
      navigator.share({ text: message }).catch(() => {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
      })
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    }
    setShared(true)
    setTimeout(() => setShared(false), 3000)
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

  if (!data) return null

  return (
    <Card variant="accent" padding="md" className="mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* QR Code */}
        <div
          ref={svgContainerRef}
          className="shrink-0 rounded-xl p-3 qr-container"
          style={{ background: 'rgba(255,255,255,0.08)', width: 140, height: 140, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          dangerouslySetInnerHTML={{ __html: sanitizeQrSvg(data.qrSvg) }}
        />

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-display font-bold text-white text-[16px] mb-1.5">
            QR Code para avaliações
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            Imprima e coloque na recepção{vocab.local !== 'estabelecimento' ? ` do ${vocab.local}` : ''}. Seus {vocab.clientes} escaneiam e avaliam direto no Google.
          </p>

          {/* Link copiável */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span
              className="text-xs truncate flex-1"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'monospace' }}
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

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={shareWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: shared ? 'rgba(74,222,128,0.15)' : '#25D366',
                color: shared ? '#4ADE80' : '#fff',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              {shared ? 'Enviado!' : 'Pedir avaliação via WhatsApp'}
            </button>
            <button
              onClick={downloadPNG}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: 'rgba(14,165,233,0.15)',
                border: '1px solid rgba(14,165,233,0.25)',
                color: 'var(--accent-bright)',
              }}
            >
              Baixar QR Code (PNG)
            </button>
            <a
              href="/dashboard/kit-reviews"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)',
              }}
            >
              Ver kit completo
            </a>
          </div>
        </div>
      </div>
    </Card>
  )
}
