import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('profiles')
        .update({ force_logout_at: null })
        .eq('id', user.id)
    }
  } catch {
    // best effort
  }

  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const all = cookieStore.getAll()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loftalgerie.com'
  const response = NextResponse.redirect(new URL('/fr/login', siteUrl))
  for (const c of all) {
    if (c.name.startsWith('sb-') || c.name === 'login_context') {
      response.cookies.set(c.name, '', { maxAge: 0, path: '/' })
    }
  }
  return response
}
