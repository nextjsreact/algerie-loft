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
import { useTranslations, useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface AdaptiveHeaderProps {
  user: User
}

export function AdaptiveHeader({ user }: AdaptiveHeaderProps) {
  const locale = useLocale() as 'fr' | 'en' | 'ar'
  const pathname = usePathname()
  const [sidebarVisible, setSidebarVisible] = useState(false)
  
  // Traductions pour les 3 langues
  const navTranslations = {
    fr: {
      loftManager: "Gestionnaire d'appartements",
      toggleTheme: "Basculer le thème",
      dashboard: "Tableau de bord",
      conversations: "Conversations", 
      notifications: "Notifications",
      lofts: "Appartements",
      customers: "Clients",
      reservations: "Réservations",
      availability: "Disponibilité",
      tasks: "Tâches",
      teams: "Équipes", 
      owners: "Propriétaires",
      transactions: "Transactions",
      reports: "Rapports",
      reportsNav: "Rapports",
      settings: "Paramètres",
      signOut: "Déconnexion",
      admins: "Administrateur",
      admin: "Administrateur"
    },
    en: {
      loftManager: "Loft Manager",
      toggleTheme: "Toggle theme",
      dashboard: "Dashboard",
      conversations: "Conversations", 
      notifications: "Notifications",
      lofts: "Lofts",
      customers: "Customers",
      reservations: "Reservations",
      availability: "Availability",
      tasks: "Tasks",
      teams: "Teams", 
      owners: "Owners",
      transactions: "Transactions",
      reports: "Reports",
      reportsNav: "Reports",
      settings: "Settings",
      signOut: "Sign Out",
      admins: "Administrator",
      admin: "Administrator"
    },
    ar: {
      loftManager: "مدير الشقق",
      toggleTheme: "تبديل المظهر",
      dashboard: "لوحة التحكم",
      conversations: "المحادثات", 
      notifications: "الإشعارات",
      lofts: "الشقق",
      customers: "العملاء",
      reservations: "الحجوزات",
      availability: "التوفر",
      tasks: "المهام",
      teams: "الفرق", 
      owners: "الملاك",
      transactions: "المعاملات",
      reports: "التقارير",
      reportsNav: "التقارير",
      settings: "الإعدادات",
      signOut: "تسجيل الخروج",
      admins: "مدير",
      admin: "مدير"
    }
  }
  
  const t = (key: string) => navTranslations[locale][key as keyof typeof navTranslations['fr']] || key
  
  // Détecter si la sidebar devrait être visible
  useEffect(() => {
    const shouldShowSidebar = () => {
      // Pages où la sidebar ne doit pas être visible
      const noSidebarPages = [
        '/login', '/register', '/forgot-password', '/reset-password',
        '/public', '/site-public', '/client/', '/partner/'
      ]
      
      const isNoSidebarPage = noSidebarPages.some(page => pathname?.includes(page))
      const isRootPage = pathname === `/${locale}` || pathname === '/fr' || pathname === '/en' || pathname === '/ar'
      
      // La sidebar est visible si :
      // - Ce n'est pas une page sans sidebar
      // - Ce n'est pas la page racine
      // - L'utilisateur a un rôle qui permet d'accéder à la sidebar
      const hasAdminAccess = user?.role && ['admin', 'manager', 'executive', 'member'].includes(user.role)
      
      return !isNoSidebarPage && !isRootPage && hasAdminAccess
    }
    
    setSidebarVisible(shouldShowSidebar())
  }, [pathname, user?.role, locale])

  // Header simplifié quand la sidebar est visible (sur desktop)
  // Mais sur mobile, on a toujours besoin du menu burger
  if (sidebarVisible) {
    return (
      <header className="flex h-16 items-center justify-between bg-gray-900 px-4 md:hidden z-50">
        {/* Logo compact sur mobile */}
        <Link href={`/${locale}/dashboard`} className="flex items-center">
          <Building2 className="h-6 w-6 text-white" />
        </Link>
        
        <div className="flex items-center gap-2">
          {/* Contrôles de langue et thème */}
          <div className="flex items-center bg-white/20 dark:bg-gray-800 rounded-lg p-1 gap-1">
            <LanguageSelector />
            <ThemeToggle variant="ghost" size="sm" className="text-white hover:text-white" />
          </div>
          
          {/* Avatar utilisateur */}
          <UserAvatarDropdown locale={locale} />
          
          {/* Menu burger - TOUJOURS visible sur mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-gray-900 p-0 border-r border-white/10">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="h-full overflow-hidden">
                <Sidebar user={user} unreadCount={0} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    )
  }

  // Header complet quand la sidebar n'est pas visible
  return (
    <header className="flex h-16 items-center justify-between bg-gray-900 px-4 md:hidden z-50">
      {/* Logo et titre */}
      <Link href={`/${locale}/dashboard`} className="flex items-center">
        <Building2 className="h-8 w-8 text-white" />
        <span className="ml-2 text-xl font-semibold text-white">{t('loftManager')}</span>
      </Link>
      
      {/* Contrôles de droite */}
      <div className="flex items-center gap-2">
        {/* Contrôles de langue et thème */}
        <div className="flex items-center bg-white/20 dark:bg-gray-800 rounded-lg p-1 gap-1">
          <LanguageSelector />
          <ThemeToggle variant="ghost" size="sm" className="text-white hover:text-white" />
        </div>
        
        {/* Avatar utilisateur */}
        <UserAvatarDropdown locale={locale} />
        
        {/* Menu burger pour la sidebar mobile */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-gray-900 p-0 border-r border-white/10">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="h-full overflow-hidden">
              <Sidebar user={user} unreadCount={0} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

export default AdaptiveHeader