import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const selectedRole = searchParams.get('role') ?? 'client'

  console.log(`🔄 [OAuth Callback] Starting with params: code=${!!code}, next=${next}, role=${selectedRole}`)

  if (code) {
    const supabase = await createClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.user) {
        console.log('OAuth callback successful for:', data.user.email, 'with URL role param:', selectedRole)
        
        // Détecter le VRAI rôle depuis la DB
        const { detectUserRole } = await import('@/lib/auth/role-detection');
        const actualDbRole = await detectUserRole(data.user.id, data.user.email);
        console.log('✅ Actual DB role detected:', actualDbRole)
        console.log('📝 Selected role from URL:', selectedRole)
        
        // Créer le cookie login_context
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        
        // Déterminer le contexte selon le rôle sélectionné ET les permissions
        let loginContext: string;
        
        // Si l'utilisateur est un employé (admin, manager, etc.), il peut choisir son contexte
        const isEmployee = ['admin', 'manager', 'member', 'executive', 'superuser'].includes(actualDbRole);
        
        console.log(`🔍 [OAuth Callback] isEmployee=${isEmployee}, actualDbRole=${actualDbRole}, selectedRole=${selectedRole}`)
        
        if (isEmployee) {
          // Un employé peut se connecter comme client, partner ou employee
          const contextMap: Record<string, string> = {
            'client': 'client',
            'partner': 'partner',
            'admin': 'employee',
            'employee': 'employee'
          }
          loginContext = contextMap[selectedRole] || 'employee';
          console.log(`✅ Employee choosing context: ${loginContext} (from URL param: ${selectedRole})`);
        } else {
          // Un client/partner ne peut se connecter que dans son propre contexte
          if (actualDbRole === 'client') {
            loginContext = 'client';
          } else if (actualDbRole === 'partner') {
            loginContext = 'partner';
          } else {
            loginContext = 'client'; // Fallback pour les nouveaux utilisateurs
          }
          console.log(`✅ Non-employee forced to their context: ${loginContext} (actualDbRole: ${actualDbRole})`);
        }
        
        // Créer le cookie côté serveur
        cookieStore.set('login_context', loginContext, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 jours
          sameSite: 'lax',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production'
        })
        
        console.log(`✅ [OAuth Callback] Cookie login_context=${loginContext} créé pour DB role=${actualDbRole}`)
        
        // Rediriger selon le CONTEXTE DE CONNEXION (basé sur le rôle DB)
        const locale = next.replace('/', '') || 'fr'
        const timestamp = Date.now()
        
        console.log(`🔄 [OAuth Callback] Redirection logic: loginContext=${loginContext}, actualDbRole=${actualDbRole}, locale=${locale}`)
        console.log(`🎯 [OAuth Callback] About to redirect based on context: ${loginContext}`)
        
        // SOLUTION BRUTALE - FORCER LA REDIRECTION
        console.log(`🔄 [OAuth Callback] FORCING REDIRECT - Role: ${actualDbRole}, Context: ${loginContext}`)
        
        // Redirection forcée selon le rôle DB uniquement
        if (actualDbRole === 'client') {
          console.log(`🚀 FORCING CLIENT REDIRECT`)
          return NextResponse.redirect(`${origin}/fr/client/dashboard`)
        }
        
        if (actualDbRole === 'partner') {
          console.log(`🚀 FORCING PARTNER REDIRECT`)
          return NextResponse.redirect(`${origin}/fr/partner/dashboard`)
        }
        
        if (actualDbRole === 'executive') {
          console.log(`🚀 FORCING EXECUTIVE REDIRECT`)
          return NextResponse.redirect(`${origin}/fr/executive`)
        }
        
        if (['admin', 'manager', 'member', 'superuser'].includes(actualDbRole)) {
          console.log(`🚀 FORCING EMPLOYEE REDIRECT`)
          return NextResponse.redirect(`${origin}/fr/dashboard`)
        }
        
        // Fallback absolu
        console.log(`🚀 FORCING FALLBACK REDIRECT`)
        return NextResponse.redirect(`${origin}/fr/client/dashboard`)
      } else {
        console.error('OAuth callback error:', error)
        return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
      }
    } catch (err) {
      console.error('OAuth callback exception:', err)
      return NextResponse.redirect(`${origin}/login?error=callback_exception`)
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}