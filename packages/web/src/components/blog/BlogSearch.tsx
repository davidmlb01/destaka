'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface BlogSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export function BlogSearch({
  onSearch,
  placeholder = 'Buscar artigos...',
}: BlogSearchProps) {
  const [value, setValue] = useState('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  const debouncedSearch = useCallback(
    (query: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        onSearch(query)
      }, 300)
    },
    [onSearch],
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setValue(q)
    debouncedSearch(q)
  }

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9CA3AF"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg font-body text-sm outline-none transition-all"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.1)',
          color: '#1A1A1A',
        }}
      />
    </div>
  )
}
