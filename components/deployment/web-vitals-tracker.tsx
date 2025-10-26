/**
 * Web Vitals Tracker Component
 * 
 * Automatically tracks and reports Core Web Vitals to the monitoring system.
 */

'use client'

import { useEffect } from 'react'
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

interface WebVitalsMetric {
  name: string
  value: number
  id: string
  delta: number
}

export function WebVitalsTracker() {
  useEffect(() => {
    // Track Core Web Vitals
    const sendToAnalytics = (metric: WebVitalsMetric) => {
      // Send to our monitoring API
      fetch('/api/deployment/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [metric.name.toLowerCase()]: metric.value,
          id: metric.id,
          delta: metric.delta
        }),
      }).catch(error => {
        console.warn('Failed to send Web Vitals metric:', error)
      })

      // Also send to Vercel Analytics if available
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va('event', {
          name: 'web-vital',
          data: {
            metric: metric.name,
            value: metric.value,
            id: metric.id
          }
        })
      }

      // Log for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Web Vital - ${metric.name}:`, {
          value: metric.value,
          id: metric.id,
          delta: metric.delta
        })
      }
    }

    // Register Web Vitals observers
    getCLS(sendToAnalytics)
    getFID(sendToAnalytics)
    getFCP(sendToAnalytics)
    getLCP(sendToAnalytics)
    getTTFB(sendToAnalytics)

    // Track custom performance metrics
    const trackCustomMetrics = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          // Track additional timing metrics
          const metrics = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstByte: navigation.responseStart - navigation.requestStart,
            domInteractive: navigation.domInteractive - navigation.navigationStart,
            domComplete: navigation.domComplete - navigation.navigationStart
          }

          // Send custom metrics
          fetch('/api/deployment/web-vitals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(metrics),
          }).catch(error => {
            console.warn('Failed to send custom metrics:', error)
          })
        }
      }
    }

    // Track custom metrics after page load
    if (document.readyState === 'complete') {
      trackCustomMetrics()
    } else {
      window.addEventListener('load', trackCustomMetrics)
    }

    // Cleanup
    return () => {
      window.removeEventListener('load', trackCustomMetrics)
    }
  }, [])

  // This component doesn't render anything
  return null
}

/**
 * Hook for tracking custom performance events
 */
export function usePerformanceTracking() {
  const trackEvent = (eventName: string, duration: number, metadata?: Record<string, any>) => {
    fetch('/api/deployment/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customEvent: eventName,
        duration,
        metadata,
        timestamp: Date.now()
      }),
    }).catch(error => {
      console.warn('Failed to track performance event:', error)
    })
  }

  const trackUserInteraction = (interaction: string, element?: string) => {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      trackEvent(`user_interaction_${interaction}`, duration, { element })
    }
  }

  const trackAsyncOperation = async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await operation()
      const duration = performance.now() - startTime
      trackEvent(`async_operation_${operationName}`, duration, { success: true })
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      trackEvent(`async_operation_${operationName}`, duration, { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  return {
    trackEvent,
    trackUserInteraction,
    trackAsyncOperation
  }
}