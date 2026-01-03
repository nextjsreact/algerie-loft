"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useSidebarVisibility } from "@/hooks/use-sidebar-visibility"
import { useVisitorTracking } from "@/hooks/useVisitorTracking"
import { cn } from "@/lib/utils"

import { DesktopHeader } from "@/components/layout/desktop-header"
import { NextIntlClientProvider } from 'next-intl'
import SupabaseProvider from "@/components/providers/supabase-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from '@/components/providers/toast-provider'
import { EnhancedRealtimeProvider } from '@/components/providers/enhanced-realtime-provider'
import { NotificationProvider } from '@/components/providers/notification-context'
import { CriticalAlertsNotification } from '@/components/executive/critical-alerts-notification'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { Sidebar } from "@/components/layout/sidebar-nextintl"
import { SuperuserSidebar } from "@/components/admin/superuser/superuser-sidebar"
import { Header } from "@/components/layout/header-nextintl"
import { AdaptiveHeader } from "@/components/layout/adaptive-header"
import { MobileHeader } from "@/components/layout/mobile-header"
// ErrorBoundary removed - causing compatibility issues with Next.js 15
// import { ErrorBoundary } from "@/components/error-boundary"

interface ClientProvidersProps {
  children: React.ReactNode;
  session: any; // Type this more specifically if possible
  unreadCount: number | null;
  locale: string;
  messages: any;
  hideSidebar?: boolean;
}

