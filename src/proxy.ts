import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function buildCsp(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' https://js.stripe.com https://accounts.google.com https://www.googletagmanager.com https://connect.facebook.net`,
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
  const response = await updateSession(request)
  response.headers.set('Content-Security-Policy', buildCsp())
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-Frame-Options', 'DENY')

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
