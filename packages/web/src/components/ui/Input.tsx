'use client'

import { type InputHTMLAttributes, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: string
}

export function Input({ label, error, icon, id: externalId, className = '', ...props }: InputProps) {
  const autoId = useId()
  const id = externalId ?? autoId

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium mb-1.5"
        style={{ color: 'rgba(255,255,255,0.65)' }}
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] pointer-events-none select-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            'w-full py-3.5 pr-4 rounded-xl text-[15px] outline-none transition-all',
            'focus:ring-2 focus:ring-amber-600/30',
            icon ? 'pl-11' : 'pl-4',
            error ? 'border-red-500/50' : 'border-white/8',
          ].join(' ')}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.08)',
            color: '#fff',
          }}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px]" style={{ color: '#FB923C' }} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
