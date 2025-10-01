"use client"

import { Menu, Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar-nextintl"
import { LanguageSelector } from "@/components/ui/language-selector"
import type { User } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTranslations, useLocale } from "next-intl"

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  const locale = useLocale()
  const t = useTranslations('nav')

  return (
     <header className="flex h-16 items-center justify-between bg-gray-900 px-4 md:hidden z-50">
       <Link href={`/${locale}/dashboard`} className="flex items-center">
         <Building2 className="h-8 w-8 text-white" />
         <span className="ml-2 text-xl font-semibold text-white">{t('loftManager')}</span>
       </Link>
       <div className="flex items-center gap-2">
         <div className="flex items-center bg-white/20 dark:bg-gray-800 rounded-md p-1 gap-1">
           <LanguageSelector />
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