'use client'

import { SimpleLoginFormNextIntl } from '@/components/auth/simple-login-form-nextintl'
import { useEffect } from 'react'

export default function ClientLoginPage() {
  useEffect(() => {
    // Créer le cookie de contexte CLIENT dès l'arrivée sur la page
    document.cookie = `login_context=client; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    console.log('✅ Cookie login_context=client pré-créé')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-blue-600">🏠 Connexion Client</h1>
          <p className="text-gray-600">Réservez et gérez vos séjours</p>
        </div>
        <SimpleLoginFormNextIntl />
      </div>
    </div>
  )
}
