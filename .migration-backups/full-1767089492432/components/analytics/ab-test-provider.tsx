'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ABTestingFramework, ABVariant, ABTestAssignment } from '@/lib/analytics/ab-testing'

interface ABTestContextType {
  framework: ABTestingFramework | null
  isInitialized: boolean
  getVariant: (testId: string) => ABVariant | null
  getVariantConfig: (testId: string) => Record<string, any>
  isInVariant: (testId: string, variantId: string) => boolean
  trackConversion: (testId: string, metric: string, value?: number, metadata?: Record<string, any>) => void
}

const ABTestContext = createContext<ABTestContextType>({
  framework: null,
  isInitialized: false,
  getVariant: () => null,
  getVariantConfig: () => ({}),
  isInVariant: () => false,
  trackConversion: () => {},
})

interface ABTestProviderProps {
  children: React.ReactNode
  userId?: string
  sessionId?: string
}

export function ABTestProvider({ children, userId, sessionId }: ABTestProviderProps) {
  const [framework, setFramework] = useState<ABTestingFramework | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initFramework = async () => {
      if (typeof window === 'undefined') return

      const abFramework = ABTestingFramework.getInstance()
      await abFramework.init(userId, sessionId)
      
      setFramework(abFramework)
      setIsInitialized(true)
    }

    initFramework()
  }, [userId, sessionId])

  const contextValue: ABTestContextType = {
    framework,
    isInitialized,
    getVariant: (testId: string) => framework?.getVariant(testId) || null,
    getVariantConfig: (testId: string) => framework?.getVariantConfig(testId) || {},
    isInVariant: (testId: string, variantId: string) => framework?.isInVariant(testId, variantId) || false,
    trackConversion: (testId: string, metric: string, value?: number, metadata?: Record<string, any>) => {
      framework?.trackConversion(testId, metric, value, metadata)
    },
  }

  return (
    <ABTestContext.Provider value={contextValue}>
      {children}
    </ABTestContext.Provider>
  )
}

export function useABTest(testId: string) {
  const context = useContext(ABTestContext)
  
  if (!context) {
    throw new Error('useABTest must be used within an ABTestProvider')
  }

  const { framework, isInitialized } = context
  const variant = framework?.getVariant(testId) || null
  const config = framework?.getVariantConfig(testId) || {}

  return {
    variant,
    config,
    isInitialized,
    isInVariant: (variantId: string) => framework?.isInVariant(testId, variantId) || false,
    trackConversion: (metric: string, value?: number, metadata?: Record<string, any>) => 
      framework?.trackConversion(testId, metric, value, metadata),
  }
}

export function useABTestContext() {
  const context = useContext(ABTestContext)
  
  if (!context) {
    throw new Error('useABTestContext must be used within an ABTestProvider')
  }

  return context
}