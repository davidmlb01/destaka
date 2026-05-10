import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rotas públicas que não precisam de auth
const PUBLIC_PATHS = ['/', '/saude', '/saude/diagnostico', '/saude/login', '/saude/verificar', '/privacidade', '/termos', '/api/auth', '/api/public', '/api/health']

// Redirects de rotas antigas para novas (SEO + links existentes)
const LEGACY_REDIRECTS: Record<string, string> = {
  '/login': '/saude/login',
  '/dashboard': '/saude/dashboard',
  '/onboarding': '/saude/onboarding',
  '/diagnostico': '/saude/diagnostico',
  '/verificar': '/saude/verificar',
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams, origin } = request.nextUrl

  // Supabase OAuth às vezes redireciona o code para a raiz
  const code = searchParams.get('code')
  if (code && pathname !== '/api/auth/callback') {
    const callbackUrl = new URL('/api/auth/callback', origin)
    callbackUrl.searchParams.set('code', code)
    return NextResponse.redirect(callbackUrl)
  }

  // Redirect rotas legado para /saude/*
  for (const [old, newPath] of Object.entries(LEGACY_REDIRECTS)) {
    if (pathname === old || pathname.startsWith(old + '/')) {
      const rest = pathname.slice(old.length)
      return NextResponse.redirect(new URL(newPath + rest, origin), 301)
    }
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
