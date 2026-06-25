import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const all = cookieStore.getAll()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loftalgerie.com'
  const response = NextResponse.redirect(new URL('/fr/login', siteUrl))
  for (const c of all) {
    if (c.name.startsWith('sb-')) {
      response.cookies.set(c.name, '', { maxAge: 0, path: '/' })
    }
  }
  return response
}
