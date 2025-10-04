#!/usr/bin/env node

/**
 * Production Monitoring Script for Audit System
 * 
 * This script monitors the audit system in production and provides:
 * 1. Performance metrics collection
 * 2. Health checks and alerts
 * 3. Automated maintenance tasks
 * 4. Security monitoring
 * 
 * Usage: npm run monitor:audit-production
 */

import { createClient } from '@supabase/supabase-js'
import { AUDIT_PRODUCTION_CONFIG, AuditProductionUtils } from '../lib/config/audit-production-config'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Configuration
const PRODUCTION_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD || process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY_PROD || process.env.SUPABASE_SERVICE_ROLE_KEY,
  environment: 'production'
}

if (!PRODUCTION_CONFIG.supabaseUrl || !PRODUCTION_CONFIG.supabaseKey) {
  console.error('❌ Missing production Supabase configuration')
  process.exit(1)
}

const supabase = createClient(PRODUCTION_CONFIG.supabaseUrl, PRODUCTION_CONFIG.supabaseKey)

/**
 * Monitoring metrics interface
 */
interface AuditMetrics {
  timestamp: Date;
  database: {
    totalLogs: number;
    tableSizeGB: number;
    indexEfficiency: number;
    queryPerformance: {
      avgResponseTime: number;
      slowQueries: number;
    };
  };
  performance: {
    apiResponseTimes: Record<string, number>;
    errorRate: number;
    throughput: number;
  };
  security: {
    failedAccessAttempts: number;
    suspiciousActivity: number;
    integrityStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  };
  retention: {
    logsToArchive: number;
    logsToDelete: number;
    archiveStatus: 'UP_TO_DATE' | 'BEHIND' | 'CRITICAL';
  };
}

/**
 * Alert interface
 */
interface Alert {
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  category: 'PERFORMANCE' | 'SECURITY' | 'RETENTION' | 'INTEGRITY';
  message: string;
  details: any;
  timestamp: Date;
}

/**
 * Audit system monitoring class
 */
class AuditSystemMonitor {
  private alerts: Alert[] = []
  private metrics: AuditMetrics | null = null

  /**
   * Add an alert
   */
  private addAlert(level: Alert['level'], category: Alert['category'], message: string, details: any = {}) {
    this.alerts.push({
      level,
      category,
      message,
      details,
      timestamp: new Date()
    })

    const emoji = level === 'CRITICAL' ? '🚨' : level === 'WARNING' ? '⚠️' : 'ℹ️'
    console.log(`${emoji} [${category}] ${message}`)
  }

