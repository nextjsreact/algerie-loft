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
        console.log('OAuth callback successful for:', data.user.email, 'with role:', selectedRole)
        
        // Créer le cookie login_context selon le rôle sélectionné
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        
        // Mapper le rôle sélectionné au contexte
        const contextMap: Record<string, string> = {
          'client': 'client',
          'partner': 'partner',
          'admin': 'employee',
          'employee': 'employee'
        }
        const loginContext = contextMap[selectedRole] || 'employee'
        
        // Créer le cookie côté serveur
        cookieStore.set('login_context', loginContext, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 jours
          sameSite: 'lax',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production'
        })
        
        console.log(`✅ [OAuth Callback] Cookie login_context=${loginContext} créé pour role=${selectedRole}`)
        
        // Détecter le rôle DB pour les employés uniquement
        let actualUserRole = selectedRole;
        if (loginContext === 'employee') {
          try {
            const { detectUserRole } = await import('@/lib/auth/role-detection');
            actualUserRole = await detectUserRole(data.user.id, data.user.email);
            console.log('✅ User actual role detected:', actualUserRole)
          } catch (roleDetectionErr) {
            console.error('Exception in role detection:', roleDetectionErr)
            actualUserRole = 'member' // Fallback sécurisé
          }
        }
        
        // Rediriger selon le CONTEXTE DE CONNEXION
        const locale = next.replace('/', '') || 'fr'
        const timestamp = Date.now()
        
        switch (loginContext) {
          case 'client':
            return NextResponse.redirect(`${origin}/${locale}/client/dashboard?t=${timestamp}`)
          case 'partner':
            return NextResponse.redirect(`${origin}/${locale}/partner/dashboard?t=${timestamp}`)
          case 'employee':
            // Pour les employés, utiliser le rôle DB
            switch (actualUserRole) {
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