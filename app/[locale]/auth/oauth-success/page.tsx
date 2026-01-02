"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OAuthSuccessPageProps {
  params: Promise<{ locale: string }>
}

export default function OAuthSuccessPage({ params }: OAuthSuccessPageProps) {
  const [status, setStatus] = useState('🔄 Traitement de la connexion OAuth...')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const processOAuthSuccess = async () => {
      try {
        const { locale } = await params
        const contextParam = searchParams.get('context')
        
        console.log('🔄 OAuth Success - Démarrage du traitement')
        console.log('🔄 OAuth Success - Locale:', locale)
        console.log('🔄 OAuth Success - Context param:', contextParam)
        
        setStatus('🔍 Vérification de la session...')
        
        // ÉTAPE 1: Vérifier la session (comme dans email/password)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ OAuth Success - Erreur session:', sessionError)
          setError(`Erreur de session: ${sessionError.message}`)
          return
        }
        
        if (!session || !session.user) {
          console.error('❌ OAuth Success - Pas de session')
          setError('Aucune session trouvée')
          return
        }
        
        console.log('✅ OAuth Success - Session trouvée pour:', session.user.email)
        setStatus('✅ Session établie - récupération du profil...')
        
        // ÉTAPE 2: Récupérer le rôle DB (exactement comme email/password)
        let actualUserRole = null;
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!profileError && profile) {
            actualUserRole = profile.role;
            console.log('✅ OAuth Success - User actual role from database:', actualUserRole)
          } else {
            console.log('⚠️ OAuth Success - No profile found in database')
          }
        } catch (profileErr) {
          console.error('❌ OAuth Success - Exception getting user profile:', profileErr)
        }
        
        // ÉTAPE 3: Récupérer le contexte de connexion (comme email/password)
        let loginContext = contextParam || 'employee' // Fallback
        
        // Vérifier aussi le cookie
        if (typeof window !== 'undefined') {
          const cookieContext = document.cookie.split('; ').find(row => row.startsWith('login_context='))?.split('=')[1]
          if (cookieContext) {
            loginContext = cookieContext
            console.log('🍪 OAuth Success - Login context from cookie:', loginContext)
          }
        }
        
        console.log('🍪 OAuth Success - Login context final:', loginContext)
        console.log('🔍 OAuth Success - Actual user role:', actualUserRole)
        setStatus('🎯 Détermination de la redirection...')
        
        // ÉTAPE 4: Redirection (EXACTEMENT comme email/password)
        let redirectPath = `/${locale}/home` // Fallback pour employés
        
        console.log('🔄 OAuth Success - Début logique redirection')
        console.log('🔄 OAuth Success - loginContext:', loginContext)
        console.log('🔄 OAuth Success - actualUserRole:', actualUserRole)
        
        // Priorité 1: Si l'utilisateur est un employé, utiliser son rôle DB
        const isEmployee = ['admin', 'manager', 'member', 'executive', 'superuser'].includes(actualUserRole);
        
        if (isEmployee) {
          console.log('✅ OAuth Success - Utilisateur identifié comme employé')
          switch (actualUserRole) {
            case 'superuser':
              redirectPath = `/${locale}/admin/superuser/dashboard`
              console.log('🚀 OAuth Success - Redirection superuser:', redirectPath)
              break
            case 'executive':
              redirectPath = `/${locale}/executive`
              console.log('🚀 OAuth Success - Redirection executive:', redirectPath)
              break
            case 'admin':
              redirectPath = `/${locale}/home`
              console.log('🚀 OAuth Success - Redirection admin vers home:', redirectPath)
              break
            case 'manager':
              redirectPath = `/${locale}/home`
              console.log('🚀 OAuth Success - Redirection manager vers home:', redirectPath)
              break
            case 'member':
              redirectPath = `/${locale}/home`
              console.log('🚀 OAuth Success - Redirection member vers home:', redirectPath)
              break
            default:
              redirectPath = `/${locale}/home`
              console.log('🚀 OAuth Success - Redirection employé par défaut vers home:', redirectPath)
          }
        } else {
          // Priorité 2: Pour les non-employés, utiliser le contexte ou le rôle DB
          console.log('ℹ️ OAuth Success - Utilisateur non-employé, utilisation contexte/rôle')
          
          if (loginContext && loginContext !== 'employee') {
            // Utiliser le contexte sélectionné
            switch (loginContext) {
              case 'client':
                redirectPath = `/${locale}/client/dashboard`
                console.log('🚀 OAuth Success - Redirection client (contexte):', redirectPath)
                break
              case 'partner':
                redirectPath = `/${locale}/partner/dashboard`
                console.log('🚀 OAuth Success - Redirection partner (contexte):', redirectPath)
                break
              default:
                redirectPath = `/${locale}/client/dashboard`
                console.log('🚀 OAuth Success - Redirection par défaut (contexte):', redirectPath)
            }
          } else {
            // Utiliser le rôle DB
            switch (actualUserRole) {
              case 'client':
                redirectPath = `/${locale}/client/dashboard`
                console.log('🚀 OAuth Success - Redirection client (rôle DB):', redirectPath)
                break
              case 'partner':
                redirectPath = `/${locale}/partner/dashboard`
                console.log('🚀 OAuth Success - Redirection partner (rôle DB):', redirectPath)
                break
              default:
                redirectPath = `/${locale}/client/dashboard`
                console.log('🚀 OAuth Success - Redirection par défaut (rôle DB):', redirectPath)
            }
          }
        }
        
        console.log('🚀 OAuth Success - Redirection vers:', redirectPath)
        setStatus(`🚀 Redirection vers ${redirectPath}...`)
        
        // Délai pour afficher le message puis rediriger
        setTimeout(() => {
          router.push(redirectPath)
        }, 1500)
        
      } catch (err: any) {
        console.error('❌ OAuth Success - Erreur inattendue:', err)
        setError(`Erreur inattendue: ${err.message}`)
      }
    }

    processOAuthSuccess()
  }, [params, searchParams, router, supabase])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-600">❌ Erreur OAuth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => router.push('/fr/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Retour à la connexion
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">🔐 Connexion OAuth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{status}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}