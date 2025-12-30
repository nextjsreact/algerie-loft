'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Clock,
  Download,
  RefreshCw,
  Eye,
  Ban
} from 'lucide-react'

/**
 * Comprehensive audit and monitoring dashboard for reservation flow
 * Requirements: 10.1, 10.2, 10.4
 */

interface AuditDashboardProps {
  className?: string
}

interface DashboardMetrics {
  reservation_metrics: {
    total_reservations: number
    successful_reservations: number
    failed_reservations: number
    conversion_rate: number
    error_rate: number
    security_incidents: number
  }
  security_metrics: {
    total_threats: number
    blocked_requests: number
    top_threat_sources: Array<{ ip: string; count: number }>
    threats_by_severity: Record<string, number>
  }
  error_analytics: {
    total_errors: number
    errors_by_type: Record<string, number>
    errors_by_step: Record<string, number>
    top_error_patterns: Array<{
      pattern_id: string
      error_type: string
      step: string
      frequency: number
    }>
  }
  system_health: {
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
  }
}

interface AuditEvent {
  id: string
  reservation_id: string
  action: string
  user_id?: string
  user_type: string
  timestamp: string
  notes?: string
  severity?: string
}

interface SecurityThreat {
  threat_id: string
  threat_type: string
  severity: string
  ip_address?: string
  detection_time: string
  risk_score: number
  blocked: boolean
  indicators: string[]
}

