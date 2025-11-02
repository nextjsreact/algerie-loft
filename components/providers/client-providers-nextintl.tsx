"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useSidebarVisibility } from "@/hooks/use-sidebar-visibility"
import { SidebarDebug } from "@/components/debug/sidebar-debug"
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
import { Header } from "@/components/layout/header-nextintl"
import { ErrorBoundary } from "@/components/error-boundary"

interface ClientProvidersProps {
  children: React.ReactNode;
  session: any; // Type this more specifically if possible
  unreadCount: number | null;
  locale: string;
  messages: any;
  hideSidebar?: boolean;
}

export default function ClientProviders({ children, session, unreadCount, locale, messages, hideSidebar = false }: ClientProvidersProps) {
  const pathname = usePathname()
  const [renderKey, setRenderKey] = useState(0)
  
  // Use custom hook for sidebar visibility logic
  const { shouldHideSidebar, isAuthPage, isPublicPage } = useSidebarVisibility({
    userRole: session?.user?.role,
    hideSidebar
  })
  
  // Force re-render when pathname or user role changes
  useEffect(() => {
    setRenderKey(prev => prev + 1)
  }, [pathname, session?.user?.role, shouldHideSidebar])

   return (
     <ErrorBoundary>
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
       ) : (
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
             <ErrorBoundary>
               <EnhancedRealtimeProvider userId={session.user.id}>
                 <NotificationProvider userId={session.user.id}>
                   <div className="flex h-screen bg-background" key={`layout-${renderKey}`}>
                     {/* Only show desktop sidebar if not hidden */}
                     {!shouldHideSidebar && (
                       <div className="hidden md:flex md:w-72 md:flex-shrink-0 md:z-10">
                         <ErrorBoundary>
                           <Sidebar user={session.user} unreadCount={unreadCount} />
                         </ErrorBoundary>
                       </div>
                     )}
                     <div className="flex flex-1 flex-col min-w-0 relative">
                       {/* Desktop header when sidebar is hidden */}
                       {shouldHideSidebar && (
                         <ErrorBoundary>
                           <DesktopHeader />
                         </ErrorBoundary>
                       )}
                       
                       {/* Mobile header - always show */}
                       <ErrorBoundary>
                         <Header user={session.user} />
                       </ErrorBoundary>
                       
                       <main className="flex-1 overflow-y-auto relative z-0 p-6 md:p-8 lg:p-12">
                         {children}
                       </main>
                     </div>
                     {/* Notifications d'alertes critiques pour les executives */}
                     <ErrorBoundary>
                       <CriticalAlertsNotification
                         userId={session.user.id}
                         userRole={session.user.role}
                       />
                     </ErrorBoundary>
                     {/* Prompt d'installation PWA */}
                     <ErrorBoundary>
                       <InstallPrompt />
                     </ErrorBoundary>
                     {/* Debug component for development */}
                     <SidebarDebug userRole={session.user.role} hideSidebar={hideSidebar} />
                   </div>
                 </NotificationProvider>
               </EnhancedRealtimeProvider>
             </ErrorBoundary>
             </ThemeProvider>
           </SupabaseProvider>
         </NextIntlClientProvider>
       )}
     </ErrorBoundary>
   );
 }