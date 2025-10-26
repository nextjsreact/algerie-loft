'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FlagIcon } from '@/components/ui/flag-icon'
import { Globe } from 'lucide-react'
import { Locale } from '@/i18n'
import { isRTL } from '@/lib/rtl'

interface LanguageOption {
  code: Locale;
  name: string;
  nativeName: string;
  flagCode: 'DZ' | 'FR' | 'GB';
}

export function LanguageSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale() as Locale
  const t = useTranslations()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const languages: LanguageOption[] = [
    { 
      code: 'ar', 
      name: 'Arabic', 
      nativeName: 'العربية', 
      flagCode: 'DZ' 
    },
    { 
      code: 'fr', 
      name: 'French', 
      nativeName: 'Français', 
      flagCode: 'FR' 
    },
    { 
      code: 'en', 
      name: 'English', 
      nativeName: 'English', 
      flagCode: 'GB' 
    },
  ]

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[1]

  const handleLanguageChange = (newLocale: Locale) => {
    // Preserve current search context and user session
    if (typeof window !== 'undefined') {
      // Save current search parameters to session
      const searchParams = new URLSearchParams(window.location.search)
      const searchContext: any = {}
      
      searchParams.forEach((value, key) => {
        searchContext[key] = value
      })
      
      // Store in session storage for restoration after language change
      try {
        sessionStorage.setItem('preserved-search-context', JSON.stringify(searchContext))
      } catch (error) {
        console.warn('Failed to preserve search context:', error)
      }
    }

    // Preserve current path structure when changing language
    const segments = pathname.split('/').filter(Boolean)
    
    // Remove current locale from path if present
    if (segments[0] && ['ar', 'fr', 'en'].includes(segments[0])) {
      segments.shift()
    }
    
    // Construct new path with new locale
    const newPath = `/${newLocale}${segments.length > 0 ? '/' + segments.join('/') : ''}`
    
    // Preserve search parameters and hash
    const searchParams = new URLSearchParams(window.location.search)
    const hash = window.location.hash
    const fullPath = `${newPath}${searchParams.toString() ? '?' + searchParams.toString() : ''}${hash}`
    
    router.push(fullPath)
  }

  // Show loading state during SSR
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 px-0" disabled>
        <Globe className="w-4 h-4" />
        <span className="sr-only">Select language</span>
      </Button>
    )
  }

  const isCurrentRTL = isRTL(currentLocale)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`h-8 px-2 gap-1 ${isCurrentRTL ? 'flex-row-reverse' : 'flex-row'}`}
          title={t('currency.selector.change') || 'Change language'}
        >
          <FlagIcon country={currentLanguage.flagCode} className="w-4 h-3" />
          <span className="text-xs font-medium hidden sm:inline">
            {currentLanguage.code.toUpperCase()}
          </span>
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={isCurrentRTL ? "start" : "end"}
        className={isCurrentRTL ? 'text-right' : 'text-left'}
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`${isRTL(lang.code) ? 'flex-row-reverse text-right' : 'flex-row text-left'} ${
              lang.code === currentLocale ? 'bg-accent' : ''
            }`}
          >
            <FlagIcon 
              country={lang.flagCode} 
              className={`w-4 h-3 ${isRTL(lang.code) ? 'ml-2' : 'mr-2'}`} 
            />
            <div className="flex flex-col">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-xs text-muted-foreground">{lang.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
