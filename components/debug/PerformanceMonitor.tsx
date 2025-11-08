'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Zap, 
  Database, 
  Image as ImageIcon, 
  Wifi,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  fcp: number | null // First Contentful Paint
  ttfb: number | null // Time to First Byte

  // Métriques personnalisées
  memoryUsage: number
  cacheHitRate: number
  apiResponseTime: number
  imageLoadTime: number
  jsLoadTime: number
  cssLoadTime: number

  // Métriques réseau
  connectionType: string
  effectiveType: string
  rtt: number
  downlink: number
}

interface PerformanceAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  metric: string
  value: number
  threshold: number
  message: string
  timestamp: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    memoryUsage: 0,
    cacheHitRate: 0,
    apiResponseTime: 0,
    imageLoadTime: 0,
    jsLoadTime: 0,
    cssLoadTime: 0,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    rtt: 0,
    downlink: 0
  })

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Seuils de performance
  const thresholds = {
    lcp: 2500, // 2.5s
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1
    fcp: 1800, // 1.8s
    ttfb: 600, // 600ms
    memoryUsage: 50, // 50MB
    apiResponseTime: 1000, // 1s
    cacheHitRate: 80 // 80%
  }

  // Collecter les métriques Core Web Vitals
  const collectWebVitals = useCallback(() => {
    if (typeof window === 'undefined') return

    // Observer pour LCP
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry) {
            setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }))
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // Observer pour FID
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }))
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        // Observer pour CLS
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          setMetrics(prev => ({ ...prev, cls: clsValue }))
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })

        // Navigation Timing pour FCP et TTFB
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0]
          setMetrics(prev => ({
            ...prev,
            ttfb: nav.responseStart - nav.requestStart,
            fcp: nav.loadEventEnd - nav.navigationStart
          }))
        }
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error)
      }
    }
  }, [])

  // Collecter les métriques de mémoire
  const collectMemoryMetrics = useCallback(() => {
    if (typeof window === 'undefined') return

    if ('memory' in performance) {
      const memory = (performance as any).memory
      const memoryUsage = memory.usedJSHeapSize / (1024 * 1024) // MB
      setMetrics(prev => ({ ...prev, memoryUsage }))
    }
  }, [])

  // Collecter les métriques réseau
  const collectNetworkMetrics = useCallback(() => {
    if (typeof window === 'undefined') return

    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setMetrics(prev => ({
        ...prev,
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        rtt: connection.rtt || 0,
        downlink: connection.downlink || 0
      }))
    }
  }, [])

  // Surveiller les temps de réponse API
  const monitorApiResponses = useCallback(() => {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        setMetrics(prev => ({
          ...prev,
          apiResponseTime: (prev.apiResponseTime + responseTime) / 2 // Moyenne mobile
        }))

        return response
      } catch (error) {
        const endTime = performance.now()
        const responseTime = endTime - startTime
        setMetrics(prev => ({
          ...prev,
          apiResponseTime: Math.max(prev.apiResponseTime, responseTime)
        }))
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // Vérifier les seuils et créer des alertes
  const checkThresholds = useCallback(() => {
    const newAlerts: PerformanceAlert[] = []

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const value = metrics[metric as keyof PerformanceMetrics] as number
      if (value && value > threshold) {
        newAlerts.push({
          id: `${metric}-${Date.now()}`,
          type: value > threshold * 1.5 ? 'error' : 'warning',
          metric,
          value,
          threshold,
          message: `${metric.toUpperCase()} dépasse le seuil (${value.toFixed(2)} > ${threshold})`,
          timestamp: Date.now()
        })
      }
    })

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev.slice(-10), ...newAlerts]) // Garder les 10 dernières alertes
    }
  }, [metrics])

  // Démarrer/arrêter le monitoring
  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev)
  }, [])

  // Effets pour collecter les métriques
  useEffect(() => {
    if (!isMonitoring) return

    collectWebVitals()
    collectNetworkMetrics()
    
    const cleanup = monitorApiResponses()

    const interval = setInterval(() => {
      collectMemoryMetrics()
      collectNetworkMetrics()
      checkThresholds()
    }, 2000)

    return () => {
      clearInterval(interval)
      cleanup?.()
    }
  }, [isMonitoring, collectWebVitals, collectMemoryMetrics, collectNetworkMetrics, monitorApiResponses, checkThresholds])

  // Formater les valeurs
  const formatValue = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A'
    if (unit === 'ms') return `${Math.round(value)}ms`
    if (unit === 'MB') return `${value.toFixed(1)}MB`
    if (unit === '%') return `${Math.round(value)}%`
    return value.toString()
  }

  // Obtenir la couleur selon la performance
  const getPerformanceColor = (value: number | null, threshold: number) => {
    if (value === null) return 'gray'
    if (value <= threshold) return 'green'
    if (value <= threshold * 1.5) return 'yellow'
    return 'red'
  }

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
        size="sm"
        variant="outline"
      >
        <Activity className="h-4 w-4 mr-2" />
        Performance
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-auto">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleMonitoring}
                size="sm"
                variant={isMonitoring ? "destructive" : "default"}
              >
                {isMonitoring ? 'Stop' : 'Start'}
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="ghost"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Core Web Vitals */}
          <div>
            <h4 className="text-sm font-medium mb-2">Core Web Vitals</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>LCP:</span>
                <Badge variant={getPerformanceColor(metrics.lcp, thresholds.lcp) as any}>
                  {formatValue(metrics.lcp)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>FID:</span>
                <Badge variant={getPerformanceColor(metrics.fid, thresholds.fid) as any}>
                  {formatValue(metrics.fid)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>CLS:</span>
                <Badge variant={getPerformanceColor(metrics.cls, thresholds.cls) as any}>
                  {metrics.cls?.toFixed(3) || 'N/A'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>TTFB:</span>
                <Badge variant={getPerformanceColor(metrics.ttfb, thresholds.ttfb) as any}>
                  {formatValue(metrics.ttfb)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Métriques système */}
          <div>
            <h4 className="text-sm font-medium mb-2">Système</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Database className="h-3 w-3 mr-1" />
                  Mémoire:
                </span>
                <span>{formatValue(metrics.memoryUsage, 'MB')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Zap className="h-3 w-3 mr-1" />
                  API:
                </span>
                <span>{formatValue(metrics.apiResponseTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Wifi className="h-3 w-3 mr-1" />
                  Réseau:
                </span>
                <span>{metrics.effectiveType}</span>
              </div>
            </div>
          </div>

          {/* Alertes récentes */}
          {alerts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Alertes</h4>
              <div className="space-y-1 max-h-32 overflow-auto">
                {alerts.slice(-3).map((alert) => (
                  <div
                    key={alert.id}
                    className={`text-xs p-2 rounded flex items-start gap-2 ${
                      alert.type === 'error' 
                        ? 'bg-red-50 text-red-700' 
                        : alert.type === 'warning'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {alert.type === 'error' ? (
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions rapides */}
          <div className="flex gap-2">
            <Button
              onClick={() => window.location.reload()}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Reload
            </Button>
            <Button
              onClick={() => {
                if ('caches' in window) {
                  caches.keys().then(names => {
                    names.forEach(name => caches.delete(name))
                  })
                }
                localStorage.clear()
              }}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceMonitor