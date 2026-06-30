import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Rate limit simple en mémoire (par IP)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = loginAttempts.get(ip)
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (record.count >= RATE_LIMIT) return false
  record.count++
  return true
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  if (!checkRateLimit(ip)) {
    return NextResponse.redirect(new URL('/fr/login?error=rate_limit', request.url))
  }

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const selectedRole = searchParams.get('role') ?? 'employee'
  const error_param = searchParams.get('error')

  if (error_param) {
    return NextResponse.redirect(`${origin}/fr/login?error=oauth_${error_param}`)
  }

  if (code) {
    const supabase = await createClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.user) {
        const { detectUserRole } = await import('@/lib/auth/role-detection');
        const actualDbRole = await detectUserRole(data.user.id, data.user.email);
        
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        
        let loginContext: string;
        const isEmployee = ['admin', 'manager', 'member', 'executive', 'superuser'].includes(actualDbRole);
        
        if (isEmployee) {
          const contextMap: Record<string, string> = {
            'client': 'client',
            'partner': 'partner',
            'admin': 'employee',
            'employee': 'employee'
          }
          loginContext = contextMap[selectedRole] || 'employee';
        } else {
          if (actualDbRole === 'client') {
            loginContext = 'client';
          } else if (actualDbRole === 'partner') {
            loginContext = 'partner';
          } else {
            loginContext = 'client';
          }
        }
        
        cookieStore.set('login_context', loginContext, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
          httpOnly: true,
          secure: true
        })
        
        let redirectUrl: string;
        const locale = next.replace('/', '') || 'fr'

        if (loginContext === 'client') {
          redirectUrl = `${origin}/${locale}/client/dashboard`
        } else if (loginContext === 'partner') {
          redirectUrl = `${origin}/${locale}/partner/dashboard`
        } else if (loginContext === 'employee') {
          if (actualDbRole === 'superuser') {
            redirectUrl = `${origin}/${locale}/admin/superuser/dashboard`
          } else if (actualDbRole === 'executive') {
            redirectUrl = `${origin}/${locale}/executive`
          } else {
            redirectUrl = `${origin}/${locale}/dashboard`
          }
        } else {
          if (actualDbRole === 'client') {
            redirectUrl = `${origin}/${locale}/client/dashboard`
          } else if (actualDbRole === 'partner') {
            redirectUrl = `${origin}/${locale}/partner/dashboard`
          } else if (actualDbRole === 'executive') {
            redirectUrl = `${origin}/${locale}/executive`
          } else {
            redirectUrl = `${origin}/${locale}/dashboard`
          }
        }
        
        return NextResponse.redirect(redirectUrl)
        
      } else {
        return NextResponse.redirect(`${origin}/fr/login?error=oauth_failed`)
      }
    } catch {
      return NextResponse.redirect(`${origin}/fr/login?error=callback_exception`)
    }
  }

  return NextResponse.redirect(`${origin}/fr/login?error=no_code`)
}