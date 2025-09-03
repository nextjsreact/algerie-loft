import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🔍 DEBUG MIDDLEWARE - pathname:', pathname)
  console.log('🔍 DEBUG MIDDLEWARE - url:', request.url)
  
  // Laisser passer toutes les requêtes pour le moment
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}