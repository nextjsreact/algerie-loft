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
        
        // Use enhanced role detection system
        let actualUserRole = selectedRole; // Default fallback
        try {
          const { detectUserRole } = await import('@/lib/auth/role-detection');
          actualUserRole = await detectUserRole(data.user.id, data.user.email);
          console.log('✅ User actual role detected:', actualUserRole)
        } catch (roleDetectionErr) {
          console.error('Exception in role detection:', roleDetectionErr)
          console.log('⚠️ Using selected role as fallback:', selectedRole)
        }
        
        // Redirect based on actual user role with forced cache busting
        const locale = next.replace('/', '') || 'fr'
        const timestamp = Date.now()
        
        switch (actualUserRole) {
          case 'superuser':
            return NextResponse.redirect(`${origin}/${locale}/admin/superuser/dashboard?t=${timestamp}`)
          case 'client':
            return NextResponse.redirect(`${origin}/${locale}/client/dashboard?t=${timestamp}`)
          case 'partner':
            return NextResponse.redirect(`${origin}/${locale}/partner/dashboard?t=${timestamp}`)
          case 'admin':
          case 'manager':
          case 'executive':
          case 'member':
            return NextResponse.redirect(`${origin}/${locale}/home?t=${timestamp}`)
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