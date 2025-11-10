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
    
    // Pages client - ne doivent pas avoir la sidebar admin
    const isClientPage = pathname?.includes('/client') || 
                         pathname?.includes('/partner') ||
                         (pathname?.includes('/admin/superuser') && userRole === 'superuser') ||
                         (userRole === 'client' && !pathname?.includes('/admin')) || 
                         (userRole === 'partner' && !pathname?.includes('/admin'))
    
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
  
  const isClientPage = pathname?.includes('/client') || (userRole === 'client' && !pathname?.includes('/admin'))
  
  return {
    shouldHideSidebar,
    isAuthPage,
    isPublicPage,
    isClientPage,
    pathname
  }
}