"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Settings,
  DollarSign,
  Menu,
  X,
  Sparkles
} from 'lucide-react'
import { PartnerSWRProvider } from './swr-provider'
import type { AuthSession } from '@/lib/types'

interface ResponsivePartnerLayoutProps {
  children: React.ReactNode
  locale: string
}

export function ResponsivePartnerLayout({ children, locale }: ResponsivePartnerLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('partner.navigation')
  const brandingT = useTranslations('partner.branding')
  
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigationItems = [
    { name: 'dashboard', translationKey: 'dashboard', href: `/${locale}/partner/dashboard`, icon: LayoutDashboard },
    { name: 'properties', translationKey: 'properties', href: `/${locale}/partner/properties`, icon: Building2 },
    { name: 'bookings', translationKey: 'bookings', href: `/${locale}/partner/bookings`, icon: Calendar },
    { name: 'revenue', translationKey: 'revenue', href: `/${locale}/partner/revenue`, icon: DollarSign },
    { name: 'analytics', translationKey: 'analytics', href: `/${locale}/partner/analytics`, icon: BarChart3 },
    { name: 'messages', translationKey: 'messages', href: `/${locale}/partner/messages`, icon: MessageSquare },
    { name: 'settings', translationKey: 'settings', href: `/${locale}/partner/settings`, icon: Settings },
  ]

  const handleSessionExpired = useCallback(() => {
    setSession(null)
    router.push(`/${locale}/login?redirect=${encodeURIComponent(window.location.pathname)}`)
  }, [locale, router])

  const handleUnauthorized = useCallback(() => {
    router.push(`/${locale}/unauthorized`)
  }, [locale, router])

  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            handleSessionExpired()
            return
          }
          throw new Error(`Session fetch failed: ${response.status}`)
        }
        
        const sessionData = await response.json()
        
        if (!sessionData.isAuthenticated || !sessionData.user) {
          handleSessionExpired()
          return
        }
        
        const hasPartnerAccess = sessionData.user.role === 'partner' || 
                                 sessionData.user.role === 'admin' ||
                                 sessionData.partnerProfile?.verification_status === 'verified'
        
        if (!hasPartnerAccess) {
          handleUnauthorized()
          return
        }
        
        setSession({
          user: sessionData.user,
          token: sessionData.token
        })
      } catch (err) {
        console.error('[PartnerLayout] Session loading error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load session'
        setError(errorMessage)
        setTimeout(() => handleSessionExpired(), 2000)
      } finally {
        setLoading(false)
      }
    }
    
    loadSession()
  }, [locale, router, handleSessionExpired, handleUnauthorized])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Vérification...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">Erreur d'authentification</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">{error || 'Session invalide'}</p>
          <p className="text-sm text-gray-500">Redirection...</p>
        </div>
      </div>
    )
  }

  return (
    <PartnerSWRProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {brandingT('title')}
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200 backdrop-blur-sm"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="h-6 w-6 text-slate-700 dark:text-slate-300" /> : <Menu className="h-6 w-6 text-slate-700 dark:text-slate-300" />}
            </button>
          </div>
        </header>

        {/* Desktop Header - Fixed at top */}
        <header className="hidden lg:block fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo et Titre */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  {brandingT('title')}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {brandingT('subtitle')}
                </p>
              </div>
            </div>
            
            {/* Actions et Profil */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200 group">
                <MessageSquare className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              
              {/* Avatar et Menu */}
              <div className="flex items-center gap-2 pl-3 border-l border-white/20 dark:border-slate-700/50">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {session.user.full_name || session.user.email?.split('@')[0] || 'Partenaire'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {session.user.role === 'admin' ? 'Administrateur' : 
                     session.user.role === 'manager' ? 'Manager' :
                     session.user.role === 'executive' ? 'Exécutif' :
                     session.user.role === 'superuser' ? 'Superuser' : 'Partenaire'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/50 cursor-pointer hover:scale-105 transition-transform">
                  {(session.user.full_name || session.user.email || 'P').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="lg:flex relative lg:pt-20">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block lg:w-72 lg:fixed lg:top-20 lg:bottom-0 lg:left-0 backdrop-blur-2xl bg-white/70 dark:bg-slate-900/70 border-r border-white/20 dark:border-slate-700/50 shadow-2xl z-30">
            <div className="flex flex-col h-full">
              {/* Navigation with Modern Design */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-2 pt-6">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50 scale-105"
                          : "text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:scale-105 hover:shadow-md"
                      )}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      )}
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-300",
                        isActive 
                          ? "bg-white/20" 
                          : "bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30"
                      )}>
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                          isActive ? "text-white" : "text-blue-600 dark:text-blue-400"
                        )} />
                      </div>
                      <span className={cn(
                        "font-medium transition-all duration-300",
                        isActive ? "text-white" : "group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      )}>
                        {t(item.translationKey)}
                      </span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse"></div>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Footer Accent */}
              <div className="p-4 border-t border-white/20 dark:border-slate-700/50">
                <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 border border-blue-200/50 dark:border-blue-800/50">
                  <p className="text-xs text-slate-600 dark:text-slate-400 text-center font-medium">
                    ✨ Powered by Loft Algérie
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Sidebar - Mobile */}
          {sidebarOpen && (
            <>
              <div 
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                onClick={() => setSidebarOpen(false)}
              />
              <aside className="lg:hidden fixed inset-y-0 left-0 w-72 backdrop-blur-2xl bg-white/90 dark:bg-slate-900/90 z-50 shadow-2xl animate-in slide-in-from-left duration-300">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-white/20 dark:border-slate-700/50 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                          {brandingT('title')}
                        </h1>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {brandingT('subtitle')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {navigationItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                      const Icon = item.icon
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                            isActive
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50"
                              : "text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:scale-105 hover:shadow-md"
                          )}
                        >
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                          )}
                          <div className={cn(
                            "p-2 rounded-lg transition-all duration-300",
                            isActive 
                              ? "bg-white/20" 
                              : "bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30"
                          )}>
                            <Icon className={cn(
                              "h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                              isActive ? "text-white" : "text-blue-600 dark:text-blue-400"
                            )} />
                          </div>
                          <span className={cn(
                            "font-medium transition-all duration-300",
                            isActive ? "text-white" : "group-hover:text-blue-600 dark:group-hover:text-blue-400"
                          )}>
                            {t(item.translationKey)}
                          </span>
                          {isActive && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          )}
                        </Link>
                      )
                    })}
                  </nav>

                  <div className="p-4 border-t border-white/20 dark:border-slate-700/50">
                    <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 border border-blue-200/50 dark:border-blue-800/50">
                      <p className="text-xs text-slate-600 dark:text-slate-400 text-center font-medium">
                        ✨ Powered by Loft Algérie
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </>
          )}

          {/* Main Content */}
          <main className="lg:ml-72 w-full relative lg:pt-0">
            <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </PartnerSWRProvider>
  )
}
