'use client'

import React from 'react'
import { useABTest } from './ab-test-provider'

interface ABTestWrapperProps {
  testId: string
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function ABTestWrapper({ testId, children, fallback, className }: ABTestWrapperProps) {
  const { variant, isInitialized } = useABTest(testId)

  // Show fallback while loading or if no variant assigned
  if (!isInitialized || !variant) {
    return fallback ? <>{fallback}</> : <>{children}</>
  }

  return (
    <div className={className} data-ab-test={testId} data-ab-variant={variant.id}>
      {children}
    </div>
  )
}

interface ABTestVariantProps {
  testId: string
  variantId: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ABTestVariant({ testId, variantId, children, fallback }: ABTestVariantProps) {
  const { isInVariant, isInitialized } = useABTest(testId)

  if (!isInitialized) {
    return fallback ? <>{fallback}</> : null
  }

  if (!isInVariant(variantId)) {
    return null
  }

  return <>{children}</>
}

interface ConditionalRenderProps {
  testId: string
  variantId: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ConditionalRender({ testId, variantId, children, fallback }: ConditionalRenderProps) {
  const { isInVariant, isInitialized } = useABTest(testId)

  if (!isInitialized) {
    return fallback ? <>{fallback}</> : <>{children}</>
  }

  return isInVariant(variantId) ? <>{children}</> : (fallback ? <>{fallback}</> : null)
}

// Hero section A/B test component
interface ABTestHeroProps {
  children: React.ReactNode
  guestFirstVariant: React.ReactNode
  currentVariant: React.ReactNode
}

export function ABTestHero({ children, guestFirstVariant, currentVariant }: ABTestHeroProps) {
  const { config, isInitialized, trackConversion } = useABTest('homepage_hero_layout')

  // Track hero view
  React.useEffect(() => {
    if (isInitialized) {
      trackConversion('hero_view', 1)
    }
  }, [isInitialized, trackConversion])

  if (!isInitialized) {
    return <>{currentVariant}</>
  }

  switch (config.layout) {
    case 'guest_first':
      return <>{guestFirstVariant}</>
    case 'current':
    default:
      return <>{currentVariant}</>
  }
}

// CTA button A/B test component
interface ABTestCTAProps {
  onClick?: () => void
  className?: string
  children?: React.ReactNode
}

export function ABTestCTA({ onClick, className, children }: ABTestCTAProps) {
  const { config, isInitialized, trackConversion } = useABTest('cta_button_text')

  const handleClick = () => {
    if (isInitialized) {
      trackConversion('cta_click', 1)
    }
    onClick?.()
  }

  const ctaText = config.ctaText || 'Réserver maintenant'

  return (
    <button 
      onClick={handleClick}
      className={className}
      data-ab-test="cta_button_text"
      data-ab-variant={config.ctaText}
    >
      {children || ctaText}
    </button>
  )
}

// Owner section position A/B test component
interface ABTestOwnerSectionProps {
  children: React.ReactNode
  afterTrustPosition: React.ReactNode
  afterLoftsPosition: React.ReactNode
}

export function ABTestOwnerSection({ children, afterTrustPosition, afterLoftsPosition }: ABTestOwnerSectionProps) {
  const { config, isInitialized, trackConversion } = useABTest('owner_section_position')

  // Track owner section view
  React.useEffect(() => {
    if (isInitialized) {
      trackConversion('owner_section_view', 1)
    }
  }, [isInitialized, trackConversion])

  if (!isInitialized) {
    return <>{afterTrustPosition}</>
  }

  switch (config.ownerSectionPosition) {
    case 'after_lofts':
      return <>{afterLoftsPosition}</>
    case 'after_trust':
    default:
      return <>{afterTrustPosition}</>
  }
}

// Performance monitoring wrapper
interface ABTestPerformanceProps {
  testId: string
  children: React.ReactNode
}

export function ABTestPerformance({ testId, children }: ABTestPerformanceProps) {
  const { variant, trackConversion } = useABTest(testId)
  const [startTime] = React.useState(Date.now())

  React.useEffect(() => {
    // Track render time
    const renderTime = Date.now() - startTime
    if (variant) {
      trackConversion('render_time', renderTime, { 
        variant_id: variant.id,
        component: 'performance_wrapper'
      })
    }
  }, [variant, startTime, trackConversion])

  React.useEffect(() => {
    // Track component mount
    if (variant) {
      trackConversion('component_mount', 1, { 
        variant_id: variant.id,
        timestamp: Date.now()
      })
    }

    // Track component unmount
    return () => {
      if (variant) {
        trackConversion('component_unmount', 1, { 
          variant_id: variant.id,
          timestamp: Date.now()
        })
      }
    }
  }, [variant, trackConversion])

  return <>{children}</>
}