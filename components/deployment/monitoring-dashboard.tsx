/**
 * Deployment Monitoring Dashboard Component
 * 
 * Provides a real-time dashboard for monitoring deployment status,
 * feature flags, and rollback capabilities.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { Progress } from '../ui/progress'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Flag, 
  RotateCcw, 
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'

interface MonitoringData {
  timestamp: string
  monitoring: {
    isActive: boolean
    metricsCount: number
    alertsCount: number
    healthChecksCount: number
  }
  performance: {
    averageResponseTime: number
    errorRate: number
    requestCount: number
    slowRequestCount: number
    webVitals: {
      averageLCP: number
      averageFID: number
      averageCLS: number
    }
  }
  rollout: {
    totalFlags: number
    enabledFlags: number
    activeRollouts: number
    averageRolloutPercentage: number
  }
  rollback: {
    stats: {
      totalEvents: number
      successfulRollbacks: number
      failedRollbacks: number
      averageExecutionTime: number
      lastRollback?: string
    }
    recentEvents: Array<{
      id: string
      triggerId: string
      timestamp: string
      reason: string
      status: string
    }>
  }
  featureFlags: Array<{
    id: string
    name: string
    enabled: boolean
    rolloutPercentage: number
    updatedAt: string
  }>
}

export function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch monitoring data
  const fetchData = async () => {
    try {
      const response = await fetch('/api/deployment/monitoring')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const newData = await response.json()
      setData(newData)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh data
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Trigger manual rollback
  const triggerRollback = async () => {
    if (!confirm('Are you sure you want to trigger an emergency rollback? This will disable all features.')) {
      return
    }

    try {
      const response = await fetch('/api/deployment/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Manual emergency rollback from dashboard',
          triggeredBy: 'dashboard-user'
        })
      })

      if (response.ok) {
        alert('Emergency rollback triggered successfully')
        fetchData() // Refresh data
      } else {
        throw new Error('Failed to trigger rollback')
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Update feature flag rollout
  const updateRollout = async (flagId: string, percentage: number) => {
    try {
      const response = await fetch('/api/deployment/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagId,
          percentage,
          updatedBy: 'dashboard-user'
        })
      })

      if (response.ok) {
        fetchData() // Refresh data
      } else {
        throw new Error('Failed to update rollout')
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading monitoring dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load monitoring data: {error}
          <Button onClick={fetchData} className="ml-2" size="sm">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No monitoring data available</AlertDescription>
      </Alert>
    )
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getWebVitalStatus = (lcp: number, fid: number, cls: number) => {
    const lcpGood = lcp <= 2500
    const fidGood = fid <= 100
    const clsGood = cls <= 0.1
    
    if (lcpGood && fidGood && clsGood) return { status: 'Good', color: 'text-green-600' }
    if (!lcpGood || !fidGood || !clsGood) return { status: 'Needs Improvement', color: 'text-yellow-600' }
    return { status: 'Poor', color: 'text-red-600' }
  }

  const webVitalStatus = getWebVitalStatus(
    data.performance.webVitals.averageLCP,
    data.performance.webVitals.averageFID,
    data.performance.webVitals.averageCLS
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deployment Monitoring Dashboard</h1>
          <p className="text-gray-600">
            Real-time monitoring for dual-audience homepage deployment
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={triggerRollback} variant="destructive" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Emergency Rollback
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitoring Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {data.monitoring.isActive ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className={data.monitoring.isActive ? 'text-green-600' : 'text-red-600'}>
                {data.monitoring.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.monitoring.metricsCount} metrics collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getStatusColor(data.performance.averageResponseTime, { good: 1000, warning: 2000 })}>
                {Math.round(data.performance.averageResponseTime)}ms
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.performance.requestCount} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getStatusColor(data.performance.errorRate, { good: 1, warning: 5 })}>
                {data.performance.errorRate.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.performance.slowRequestCount} slow requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Web Vitals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              <span className={webVitalStatus.color}>
                {webVitalStatus.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              LCP: {Math.round(data.performance.webVitals.averageLCP)}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Feature Flags Status
          </CardTitle>
          <CardDescription>
            Current rollout status for dual-audience homepage features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.featureFlags.map((flag) => (
              <div key={flag.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{flag.name}</h4>
                    <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{flag.rolloutPercentage}%</div>
                    <div className="text-xs text-gray-500">rollout</div>
                  </div>
                </div>
                <Progress value={flag.rolloutPercentage} className="mb-2" />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateRollout(flag.id, Math.min(100, flag.rolloutPercentage + 25))}
                    disabled={flag.rolloutPercentage >= 100}
                  >
                    +25%
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateRollout(flag.id, Math.max(0, flag.rolloutPercentage - 25))}
                    disabled={flag.rolloutPercentage <= 0}
                  >
                    -25%
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateRollout(flag.id, 0)}
                    disabled={flag.rolloutPercentage === 0}
                  >
                    Disable
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rollback History */}
      {data.rollback.recentEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Recent Rollback Events
            </CardTitle>
            <CardDescription>
              Recent rollback events and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.rollback.recentEvents.map((event) => (
                <div key={event.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">{event.reason}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={event.status === 'completed' ? 'default' : 'destructive'}>
                    {event.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rollout Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Flags:</span>
                <span className="font-medium">{data.rollout.totalFlags}</span>
              </div>
              <div className="flex justify-between">
                <span>Enabled:</span>
                <span className="font-medium">{data.rollout.enabledFlags}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Rollouts:</span>
                <span className="font-medium">{data.rollout.activeRollouts}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. Rollout:</span>
                <span className="font-medium">{Math.round(data.rollout.averageRolloutPercentage)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rollback Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Events:</span>
                <span className="font-medium">{data.rollback.stats.totalEvents}</span>
              </div>
              <div className="flex justify-between">
                <span>Successful:</span>
                <span className="font-medium text-green-600">{data.rollback.stats.successfulRollbacks}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed:</span>
                <span className="font-medium text-red-600">{data.rollback.stats.failedRollbacks}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. Time:</span>
                <span className="font-medium">{Math.round(data.rollback.stats.averageExecutionTime)}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>LCP:</span>
                <span className="font-medium">{Math.round(data.performance.webVitals.averageLCP)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>FID:</span>
                <span className="font-medium">{Math.round(data.performance.webVitals.averageFID)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>CLS:</span>
                <span className="font-medium">{data.performance.webVitals.averageCLS.toFixed(3)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}