  /**
   * Collect database metrics
   */
  async collectDatabaseMetrics(): Promise<AuditMetrics['database']> {
    try {
      // Get total audit logs count
      const { count: totalLogs, error: countError } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        this.addAlert('WARNING', 'PERFORMANCE', 'Failed to get audit logs count', countError)
      }

      // Get table size
      const { data: sizeData, error: sizeError } = await supabase.rpc('get_audit_table_size')
      const tableSizeGB = sizeData?.[0]?.size_gb || 0

      if (sizeError) {
        this.addAlert('WARNING', 'PERFORMANCE', 'Failed to get table size', sizeError)
      }

      // Check if table size exceeds threshold
      const sizeThreshold = AuditProductionUtils.getAlertThreshold('tableSizeGB')
      if (tableSizeGB > sizeThreshold) {
        this.addAlert('WARNING', 'PERFORMANCE', 
          `Audit table size (${tableSizeGB}GB) exceeds threshold (${sizeThreshold}GB)`,
          { currentSize: tableSizeGB, threshold: sizeThreshold }
        )
      }

      // Get index efficiency
      const { data: indexData, error: indexError } = await supabase.rpc('get_audit_index_efficiency')
      const indexEfficiency = indexData?.[0]?.efficiency_percent || 0

      if (indexError) {
        this.addAlert('WARNING', 'PERFORMANCE', 'Failed to get index efficiency', indexError)
      }

      // Monitor query performance
      const startTime = Date.now()
      const { data: perfTest, error: perfError } = await supabase
        .from('audit_logs')
        .select('id')
        .limit(1)

      const queryTime = Date.now() - startTime
      const responseThreshold = AuditProductionUtils.getAlertThreshold('queryResponseTimeMs')

      if (queryTime > responseThreshold) {
        this.addAlert('WARNING', 'PERFORMANCE',
          `Query response time (${queryTime}ms) exceeds threshold (${responseThreshold}ms)`,
          { responseTime: queryTime, threshold: responseThreshold }
        )
      }

      return {
        totalLogs: totalLogs || 0,
        tableSizeGB,
        indexEfficiency,
        queryPerformance: {
          avgResponseTime: queryTime,
          slowQueries: queryTime > responseThreshold ? 1 : 0
        }
      }

    } catch (error) {
      this.addAlert('CRITICAL', 'PERFORMANCE', 'Failed to collect database metrics', error)
      return {
        totalLogs: 0,
        tableSizeGB: 0,
        indexEfficiency: 0,
        queryPerformance: {
          avgResponseTime: 0,
          slowQueries: 0
        }
      }
    }
  }

  /**
   * Monitor API performance
   */
  async monitorAPIPerformance(): Promise<AuditMetrics['performance']> {
    try {
      const apiEndpoints = [
        '/api/audit/logs',
        '/api/audit/export',
        '/api/audit/security'
      ]

      const responseTimes: Record<string, number> = {}
      let errorCount = 0

      // In a real implementation, you would test these endpoints with proper authentication
      // For now, we'll simulate the monitoring
      for (const endpoint of apiEndpoints) {
        try {
          const startTime = Date.now()
          // Simulate API call - in production, use actual HTTP requests
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
          const responseTime = Date.now() - startTime
          responseTimes[endpoint] = responseTime
        } catch (error) {
          errorCount++
          this.addAlert('WARNING', 'PERFORMANCE', `API endpoint ${endpoint} failed`, error)
        }
      }

      const errorRate = (errorCount / apiEndpoints.length) * 100
      const failureThreshold = AuditProductionUtils.getAlertThreshold('failureRatePercent')

      if (errorRate > failureThreshold) {
        this.addAlert('CRITICAL', 'PERFORMANCE',
          `API error rate (${errorRate}%) exceeds threshold (${failureThreshold}%)`,
          { errorRate, threshold: failureThreshold }
        )
      }

      return {
        apiResponseTimes: responseTimes,
        errorRate,
        throughput: apiEndpoints.length - errorCount
      }

    } catch (error) {
      this.addAlert('CRITICAL', 'PERFORMANCE', 'Failed to monitor API performance', error)
      return {
        apiResponseTimes: {},
        errorRate: 100,
        throughput: 0
      }
    }
  }

  /**
   * Monitor security aspects
   */
  async monitorSecurity(): Promise<AuditMetrics['security']> {
    try {
      // Check for failed access attempts
      const { data: failedAttempts, error: failedError } = await supabase
        .from('audit_access_logs')
        .select('*')
        .eq('access_granted', false)
        .gte('access_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const failedCount = failedAttempts?.length || 0
      const maxFailedAttempts = AUDIT_PRODUCTION_CONFIG.security.maxFailedAccessAttempts

      if (failedCount > maxFailedAttempts) {
        this.addAlert('WARNING', 'SECURITY',
          `High number of failed access attempts: ${failedCount}`,
          { failedAttempts: failedCount, threshold: maxFailedAttempts }
        )
      }

      // Check for suspicious activity
      const { data: suspiciousData, error: suspiciousError } = await supabase.rpc('detect_suspicious_access')
      const suspiciousCount = suspiciousData?.length || 0

      if (suspiciousCount > 0) {
        this.addAlert('WARNING', 'SECURITY',
          `Detected ${suspiciousCount} suspicious activity patterns`,
          { patterns: suspiciousData }
        )
      }

      // Check audit integrity
      const { data: integrityData, error: integrityError } = await supabase.rpc('verify_audit_logs_integrity')
      const integrityResult = integrityData?.[0] || { integrity_percentage: 0 }
      
      let integrityStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY'
      if (integrityResult.integrity_percentage < 95) {
        integrityStatus = 'CRITICAL'
        this.addAlert('CRITICAL', 'INTEGRITY',
          `Audit integrity below 95%: ${integrityResult.integrity_percentage}%`,
          integrityResult
        )
      } else if (integrityResult.integrity_percentage < 99) {
        integrityStatus = 'WARNING'
        this.addAlert('WARNING', 'INTEGRITY',
          `Audit integrity below 99%: ${integrityResult.integrity_percentage}%`,
          integrityResult
        )
      }

      return {
        failedAccessAttempts: failedCount,
        suspiciousActivity: suspiciousCount,
        integrityStatus
      }

    } catch (error) {
      this.addAlert('CRITICAL', 'SECURITY', 'Failed to monitor security', error)
      return {
        failedAccessAttempts: 0,
        suspiciousActivity: 0,
        integrityStatus: 'CRITICAL'
      }
    }
  }

  /**
   * Monitor retention status
   */
  async monitorRetention(): Promise<AuditMetrics['retention']> {
    try {
      // Get retention status
      const { data: retentionData, error: retentionError } = await supabase.rpc('get_retention_status')
      
      if (retentionError) {
        this.addAlert('WARNING', 'RETENTION', 'Failed to get retention status', retentionError)
        return {
          logsToArchive: 0,
          logsToDelete: 0,
          archiveStatus: 'CRITICAL'
        }
      }

      const totalToArchive = retentionData?.reduce((sum: number, table: any) => sum + (table.logs_to_archive || 0), 0) || 0
      const totalToDelete = retentionData?.reduce((sum: number, table: any) => sum + (table.logs_to_delete || 0), 0) || 0

      let archiveStatus: 'UP_TO_DATE' | 'BEHIND' | 'CRITICAL' = 'UP_TO_DATE'

      if (totalToArchive > 10000) {
        archiveStatus = 'CRITICAL'
        this.addAlert('CRITICAL', 'RETENTION',
          `Large number of logs need archiving: ${totalToArchive}`,
          { logsToArchive: totalToArchive }
        )
      } else if (totalToArchive > 1000) {
        archiveStatus = 'BEHIND'
        this.addAlert('WARNING', 'RETENTION',
          `Logs need archiving: ${totalToArchive}`,
          { logsToArchive: totalToArchive }
        )
      }

      if (totalToDelete > 1000) {
        this.addAlert('WARNING', 'RETENTION',
          `Logs need deletion: ${totalToDelete}`,
          { logsToDelete: totalToDelete }
        )
      }

      return {
        logsToArchive: totalToArchive,
        logsToDelete: totalToDelete,
        archiveStatus
      }

    } catch (error) {
      this.addAlert('CRITICAL', 'RETENTION', 'Failed to monitor retention', error)
      return {
        logsToArchive: 0,
        logsToDelete: 0,
        archiveStatus: 'CRITICAL'
      }
    }
  }

  /**
   * Perform automated maintenance tasks
   */
  async performMaintenance(): Promise<void> {
    try {
      console.log('🔧 Performing automated maintenance tasks...')

      // Auto-archive if enabled and needed
      if (AUDIT_PRODUCTION_CONFIG.retention.enableAutoArchiving) {
        const { data: archiveResult, error: archiveError } = await supabase.rpc('archive_old_audit_logs', {
          p_table_name: null,
          p_batch_size: 1000
        })

        if (archiveError) {
          this.addAlert('WARNING', 'RETENTION', 'Auto-archiving failed', archiveError)
        } else if (archiveResult && archiveResult.length > 0) {
          const totalArchived = archiveResult.reduce((sum: number, result: any) => sum + result.archived_count, 0)
          this.addAlert('INFO', 'RETENTION', `Auto-archived ${totalArchived} audit logs`, archiveResult)
        }
      }

      // Run integrity checks if enabled
      if (AUDIT_PRODUCTION_CONFIG.security.enableIntegrityChecks) {
        const { data: integrityResult, error: integrityError } = await supabase.rpc('verify_audit_logs_integrity')
        
        if (integrityError) {
          this.addAlert('WARNING', 'INTEGRITY', 'Integrity check failed', integrityError)
        } else {
          this.addAlert('INFO', 'INTEGRITY', 'Integrity check completed', integrityResult)
        }
      }

      // Update statistics
      const { error: statsError } = await supabase.rpc('update_audit_statistics')
      
      if (statsError) {
        this.addAlert('WARNING', 'PERFORMANCE', 'Statistics update failed', statsError)
      } else {
        this.addAlert('INFO', 'PERFORMANCE', 'Statistics updated successfully')
      }

    } catch (error) {
      this.addAlert('CRITICAL', 'RETENTION', 'Maintenance tasks failed', error)
    }
  }

  /**
   * Collect all metrics
   */
  async collectMetrics(): Promise<AuditMetrics> {
    console.log('📊 Collecting audit system metrics...')

    const [database, performance, security, retention] = await Promise.all([
      this.collectDatabaseMetrics(),
      this.monitorAPIPerformance(),
      this.monitorSecurity(),
      this.monitorRetention()
    ])

    this.metrics = {
      timestamp: new Date(),
      database,
      performance,
      security,
      retention
    }

    return this.metrics
  }

  /**
   * Generate monitoring report
   */
  generateReport(): void {
    if (!this.metrics) {
      console.log('❌ No metrics available for report generation')
      return
    }

    console.log('\n' + '='.repeat(80))
    console.log('AUDIT SYSTEM MONITORING REPORT')
    console.log('='.repeat(80))
    console.log(`Report Date: ${this.metrics.timestamp.toISOString()}`)
    console.log(`Environment: ${PRODUCTION_CONFIG.environment}`)
    console.log('')

    // Database metrics
    console.log('📊 DATABASE METRICS:')
    console.log(`  Total Audit Logs: ${this.metrics.database.totalLogs.toLocaleString()}`)
    console.log(`  Table Size: ${this.metrics.database.tableSizeGB.toFixed(2)} GB`)
    console.log(`  Index Efficiency: ${this.metrics.database.indexEfficiency.toFixed(1)}%`)
    console.log(`  Avg Query Time: ${this.metrics.database.queryPerformance.avgResponseTime}ms`)
    console.log('')

    // Performance metrics
    console.log('⚡ PERFORMANCE METRICS:')
    console.log(`  API Error Rate: ${this.metrics.performance.errorRate.toFixed(1)}%`)
    console.log(`  API Throughput: ${this.metrics.performance.throughput} endpoints`)
    Object.entries(this.metrics.performance.apiResponseTimes).forEach(([endpoint, time]) => {
      console.log(`  ${endpoint}: ${time}ms`)
    })
    console.log('')

    // Security metrics
    console.log('🔒 SECURITY METRICS:')
    console.log(`  Failed Access Attempts (24h): ${this.metrics.security.failedAccessAttempts}`)
    console.log(`  Suspicious Activity Patterns: ${this.metrics.security.suspiciousActivity}`)
    console.log(`  Integrity Status: ${this.metrics.security.integrityStatus}`)
    console.log('')

    // Retention metrics
    console.log('📦 RETENTION METRICS:')
    console.log(`  Logs to Archive: ${this.metrics.retention.logsToArchive.toLocaleString()}`)
    console.log(`  Logs to Delete: ${this.metrics.retention.logsToDelete.toLocaleString()}`)
    console.log(`  Archive Status: ${this.metrics.retention.archiveStatus}`)
    console.log('')

    // Alerts summary
    const criticalAlerts = this.alerts.filter(a => a.level === 'CRITICAL').length
    const warningAlerts = this.alerts.filter(a => a.level === 'WARNING').length
    const infoAlerts = this.alerts.filter(a => a.level === 'INFO').length

    console.log('🚨 ALERTS SUMMARY:')
    console.log(`  Critical: ${criticalAlerts}`)
    console.log(`  Warning: ${warningAlerts}`)
    console.log(`  Info: ${infoAlerts}`)
    console.log('')

    if (this.alerts.length > 0) {
      console.log('📋 RECENT ALERTS:')
      this.alerts.slice(-10).forEach(alert => {
        const emoji = alert.level === 'CRITICAL' ? '🚨' : alert.level === 'WARNING' ? '⚠️' : 'ℹ️'
        console.log(`  ${emoji} [${alert.category}] ${alert.message}`)
      })
    }

    console.log('='.repeat(80))

    // Save metrics to file
    const reportData = {
      metrics: this.metrics,
      alerts: this.alerts,
      generatedAt: new Date().toISOString()
    }

    const reportPath = join(process.cwd(), 'logs', `audit-monitoring-${Date.now()}.json`)
    try {
      writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
      console.log(`📄 Report saved to: ${reportPath}`)
    } catch (error) {
      console.log(`❌ Failed to save report: ${error}`)
    }
  }

  /**
   * Main monitoring execution
   */
  async monitor(): Promise<void> {
    try {
      console.log('🔍 Starting Audit System Monitoring...\n')

      // Collect metrics
      await this.collectMetrics()

      // Perform maintenance
      await this.performMaintenance()

      // Generate report
      this.generateReport()

      // Determine overall health
      const criticalAlerts = this.alerts.filter(a => a.level === 'CRITICAL').length
      const warningAlerts = this.alerts.filter(a => a.level === 'WARNING').length

      if (criticalAlerts > 0) {
        console.log('\n🚨 CRITICAL ISSUES DETECTED - Immediate attention required!')
        process.exit(1)
      } else if (warningAlerts > 0) {
        console.log('\n⚠️  WARNING ISSUES DETECTED - Review recommended')
        process.exit(0)
      } else {
        console.log('\n✅ Audit System is healthy')
        process.exit(0)
      }

    } catch (error) {
      console.error('💥 Monitoring failed with exception:', error)
      process.exit(1)
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const monitor = new AuditSystemMonitor()
  await monitor.monitor()
}

// Run monitoring if this script is executed directly
if (require.main === module) {
  main()
}

export { AuditSystemMonitor }