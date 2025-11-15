"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PartnerSidebar } from './partner-sidebar'
import { PartnerSWRProvider } from './swr-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import type { AuthSession } from '@/lib/types'

interface PartnerLayoutProps {
  children: React.ReactNode
  locale: string
  showSidebar?: boolean
}

export function PartnerLayout({ 
  children, 
  locale,
  showSidebar = true 
}: PartnerLayoutProps) {
  const router = useRouter()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle session expiration gracefully
  const handleSessionExpired = useCallback(() => {
    console.log('[PartnerLayout] Session expired, redirecting to login')
    // Clear any local state
    setSession(null)
    // Redirect to login with return URL
    router.push(`/${locale}/login?redirect=${encodeURIComponent(window.location.pathname)}`)
  }, [locale, router])

  // Handle unauthorized access
  const handleUnauthorized = useCallback(() => {
    console.log('[PartnerLayout] User not authorized as partner')
    router.push(`/${locale}/unauthorized`)
  }, [locale, router])

  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch session from API endpoint
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            // Unauthorized - session expired or invalid
            handleSessionExpired()
            return
          }
          throw new Error(`Session fetch failed: ${response.status}`)
        }
        
        const sessionData = await response.json()
        
        // Check if user is authenticated
        if (!sessionData.isAuthenticated || !sessionData.user) {
          handleSessionExpired()
          return
        }
        
        // Verify user has partner role
        if (sessionData.user.role !== 'partner') {
          handleUnauthorized()
          return
        }
        
        // Session is valid and user is authorized
        setSession({
          user: sessionData.user,
          token: sessionData.token
        })
        
        console.log('[PartnerLayout] Session loaded successfully for partner:', sessionData.user.email)
      } catch (err) {
        console.error('[PartnerLayout] Session loading error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load session'
        setError(errorMessage)
        
        // On error, redirect to login after a short delay
        setTimeout(() => {
          handleSessionExpired()
        }, 2000)
      } finally {
        setLoading(false)
      }
    }
    
    loadSession()
    
    // Set up periodic session check (every 5 minutes)
    const sessionCheckInterval = setInterval(() => {
      loadSession()
    }, 5 * 60 * 1000)
    
    return () => {
      clearInterval(sessionCheckInterval)
    }
  }, [locale, router, handleSessionExpired, handleUnauthorized])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Show error state if session loading failed
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">Authentication Error</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Don't render if no session (will redirect)
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <PartnerSWRProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          {showSidebar && (
            <PartnerSidebar 
              locale={locale}
              userProfile={{
                name: session.user.full_name || session.user.email || 'Partner',
                email: session.user.email || '',
              }}
            />
          )}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </PartnerSWRProvider>
  )
}
