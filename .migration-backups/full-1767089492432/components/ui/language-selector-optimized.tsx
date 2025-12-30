"use client"

import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Check, Loader2 } from "lucide-react"
import { FlagIcon } from "@/components/ui/flag-icon"
import { useState, useEffect, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useLocale } from "next-intl"

const languages = [
  { code: 'fr', name: 'Français', flagCode: 'FR' as const },
  { code: 'en', name: 'English', flagCode: 'GB' as const },
  { code: 'ar', name: 'العربية', flagCode: 'DZ' as const }
]

interface LanguageSelectorProps {
  showText?: boolean
}

export function LanguageSelectorOptimized({ showText = false }: LanguageSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === currentLocale || isChanging) return
    
    setIsChanging(true)
    
    try {
      // Set locale cookie for persistence
      document.cookie = `NEXT_LOCALE=${langCode}; path=/; max-age=31536000; SameSite=Lax`
      
      // Get current path without locale
      const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/'
      
      // Navigate to new locale
      const newUrl = `/${langCode}${pathWithoutLocale}`
      
      // Use startTransition for better performance
      startTransition(() => {
        router.push(newUrl)
        router.refresh()
      })
      
      // Fallback to window.location after a short delay if router doesn't work
      setTimeout(() => {
        if (isChanging) {
          window.location.href = newUrl
        }
      }, 2000)
      
    } catch (error) {
      console.error('Language change error:', error)
      // Fallback to direct navigation
      window.location.href = `/${langCode}${pathname.replace(`/${currentLocale}`, '') || '/'}`
    }
  }

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  // Show default during hydration
  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className={`flex items-center gap-2 ${showText ? 'h-8 px-3' : 'h-8 w-8 p-0'} text-white hover:text-white hover:bg-gray-600`}
        disabled
      >
        <FlagIcon country="FR" className="w-5 h-4" />
        {showText && <span className="text-sm font-medium">Français</span>}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex items-center gap-2 ${showText ? 'h-8 px-3' : 'h-8 w-8 p-0'} text-white hover:text-white hover:bg-gray-600`}
          disabled={isChanging || isPending}
        >
          {(isChanging || isPending) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FlagIcon country={currentLanguage.flagCode} className="w-5 h-4" />
          )}
          {showText && (
            <span className="text-sm font-medium">
              {(isChanging || isPending) ? 'Changement...' : currentLanguage.name}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer"
            disabled={isChanging || isPending || lang.code === currentLocale}
          >
            <div className="flex items-center gap-3">
              <FlagIcon country={lang.flagCode} className="w-5 h-4" />
              <span>{lang.name}</span>
            </div>
            {lang.code === currentLocale && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}