import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('profiles')
        .update({ force_logout_at: null, is_online: false })
        .eq('id', user.id)
    }
  } catch {
    // best effort
  }

  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const all = cookieStore.getAll()

  const redirectUrl = new URL('/fr/login', request.url)
  const response = NextResponse.redirect(redirectUrl)

  for (const c of all) {
    response.cookies.set(c.name, '', { maxAge: 0, path: '/' })
  }

  return response
}
