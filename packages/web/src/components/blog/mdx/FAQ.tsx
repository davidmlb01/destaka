'use client'

import { useState } from 'react'

interface FAQItem {
  q: string
  a: string
}

interface FAQProps {
  items: FAQItem[]
}

export function FAQ({ items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="my-8 space-y-2">
      <h3
        className="font-display font-semibold text-lg mb-4"
        style={{ color: '#0F2A1F' }}
      >
        Perguntas frequentes
      </h3>
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div
            key={i}
            className="rounded-lg overflow-hidden"
            style={{
              border: '1px solid rgba(0,0,0,0.08)',
              background: isOpen ? '#F0FAF0' : '#FAFAF8',
            }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <span
                className="font-display font-semibold text-sm"
                style={{ color: '#0F2A1F' }}
              >
                {item.q}
              </span>
              <span
                className="flex-shrink-0 text-lg transition-transform"
                style={{
                  color: '#4ade80',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                }}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div
                className="px-4 pb-4 text-sm"
                style={{ color: '#1A1A1A' }}
              >
                {item.a}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
