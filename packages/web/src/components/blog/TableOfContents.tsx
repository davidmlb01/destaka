'use client'

import { useState, useEffect } from 'react'

interface TOCItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

function extractHeadings(markdown: string): TOCItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const items: TOCItem[] = []
  let match

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\sà-ú]/g, '')
      .replace(/\s+/g, '-')

    items.push({ id, text, level })
  }

  return items
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const headings = extractHeadings(content)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' },
    )

    for (const heading of headings) {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden lg:block sticky top-24"
        style={{ width: 280 }}
        aria-label="Sumário"
      >
        <p
          className="font-display font-semibold text-xs uppercase tracking-wider mb-3"
          style={{ color: '#6B7280' }}
        >
          Neste artigo
        </p>
        <ul className="space-y-1.5">
          {headings.map((h) => (
            <li key={h.id} style={{ paddingLeft: h.level === 3 ? 12 : 0 }}>
              <a
                href={`#${h.id}`}
                className="block font-body text-sm py-1 transition-colors"
                style={{
                  color: activeId === h.id ? '#0F2A1F' : '#6B7280',
                  fontWeight: activeId === h.id ? 600 : 400,
                  borderLeft: activeId === h.id ? '2px solid #4ade80' : '2px solid transparent',
                  paddingLeft: 12,
                }}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>

        <div
          className="mt-6 rounded-xl p-5"
          style={{
            background: 'linear-gradient(135deg, #0F2A1F 0%, #1a3d2e 100%)',
          }}
        >
          <p className="font-display font-bold text-sm text-white mb-1.5">
            Diagnóstico gratuito
          </p>
          <p className="font-body text-xs text-white/60 mb-3">
            Descubra como seus pacientes encontram você no Google.
          </p>
          <a
            href="/saude/verificar"
            className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg font-display font-bold text-xs transition-all hover:brightness-110"
            style={{ background: '#4ade80', color: '#0F2A1F' }}
          >
            Começar agora
          </a>
        </div>
      </nav>

      {/* Mobile floating button */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{ background: '#0F2A1F', color: '#4ade80' }}
          aria-label="Abrir sumário"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h12M4 18h8" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-6 max-h-[60vh] overflow-y-auto"
            style={{ background: '#FAFAF8' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p
                className="font-display font-semibold text-sm"
                style={{ color: '#0F2A1F' }}
              >
                Neste artigo
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="text-lg"
                style={{ color: '#6B7280' }}
              >
                ✕
              </button>
            </div>
            <ul className="space-y-2">
              {headings.map((h) => (
                <li key={h.id} style={{ paddingLeft: h.level === 3 ? 12 : 0 }}>
                  <a
                    href={`#${h.id}`}
                    onClick={() => setIsOpen(false)}
                    className="block font-body text-sm py-1.5"
                    style={{
                      color: activeId === h.id ? '#0F2A1F' : '#6B7280',
                      fontWeight: activeId === h.id ? 600 : 400,
                    }}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
