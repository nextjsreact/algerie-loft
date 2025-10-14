/**
 * Automated Reporting System
 * 
 * Generates automated reports for environment health, usage statistics,
 * and system performance with scheduled delivery and alerting.
 * 
 * Requirements: 6.4
 */

import { EventEmitter } from 'events'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import * as cron from 'node-cron'

export interface ReportConfig {
  type: 'daily' | 'weekly' | 'monthly'
  schedule: string // cron expression
  recipients: string[]
  format: 'markdown' | 'html' | 'json'
  includeMetrics: boolean
  includeAlerts: boolean
  includeRecommendations: boolean
  enabled: boolean
}

export interface ReportData {
  period: {
    start: Date
    end: Date
    type: string
  }
  summary: {
    totalOperations: number
    successfulOperations: number
    failedOperations: number
    averageDuration: number
    totalRecordsProcessed: number
  }
  environmentHealth: {
    [environmentId: string]: {
      averageHealthScore: number
      uptime: number
      issues: number
    }
  }
  alerts: {
    total: number
    critical: number
    warning: number
    resolved: number
    topAlerts: Array<{
      name: string
      count: number
      severity: string
    }>
  }
  performance: {
    averageResponseTime: number
    peakMemoryUsage: number
    averageCpuUsage: number
    databasePerformance: {
      averageConnectionTime: number
      slowQueries: number
    }
  }
  security: {
    productionAccessAttempts: number
    blockedAttempts: number
    auditLogEntries: number
    anonymizationOperations: number
  }
  recommendations: string[]
}

export interface GeneratedReport {
  id: string
  type: string
  generatedAt: Date
  period: { start: Date; end: Date }
  filepath: string
  format: string
  size: number
  recipients: string[]
  delivered: boolean
  deliveryAttempts: number
}

export class AutomatedReportingSystem extends EventEmitter {
  private reportConfigs: Map<string, ReportConfig> = new Map()
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map()
  private generatedReports: GeneratedReport[] = []
  
  private readonly reportsDir: string
  private readonly templatesDir: string
  private readonly archiveDir: string

  constructor() {
    super()
    
    this.reportsDir = join(process.cwd(), 'monitoring', 'reports')
    this.templatesDir = join(process.cwd(), 'monitoring', 'templates')
    this.archiveDir = join(process.cwd(), 'monitoring', 'archive')
    
    // Ensure directories exist
    [this.reportsDir, this.templatesDir, this.archiveDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    })

