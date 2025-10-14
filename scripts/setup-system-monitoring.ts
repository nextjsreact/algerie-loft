/**
 * System Monitoring Setup Script
 * 
 * Sets up comprehensive monitoring and health checks for the
 * environment cloning system with dashboards and alerting.
 * 
 * Requirements: 6.4, 10.3
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

interface MonitoringConfig {
  environment: string
  enableMetricsCollection: boolean
  enableHealthChecks: boolean
  enableAlerting: boolean
  enableDashboards: boolean
  metricsRetention: string
  alertingChannels: string[]
}

export class SystemMonitoringSetup {
  private monitoringDir: string
  private dashboardsDir: string
  private alertsDir: string
  private healthChecksDir: string

  constructor() {
    const baseDir = join(process.cwd(), '.kiro', 'environment-cloning', 'monitoring')
    this.monitoringDir = baseDir
    this.dashboardsDir = join(baseDir, 'dashboards')
    this.alertsDir = join(baseDir, 'alerts')
    this.healthChecksDir = join(baseDir, 'health-checks')

    // Ensure directories exist
    [this.monitoringDir, this.dashboardsDir, this.alertsDir, this.healthChecksDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    })
  }

  /**
   * Setup complete monitoring system
   */
  public async setupMonitoring(config: MonitoringConfig): Promise<void> {
    console.log('📊 Setting up system monitoring...')

    // Setup metrics collection
    if (config.enableMetricsCollection) {
      await this.setupMetricsCollection(config)
    }

    // Setup health checks
    if (config.enableHealthChecks) {
      await this.setupHealthChecks(config)
    }

    // Setup alerting
    if (config.enableAlerting) {
      await this.setupAlerting(config)
    }

    // Setup dashboards
    if (config.enableDashboards) {
      await this.setupDashboards(config)
    }

    // Generate monitoring documentation
    await this.generateMonitoringDocumentation(config)

    console.log('✅ System monitoring setup completed')
  }

  /**
   * Setup metrics collection
   */
  private async setupMetricsCollection(config: MonitoringConfig): Promise<void> {
    console.log('   Setting up metrics collection...')

    const metricsConfig = {
      environment: config.environment,
      retention: config.metricsRetention,
      collection: {
        interval: 60000, // 1 minute
        batchSize: 100,
        timeout: 30000 // 30 seconds
      },
      metrics: {
        clone_operations_total: {
          type: 'counter',
          description: 'Total number of clone operations',
          labels: ['source_env', 'target_env', 'status']
        },
        clone_operation_duration_seconds: {
          type: 'histogram',
          description: 'Duration of clone operations in seconds',
          labels: ['source_env', 'target_env']
        },
        records_cloned_total: {
          type: 'counter',
          description: 'Total number of records cloned',
          labels: ['table_name', 'source_env', 'target_env']
        },
        production_access_attempts_total: {
          type: 'counter',
          description: 'Total number of production access attempts',
          labels: ['operation', 'blocked']
        },
        environment_health_score: {
          type: 'gauge',
          description: 'Health score of environments (0-100)',
          labels: ['environment_id', 'environment_type']
        }
      }
    }

    const metricsConfigPath = join(this.monitoringDir, 'metrics-config.json')
    writeFileSync(metricsConfigPath, JSON.stringify(metricsConfig, null, 2))

    console.log('     ✅ Metrics collection configured')
  }

  /**
   * Setup health checks
   */
  private async setupHealthChecks(config: MonitoringConfig): Promise<void> {
    console.log('   Setting up health checks...')

    const healthCheckConfig = {
      environment: config.environment,
      globalSettings: {
        defaultInterval: 60000, // 1 minute
        defaultTimeout: 10000, // 10 seconds
        defaultRetries: 3
      },
      checks: {
        'Database Connectivity': {
          description: 'Checks database connectivity for all environments',
          interval: 30000,
          timeout: 10000,
          retries: 3,
          severity: 'critical',
          enabled: true
        },
        'Production Safety Guard': {
          description: 'Validates production safety guard is active',
          interval: 60000,
          timeout: 5000,
          retries: 2,
          severity: 'critical',
          enabled: true
        },
        'Environment Configuration': {
          description: 'Validates environment configurations are correct',
          interval: 300000,
          timeout: 15000,
          retries: 2,
          severity: 'high',
          enabled: true
        },
        'Clone Operations Status': {
          description: 'Monitors active clone operations',
          interval: 30000,
          timeout: 5000,
          retries: 1,
          severity: 'medium',
          enabled: true
        }
      }
    }

    const healthCheckConfigPath = join(this.healthChecksDir, 'health-checks-config.json')
    writeFileSync(healthCheckConfigPath, JSON.stringify(healthCheckConfig, null, 2))

    console.log('     ✅ Health checks configured')
  }

  /**
   * Setup alerting
   */
  private async setupAlerting(config: MonitoringConfig): Promise<void> {
    console.log('   Setting up alerting...')

    const alertingConfig = {
      environment: config.environment,
      channels: {
        email: {
          enabled: config.alertingChannels.includes('email'),
          smtp: {
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
              user: process.env.SMTP_USER || '',
              pass: process.env.SMTP_PASS || ''
            }
          },
          recipients: {
            warning: ['admin@loftalgerie.com'],
            critical: ['admin@loftalgerie.com', 'emergency@loftalgerie.com']
          }
        },
        webhook: {
          enabled: config.alertingChannels.includes('webhook'),
          url: process.env.WEBHOOK_URL || '',
          timeout: 5000,
          retries: 3
        }
      },
      rules: [
        {
          name: 'Clone Operation Failed',
          description: 'Alert when clone operation fails',
          condition: 'clone_operations_total{status="failed"} > 0',
          severity: 'critical',
          duration: '0s',
          channels: ['email', 'webhook']
        },
        {
          name: 'Production Access Blocked',
          description: 'Alert when production access is blocked',
          condition: 'production_access_attempts_total{blocked="true"} > 0',
          severity: 'critical',
          duration: '0s',
          channels: ['email', 'webhook']
        },
        {
          name: 'Environment Health Degraded',
          description: 'Alert when environment health score is low',
          condition: 'environment_health_score < 70',
          severity: 'warning',
          duration: '10m',
          channels: ['email']
        }
      ]
    }

    const alertingConfigPath = join(this.alertsDir, 'alerting-config.json')
    writeFileSync(alertingConfigPath, JSON.stringify(alertingConfig, null, 2))

    console.log('     ✅ Alerting configured')
  }

  /**
   * Setup dashboards
   */
  private async setupDashboards(config: MonitoringConfig): Promise<void> {
    console.log('   Setting up dashboards...')

    // Generate main dashboard configuration
    const mainDashboard = {
      id: 'main-dashboard',
      title: 'Environment Cloning System - Main Dashboard',
      description: 'Overview of environment cloning system status and metrics',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      panels: [
        {
          id: 'system-overview',
          title: 'System Overview',
          type: 'stat',
          targets: [
            { metric: 'clone_operations_total', label: 'Total Clone Operations' },
            { metric: 'production_access_attempts_total{blocked="true"}', label: 'Blocked Production Access' },
            { metric: 'environment_health_score', label: 'Average Health Score' }
          ]
        },
        {
          id: 'clone-operations-timeline',
          title: 'Clone Operations Timeline',
          type: 'graph',
          targets: [
            { metric: 'rate(clone_operations_total[5m])', label: 'Operations per minute' }
          ]
        }
      ]
    }

    const mainDashboardPath = join(this.dashboardsDir, 'main-dashboard.json')
    writeFileSync(mainDashboardPath, JSON.stringify(mainDashboard, null, 2))

    // Generate dashboard viewer HTML
    const dashboardViewer = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Environment Cloning System - Monitoring Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .panel {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .metric-value {
            font-weight: bold;
            color: #007bff;
        }
        .status-healthy { color: #28a745; }
        .status-critical { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Environment Cloning System - Monitoring Dashboard</h1>
        <p>Real-time monitoring and health status</p>
    </div>

    <div class="dashboard-grid">
        <div class="panel">
            <h3>System Overview</h3>
            <div class="metric">
                <span>Total Clone Operations</span>
                <span class="metric-value">Loading...</span>
            </div>
            <div class="metric">
                <span>Production Safety Guard</span>
                <span class="metric-value status-healthy">Active</span>
            </div>
        </div>
    </div>
</body>
</html>`

    const viewerPath = join(this.dashboardsDir, 'dashboard-viewer.html')
    writeFileSync(viewerPath, dashboardViewer)

    console.log('     ✅ Dashboards configured')
  }

  /**
   * Generate monitoring documentation
   */
  private async generateMonitoringDocumentation(config: MonitoringConfig): Promise<void> {
    const documentation = `# System Monitoring Documentation

Generated on: ${new Date().toISOString()}
Environment: ${config.environment}

## Overview

This document describes the monitoring setup for the Environment Cloning System.

## Components

### Metrics Collection
- **Enabled**: ${config.enableMetricsCollection}
- **Retention**: ${config.metricsRetention}
- **Collection Interval**: 60 seconds

### Health Checks
- **Enabled**: ${config.enableHealthChecks}
- **Check Interval**: Varies by check (30s - 5m)
- **Severity Levels**: Low, Medium, High, Critical

### Alerting
- **Enabled**: ${config.enableAlerting}
- **Channels**: ${config.alertingChannels.join(', ')}
- **Evaluation Interval**: 30 seconds

### Dashboards
- **Enabled**: ${config.enableDashboards}
- **Web Interface**: dashboard-viewer.html

## Configuration Files

- \`monitoring/metrics-config.json\`: Metrics configuration
- \`monitoring/health-checks/health-checks-config.json\`: Health check settings
- \`monitoring/alerts/alerting-config.json\`: Alert rules and channels
- \`monitoring/dashboards/main-dashboard.json\`: Dashboard definition

## Support

For monitoring system issues, check system logs and configuration files.
`

    const docPath = join(this.monitoringDir, 'README.md')
    writeFileSync(docPath, documentation)
  }
}

// CLI interface
if (require.main === module) {
  const setup = new SystemMonitoringSetup()
  
  const config: MonitoringConfig = {
    environment: process.env.NODE_ENV || 'development',
    enableMetricsCollection: true,
    enableHealthChecks: true,
    enableAlerting: process.env.NODE_ENV === 'production',
    enableDashboards: true,
    metricsRetention: '30d',
    alertingChannels: ['email', 'webhook']
  }

  setup.setupMonitoring(config)
    .then(() => {
      console.log('🎉 System monitoring setup completed successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Monitoring setup failed:', error.message)
      process.exit(1)
    })
}