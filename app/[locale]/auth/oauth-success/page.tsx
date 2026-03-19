"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface OAuthSuccessPageProps {
  params: Promise<{ locale: string }>
}

export default function OAuthSuccessPage({ params }: OAuthSuccessPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const process = async () => {
      const { locale } = await params
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push(`/${locale}/login`)
        return
      }

      // Read login_context cookie (set before OAuth redirect)
      const loginContext = document.cookie
        .split('; ')
        .find(row => row.startsWith('login_context='))
        ?.split('=')[1]

      console.log('OAuth success - loginContext:', loginContext, 'user:', session.user.email)

      // Redirect based on chosen context
      if (loginContext === 'client') {
        router.push(`/${locale}/client/dashboard`)
      } else if (loginContext === 'partner') {
        router.push(`/${locale}/partner/dashboard`)
      } else {
        // Employee — check actual DB role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        const role = profile?.role
        if (role === 'superuser') router.push(`/${locale}/admin/superuser/dashboard`)
        else if (role === 'executive') router.push(`/${locale}/executive`)
        else router.push(`/${locale}/home`)
      }
    }

    process()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Connexion en cours...</p>
      </div>
    </div>
  )
}
