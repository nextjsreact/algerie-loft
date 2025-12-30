'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  Database, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Archive,
  Trash2,
  Eye,
  Download
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger'

interface AuditIntegrityResult {
  totalLogs: number
  validLogs: number
  invalidLogs: number
  integrityPercentage: number
}

interface AuditAccessLog {
  id: string
  accessedByUserId: string
  accessedByEmail: string
  accessType: 'VIEW' | 'EXPORT' | 'SEARCH' | 'FILTER'
  tableName?: string
  recordId?: string
  recordsAccessed: number
  accessTimestamp: string
}

interface RetentionStatus {
  tableName: string
  totalLogs: number
  logsToArchive: number
  logsToDelete: number
  oldestLogDate?: string
  newestLogDate?: string
}

interface SuspiciousAccess {
  userId: string
  userEmail: string
  suspiciousActivity: string
  accessCount: number
  firstAccess: string
  lastAccess: string
}

export function AuditSecurityDashboard() {
  const [integrityResult, setIntegrityResult] = useState<AuditIntegrityResult | null>(null)
  const [accessLogs, setAccessLogs] = useState<AuditAccessLog[]>([])
  const [retentionStatus, setRetentionStatus] = useState<RetentionStatus[]>([])
  const [suspiciousAccess, setSuspiciousAccess] = useState<SuspiciousAccess[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('integrity')
  const { toast } = useToast()

  useEffect(() => {
    if (activeTab === 'integrity') {
      fetchIntegrityStatus()
    } else if (activeTab === 'access-logs') {
      fetchAccessLogs()
    } else if (activeTab === 'retention') {
      fetchRetentionStatus()
    } else if (activeTab === 'security') {
      fetchSuspiciousAccess()
    }
  }, [activeTab])

  const fetchIntegrityStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/audit/security?action=integrity')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch integrity status')
      }

      setIntegrityResult(result.data)
    } catch (error) {
      logger.error('Failed to fetch integrity status', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch audit integrity status',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAccessLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/audit/security?action=access-logs&limit=100')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch access logs')
      }

      setAccessLogs(result.data.logs)
    } catch (error) {
      logger.error('Failed to fetch access logs', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch audit access logs',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRetentionStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/audit/security?action=retention')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch retention status')
      }

      setRetentionStatus(result.data)
    } catch (error) {
      logger.error('Failed to fetch retention status', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch retention status',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSuspiciousAccess = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/audit/security?action=suspicious-access')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch suspicious access')
      }

      setSuspiciousAccess(result.data)
    } catch (error) {
      logger.error('Failed to fetch suspicious access', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch suspicious access patterns',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveLogs = async (tableName?: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/audit/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive',
          table_name: tableName
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to archive logs')
      }

      toast({
        title: 'Success',
        description: 'Audit logs archived successfully'
      })

      // Refresh retention status
      fetchRetentionStatus()
    } catch (error) {
      logger.error('Failed to archive logs', error)
      toast({
        title: 'Error',
        description: 'Failed to archive audit logs',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCleanupLogs = async (tableName?: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/audit/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cleanup',
          table_name: tableName
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cleanup logs')
      }

      toast({
        title: 'Success',
        description: 'Audit logs cleaned up successfully'
      })

      // Refresh retention status
      fetchRetentionStatus()
    } catch (error) {
      logger.error('Failed to cleanup logs', error)
      toast({
        title: 'Error',
        description: 'Failed to cleanup audit logs',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getAccessTypeColor = (type: string) => {
    switch (type) {
      case 'VIEW': return 'bg-blue-100 text-blue-800'
      case 'EXPORT': return 'bg-orange-100 text-orange-800'
      case 'SEARCH': return 'bg-green-100 text-green-800'
      case 'FILTER': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Audit Security Dashboard</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrity">Integrity</TabsTrigger>
          <TabsTrigger value="access-logs">Access Logs</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="integrity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Audit Log Integrity
              </CardTitle>
              <CardDescription>
                Verify the integrity of audit logs using cryptographic hashes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : integrityResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{integrityResult.totalLogs}</div>
                        <p className="text-sm text-muted-foreground">Total Logs</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{integrityResult.validLogs}</div>
                        <p className="text-sm text-muted-foreground">Valid Logs</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">{integrityResult.invalidLogs}</div>
                        <p className="text-sm text-muted-foreground">Invalid Logs</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Integrity Score</span>
                      <span>{integrityResult.integrityPercentage}%</span>
                    </div>
                    <Progress value={integrityResult.integrityPercentage} className="h-2" />
                  </div>

                  {integrityResult.integrityPercentage < 100 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Some audit logs have failed integrity checks. This may indicate data corruption or tampering.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button onClick={fetchIntegrityStatus} disabled={loading}>
                    Refresh Integrity Check
                  </Button>
                </div>
              ) : (
                <Button onClick={fetchIntegrityStatus} disabled={loading}>
                  Run Integrity Check
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Audit Access Logs
              </CardTitle>
              <CardDescription>
                Monitor who is accessing audit data for security purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">User</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Access Type</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Table</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Records</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accessLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="border border-gray-200 px-4 py-2">
                              {log.accessedByEmail}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <Badge className={getAccessTypeColor(log.accessType)}>
                                {log.accessType}
                              </Badge>
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {log.tableName || 'All'}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {log.recordsAccessed}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {formatDate(log.accessTimestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {accessLogs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No audit access logs found
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Data Retention Management
              </CardTitle>
              <CardDescription>
                Manage audit log retention and archival policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {retentionStatus.map((status) => (
                    <Card key={status.tableName}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold capitalize">{status.tableName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Total logs: {status.totalLogs}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {status.logsToArchive > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleArchiveLogs(status.tableName)}
                                disabled={loading}
                              >
                                <Archive className="h-4 w-4 mr-1" />
                                Archive ({status.logsToArchive})
                              </Button>
                            )}
                            {status.logsToDelete > 0 && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCleanupLogs(status.tableName)}
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete ({status.logsToDelete})
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Oldest log:</span>
                            <br />
                            {status.oldestLogDate ? formatDate(status.oldestLogDate) : 'N/A'}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Newest log:</span>
                            <br />
                            {status.newestLogDate ? formatDate(status.newestLogDate) : 'N/A'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {retentionStatus.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No retention data available
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Security Monitoring
              </CardTitle>
              <CardDescription>
                Monitor for suspicious audit access patterns and security threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {suspiciousAccess.length > 0 ? (
                    suspiciousAccess.map((access, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <div className="font-semibold">{access.suspiciousActivity}</div>
                            <div className="text-sm">
                              <strong>User:</strong> {access.userEmail} ({access.userId})
                            </div>
                            <div className="text-sm">
                              <strong>Access Count:</strong> {access.accessCount}
                            </div>
                            <div className="text-sm">
                              <strong>Period:</strong> {formatDate(access.firstAccess)} - {formatDate(access.lastAccess)}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))
                  ) : (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        No suspicious audit access patterns detected
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button onClick={fetchSuspiciousAccess} disabled={loading}>
                    Refresh Security Check
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}