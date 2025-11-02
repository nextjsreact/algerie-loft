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
        
        // Update user metadata with selected role
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              ...data.user.user_metadata,
              active_role: selectedRole,
              role: selectedRole, // Keep for compatibility
              last_role_update: new Date().toISOString() // Force cache invalidation
            }
          })
          
          if (updateError) {
            console.error('Failed to update user role:', updateError)
          } else {
            console.log('✅ User role updated to:', selectedRole)
          }
        } catch (updateErr) {
          console.error('Exception updating user role:', updateErr)
        }
        
        // Redirect based on selected role with forced cache busting
        const locale = next.replace('/', '') || 'fr'
        const timestamp = Date.now()
        
        switch (selectedRole) {
          case 'client':
            return NextResponse.redirect(`${origin}/${locale}/client/dashboard?t=${timestamp}`)
          case 'partner':
            return NextResponse.redirect(`${origin}/${locale}/partner/dashboard?t=${timestamp}`)
          case 'admin':
          case 'manager':
          case 'executive':
            return NextResponse.redirect(`${origin}/${locale}/app/dashboard?t=${timestamp}`)
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