export default function ClientProviders({ children, session: serverSession, unreadCount, locale, messages, hideSidebar = false }: ClientProvidersProps) {
  const pathname = usePathname()
  const [renderKey, setRenderKey] = useState(0)
  const [clientSession, setClientSession] = useState(serverSession)
  const [isLoading, setIsLoading] = useState(!serverSession?.user?.id)
  
  // Get session client-side (especially important for OAuth)
  useEffect(() => {
    async function getClientSession() {
      try {
        const { getSession } = await import('@/lib/auth')
        const session = await getSession()
        setClientSession(session)
        console.log('✅ [ClientProviders] Client session fetched:', !!session?.user?.id)
      } catch (error) {
        console.error('❌ [ClientProviders] Failed to get client session:', error)
        setClientSession(serverSession) // Fallback to server session
      } finally {
        setIsLoading(false)
      }
    }
    
    // If we have server session, use it immediately
    if (serverSession?.user?.id) {
      setClientSession(serverSession)
      setIsLoading(false)
      console.log('✅ [ClientProviders] Using server session:', serverSession.user.email)
    } else {
      // Check if we're on an OAuth callback page or have OAuth params
      const hasOAuthParams = window.location.search.includes('access_token') || 
                            window.location.hash.includes('access_token') ||
                            window.location.pathname.includes('oauth-success')
      
      if (hasOAuthParams) {
        console.log('🔄 [ClientProviders] OAuth detected, fetching session...')
        // For OAuth, fetch session but don't show loading screen
        setIsLoading(false) // Show layout immediately
        getClientSession()
      } else {
        // For regular pages without session, get session client-side
        getClientSession()
      }
    }
  }, [serverSession])
  
  // Use client session instead of server session
  const session = clientSession
  
  // Additional effect to handle OAuth session updates
  useEffect(() => {
    // Listen for OAuth session ready event
    const handleOAuthSessionReady = async (event: CustomEvent) => {
      console.log('🎉 [ClientProviders] OAuth session ready event received')
      const { session: oauthSession } = event.detail
      if (oauthSession?.user?.id) {
        setClientSession(oauthSession)
        setRenderKey(prev => prev + 1) // Force re-render
        console.log('✅ [ClientProviders] OAuth session applied:', oauthSession.user.email)
      }
    }

    // Listen for session changes (OAuth completion)
    const handleSessionChange = async () => {
      if (!clientSession?.user?.id && !isLoading) {
        console.log('🔄 [ClientProviders] Checking for updated session...')
        try {
          const { getSession } = await import('@/lib/auth')
          const newSession = await getSession()
          if (newSession?.user?.id && newSession.user.id !== clientSession?.user?.id) {
            console.log('✅ [ClientProviders] Session updated:', newSession.user.email)
            setClientSession(newSession)
            setRenderKey(prev => prev + 1) // Force re-render
          }
        } catch (error) {
          console.error('❌ [ClientProviders] Session check failed:', error)
        }
      }
    }

    // Add event listener for OAuth session ready
    window.addEventListener('oauth-session-ready', handleOAuthSessionReady as EventListener)

    // Check for session updates periodically for OAuth scenarios
    const interval = setInterval(handleSessionChange, 2000)
    
    // Cleanup
    return () => {
      window.removeEventListener('oauth-session-ready', handleOAuthSessionReady as EventListener)
      clearInterval(interval)
    }
  }, [clientSession?.user?.id, isLoading])
  
  // Use custom hook for sidebar visibility logic
  const { shouldHideSidebar, isAuthPage, isPublicPage } = useSidebarVisibility({
    userRole: session?.user?.role,
    hideSidebar
  })
  
  // Visitor tracking - Light version (once per session)
  // Track everyone EXCEPT superusers on admin pages
  const isSuperuserAdmin = session?.user?.role === 'superuser' && pathname?.includes('/admin/superuser');
  const shouldTrack = !isSuperuserAdmin;
  
  useVisitorTracking({ 
    enabled: shouldTrack,
    debug: false // Set to true for debugging
  });
  
  // Debug logs
  useEffect(() => {
    console.log('[ClientProviders] Debug:', {
      userRole: session?.user?.role,
      pathname,
      shouldHideSidebar,
      isAuthPage,
      isPublicPage,
      isLoading,
      hasSession: !!session,
      sessionSource: serverSession?.user?.id ? 'server' : 'client'
    })
  }, [session?.user?.role, pathname, shouldHideSidebar, isAuthPage, isPublicPage, isLoading, serverSession?.user?.id])
  
  // Force re-render when pathname or user role changes
  useEffect(() => {
    setRenderKey(prev => prev + 1)
  }, [pathname, session?.user?.role, shouldHideSidebar])

   // Show loading state only for non-OAuth scenarios
   if (isLoading && !pathname?.includes('oauth-success')) {
     return (
       <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Lagos">
         <ThemeProvider
           attribute="class"
           defaultTheme="system"
           enableSystem
           disableTransitionOnChange
         >
           <div className="flex items-center justify-center min-h-screen">
             <div className="text-lg">Chargement...</div>
           </div>
         </ThemeProvider>
       </NextIntlClientProvider>
     )
   }

   return (
     <>
       {!session || isAuthPage || isPublicPage ? (
         // For pages without session OR auth pages OR public pages, use minimal providers
         <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Lagos">
           <ThemeProvider
             attribute="class"
             defaultTheme="system"
             enableSystem
             disableTransitionOnChange
           >
             <main className="flex-1 overflow-y-auto">
               {children}
             </main>
           </ThemeProvider>
         </NextIntlClientProvider>
       ) : session?.user?.id ? (
         // For authenticated pages (non-auth), use full provider stack
         <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Lagos">
           <SupabaseProvider>
             <ThemeProvider
               attribute="class"
               defaultTheme="system"
               enableSystem
               disableTransitionOnChange
             >
             <ToastProvider />
               <EnhancedRealtimeProvider userId={session.user.id}>
                 <NotificationProvider userId={session.user.id}>
                   <div className="flex h-screen bg-background" key={`layout-${renderKey}`}>
                     {/* Show appropriate sidebar based on user role */}
                     {session.user.role === 'superuser' && (pathname?.includes('/admin/superuser') || pathname?.includes('/database-cloner') || pathname?.includes('/admin/announcements') || pathname?.includes('/settings')) ? (
                       <div className="flex w-72 flex-shrink-0 z-10">
                         <SuperuserSidebar />
                       </div>
                     ) : !shouldHideSidebar && (
                       <div className="hidden md:flex md:w-72 md:flex-shrink-0 md:z-10">
                         <Sidebar user={session.user} unreadCount={unreadCount} />
                       </div>
                     )}
                     <div className="flex flex-1 flex-col min-w-0 relative">
                       {/* Desktop header - always visible on desktop */}
                       <div className={cn(
                         "hidden md:block fixed top-0 right-0 left-0 z-20",
                         !shouldHideSidebar && "md:left-72"
                       )}>
                         <DesktopHeader />
                       </div>
                       
                       {/* Mobile header - always shows burger menu */}
                       <MobileHeader 
                         user={session.user} 
                         showLogo={shouldHideSidebar} 
                       />
                       
                       <main className="flex-1 overflow-y-auto relative z-0 px-6 pb-6 pt-28 md:px-8 md:pb-8 md:pt-36 lg:px-12 lg:pb-12">
                         {children}
                       </main>
                     </div>
                     {/* Notifications d'alertes critiques pour les executives */}
                     <CriticalAlertsNotification
                       userId={session.user.id}
                       userRole={session.user.role}
                     />
                     {/* Prompt d'installation PWA avec paramètres intelligents */}
                     <InstallPrompt userRole={session.user.role} />

                   </div>
                 </NotificationProvider>
               </EnhancedRealtimeProvider>
             </ThemeProvider>
           </SupabaseProvider>
         </NextIntlClientProvider>
       ) : (
         // Fallback if session exists but user.id is missing
         <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Lagos">
           <ThemeProvider
             attribute="class"
             defaultTheme="system"
             enableSystem
             disableTransitionOnChange
           >
             <main className="flex-1 overflow-y-auto">
               {children}
             </main>
           </ThemeProvider>
         </NextIntlClientProvider>
       )}
     </>
   );
 }