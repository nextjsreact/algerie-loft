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
        
        // Get the user's actual role from the profiles table instead of using selected role
        let actualUserRole = selectedRole; // Default fallback
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          
          if (!profileError && profile) {
            actualUserRole = profile.role;
            console.log('✅ User actual role from database:', actualUserRole)
          } else {
            console.log('⚠️ No profile found, using selected role as fallback:', selectedRole)
          }
        } catch (profileErr) {
          console.error('Exception getting user profile:', profileErr)
        }
        
        // Redirect based on actual user role with forced cache busting
        const locale = next.replace('/', '') || 'fr'
        const timestamp = Date.now()
        
        switch (actualUserRole) {
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