"use client"

import React, { ReactNode } from 'react'
import { ClientAuthProvider } from '@/contexts/ClientAuthContext'
import { SuperuserAuthProvider } from '@/contexts/SuperuserAuthContext'

interface EnhancedAuthProviderProps {
  children: ReactNode
}

/**
 * Combined authentication provider that supports both client and superuser auth
 */
export function EnhancedAuthProvider({ children }: EnhancedAuthProviderProps) {
  return (
    <ClientAuthProvider>
      <SuperuserAuthProvider>
        {children}
      </SuperuserAuthProvider>
    </ClientAuthProvider>
  )
}

/**
 * Hook to use both auth contexts together
 */
export function useEnhancedAuth() {
  // This would be implemented to combine both contexts
  // For now, users should use the specific hooks they need
  return {
    // Placeholder - implement if needed for specific use cases
  }
}