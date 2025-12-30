'use client'

import { SimpleLoginFormNextIntl } from '@/components/auth/simple-login-form-nextintl'
import { useEffect } from 'react'

export default function PartnerLoginPage() {
  useEffect(() => {
    // Créer le cookie de contexte PARTENAIRE côté serveur via API
    const setContext = async () => {
      try {
        const response = await fetch('/api/auth/set-login-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: 'partner' })
        })
        
        if (response.ok) {
          console.log('✅ Cookie login_context=partner créé côté SERVEUR')
        } else {
          // Fallback client-side
          document.cookie = `login_context=partner; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
          console.log('✅ Cookie login_context=partner créé côté CLIENT (fallback)')
        }
      } catch (error) {
        // Fallback client-side
        document.cookie = `login_context=partner; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        console.log('✅ Cookie login_context=partner créé côté CLIENT (fallback)')
      }
    }
    
    setContext()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-green-600">🏢 Connexion Partenaire</h1>
          <p className="text-gray-600">Gérez vos propriétés et réservations</p>
        </div>
        <SimpleLoginFormNextIntl />
      </div>
    </div>
  )
}