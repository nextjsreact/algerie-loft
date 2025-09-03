"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { I18nextProvider } from "react-i18next"
import i18next from "i18next"
import { initializeI18n } from "./index"

interface I18nContextType {
  t: typeof i18next.t;
  i18n: typeof i18next;
  ready: boolean;
  language: string;
  changeLanguage: (lng: string) => Promise<void>;
  version: number; // Pour forcer le re-rendu
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: React.ReactNode;
  lang?: string;
}

export function I18nProvider({ children, lang }: I18nProviderProps) {
  const [ready, setReady] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('fr')
  const [version, setVersion] = useState(0) // Compteur pour forcer le re-rendu

  useEffect(() => {
    const initializeI18nContext = async () => {
      try {
        // Récupérer la langue depuis les cookies en priorité, puis localStorage, puis lang prop, puis défaut
        let initialLang = 'fr';
        if (typeof window !== 'undefined') {
          // D'abord essayer les cookies
          const cookies = document.cookie.split(';');
          const langCookie = cookies.find(cookie => cookie.trim().startsWith('language='));
          if (langCookie) {
            const cookieLang = langCookie.split('=')[1];
            if (['en', 'fr', 'ar'].includes(cookieLang)) {
              initialLang = cookieLang;
            }
          } else {
            // Sinon essayer localStorage
            const storedLang = localStorage.getItem('language');
            if (storedLang && ['en', 'fr', 'ar'].includes(storedLang)) {
              initialLang = storedLang;
            }
          }
        }
        if (!initialLang) {
          initialLang = lang || 'fr';
        }
        
        console.log('🌍 Initialisation I18n avec langue:', initialLang);
        
        await initializeI18n({ 
          lng: initialLang
        });
        
        await i18next.changeLanguage(initialLang);
        
        console.log('✅ I18n initialisé, langue actuelle:', i18next.language);
        setCurrentLanguage(i18next.language)
        
        i18next.on('languageChanged', (lng: string) => {
          console.log('🔄 Langue changée vers:', lng);
          setCurrentLanguage(lng)
          setVersion(prev => prev + 1) // Incrémenter pour forcer le re-rendu
          if (typeof window !== 'undefined') {
            localStorage.setItem('language', lng);
          }
        })
        
        setReady(true)
      } catch (error) {
        console.error('Failed to initialize i18n:', error)
        setReady(true)
      }
    }

    initializeI18nContext()
    
    // Clean up listener on unmount
    return () => {
      if (i18next) {
        i18next.off('languageChanged')
      }
    }
  }, [lang])

  const contextValue: I18nContextType = {
    t: i18next.t.bind(i18next),
    i18n: i18next,
    ready,
    language: currentLanguage,
    version,
    changeLanguage: async (lng: string) => {
      try {
        // Changer la langue
        await i18next.changeLanguage(lng);
        
        // Mettre à jour l'état local pour déclencher un re-rendu
        setCurrentLanguage(lng);
        setVersion(prev => prev + 1);
        
        // Sauvegarder la langue dans localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('language', lng);
        }
      } catch (error) {
        console.error('Failed to change language:', error)
      }
    },
  }

  if (!ready) {
    return <div>Loading translations...</div>;
  }

  return (
    <I18nextProvider i18n={i18next}>
      <I18nContext.Provider value={contextValue}>
        {children}
      </I18nContext.Provider>
    </I18nextProvider>
  )
}

export function useTranslation(namespaces?: string | string[]) {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within an I18nProvider")
  }
  
  // If specific namespaces are requested, ensure they are loaded
  if (namespaces && context.i18n) {
    const nsArray = Array.isArray(namespaces) ? namespaces : [namespaces]
    nsArray.forEach(ns => {
      // Check if the namespace is already loaded
      if (!context.i18n.hasResourceBundle(context.'fr', ns)) {
        // Try to load the namespace
        context.i18n.loadNamespaces(ns).catch(err => {
          console.error('Failed to load namespace:', ns, err)
        })
      }
    })
  }
  
  // Return a custom t function that handles namespaces properly
  return {
    ...context,
    t: (key: string, options?: any) => {
      // If key contains namespace separator, use it directly
      if (key.includes(':')) {
        return context.t(key, options)
      }
      
      // If namespaces are specified, try each namespace
      if (namespaces) {
        const nsArray = Array.isArray(namespaces) ? namespaces : [namespaces]
        for (const ns of nsArray) {
          const translatedKey = `${ns}:${key}`
          const result = context.t(translatedKey, { ...options, defaultValue: null })
          if (result !== translatedKey && result !== null) {
            return result
          }
        }
      }
      
      // Fallback to default behavior
      return context.t(key, options)
    }
  }
}