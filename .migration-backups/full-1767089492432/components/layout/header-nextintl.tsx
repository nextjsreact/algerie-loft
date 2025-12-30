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
import { useSidebarVisibility } from "@/hooks/use-sidebar-visibility"

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  const locale = useLocale() as 'fr' | 'en' | 'ar'
  const { shouldHideSidebar } = useSidebarVisibility({ userRole: user?.role })
  
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
  
  console.log(`[HEADER] Locale utilisée: ${locale}`)

  // Si la sidebar est visible (pour les utilisateurs avec accès admin), afficher seulement les contrôles essentiels
  const hasSidebarAccess = user?.role && ['admin', 'manager', 'executive', 'member'].includes(user.role)
  
  if (!shouldHideSidebar && hasSidebarAccess) {
    return (
      <header className="flex h-16 items-center justify-end bg-gray-900 px-4 md:hidden z-50">
        <div className="flex items-center gap-2">
          {/* Seulement les contrôles essentiels quand la sidebar est visible */}
          <div className="flex items-center bg-white/20 dark:bg-gray-800 rounded-md p-1 gap-1">
            <LanguageSelector showText={true} />
            <ThemeToggle variant="ghost" size="sm" className="text-white hover:text-white" />
          </div>
          <UserAvatarDropdown locale={locale} />
        </div>
      </header>
    )
  }

  // Header complet quand la sidebar est cachée
  return (
     <header className="flex h-16 items-center justify-between bg-gray-900 px-4 md:hidden z-50">
       <Link href={`/${locale}/dashboard`} className="flex items-center">
         <Building2 className="h-8 w-8 text-white" />
         <span className="ml-2 text-xl font-semibold text-white">{t('loftManager')}</span>
       </Link>
       <div className="flex items-center gap-2">
         {/* User Avatar - visible on all screen sizes */}
         <UserAvatarDropdown locale={locale} />
         
         <div className="flex items-center bg-white/20 dark:bg-gray-800 rounded-md p-1 gap-1">
           <LanguageSelector showText={true} />
           <ThemeToggle variant="ghost" size="sm" className="text-white hover:text-white" />
         </div>
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