"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface OAuthRedirectHandlerProps {
  locale: string
}

export function OAuthRedirectHandler({ locale }: OAuthRedirectHandlerProps) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      try {
        console.log('🔄 [OAuth Handler] Checking for OAuth session...')
        
        // Vérifier s'il y a une session active (après OAuth)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ [OAuth Handler] Session error:', error)
          return
        }
        
        if (session && session.user) {
          console.log('✅ [OAuth Handler] OAuth session detected for:', session.user.email)
          
          // Vérifier si c'est une nouvelle session (OAuth récent)
          const sessionAge = Date.now() - new Date(session.user.created_at).getTime()
          const isRecentSession = sessionAge < 60000 // Moins d'1 minute
          
          console.log('🕐 [OAuth Handler] Session age:', sessionAge, 'ms, isRecent:', isRecentSession)
          
          // Ou vérifier s'il y a des paramètres OAuth dans l'URL
          const urlParams = new URLSearchParams(window.location.search)
          const hasOAuthParams = urlParams.has('access_token') || urlParams.has('refresh_token') || 
                                 window.location.hash.includes('access_token')
          
          console.log('🔍 [OAuth Handler] OAuth params in URL:', hasOAuthParams)
          
          if (isRecentSession || hasOAuthParams) {
            console.log('🎯 [OAuth Handler] Redirecting OAuth user...')
            
            // Récupérer le rôle de l'utilisateur depuis la DB
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()
              
              let userRole = 'client' // Fallback
              if (!profileError && profile) {
                userRole = profile.role
                console.log('✅ [OAuth Handler] User role from DB:', userRole)
              } else {
                console.log('⚠️ [OAuth Handler] No profile found, using fallback role')
              }
              
              // Vérifier le contexte de connexion depuis le cookie
              let loginContext = 'client' // Fallback
              const cookieContext = document.cookie.split('; ').find(row => row.startsWith('login_context='))?.split('=')[1]
              if (cookieContext) {
                loginContext = cookieContext
                console.log('🍪 [OAuth Handler] Login context from cookie:', loginContext)
              }
              
              // Rediriger selon le rôle et le contexte
              let redirectPath = `/${locale}/client/dashboard` // Fallback
              
              if (userRole === 'client') {
                redirectPath = `/${locale}/client/dashboard`
              } else if (userRole === 'partner') {
                redirectPath = `/${locale}/partner/dashboard`
              } else if (userRole === 'executive') {
                redirectPath = `/${locale}/executive`
              } else if (['admin', 'manager', 'member', 'superuser'].includes(userRole)) {
                redirectPath = `/${locale}/dashboard`
              }
              
              console.log('🚀 [OAuth Handler] Redirecting to:', redirectPath)
              
              // Nettoyer l'URL des paramètres OAuth avant la redirection
              if (hasOAuthParams) {
                window.history.replaceState({}, document.title, `/${locale}`)
              }
              
              // Redirection
              router.push(redirectPath)
              
            } catch (profileErr) {
              console.error('❌ [OAuth Handler] Profile fetch error:', profileErr)
              // Redirection fallback
              router.push(`/${locale}/client/dashboard`)
            }
          } else {
            console.log('ℹ️ [OAuth Handler] Session exists but not from recent OAuth')
          }
        } else {
          console.log('ℹ️ [OAuth Handler] No active session')
        }
      } catch (err) {
        console.error('❌ [OAuth Handler] Unexpected error:', err)
      }
    }

    // Délai pour laisser le temps à Supabase de traiter la session
    const timer = setTimeout(handleOAuthRedirect, 1000)
    
    return () => clearTimeout(timer)
  }, [locale, router, supabase])

  // Ce composant ne rend rien visuellement
  return null
}