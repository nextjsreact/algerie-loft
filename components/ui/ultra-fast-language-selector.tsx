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
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useLocale } from "next-intl"

const languages = [
  { code: 'fr', name: 'Français', flagCode: 'FR' as const },
  { code: 'en', name: 'English', flagCode: 'GB' as const },
  { code: 'ar', name: 'العربية', flagCode: 'DZ' as const }
]

interface UltraFastLanguageSelectorProps {
  showText?: boolean
}

export function UltraFastLanguageSelector({ showText = false }: UltraFastLanguageSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()
  const [isChanging, setIsChanging] = useState(false)

  const handleLanguageChange = (langCode: string) => {
    if (langCode === currentLocale || isChanging) return
    
    setIsChanging(true)
    
    // Méthode ultra-rapide : changement immédiat avec cookie
    document.cookie = `NEXT_LOCALE=${langCode}; path=/; max-age=31536000; SameSite=Lax`
    
    // Navigation immédiate
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/'
    const newUrl = `/${langCode}${pathWithoutLocale}`
    
    // Utiliser location.replace pour un changement plus rapide
    window.location.replace(newUrl)
  }

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex items-center gap-1 ${showText ? 'h-8 px-2' : 'h-8 w-8 p-0'} text-white hover:text-white hover:bg-gray-600`}
          disabled={isChanging}
        >
          {isChanging ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FlagIcon country={currentLanguage.flagCode} className="w-4 h-3" />
          )}
          {showText && !isChanging && (
            <span className="text-xs font-medium">{currentLanguage.name}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer py-1"
            disabled={isChanging || lang.code === currentLocale}
          >
            <div className="flex items-center gap-2">
              <FlagIcon country={lang.flagCode} className="w-4 h-3" />
              <span className="text-sm">{lang.name}</span>
            </div>
            {lang.code === currentLocale && (
              <Check className="h-3 w-3 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}