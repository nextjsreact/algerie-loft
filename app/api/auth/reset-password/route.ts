import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Récupérer le code d'authentification de Supabase
  const code = searchParams.get('code')
  
  console.log('Reset password API called with code:', !!code)

  // Vérifier que nous avons le code nécessaire
  if (!code) {
    console.log('No auth code provided, redirecting to forgot password')
    return NextResponse.redirect(new URL('/fr/forgot-password?error=invalid-link', request.url))
  }

  try {
    // Créer le client Supabase
    const supabase = await createClient()
    
    // Échanger le code contre une session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.log('Failed to exchange code for session:', error.message)
      return NextResponse.redirect(new URL('/fr/forgot-password?error=expired-link', request.url))
    }

    if (!data.session) {
      console.log('No session returned from code exchange')
      return NextResponse.redirect(new URL('/fr/forgot-password?error=auth-failed', request.url))
    }

    console.log('Successfully exchanged code for session, redirecting to reset password page')
    
    // Rediriger vers la page de reset password
    // La session est maintenant établie via les cookies
    return NextResponse.redirect(new URL('/fr/reset-password', request.url))
    
  } catch (err: any) {
    console.error('Error in reset password callback:', err.message)
    return NextResponse.redirect(new URL('/fr/forgot-password?error=auth-failed', request.url))
  }
}