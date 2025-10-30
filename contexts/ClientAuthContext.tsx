"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { clientAuthService } from '@/lib/services/client-auth-service'
import type { ClientUser, ClientAuthSession } from '@/lib/types/client-auth'

interface ClientAuthContextType {
  user: ClientUser | null
  session: ClientAuthSession | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined)

interface ClientAuthProviderProps {
  children: ReactNode
}

export function ClientAuthProvider({ children }: ClientAuthProviderProps) {
  const [user, setUser] = useState<ClientUser | null>(null)
  const [session, setSession] = useState<ClientAuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && !!session

  // Initialize authentication state on mount
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('client_auth_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      const result = await clientAuthService.validateSession(token)
      if (result.success && result.data) {
        setUser(result.data.user)
        setSession(result.data)
      } else {
        // Invalid token, remove it
        localStorage.removeItem('client_auth_token')
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      localStorage.removeItem('client_auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const result = await clientAuthService.login({ email, password })
      
      if (result.success && result.data) {
        setUser(result.data.user)
        setSession(result.data)
        localStorage.setItem('client_auth_token', result.data.token)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('client_auth_token')
      if (token) {
        await clientAuthService.logout(token)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local state
      setUser(null)
      setSession(null)
      localStorage.removeItem('client_auth_token')
    }
  }

  const refreshSession = async () => {
    try {
      const token = localStorage.getItem('client_auth_token')
      if (!token) {
        setUser(null)
        setSession(null)
        return
      }

      const result = await clientAuthService.validateSession(token)
      if (result.success && result.data) {
        setUser(result.data.user)
        setSession(result.data)
      } else {
        // Invalid session, clear everything
        setUser(null)
        setSession(null)
        localStorage.removeItem('client_auth_token')
      }
    } catch (error) {
      console.error('Session refresh error:', error)
      setUser(null)
      setSession(null)
      localStorage.removeItem('client_auth_token')
    }
  }

  const value: ClientAuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshSession
  }

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  )
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext)
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider')
  }
  return context
}

// Hook for checking authentication status without throwing
export function useClientAuthOptional() {
  return useContext(ClientAuthContext)
}