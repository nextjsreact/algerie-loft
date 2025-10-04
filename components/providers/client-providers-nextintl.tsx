"use client"

import React from "react"
import { usePathname } from "next/navigation"
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
  
  // Pages qui doivent utiliser un layout minimal (sans sidebar/header)
  const isAuthPage = pathname?.includes('/login') || 
                     pathname?.includes('/register') || 
                     pathname?.includes('/forgot-password') || 
                     pathname?.includes('/reset-password')
  
  // Forcer le layout minimal pour les pages d'authentification
  const shouldHideSidebar = hideSidebar || isAuthPage

   return (
     <ErrorBoundary>
       {!session || isAuthPage ? (
         // For pages without session OR auth pages, use minimal providers
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
                   <div className="flex h-screen bg-background">
                     {/* Only show desktop sidebar if not hidden */}
                     {!shouldHideSidebar && (
                       <div className="hidden md:flex md:w-72 md:flex-shrink-0 md:z-10">
                         <ErrorBoundary>
                           <Sidebar user={session.user} unreadCount={unreadCount} />
                         </ErrorBoundary>
                       </div>
                     )}
                     <div className="flex flex-1 flex-col min-w-0 relative">
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