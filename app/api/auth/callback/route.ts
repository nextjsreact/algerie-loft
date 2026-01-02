import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // LOGS DÉTAILLÉS POUR PRODUCTION
  console.log('🔥 [PRODUCTION OAUTH CALLBACK] ===================')
  console.log('🔥 [PRODUCTION] Request URL:', request.url)
  console.log('🔥 [PRODUCTION] Request method:', request.method)
  console.log('🔥 [PRODUCTION] Headers:', Object.fromEntries(request.headers.entries()))
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const selectedRole = searchParams.get('role') ?? 'client'
  const state = searchParams.get('state')
  const error_param = searchParams.get('error')

  console.log('🔥 [PRODUCTION] Search params:', {
    code: code ? `${code.substring(0, 10)}...` : null,
    next,
    selectedRole,
    state,
    error: error_param
  })
  console.log('🔥 [PRODUCTION] Origin:', origin)

  // Vérifier s'il y a une erreur OAuth
  if (error_param) {
    console.error('🔥 [PRODUCTION] OAuth error parameter:', error_param)
    return NextResponse.redirect(`${origin}/fr/login?error=oauth_${error_param}`)
  }

  if (code) {
    console.log('🔥 [PRODUCTION] OAuth code received, processing...')
    const supabase = await createClient()
    
    try {
      console.log('🔥 [PRODUCTION] Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.user) {
        console.log('🔥 [PRODUCTION] ✅ OAuth callback successful for:', data.user.email)
        console.log('🔥 [PRODUCTION] User ID:', data.user.id)
        console.log('🔥 [PRODUCTION] Selected role from URL:', selectedRole)
        
        // Détecter le VRAI rôle depuis la DB
        console.log('🔥 [PRODUCTION] Detecting user role from database...')
        const { detectUserRole } = await import('@/lib/auth/role-detection');
        const actualDbRole = await detectUserRole(data.user.id, data.user.email);
        console.log('🔥 [PRODUCTION] ✅ Actual DB role detected:', actualDbRole)
        
        // Créer le cookie login_context
        console.log('🔥 [PRODUCTION] Creating login context cookie...')
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        
        // Déterminer le contexte selon le rôle sélectionné ET les permissions
        let loginContext: string;
        
        // Si l'utilisateur est un employé (admin, manager, etc.), il peut choisir son contexte
        const isEmployee = ['admin', 'manager', 'member', 'executive', 'superuser'].includes(actualDbRole);
        
        console.log('🔥 [PRODUCTION] Role analysis:', {
          isEmployee,
          actualDbRole,
          selectedRole
        })
        
        if (isEmployee) {
          // Un employé peut se connecter comme client, partner ou employee
          const contextMap: Record<string, string> = {
            'client': 'client',
            'partner': 'partner',
            'admin': 'employee',
            'employee': 'employee'
          }
          loginContext = contextMap[selectedRole] || 'employee';
          console.log('🔥 [PRODUCTION] ✅ Employee choosing context:', loginContext);
        } else {
          // Un client/partner ne peut se connecter que dans son propre contexte
          if (actualDbRole === 'client') {
            loginContext = 'client';
          } else if (actualDbRole === 'partner') {
            loginContext = 'partner';
          } else {
            loginContext = 'client'; // Fallback pour les nouveaux utilisateurs
          }
          console.log('🔥 [PRODUCTION] ✅ Non-employee forced to context:', loginContext);
        }
        
        // Créer le cookie côté serveur
        console.log('🔥 [PRODUCTION] Setting cookie login_context =', loginContext)
        cookieStore.set('login_context', loginContext, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 jours
          sameSite: 'lax',
          httpOnly: false,
          secure: true // TOUJOURS true en production
        })
        
        // Déterminer l'URL de redirection
        let redirectUrl: string;
        
        // Extraire la locale du paramètre next
        const locale = next.replace('/', '') || 'fr'
        console.log('🔥 [PRODUCTION] Locale extracted:', locale)
        
        // Redirection selon le CONTEXTE DE CONNEXION (basé sur le rôle DB)
        console.log('🔥 [PRODUCTION] Determining redirect URL...')
        
        if (actualDbRole === 'client') {
          redirectUrl = `${origin}/${locale}/client/dashboard`
          console.log('🔥 [PRODUCTION] 🚀 CLIENT REDIRECT:', redirectUrl)
        } else if (actualDbRole === 'partner') {
          redirectUrl = `${origin}/${locale}/partner/dashboard`
          console.log('🔥 [PRODUCTION] 🚀 PARTNER REDIRECT:', redirectUrl)
        } else if (actualDbRole === 'executive') {
          redirectUrl = `${origin}/${locale}/executive`
          console.log('🔥 [PRODUCTION] 🚀 EXECUTIVE REDIRECT:', redirectUrl)
        } else if (['admin', 'manager', 'member', 'superuser'].includes(actualDbRole)) {
          redirectUrl = `${origin}/${locale}/dashboard`
          console.log('🔥 [PRODUCTION] 🚀 EMPLOYEE REDIRECT:', redirectUrl)
        } else {
          // Fallback absolu
          redirectUrl = `${origin}/${locale}/client/dashboard`
          console.log('🔥 [PRODUCTION] 🚀 FALLBACK REDIRECT:', redirectUrl)
        }
        
        console.log('🔥 [PRODUCTION] 🎯 FINAL REDIRECT URL:', redirectUrl)
        console.log('🔥 [PRODUCTION] Performing redirect...')
        
        const response = NextResponse.redirect(redirectUrl)
        console.log('🔥 [PRODUCTION] ✅ Redirect response created')
        return response
        
      } else {
        console.error('🔥 [PRODUCTION] ❌ OAuth callback error:', error)
        return NextResponse.redirect(`${origin}/fr/login?error=oauth_failed&details=${encodeURIComponent(error?.message || 'unknown')}`)
      }
    } catch (err) {
      console.error('🔥 [PRODUCTION] ❌ OAuth callback exception:', err)
      return NextResponse.redirect(`${origin}/fr/login?error=callback_exception&details=${encodeURIComponent(err.message)}`)
    }
  }

  // No code provided
  console.error('🔥 [PRODUCTION] ❌ No OAuth code provided in callback')
  console.log('🔥 [PRODUCTION] Available search params:', Array.from(searchParams.entries()))
  return NextResponse.redirect(`${origin}/fr/login?error=no_code`)
}