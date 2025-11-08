"use client"

import { Menu, Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar-nextintl"
import { LanguageSelector } from "@/components/ui/language-selector"
import { UserAvatarDropdown } from "@/components/auth/user-avatar-dropdown"
import type { User } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLocale } from "next-intl"

interface MobileHeaderProps {
  user: User
  showLogo?: boolean
}

export function MobileHeader({ user, showLogo = true }: MobileHeaderProps) {
  const locale = useLocale()

  return (
    <header className="flex h-16 items-center justify-between bg-gray-900 px-4 md:hidden z-50">
      {/* Logo - conditionnel */}
      {showLogo && (
        <Link href={`/${locale}/dashboard`} className="flex items-center">
          <Building2 className="h-6 w-6 text-white" />
          <span className="ml-2 text-lg font-semibold text-white hidden sm:inline">
            Loft Manager
          </span>
        </Link>
      )}
      
      {/* Si pas de logo, on met un spacer */}
      {!showLogo && <div className="w-6" />}
      
      {/* Contrôles de droite - TOUJOURS visibles */}
      <div className="flex items-center gap-2">
        {/* Contrôles de langue et thème */}
        <div className="flex items-center bg-white/20 dark:bg-gray-800 rounded-lg p-1 gap-1">
          <LanguageSelector showText={true} />
          <ThemeToggle variant="ghost" size="sm" className="text-white hover:text-white" />
        </div>
        
        {/* Avatar utilisateur */}
        <UserAvatarDropdown locale={locale} />
        
        {/* Menu burger - TOUJOURS visible sur mobile */}
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 border border-white/20"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-gray-900 p-0 border-r border-white/10">
            <SheetTitle className="sr-only">Menu de Navigation</SheetTitle>
            <div className="h-full overflow-hidden">
              <Sidebar user={user} unreadCount={0} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

export default MobileHeader