export function ReservationAuditDashboard({ className }: AuditDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [securityThreats, setSecurityThreats] = useState<SecurityThreat[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, these would be API calls
      const mockMetrics: DashboardMetrics = {
        reservation_metrics: {
          total_reservations: 156,
          successful_reservations: 142,
          failed_reservations: 14,
          conversion_rate: 91.0,
          error_rate: 2.3,
          security_incidents: 3
        },
        security_metrics: {
          total_threats: 12,
          blocked_requests: 45,
          top_threat_sources: [
            { ip: '192.168.1.100', count: 15 },
            { ip: '10.0.0.50', count: 8 },
            { ip: '172.16.0.25', count: 5 }
          ],
          threats_by_severity: {
            low: 5,
            medium: 4,
            high: 2,
            critical: 1
          }
        },
        error_analytics: {
          total_errors: 28,
          errors_by_type: {
            validation_error: 12,
            payment_error: 8,
            availability_error: 5,
            system_error: 3
          },
          errors_by_step: {
            guest_info_entry: 10,
            payment_processing: 8,
            availability_check: 6,
            reservation_creation: 4
          },
          top_error_patterns: [
            {
              pattern_id: 'val_guest_info',
              error_type: 'validation_error',
              step: 'guest_info_entry',
              frequency: 12
            },
            {
              pattern_id: 'pay_failed',
              error_type: 'payment_error',
              step: 'payment_processing',
              frequency: 8
            }
          ]
        },
        system_health: {
          status: 'healthy',
          issues: []
        }
      }

      const mockAuditEvents: AuditEvent[] = [
        {
          id: '1',
          reservation_id: 'res_123',
          action: 'reservation_created',
          user_id: 'user_456',
          user_type: 'customer',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          notes: 'New reservation created successfully'
        },
        {
          id: '2',
          reservation_id: 'res_124',
          action: 'payment_failed',
          user_id: 'user_789',
          user_type: 'customer',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          notes: 'Payment processing failed',
          severity: 'high'
        },
        {
          id: '3',
          reservation_id: 'res_125',
          action: 'security_event',
          user_type: 'system',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          notes: 'Suspicious activity detected',
          severity: 'medium'
        }
      ]

      const mockSecurityThreats: SecurityThreat[] = [
        {
          threat_id: 'threat_1',
          threat_type: 'brute_force_attack',
          severity: 'high',
          ip_address: '192.168.1.100',
          detection_time: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          risk_score: 85,
          blocked: true,
          indicators: ['excessive_auth_attempts', 'failed_logins']
        },
        {
          threat_id: 'threat_2',
          threat_type: 'payment_fraud',
          severity: 'critical',
          ip_address: '10.0.0.50',
          detection_time: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          risk_score: 95,
          blocked: true,
          indicators: ['multiple_payment_methods', 'suspicious_amount']
        }
      ]

      setMetrics(mockMetrics)
      setAuditEvents(mockAuditEvents)
      setSecurityThreats(mockSecurityThreats)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh functionality
  useEffect(() => {
    loadDashboardData()
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [timeRange, autoRefresh])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const exportAuditLogs = async (format: 'json' | 'csv') => {
    try {
      // In a real implementation, this would call the export API
      const data = format === 'json' 
        ? JSON.stringify(auditEvents, null, 2)
        : convertToCSV(auditEvents)
      
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${timeRange}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting audit logs:', error)
    }
  }

  const convertToCSV = (data: AuditEvent[]): string => {
    const headers = ['ID', 'Reservation ID', 'Action', 'User ID', 'User Type', 'Timestamp', 'Notes']
    const rows = data.map(event => [
      event.id,
      event.reservation_id,
      event.action,
      event.user_id || '',
      event.user_type,
      event.timestamp,
      event.notes || ''
    ])
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load dashboard data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservation Audit Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor reservation flow security, errors, and performance
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {metrics.system_health.status !== 'healthy' && (
        <Alert variant={metrics.system_health.status === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Health Alert</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              {metrics.system_health.issues.map((issue, index) => (
                <div key={index}>• {issue}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.reservation_metrics.total_reservations}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.reservation_metrics.successful_reservations} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.reservation_metrics.conversion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.reservation_metrics.failed_reservations} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Threats</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.security_metrics.total_threats}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.security_metrics.blocked_requests} requests blocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.reservation_metrics.error_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.error_analytics.total_errors} total errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Audit Events</CardTitle>
                  <CardDescription>
                    Latest reservation flow activities and system events
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportAuditLogs('csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportAuditLogs('json')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{event.action}</Badge>
                          {event.severity && (
                            <Badge variant={getSeverityColor(event.severity) as any}>
                              {event.severity}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {event.notes}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {event.user_type} {event.user_id && `(${event.user_id})`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Security Threats</CardTitle>
                <CardDescription>Recent security incidents and threats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityThreats.map((threat) => (
                    <div key={threat.threat_id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getSeverityColor(threat.severity) as any}>
                            {threat.severity}
                          </Badge>
                          <span className="font-medium">{threat.threat_type}</span>
                          {threat.blocked && <Ban className="h-4 w-4 text-red-500" />}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Risk Score: {threat.risk_score}/100
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {threat.indicators.join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{threat.ip_address}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(threat.detection_time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Sources</CardTitle>
                <CardDescription>Top IP addresses generating threats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.security_metrics.top_threat_sources.map((source, index) => (
                    <div key={source.ip} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-mono text-sm">{source.ip}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{source.count} threats</span>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Error Analysis Tab */}
        <TabsContent value="errors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Errors by Type</CardTitle>
                <CardDescription>Distribution of error types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.error_analytics.errors_by_type).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{type.replace('_', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Errors by Step</CardTitle>
                <CardDescription>Where errors occur in the flow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.error_analytics.errors_by_step).map(([step, count]) => (
                    <div key={step} className="flex items-center justify-between">
                      <span className="text-sm">{step.replace('_', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Error Patterns</CardTitle>
              <CardDescription>Most frequent error patterns requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.error_analytics.top_error_patterns.map((pattern) => (
                  <div key={pattern.pattern_id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{pattern.error_type.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        Step: {pattern.step.replace('_', ' ')}
                      </div>
                    </div>
                    <Badge variant="destructive">{pattern.frequency} occurrences</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>Key performance indicators and system health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">91.0%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">245ms</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">1,234</div>
                  <div className="text-sm text-muted-foreground">Requests/min</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}