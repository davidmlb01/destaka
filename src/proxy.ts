import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_MAX_AGE } from '@/lib/referral/constants'

function buildCsp(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' ${process.env.NODE_ENV !== 'production' ? "'unsafe-eval'" : ''} https://js.stripe.com https://accounts.google.com https://www.googletagmanager.com https://connect.facebook.net`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https://*.googleusercontent.com https://*.googleapis.com https://*.stripe.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org`,
    `connect-src 'self' ${supabaseUrl} https://api.anthropic.com https://api.stripe.com https://mybusinessaccountmanagement.googleapis.com https://mybusinessbusinessinformation.googleapis.com https://mybusiness.googleapis.com https://accounts.google.com https://www.googleapis.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org`,
    `frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://accounts.google.com`,
    `upgrade-insecure-requests`,
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  // Captura ?ref= e salva cookie de 90 dias (URL limpa apos redirect)
  const refCode = request.nextUrl.searchParams.get('ref')
  if (refCode && refCode.trim().length > 0 && refCode.trim().length <= 20) {
    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete('ref')
    const redirect = NextResponse.redirect(cleanUrl)
    redirect.cookies.set(REFERRAL_COOKIE_NAME, refCode.trim().toUpperCase(), {
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    redirect.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    redirect.headers.set('X-Content-Type-Options', 'nosniff')
    redirect.headers.set('X-Frame-Options', 'DENY')
    return redirect
  }

  // Captura UTMs server-side (httpOnly, 30 dias) — mais confiavel que JS client-side
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  const utms: Record<string, string> = {}
  let hasUtm = false
  for (const key of utmKeys) {
    const val = request.nextUrl.searchParams.get(key)
    if (val && val.trim().length > 0 && val.trim().length <= 100) {
      utms[key] = val.trim()
      hasUtm = true
    }
  }

  // Captura referrer na primeira visita (so se nao tem cookie ainda)
  const referer = request.headers.get('referer')
  if (!request.cookies.get('destaka_referrer') && referer) {
    try {
      const refHost = new URL(referer).hostname
      if (refHost && !refHost.includes('destaka.com.br')) {
        // Sera lido no cookie apos o response ser criado
        hasUtm = true // flag para saber que precisa setar cookies
        utms._referrer = refHost
      }
    } catch { /* URL invalida, ignora */ }
  }

  const nonce = crypto.randomUUID()
  const response = await updateSession(request)
  response.headers.set('Content-Security-Policy', buildCsp(nonce))
  response.headers.set('x-csp-nonce', nonce)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Seta cookies de UTM e referrer (server-side)
  if (hasUtm) {
    const referrer = utms._referrer
    delete utms._referrer
    if (Object.keys(utms).length > 0) {
      response.cookies.set('destaka_utm', JSON.stringify(utms), {
        maxAge: 30 * 24 * 60 * 60, // 30 dias
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
    if (referrer) {
      response.cookies.set('destaka_referrer', referrer, {
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
  }

  // CORS: restrict API routes to same origin
  const origin = request.headers.get('origin')
  if (request.nextUrl.pathname.startsWith('/api') && origin) {
    const allowedOrigins = ['https://destaka.com.br', 'https://www.destaka.com.br']
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push('http://localhost:3000')
    }
    if (allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key')
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
