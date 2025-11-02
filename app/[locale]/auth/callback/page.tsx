import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export default async function AuthCallbackPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { code?: string; error?: string }
}) {
  const { locale } = params
  const { code, error } = searchParams

  if (error) {
    console.error('OAuth error:', error)
    redirect(`/${locale}/login?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const supabase = await createClient()
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        redirect(`/${locale}/login?error=${encodeURIComponent(exchangeError.message)}`)
      }

      if (data.user) {
        console.log('OAuth login successful:', data.user.email)
        
        // For new OAuth users, redirect to home page
        // They can set their role later or we can detect it from the context
        redirect(`/${locale}`)
      }
    } catch (err) {
      console.error('Callback processing error:', err)
      redirect(`/${locale}/login?error=callback_failed`)
    }
  }

  // If no code, redirect to login
  redirect(`/${locale}/login`)
}