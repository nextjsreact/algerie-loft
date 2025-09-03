"use client"

import { useLocale } from "next-intl"
import { useRouter, usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { FlagIcon } from "@/components/ui/flag-icon"

const languages = [
  { code: 'ar' as const, name: 'العربية', flagCode: 'DZ' as const },
  { code: 'fr' as const, name: 'Français', flagCode: 'FR' as const },
  { code: 'en' as const, name: 'English', flagCode: 'GB' as const }
]

interface SimpleLanguageSelectorProps {
  showText?: boolean
}

export function SimpleLanguageSelector({ showText = false }: SimpleLanguageSelectorProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  
  const currentLanguage = languages.find(lang => lang.code === locale)

  const changeLanguage = (newLocale: string) => {
    // Remove current locale from pathname and add new one
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '')
    const newPath = `/${newLocale}${pathWithoutLocale}`
    router.push(newPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {currentLanguage?.flagCode && (
            <FlagIcon country={currentLanguage.flagCode} className="w-5 h-4" />
          )}
          {showText && currentLanguage?.name}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="flex items-center gap-2"
          >
            <FlagIcon country={lang.flagCode} className="w-5 h-4" /> {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}