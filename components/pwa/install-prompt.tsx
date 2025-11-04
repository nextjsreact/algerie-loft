'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Clock } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptProps {
  userRole?: string
}

export function InstallPrompt({ userRole }: InstallPromptProps) {
  // Traductions en français
  const translations = {
    installTitle: 'Installer Algerie Loft',
    installDescription: 'Installez l\'application pour un accès rapide et des notifications en temps réel',
    install: 'Installer',
    notNow: 'Pas maintenant',
    neverAsk: 'Ne plus demander'
  }

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  // Clés de stockage local
  const STORAGE_KEYS = {
    DISMISSED: 'pwa-dismissed',
    NEVER_ASK: 'pwa-never-ask',
    LAST_SHOWN: 'pwa-last-shown'
  }

  // Vérifier si on doit afficher le prompt
  const shouldShowPrompt = () => {
    // Ne jamais afficher si l'utilisateur a dit "ne plus demander"
    if (localStorage.getItem(STORAGE_KEYS.NEVER_ASK) === 'true') {
      return false
    }

    // Seulement pour les employés (pas les clients/partenaires)
    if (!userRole || userRole === 'client' || userRole === 'partner') {
      return false
    }

    // Vérifier le délai depuis la dernière fois
    const lastShown = localStorage.getItem(STORAGE_KEYS.LAST_SHOWN)
    if (lastShown) {
      const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000) // 6 mois
      if (parseInt(lastShown) > sixMonthsAgo) {
        return false
      }
    }

    return true
  }

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Vérifier si on doit afficher le prompt avec nos règles intelligentes
      if (shouldShowPrompt()) {
        setShowInstallPrompt(true)
        // Enregistrer quand on l'a montré
        localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, Date.now().toString())
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [userRole])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      // Installation acceptée - ne plus jamais demander
      localStorage.setItem(STORAGE_KEYS.NEVER_ASK, 'true')
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleNotNow = () => {
    // "Pas maintenant" - réapparaîtra dans 6 mois
    localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, Date.now().toString())
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  const handleNeverAsk = () => {
    // "Ne plus demander" - ne réapparaîtra jamais
    localStorage.setItem(STORAGE_KEYS.NEVER_ASK, 'true')
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg shadow-xl p-5 border-l-4 border-l-blue-500">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-base text-gray-900 dark:text-white">
              {translations.installTitle}
            </h3>
          </div>
          <Button onClick={handleNotNow} variant="ghost" size="sm" className="p-1">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {translations.installDescription}
        </p>
        
        <div className="flex flex-col gap-2">
          <Button onClick={handleInstall} size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            {translations.install}
          </Button>
          
          <div className="flex gap-2">
            <Button onClick={handleNotNow} variant="outline" size="sm" className="flex-1">
              <Clock className="w-4 h-4 mr-1" />
              {translations.notNow}
            </Button>
            <Button onClick={handleNeverAsk} variant="ghost" size="sm" className="flex-1 text-gray-500">
              {translations.neverAsk}
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 Accès rapide, notifications et mode hors ligne
        </p>
      </div>
    </div>
  )
}