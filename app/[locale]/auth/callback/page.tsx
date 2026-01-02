import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

interface AuthCallbackPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AuthCallbackPage({
  params,
  searchParams,
}: AuthCallbackPageProps) {
  const { locale } = await params;
  const { code, next, role, error } = await searchParams;

  console.log(`🔄 [Auth Callback Page] Params: code=${!!code}, next=${next}, role=${role}, error=${error}`)

  if (error) {
    console.error(`❌ [Auth Callback Page] OAuth error: ${error}`)
    redirect(`/${locale}/login?error=${error}`)
  }

  if (!code) {
    console.error(`❌ [Auth Callback Page] No code provided`)
    redirect(`/${locale}/login?error=no_code`)
  }

  const supabase = await createClient()
  
  try {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string)
    
    if (exchangeError || !data.user) {
      console.error(`❌ [Auth Callback Page] Session exchange error:`, exchangeError)
      redirect(`/${locale}/login?error=session_exchange_failed`)
    }

    console.log(`✅ [Auth Callback Page] Session created for: ${data.user.email}`)

    // Détecter le rôle DB
    const { detectUserRole } = await import('@/lib/auth/role-detection');
    const actualDbRole = await detectUserRole(data.user.id, data.user.email);
    console.log(`✅ [Auth Callback Page] DB role detected: ${actualDbRole}`)

    // Créer le cookie login_context
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    
    const selectedRole = role as string || 'client'
    let loginContext: string;
    
    // Déterminer le contexte
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
        loginContext = 'employee';
      }
    }

    // Créer le cookie
    cookieStore.set('login_context', loginContext, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production'
    })

    console.log(`✅ [Auth Callback Page] Cookie login_context=${loginContext} created`)

    // Rediriger selon le contexte
    switch (loginContext) {
      case 'client':
        console.log(`🚀 [Auth Callback Page] Redirecting to client dashboard`)
        redirect(`/${locale}/client/dashboard`)
        break;
      case 'partner':
        console.log(`🚀 [Auth Callback Page] Redirecting to partner dashboard`)
        redirect(`/${locale}/partner/dashboard`)
        break;
      case 'employee':
        switch (actualDbRole) {
          case 'superuser':
            redirect(`/${locale}/admin/superuser/dashboard`)
            break;
          case 'executive':
            redirect(`/${locale}/executive`)
            break;
          default:
            redirect(`/${locale}/dashboard`)
            break;
        }
        break;
      default:
        // Fallback basé sur le rôle DB
        console.log(`⚠️ [Auth Callback Page] Fallback redirection for role: ${actualDbRole}`)
        switch (actualDbRole) {
          case 'client':
            redirect(`/${locale}/client/dashboard`)
            break;
          case 'partner':
            redirect(`/${locale}/partner/dashboard`)
            break;
          case 'superuser':
            redirect(`/${locale}/admin/superuser/dashboard`)
            break;
          case 'executive':
            redirect(`/${locale}/executive`)
            break;
          default:
            redirect(`/${locale}/dashboard`)
            break;
        }
        break;
    }
  } catch (err) {
    console.error(`❌ [Auth Callback Page] Exception:`, err)
    redirect(`/${locale}/login?error=callback_exception`)
  }
}