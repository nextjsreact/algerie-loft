"use client"

import React from "react"
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
}

export default function ClientProviders({ children, session, unreadCount, locale, messages }: ClientProvidersProps) {
  return (
    <ErrorBoundary>
      {!session ? (
        // For pages without session (like homepage), use minimal providers
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
        // For authenticated pages, use full provider stack
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
                  <div className="flex h-screen bg-background md:gap-x-4">
                    <div className="hidden md:flex">
                      <ErrorBoundary>
                        <Sidebar user={session.user} unreadCount={unreadCount} />
                      </ErrorBoundary>
                    </div>
                    <div className="flex flex-1 flex-col">
                      <ErrorBoundary>
                        <Header user={session.user} />
                      </ErrorBoundary>
                      <main className="flex-1 overflow-y-auto">
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