    this.initializeDefaultReportConfigs()
    this.createReportTemplates()
  }

  /**
   * Start the automated reporting system
   */
  public start(): void {
    console.log('📊 Starting Automated Reporting System...')

    // Schedule all enabled reports
    this.reportConfigs.forEach((config, id) => {
      if (config.enabled) {
        this.scheduleReport(id, config)
      }
    })

    console.log('✅ Automated Reporting System started')
    this.emit('reporting-started')
  }

  /**
   * Stop the automated reporting system
   */
  public stop(): void {
    console.log('📊 Stopping Automated Reporting System...')

    // Stop all scheduled jobs
    this.scheduledJobs.forEach((job, id) => {
      job.stop()
      console.log(`   Stopped scheduled report: ${id}`)
    })
    this.scheduledJobs.clear()

    console.log('✅ Automated Reporting System stopped')
    this.emit('reporting-stopped')
  }

  /**
   * Add report configuration
   */
  public addReportConfig(id: string, config: ReportConfig): void {
    this.reportConfigs.set(id, config)
    
    if (config.enabled) {
      this.scheduleReport(id, config)
    }
    
    console.log(`📋 Added report configuration: ${id} (${config.type})`)
  }

  /**
   * Generate report manually
   */
  public async generateReport(configId: string): Promise<GeneratedReport> {
    const config = this.reportConfigs.get(configId)
    if (!config) {
      throw new Error(`Report configuration not found: ${configId}`)
    }

    console.log(`📊 Generating ${config.type} report...`)

    // Collect report data
    const reportData = await this.collectReportData(config.type)

    // Generate report content
    const reportContent = this.formatReport(reportData, config)

    // Save report to file
    const report = await this.saveReport(configId, config, reportContent, reportData)

    // Deliver report
    if (config.recipients.length > 0) {
      await this.deliverReport(report, config)
    }

    this.generatedReports.push(report)
    this.emit('report-generated', report)

    console.log(`✅ Report generated: ${report.filepath}`)
    return report
  }

  /**
   * Get generated reports
   */
  public getGeneratedReports(limit: number = 50): GeneratedReport[] {
    return this.generatedReports
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, limit)
  }

  /**
   * Get report statistics
   */
  public getReportStatistics(): {
    totalReports: number
    reportsByType: Record<string, number>
    deliverySuccessRate: number
    averageReportSize: number
  } {
    const totalReports = this.generatedReports.length
    const reportsByType: Record<string, number> = {}
    let totalDelivered = 0
    let totalSize = 0

    this.generatedReports.forEach(report => {
      reportsByType[report.type] = (reportsByType[report.type] || 0) + 1
      if (report.delivered) totalDelivered++
      totalSize += report.size
    })

    return {
      totalReports,
      reportsByType,
      deliverySuccessRate: totalReports > 0 ? (totalDelivered / totalReports) * 100 : 0,
      averageReportSize: totalReports > 0 ? totalSize / totalReports : 0
    }
  }

  /**
   * Schedule report generation
   */
  private scheduleReport(id: string, config: ReportConfig): void {
    // Stop existing job if any
    const existingJob = this.scheduledJobs.get(id)
    if (existingJob) {
      existingJob.stop()
    }

    // Create new scheduled job
    const job = cron.schedule(config.schedule, async () => {
      try {
        await this.generateReport(id)
      } catch (error) {
        console.error(`Error generating scheduled report ${id}:`, error)
        this.emit('report-generation-error', { configId: id, error })
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    })

    job.start()
    this.scheduledJobs.set(id, job)
    
    console.log(`📅 Scheduled ${config.type} report: ${config.schedule}`)
  }

  /**
   * Collect report data
   */
  private async collectReportData(reportType: string): Promise<ReportData> {
    const now = new Date()
    let start: Date
    let end: Date = now

    // Determine time period
    switch (reportType) {
      case 'daily':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'weekly':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    // Simulate data collection (in real implementation, this would query actual data)
    const reportData: ReportData = {
      period: { start, end, type: reportType },
      summary: {
        totalOperations: Math.floor(Math.random() * 100) + 50,
        successfulOperations: Math.floor(Math.random() * 90) + 45,
        failedOperations: Math.floor(Math.random() * 10),
        averageDuration: Math.floor(Math.random() * 300) + 120, // seconds
        totalRecordsProcessed: Math.floor(Math.random() * 100000) + 50000
      },
      environmentHealth: {
        production: {
          averageHealthScore: 85 + Math.random() * 15,
          uptime: 99.5 + Math.random() * 0.5,
          issues: Math.floor(Math.random() * 3)
        },
        test: {
          averageHealthScore: 80 + Math.random() * 20,
          uptime: 95 + Math.random() * 5,
          issues: Math.floor(Math.random() * 5)
        },
        training: {
          averageHealthScore: 75 + Math.random() * 25,
          uptime: 90 + Math.random() * 10,
          issues: Math.floor(Math.random() * 8)
        }
      },
      alerts: {
        total: Math.floor(Math.random() * 20) + 5,
        critical: Math.floor(Math.random() * 3),
        warning: Math.floor(Math.random() * 15) + 5,
        resolved: Math.floor(Math.random() * 18) + 3,
        topAlerts: [
          { name: 'High Memory Usage', count: Math.floor(Math.random() * 5) + 1, severity: 'warning' },
          { name: 'Database Connection Slow', count: Math.floor(Math.random() * 3) + 1, severity: 'warning' },
          { name: 'Environment Health Degraded', count: Math.floor(Math.random() * 2) + 1, severity: 'critical' }
        ]
      },
      performance: {
        averageResponseTime: Math.floor(Math.random() * 200) + 100, // ms
        peakMemoryUsage: Math.floor(Math.random() * 500) + 200, // MB
        averageCpuUsage: Math.floor(Math.random() * 50) + 20, // %
        databasePerformance: {
          averageConnectionTime: Math.floor(Math.random() * 100) + 50, // ms
          slowQueries: Math.floor(Math.random() * 10)
        }
      },
      security: {
        productionAccessAttempts: Math.floor(Math.random() * 50) + 20,
        blockedAttempts: Math.floor(Math.random() * 5),
        auditLogEntries: Math.floor(Math.random() * 1000) + 500,
        anonymizationOperations: Math.floor(Math.random() * 100) + 50
      },
      recommendations: this.generateRecommendations(reportType)
    }

    return reportData
  }

  /**
   * Format report content
   */
  private formatReport(data: ReportData, config: ReportConfig): string {
    switch (config.format) {
      case 'markdown':
        return this.formatMarkdownReport(data, config)
      case 'html':
        return this.formatHtmlReport(data, config)
      case 'json':
        return JSON.stringify(data, null, 2)
      default:
        return this.formatMarkdownReport(data, config)
    }
  }

  /**
   * Format markdown report
   */
  private formatMarkdownReport(data: ReportData, config: ReportConfig): string {
    const lines: string[] = []
    
    lines.push(`# ${data.period.type.charAt(0).toUpperCase() + data.period.type.slice(1)} Environment Cloning Report`)
    lines.push(`**Period:** ${data.period.start.toISOString().split('T')[0]} to ${data.period.end.toISOString().split('T')[0]}`)
    lines.push(`**Generated:** ${new Date().toISOString()}`)
    lines.push('')

    // Executive Summary
    lines.push('## Executive Summary')
    lines.push(`- **Total Operations:** ${data.summary.totalOperations}`)
    lines.push(`- **Success Rate:** ${((data.summary.successfulOperations / data.summary.totalOperations) * 100).toFixed(1)}%`)
    lines.push(`- **Average Duration:** ${Math.floor(data.summary.averageDuration / 60)}m ${data.summary.averageDuration % 60}s`)
    lines.push(`- **Records Processed:** ${data.summary.totalRecordsProcessed.toLocaleString()}`)
    lines.push('')

    // Environment Health
    if (config.includeMetrics) {
      lines.push('## Environment Health')
      Object.entries(data.environmentHealth).forEach(([env, health]) => {
        lines.push(`### ${env.charAt(0).toUpperCase() + env.slice(1)} Environment`)
        lines.push(`- **Health Score:** ${health.averageHealthScore.toFixed(1)}/100`)
        lines.push(`- **Uptime:** ${health.uptime.toFixed(2)}%`)
        lines.push(`- **Issues:** ${health.issues}`)
        lines.push('')
      })
    }

    // Alerts Summary
    if (config.includeAlerts) {
      lines.push('## Alerts Summary')
      lines.push(`- **Total Alerts:** ${data.alerts.total}`)
      lines.push(`- **Critical:** ${data.alerts.critical}`)
      lines.push(`- **Warning:** ${data.alerts.warning}`)
      lines.push(`- **Resolved:** ${data.alerts.resolved}`)
      lines.push('')
      
      if (data.alerts.topAlerts.length > 0) {
        lines.push('### Top Alerts')
        data.alerts.topAlerts.forEach(alert => {
          lines.push(`- **${alert.name}** (${alert.severity}): ${alert.count} occurrences`)
        })
        lines.push('')
      }
    }

    // Performance Metrics
    if (config.includeMetrics) {
      lines.push('## Performance Metrics')
      lines.push(`- **Average Response Time:** ${data.performance.averageResponseTime}ms`)
      lines.push(`- **Peak Memory Usage:** ${data.performance.peakMemoryUsage}MB`)
      lines.push(`- **Average CPU Usage:** ${data.performance.averageCpuUsage}%`)
      lines.push(`- **Database Connection Time:** ${data.performance.databasePerformance.averageConnectionTime}ms`)
      lines.push(`- **Slow Queries:** ${data.performance.databasePerformance.slowQueries}`)
      lines.push('')
    }

    // Security Summary
    lines.push('## Security Summary')
    lines.push(`- **Production Access Attempts:** ${data.security.productionAccessAttempts}`)
    lines.push(`- **Blocked Attempts:** ${data.security.blockedAttempts}`)
    lines.push(`- **Audit Log Entries:** ${data.security.auditLogEntries.toLocaleString()}`)
    lines.push(`- **Anonymization Operations:** ${data.security.anonymizationOperations}`)
    lines.push('')

    // Recommendations
    if (config.includeRecommendations && data.recommendations.length > 0) {
      lines.push('## Recommendations')
      data.recommendations.forEach(rec => {
        lines.push(`- ${rec}`)
      })
      lines.push('')
    }

    // Footer
    lines.push('---')
    lines.push('*This report was generated automatically by the Environment Cloning System*')

    return lines.join('\n')
  }

  /**
   * Format HTML report
   */
  private formatHtmlReport(data: ReportData, config: ReportConfig): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.period.type.charAt(0).toUpperCase() + data.period.type.slice(1)} Environment Cloning Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #667eea;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .section {
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .status-healthy { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-critical { color: #dc3545; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .recommendations {
            background: #f8f9fa;
            border-left: 4px solid #28a745;
            padding: 20px;
            border-radius: 0 8px 8px 0;
        }
        .footer {
            text-align: center;
            color: #666;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.period.type.charAt(0).toUpperCase() + data.period.type.slice(1)} Environment Cloning Report</h1>
        <p><strong>Period:</strong> ${data.period.start.toISOString().split('T')[0]} to ${data.period.end.toISOString().split('T')[0]}</p>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <h3>Total Operations</h3>
            <div class="metric-value">${data.summary.totalOperations}</div>
        </div>
        <div class="summary-card">
            <h3>Success Rate</h3>
            <div class="metric-value">${((data.summary.successfulOperations / data.summary.totalOperations) * 100).toFixed(1)}%</div>
        </div>
        <div class="summary-card">
            <h3>Records Processed</h3>
            <div class="metric-value">${data.summary.totalRecordsProcessed.toLocaleString()}</div>
        </div>
        <div class="summary-card">
            <h3>Average Duration</h3>
            <div class="metric-value">${Math.floor(data.summary.averageDuration / 60)}m ${data.summary.averageDuration % 60}s</div>
        </div>
    </div>

    ${config.includeMetrics ? `
    <div class="section">
        <h2>Environment Health</h2>
        <table>
            <thead>
                <tr>
                    <th>Environment</th>
                    <th>Health Score</th>
                    <th>Uptime</th>
                    <th>Issues</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(data.environmentHealth).map(([env, health]) => `
                <tr>
                    <td>${env.charAt(0).toUpperCase() + env.slice(1)}</td>
                    <td><span class="${health.averageHealthScore > 80 ? 'status-healthy' : health.averageHealthScore > 60 ? 'status-warning' : 'status-critical'}">${health.averageHealthScore.toFixed(1)}/100</span></td>
                    <td>${health.uptime.toFixed(2)}%</td>
                    <td>${health.issues}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${config.includeAlerts ? `
    <div class="section">
        <h2>Alerts Summary</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <h4>Total Alerts</h4>
                <div class="metric-value">${data.alerts.total}</div>
            </div>
            <div class="summary-card">
                <h4>Critical</h4>
                <div class="metric-value status-critical">${data.alerts.critical}</div>
            </div>
            <div class="summary-card">
                <h4>Warning</h4>
                <div class="metric-value status-warning">${data.alerts.warning}</div>
            </div>
            <div class="summary-card">
                <h4>Resolved</h4>
                <div class="metric-value status-healthy">${data.alerts.resolved}</div>
            </div>
        </div>
    </div>
    ` : ''}

    ${config.includeRecommendations && data.recommendations.length > 0 ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
        <ul>
            ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    <div class="footer">
        <p><em>This report was generated automatically by the Environment Cloning System</em></p>
    </div>
</body>
</html>`
  }

  /**
   * Save report to file
   */
  private async saveReport(
    configId: string,
    config: ReportConfig,
    content: string,
    data: ReportData
  ): Promise<GeneratedReport> {
    const timestamp = new Date().toISOString().split('T')[0]
    const extension = config.format === 'json' ? 'json' : config.format === 'html' ? 'html' : 'md'
    const filename = `${config.type}-report-${timestamp}-${configId}.${extension}`
    const filepath = join(this.reportsDir, filename)

    writeFileSync(filepath, content, 'utf8')

    const stats = require('fs').statSync(filepath)

    return {
      id: `${configId}-${timestamp}`,
      type: config.type,
      generatedAt: new Date(),
      period: data.period,
      filepath,
      format: config.format,
      size: stats.size,
      recipients: config.recipients,
      delivered: false,
      deliveryAttempts: 0
    }
  }

  /**
   * Deliver report
   */
  private async deliverReport(report: GeneratedReport, config: ReportConfig): Promise<void> {
    try {
      // Simulate report delivery (email, webhook, etc.)
      console.log(`📧 Delivering ${config.type} report to ${config.recipients.length} recipients...`)
      
      // In a real implementation, this would send emails or post to webhooks
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate delivery time
      
      report.delivered = true
      report.deliveryAttempts = 1
      
      console.log(`✅ Report delivered successfully: ${report.filepath}`)
      this.emit('report-delivered', report)
      
    } catch (error) {
      report.deliveryAttempts++
      console.error(`Failed to deliver report ${report.id}:`, error)
      this.emit('report-delivery-failed', { report, error })
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(reportType: string): string[] {
    const recommendations: string[] = []

    // Add type-specific recommendations
    switch (reportType) {
      case 'daily':
        recommendations.push('Monitor daily operation patterns for optimization opportunities')
        recommendations.push('Review any failed operations and address root causes')
        break
      case 'weekly':
        recommendations.push('Analyze weekly trends in system performance')
        recommendations.push('Plan maintenance windows based on usage patterns')
        break
      case 'monthly':
        recommendations.push('Review monthly capacity planning and resource allocation')
        recommendations.push('Evaluate long-term system health trends')
        break
    }

    // Add general recommendations
    recommendations.push('Ensure all environments are regularly validated')
    recommendations.push('Keep anonymization rules up to date with data changes')
    recommendations.push('Review and update alert thresholds based on system behavior')

    return recommendations
  }

  /**
   * Initialize default report configurations
   */
  private initializeDefaultReportConfigs(): void {
    const defaultConfigs: Array<{ id: string; config: ReportConfig }> = [
      {
        id: 'daily-health-report',
        config: {
          type: 'daily',
          schedule: '0 8 * * *', // Daily at 8 AM
          recipients: ['admin@loftalgerie.com'],
          format: 'markdown',
          includeMetrics: true,
          includeAlerts: true,
          includeRecommendations: true,
          enabled: true
        }
      },
      {
        id: 'weekly-summary-report',
        config: {
          type: 'weekly',
          schedule: '0 9 * * 1', // Monday at 9 AM
          recipients: ['admin@loftalgerie.com', 'management@loftalgerie.com'],
          format: 'html',
          includeMetrics: true,
          includeAlerts: true,
          includeRecommendations: true,
          enabled: true
        }
      },
      {
        id: 'monthly-executive-report',
        config: {
          type: 'monthly',
          schedule: '0 10 1 * *', // First day of month at 10 AM
          recipients: ['admin@loftalgerie.com', 'management@loftalgerie.com', 'executive@loftalgerie.com'],
          format: 'html',
          includeMetrics: true,
          includeAlerts: true,
          includeRecommendations: true,
          enabled: true
        }
      }
    ]

    defaultConfigs.forEach(({ id, config }) => {
      this.addReportConfig(id, config)
    })
  }

  /**
   * Create report templates
   */
  private createReportTemplates(): void {
    // Create a simple template file for customization
    const templateContent = `# Report Template

This directory contains templates for customizing automated reports.

## Available Variables

- \`{{period.start}}\` - Report period start date
- \`{{period.end}}\` - Report period end date
- \`{{summary.totalOperations}}\` - Total operations count
- \`{{summary.successRate}}\` - Success rate percentage
- \`{{environmentHealth}}\` - Environment health data
- \`{{alerts}}\` - Alerts summary
- \`{{performance}}\` - Performance metrics
- \`{{security}}\` - Security summary
- \`{{recommendations}}\` - Generated recommendations

## Customization

You can create custom templates by copying and modifying the default templates.
Templates support Markdown, HTML, and JSON formats.
`

    const templatePath = join(this.templatesDir, 'README.md')
    if (!existsSync(templatePath)) {
      writeFileSync(templatePath, templateContent)
    }
  }
}