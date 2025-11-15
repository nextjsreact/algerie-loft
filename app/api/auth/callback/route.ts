import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const selectedRole = searchParams.get('role') ?? 'client'

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
        
        // Créer le cookie login_context
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        
        // Déterminer le contexte selon le rôle sélectionné ET les permissions
        let loginContext: string;
        
        // Si l'utilisateur est un employé (admin, manager, etc.), il peut choisir son contexte
        const isEmployee = ['admin', 'manager', 'member', 'executive', 'superuser'].includes(actualDbRole);
        
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
            loginContext = 'employee'; // Fallback
          }
          console.log(`✅ Non-employee forced to their context: ${loginContext}`);
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
        
        switch (loginContext) {
          case 'client':
            return NextResponse.redirect(`${origin}/${locale}/client/dashboard?t=${timestamp}`)
          case 'partner':
            return NextResponse.redirect(`${origin}/${locale}/partner/dashboard?t=${timestamp}`)
          case 'employee':
            // Pour les employés, utiliser le rôle DB
            switch (actualDbRole) {
              case 'superuser':
                return NextResponse.redirect(`${origin}/${locale}/admin/superuser/dashboard?t=${timestamp}`)
              case 'executive':
                return NextResponse.redirect(`${origin}/${locale}/executive?t=${timestamp}`)
              default:
                return NextResponse.redirect(`${origin}/${locale}/home?t=${timestamp}`)
            }
          default:
            return NextResponse.redirect(`${origin}${next}?t=${timestamp}`)
        }
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