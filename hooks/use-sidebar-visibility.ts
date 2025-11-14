"use client"

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

interface UseSidebarVisibilityProps {
  userRole?: string
  hideSidebar?: boolean
}

export function useSidebarVisibility({ userRole, hideSidebar = false }: UseSidebarVisibilityProps) {
  const pathname = usePathname()
  
  const shouldHideSidebar = useMemo(() => {
    // Pages d'authentification
    const isAuthPage = pathname?.includes('/login') || 
                       pathname?.includes('/register') || 
                       pathname?.includes('/forgot-password') || 
                       pathname?.includes('/reset-password')
    
    // Pages publiques (seulement les pages racines de locale, pas les sous-pages)
    const isPublicPage = pathname?.includes('/public') || 
                         pathname?.includes('/site-public') ||
                         pathname === '/fr' || 
                         pathname === '/en' || 
                         pathname === '/ar' ||
                         pathname === '/fr/' || 
                         pathname === '/en/' || 
                         pathname === '/ar/'
    
    // Pages client - ne doivent pas avoir la sidebar admin/employé
    // Les clients et partenaires ne doivent JAMAIS voir la sidebar employé
    const isClientPage = userRole === 'client' || 
                         userRole === 'partner' ||
                         (pathname?.includes('/admin/superuser') && userRole === 'superuser')
    
    // Pages qui forcent la sidebar cachée
    const isHiddenPage = hideSidebar
    
    return isAuthPage || isPublicPage || isClientPage || isHiddenPage
  }, [pathname, userRole, hideSidebar])
  
  const isAuthPage = pathname?.includes('/login') || 
                     pathname?.includes('/register') || 
                     pathname?.includes('/forgot-password') || 
                     pathname?.includes('/reset-password')
  
  const isPublicPage = pathname?.includes('/public') || 
                       pathname?.includes('/site-public') ||
                       pathname === '/fr' || 
                       pathname === '/en' || 
                       pathname === '/ar' ||
                       pathname === '/fr/' || 
                       pathname === '/en/' || 
                       pathname === '/ar/'
  
  const isClientPage = userRole === 'client' || userRole === 'partner'
  
  return {
    shouldHideSidebar,
    isAuthPage,
    isPublicPage,
    isClientPage,
    pathname
  }
}