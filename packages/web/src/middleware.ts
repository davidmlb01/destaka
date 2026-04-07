import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rotas públicas que não precisam de auth
const PUBLIC_PATHS = ['/', '/diagnostico', '/login', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname, searchParams, origin } = request.nextUrl

  // Supabase OAuth às vezes redireciona o code para a raiz — encaminha para o callback correto
  const code = searchParams.get('code')
  if (code && pathname !== '/api/auth/callback') {
    const callbackUrl = new URL('/api/auth/callback', origin)
    callbackUrl.searchParams.set('code', code)
    return NextResponse.redirect(callbackUrl)
  }

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
