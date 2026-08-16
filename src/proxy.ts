import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function generateNonce(): string {
  return btoa(crypto.randomUUID())
}

function buildCsp(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: https:`,
    `connect-src 'self' ${supabaseUrl} https://mybusiness.googleapis.com https://www.googleapis.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  const nonce = generateNonce()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = await updateSession(request, requestHeaders)
  response.headers.set('Content-Security-Policy', buildCsp(nonce))

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
