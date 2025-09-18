"use client"

import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Check } from "lucide-react"
import { FlagIcon } from "@/components/ui/flag-icon"
import { useState, useEffect } from "react"
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

export function LanguageSelector({ showText = false }: LanguageSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLanguageChange = (langCode: string) => {
    // Set locale cookie for persistence
    document.cookie = `NEXT_LOCALE=${langCode}; path=/; max-age=31536000; SameSite=Lax`
    
    // Get current path without locale
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/'
    
    // Navigate to new locale with force refresh
    const newUrl = `/${langCode}${pathWithoutLocale}`
    
    // Use window.location for immediate navigation
    window.location.href = newUrl
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
        >
          <FlagIcon country={currentLanguage.flagCode} className="w-5 h-4" />
          {showText && <span className="text-sm font-medium">{currentLanguage.name}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer"
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