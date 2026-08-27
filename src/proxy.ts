import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function buildCsp(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://accounts.google.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https://*.googleusercontent.com https://*.googleapis.com https://*.stripe.com`,
    `connect-src 'self' ${supabaseUrl} https://api.anthropic.com https://api.stripe.com https://mybusinessaccountmanagement.googleapis.com https://mybusinessbusinessinformation.googleapis.com https://mybusiness.googleapis.com https://accounts.google.com https://www.googleapis.com`,
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

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
