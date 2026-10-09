'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? ''
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ''

// Persiste UTMs em cookie (sobrevive ao redirect do OAuth)
function captureUtms(searchParams: URLSearchParams) {
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  const utms: Record<string, string> = {}
  let hasUtm = false

  for (const key of utmKeys) {
    const val = searchParams.get(key)
    if (val) {
      utms[key] = val
      hasUtm = true
    }
  }

  if (hasUtm) {
    document.cookie = `destaka_utm=${encodeURIComponent(JSON.stringify(utms))};path=/;max-age=2592000;SameSite=Lax`
  }
}

export function getStoredUtms(): Record<string, string> | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/destaka_utm=([^;]+)/)
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match[1]))
  } catch {
    return null
  }
}

export default function TrackingScripts() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Captura UTMs de qualquer página
  useEffect(() => {
    captureUtms(searchParams)
  }, [searchParams])

  // Dispara pageview no GA4 a cada navegação
  useEffect(() => {
    if (GA4_ID && typeof window !== 'undefined' && 'gtag' in window) {
      const g = (window as Record<string, unknown>).gtag as ((...args: unknown[]) => void) | undefined
      g?.('config', GA4_ID, { page_path: pathname })
    }
  }, [pathname])

  return (
    <>
      {/* Google Analytics 4 */}
      {GA4_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel */}
      {META_PIXEL_ID && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  )
}
