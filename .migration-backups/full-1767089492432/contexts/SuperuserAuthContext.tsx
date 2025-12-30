"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useClientAuth } from './ClientAuthContext'
import type { AuthSession, UserRole } from '@/lib/types'
import type { SuperuserProfile, SuperuserSession, SuperuserPermission } from '@/types/superuser'
import { getSession } from '@/lib/auth'
import { 
  getSuperuserProfile, 
  getSuperuserSession, 
  validateSuperuserSession,
  verifySuperuserPermissions,
  logSuperuserAudit
} from '@/lib/superuser/auth'

interface SuperuserAuthContextType {
  // Base auth properties
  session: AuthSession | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Superuser specific properties
  isSuperuser: boolean
  superuserProfile: SuperuserProfile | null
  superuserSession: SuperuserSession | null
  permissions: SuperuserPermission[]
  
  // Methods
  refreshSession: () => Promise<void>
  checkPermission: (permission: SuperuserPermission) => boolean
  checkPermissions: (permissions: SuperuserPermission[]) => boolean
  requirePermission: (permission: SuperuserPermission) => Promise<boolean>
  requirePermissions: (permissions: SuperuserPermission[]) => Promise<boolean>
  logActivity: (actionType: string, details: Record<string, any>) => Promise<void>
}

const SuperuserAuthContext = createContext<SuperuserAuthContextType | undefined>(undefined)

interface SuperuserAuthProviderProps {
  children: ReactNode
}

export function SuperuserAuthProvider({ children }: SuperuserAuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [superuserProfile, setSuperuserProfile] = useState<SuperuserProfile | null>(null)
  const [superuserSession, setSuperuserSession] = useState<SuperuserSession | null>(null)
  const [permissions, setPermissions] = useState<SuperuserPermission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!session
  const isSuperuser = !!superuserProfile && superuserProfile.is_active

  // Initialize authentication state on mount
  useEffect(() => {
    initializeAuth()
  }, [])

  // Set up session validation interval for superuser sessions
  useEffect(() => {
    if (isSuperuser && superuserSession) {
      const interval = setInterval(async () => {
        const isValid = await validateSuperuserSession()
        if (!isValid) {
          // Session expired, refresh auth state
          await refreshSession()
        }
      }, 5 * 60 * 1000) // Check every 5 minutes

      return () => clearInterval(interval)
    }
  }, [isSuperuser, superuserSession])

  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      
      // Get base session
      const baseSession = await getSession()
      setSession(baseSession)

      if (baseSession && (baseSession.user.role === 'admin' || baseSession.user.role === 'superuser')) {
        // Check for superuser privileges
        const profile = await getSuperuserProfile()
        setSuperuserProfile(profile)

        if (profile) {
          setPermissions(profile.permissions)
          
          // Get superuser session
          const suSession = await getSuperuserSession()
          setSuperuserSession(suSession)
        }
      }
    } catch (error) {
      console.error('Superuser auth initialization error:', error)
      setSession(null)
      setSuperuserProfile(null)
      setSuperuserSession(null)
      setPermissions([])
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      // Refresh base session
      const baseSession = await getSession()
      setSession(baseSession)

      if (baseSession && (baseSession.user.role === 'admin' || baseSession.user.role === 'superuser')) {
        // Refresh superuser data
        const profile = await getSuperuserProfile()
        setSuperuserProfile(profile)

        if (profile) {
          setPermissions(profile.permissions)
          
          const suSession = await getSuperuserSession()
          setSuperuserSession(suSession)
        } else {
          setSuperuserProfile(null)
          setSuperuserSession(null)
          setPermissions([])
        }
      } else {
        setSuperuserProfile(null)
        setSuperuserSession(null)
        setPermissions([])
      }
    } catch (error) {
      console.error('Session refresh error:', error)
      setSession(null)
      setSuperuserProfile(null)
      setSuperuserSession(null)
      setPermissions([])
    }
  }

  const checkPermission = (permission: SuperuserPermission): boolean => {
    return isSuperuser && permissions.includes(permission)
  }

  const checkPermissions = (requiredPermissions: SuperuserPermission[]): boolean => {
    return isSuperuser && requiredPermissions.every(perm => permissions.includes(perm))
  }

  const requirePermission = async (permission: SuperuserPermission): Promise<boolean> => {
    if (!isSuperuser) {
      return false
    }

    const { hasPermission } = await verifySuperuserPermissions([permission])
    return hasPermission
  }

  const requirePermissions = async (requiredPermissions: SuperuserPermission[]): Promise<boolean> => {
    if (!isSuperuser) {
      return false
    }

    const { hasPermission } = await verifySuperuserPermissions(requiredPermissions)
    return hasPermission
  }

  const logActivity = async (actionType: string, details: Record<string, any>): Promise<void> => {
    if (!isSuperuser) {
      return
    }

    try {
      await logSuperuserAudit(
        actionType as any, // Type assertion for flexibility
        details,
        {
          severity: 'MEDIUM'
        }
      )
    } catch (error) {
      console.error('Failed to log superuser activity:', error)
    }
  }

  const value: SuperuserAuthContextType = {
    session,
    isLoading,
    isAuthenticated,
    isSuperuser,
    superuserProfile,
    superuserSession,
    permissions,
    refreshSession,
    checkPermission,
    checkPermissions,
    requirePermission,
    requirePermissions,
    logActivity
  }

  return (
    <SuperuserAuthContext.Provider value={value}>
      {children}
    </SuperuserAuthContext.Provider>
  )
}

export function useSuperuserAuth() {
  const context = useContext(SuperuserAuthContext)
  if (context === undefined) {
    throw new Error('useSuperuserAuth must be used within a SuperuserAuthProvider')
  }
  return context
}

// Hook for checking superuser authentication status without throwing
export function useSuperuserAuthOptional() {
  return useContext(SuperuserAuthContext)
}

// Hook for requiring superuser access - throws if not authorized
export function useRequireSuperuser() {
  const context = useSuperuserAuth()
  
  if (!context.isSuperuser) {
    throw new Error('Superuser access required')
  }
  
  return context
}

// Hook for requiring specific permissions - throws if not authorized
export function useRequirePermissions(requiredPermissions: SuperuserPermission[]) {
  const context = useSuperuserAuth()
  
  if (!context.isSuperuser || !context.checkPermissions(requiredPermissions)) {
    throw new Error(`Required permissions not met: ${requiredPermissions.join(', ')}`)
  }
  
  return context
}

// Utility hook for conditional superuser features
export function useConditionalSuperuser() {
  const context = useSuperuserAuthOptional()
  
  return {
    isSuperuser: context?.isSuperuser || false,
    hasPermission: (permission: SuperuserPermission) => 
      context?.checkPermission(permission) || false,
    hasPermissions: (permissions: SuperuserPermission[]) => 
      context?.checkPermissions(permissions) || false,
    logActivity: context?.logActivity || (async () => {}),
    permissions: context?.permissions || []
  }
}