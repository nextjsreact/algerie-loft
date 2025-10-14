/**
 * Dashboard System
 * 
 * Creates and manages monitoring dashboards for clone operations,
 * environment health, and system performance with real-time updates.
 * 
 * Requirements: 6.4
 */

import { EventEmitter } from 'events'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { parse } from 'url'

export interface DashboardWidget {
  id: string
  title: string
  type: 'metric' | 'chart' | 'table' | 'status' | 'alert-list' | 'progress'
  dataSource: string
  refreshInterval: number
  position: { x: number; y: number; width: number; height: number }
  config: Record<string, any>
}

export interface Dashboard {
  id: string
  title: string
  description: string
  category: 'operations' | 'health' | 'security' | 'performance'
  widgets: DashboardWidget[]
  layout: 'grid' | 'flex'
  refreshInterval: number
  autoRefresh: boolean
  public: boolean
}

export interface DashboardData {
  timestamp: Date
  widgets: Record<string, any>
}

export class DashboardSystem extends EventEmitter {
  private dashboards: Map<string, Dashboard> = new Map()
  private dashboardData: Map<string, DashboardData> = new Map()
  private server: any = null
  private port: number = 3001
  
  private readonly dashboardsDir: string
  private readonly staticDir: string

  constructor(port?: number) {
    super()
    
    if (port) this.port = port
    
    this.dashboardsDir = join(process.cwd(), 'monitoring', 'dashboards')
    this.staticDir = join(process.cwd(), 'monitoring', 'static')
    
    // Ensure directories exist
    [this.dashboardsDir, this.staticDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    })

    this.initializeDefaultDashboards()
    this.createStaticAssets()
  }

  /**
   * Start the dashboard server
   */
  public start(): void {
    console.log('📊 Starting Dashboard System...')

    this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
      this.handleRequest(req, res)
    })

    this.server.listen(this.port, () => {
      console.log(`✅ Dashboard System started on http://localhost:${this.port}`)
      this.emit('dashboard-server-started', { port: this.port })
    })

    // Generate static dashboard files
    this.generateStaticDashboards()

    // Start data collection
    this.startDataCollection()
  }

  /**
   * Stop the dashboard server
   */
  public stop(): void {
    if (this.server) {
      this.server.close(() => {
        console.log('📊 Dashboard System stopped')
        this.emit('dashboard-server-stopped')
      })
    }
  }

  /**
   * Create dashboard
   */
  public createDashboard(dashboard: Dashboard): void {
    this.dashboards.set(dashboard.id, dashboard)
    this.generateDashboardFile(dashboard)
    console.log(`📊 Created dashboard: ${dashboard.title}`)
    this.emit('dashboard-created', dashboard)
  }

  /**
   * Update dashboard data
   */
  public updateDashboardData(dashboardId: string, widgetId: string, data: any): void {
    if (!this.dashboardData.has(dashboardId)) {
      this.dashboardData.set(dashboardId, {
        timestamp: new Date(),
        widgets: {}
      })
    }

    const dashboardData = this.dashboardData.get(dashboardId)!
    dashboardData.widgets[widgetId] = data
    dashboardData.timestamp = new Date()

    this.emit('dashboard-data-updated', { dashboardId, widgetId, data })
  }

  /**
   * Get dashboard data
   */
  public getDashboardData(dashboardId: string): DashboardData | undefined {
    return this.dashboardData.get(dashboardId)
  }

  /**
   * Get all dashboards
   */
  public getDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values())
  }

  /**
   * Handle HTTP requests
   */
  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const parsedUrl = parse(req.url || '', true)
    const pathname = parsedUrl.pathname || '/'

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    try {
      if (pathname === '/') {
        this.serveDashboardList(res)
      } else if (pathname.startsWith('/dashboard/')) {
        const dashboardId = pathname.split('/')[2]
        this.serveDashboard(dashboardId, res)
      } else if (pathname.startsWith('/api/data/')) {
        const dashboardId = pathname.split('/')[3]
        this.serveDashboardData(dashboardId, res)
      } else if (pathname.startsWith('/api/dashboards')) {
        this.serveDashboardsAPI(res)
      } else if (pathname.startsWith('/static/')) {
        this.serveStaticFile(pathname, res)
      } else {
        this.serve404(res)
      }
    } catch (error) {
      console.error('Error handling request:', error)
      this.serve500(res, error)
    }
  }

  /**
   * Serve dashboard list
   */
  private serveDashboardList(res: ServerResponse): void {
    const dashboards = Array.from(this.dashboards.values())
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Environment Cloning System - Dashboards</title>
    <link rel="stylesheet" href="/static/dashboard.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>Environment Cloning System</h1>
            <p>Monitoring Dashboards</p>
        </header>

        <div class="dashboard-grid">
            ${dashboards.map(dashboard => `
            <div class="dashboard-card" onclick="window.open('/dashboard/${dashboard.id}', '_blank')">
                <h3>${dashboard.title}</h3>
                <p>${dashboard.description}</p>
                <div class="dashboard-meta">
                    <span class="category">${dashboard.category}</span>
                    <span class="widgets">${dashboard.widgets.length} widgets</span>
                </div>
            </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  }

  /**
   * Serve individual dashboard
   */
  private serveDashboard(dashboardId: string, res: ServerResponse): void {
    const dashboard = this.dashboards.get(dashboardId)
    
    if (!dashboard) {
      this.serve404(res)
      return
    }

    const html = this.generateDashboardHTML(dashboard)
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  }

  /**
   * Serve dashboard data API
   */
  private serveDashboardData(dashboardId: string, res: ServerResponse): void {
    const data = this.dashboardData.get(dashboardId)
    
    if (!data) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Dashboard data not found' }))
      return
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }

  /**
   * Serve dashboards API
   */
  private serveDashboardsAPI(res: ServerResponse): void {
    const dashboards = Array.from(this.dashboards.values())
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(dashboards))
  }

  /**
   * Serve static files
   */
  private serveStaticFile(pathname: string, res: ServerResponse): void {
    // Simple static file serving (in production, use a proper static file server)
    const filename = pathname.replace('/static/', '')
    
    if (filename === 'dashboard.css') {
      res.writeHead(200, { 'Content-Type': 'text/css' })
      res.end(this.getDashboardCSS())
    } else if (filename === 'dashboard.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' })
      res.end(this.getDashboardJS())
    } else {
      this.serve404(res)
    }
  }

  /**
   * Serve 404 error
   */
  private serve404(res: ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end('<h1>404 - Not Found</h1>')
  }

  /**
   * Serve 500 error
   */
  private serve500(res: ServerResponse, error: any): void {
    res.writeHead(500, { 'Content-Type': 'text/html' })
    res.end(`<h1>500 - Internal Server Error</h1><pre>${error.message}</pre>`)
  }

  /**
   * Generate dashboard HTML
   */
  private generateDashboardHTML(dashboard: Dashboard): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${dashboard.title}</title>
    <link rel="stylesheet" href="/static/dashboard.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="dashboard-container">
        <header class="dashboard-header">
            <h1>${dashboard.title}</h1>
            <p>${dashboard.description}</p>
            <div class="dashboard-controls">
                <button onclick="refreshDashboard()" class="refresh-btn">Refresh</button>
                <span class="last-updated" id="last-updated">Loading...</span>
            </div>
        </header>

        <div class="dashboard-grid" style="grid-template-columns: repeat(12, 1fr);">
            ${dashboard.widgets.map(widget => `
            <div class="widget" 
                 style="grid-column: span ${widget.position.width}; grid-row: span ${widget.position.height};"
                 data-widget-id="${widget.id}">
                <div class="widget-header">
                    <h3>${widget.title}</h3>
                    <div class="widget-controls">
                        <span class="widget-status" id="status-${widget.id}">●</span>
                    </div>
                </div>
                <div class="widget-content" id="content-${widget.id}">
                    <div class="loading">Loading...</div>
                </div>
            </div>
            `).join('')}
        </div>
    </div>

    <script src="/static/dashboard.js"></script>
    <script>
        const dashboardId = '${dashboard.id}';
        const refreshInterval = ${dashboard.refreshInterval};
        const autoRefresh = ${dashboard.autoRefresh};
        
        // Initialize dashboard
        initializeDashboard(dashboardId, refreshInterval, autoRefresh);
    </script>
</body>
</html>`
  }

  /**
   * Generate static dashboard files
   */
  private generateStaticDashboards(): void {
    this.dashboards.forEach(dashboard => {
      this.generateDashboardFile(dashboard)
    })
  }

  /**
   * Generate dashboard file
   */
  private generateDashboardFile(dashboard: Dashboard): void {
    const html = this.generateDashboardHTML(dashboard)
    const filepath = join(this.dashboardsDir, `${dashboard.id}.html`)
    writeFileSync(filepath, html)
  }

  /**
   * Start data collection
   */
  private startDataCollection(): void {
    // Simulate data collection for widgets
    setInterval(() => {
      this.dashboards.forEach(dashboard => {
        dashboard.widgets.forEach(widget => {
          const data = this.generateWidgetData(widget)
          this.updateDashboardData(dashboard.id, widget.id, data)
        })
      })
    }, 30000) // Update every 30 seconds

    // Initial data collection
    this.dashboards.forEach(dashboard => {
      dashboard.widgets.forEach(widget => {
        const data = this.generateWidgetData(widget)
        this.updateDashboardData(dashboard.id, widget.id, data)
      })
    })
  }

  /**
   * Generate widget data
   */
  private generateWidgetData(widget: DashboardWidget): any {
    switch (widget.type) {
      case 'metric':
        return {
          value: Math.floor(Math.random() * 100),
          unit: widget.config.unit || '',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          change: (Math.random() * 10 - 5).toFixed(1)
        }
      
      case 'chart':
        return {
          labels: ['1h', '2h', '3h', '4h', '5h', '6h'],
          datasets: [{
            label: widget.title,
            data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 100)),
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)'
          }]
        }
      
      case 'status':
        const statuses = ['healthy', 'warning', 'critical']
        return {
          status: statuses[Math.floor(Math.random() * statuses.length)],
          message: 'System is operating normally',
          lastChecked: new Date().toISOString()
        }
      
      case 'table':
        return {
          headers: ['Environment', 'Status', 'Health Score', 'Last Updated'],
          rows: [
            ['Production', 'Healthy', '95%', '2 min ago'],
            ['Test', 'Healthy', '88%', '1 min ago'],
            ['Training', 'Warning', '72%', '3 min ago']
          ]
        }
      
      case 'alert-list':
        return {
          alerts: [
            { id: 1, severity: 'warning', message: 'High memory usage detected', time: '5 min ago' },
            { id: 2, severity: 'info', message: 'Clone operation completed', time: '10 min ago' }
          ]
        }
      
      case 'progress':
        return {
          current: Math.floor(Math.random() * 100),
          total: 100,
          label: 'Clone Progress',
          status: 'in_progress'
        }
      
      default:
        return { value: 'No data' }
    }
  }

  /**
   * Initialize default dashboards
   */
  private initializeDefaultDashboards(): void {
    const dashboards: Dashboard[] = [
      {
        id: 'operations-overview',
        title: 'Clone Operations Overview',
        description: 'Real-time monitoring of clone operations and system status',
        category: 'operations',
        layout: 'grid',
        refreshInterval: 30000,
        autoRefresh: true,
        public: true,
        widgets: [
          {
            id: 'active-operations',
            title: 'Active Operations',
            type: 'metric',
            dataSource: 'clone_operations_active',
            refreshInterval: 15000,
            position: { x: 0, y: 0, width: 3, height: 2 },
            config: { unit: 'operations' }
          },
          {
            id: 'success-rate',
            title: 'Success Rate',
            type: 'metric',
            dataSource: 'clone_operations_success_rate',
            refreshInterval: 30000,
            position: { x: 3, y: 0, width: 3, height: 2 },
            config: { unit: '%' }
          },
          {
            id: 'operations-timeline',
            title: 'Operations Timeline',
            type: 'chart',
            dataSource: 'clone_operations_timeline',
            refreshInterval: 60000,
            position: { x: 0, y: 2, width: 8, height: 4 },
            config: { chartType: 'line' }
          },
          {
            id: 'environment-status',
            title: 'Environment Status',
            type: 'table',
            dataSource: 'environment_health',
            refreshInterval: 30000,
            position: { x: 8, y: 0, width: 4, height: 6 },
            config: {}
          }
        ]
      },
      {
        id: 'system-health',
        title: 'System Health Dashboard',
        description: 'Comprehensive system health monitoring and diagnostics',
        category: 'health',
        layout: 'grid',
        refreshInterval: 60000,
        autoRefresh: true,
        public: true,
        widgets: [
          {
            id: 'overall-health',
            title: 'Overall Health',
            type: 'status',
            dataSource: 'system_health_overall',
            refreshInterval: 30000,
            position: { x: 0, y: 0, width: 4, height: 3 },
            config: {}
          },
          {
            id: 'memory-usage',
            title: 'Memory Usage',
            type: 'metric',
            dataSource: 'system_memory_usage',
            refreshInterval: 30000,
            position: { x: 4, y: 0, width: 2, height: 3 },
            config: { unit: 'MB' }
          },
          {
            id: 'cpu-usage',
            title: 'CPU Usage',
            type: 'metric',
            dataSource: 'system_cpu_usage',
            refreshInterval: 30000,
            position: { x: 6, y: 0, width: 2, height: 3 },
            config: { unit: '%' }
          },
          {
            id: 'active-alerts',
            title: 'Active Alerts',
            type: 'alert-list',
            dataSource: 'system_alerts',
            refreshInterval: 15000,
            position: { x: 8, y: 0, width: 4, height: 6 },
            config: {}
          },
          {
            id: 'performance-chart',
            title: 'Performance Metrics',
            type: 'chart',
            dataSource: 'system_performance',
            refreshInterval: 60000,
            position: { x: 0, y: 3, width: 8, height: 3 },
            config: { chartType: 'line' }
          }
        ]
      },
      {
        id: 'security-monitoring',
        title: 'Security Monitoring',
        description: 'Security events, access control, and production safety monitoring',
        category: 'security',
        layout: 'grid',
        refreshInterval: 30000,
        autoRefresh: true,
        public: false,
        widgets: [
          {
            id: 'production-access',
            title: 'Production Access Attempts',
            type: 'metric',
            dataSource: 'production_access_attempts',
            refreshInterval: 15000,
            position: { x: 0, y: 0, width: 3, height: 2 },
            config: { unit: 'attempts' }
          },
          {
            id: 'blocked-attempts',
            title: 'Blocked Attempts',
            type: 'metric',
            dataSource: 'production_access_blocked',
            refreshInterval: 15000,
            position: { x: 3, y: 0, width: 3, height: 2 },
            config: { unit: 'blocked' }
          },
          {
            id: 'security-alerts',
            title: 'Security Alerts',
            type: 'alert-list',
            dataSource: 'security_alerts',
            refreshInterval: 10000,
            position: { x: 6, y: 0, width: 6, height: 4 },
            config: {}
          },
          {
            id: 'audit-activity',
            title: 'Audit Activity',
            type: 'chart',
            dataSource: 'audit_activity',
            refreshInterval: 60000,
            position: { x: 0, y: 2, width: 6, height: 4 },
            config: { chartType: 'bar' }
          }
        ]
      }
    ]

    dashboards.forEach(dashboard => {
      this.createDashboard(dashboard)
    })
  }

  /**
   * Create static assets
   */
  private createStaticAssets(): void {
    // Create CSS file
    const cssPath = join(this.staticDir, 'dashboard.css')
    if (!existsSync(cssPath)) {
      writeFileSync(cssPath, this.getDashboardCSS())
    }

    // Create JS file
    const jsPath = join(this.staticDir, 'dashboard.js')
    if (!existsSync(jsPath)) {
      writeFileSync(jsPath, this.getDashboardJS())
    }
  }

  /**
   * Get dashboard CSS
   */
  private getDashboardCSS(): string {
    return `
/* Dashboard System CSS */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f5f7fa;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    text-align: center;
    margin-bottom: 40px;
    padding: 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 10px;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.dashboard-card {
    background: white;
    padding: 25px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.dashboard-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.dashboard-meta {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
    font-size: 0.9em;
    color: #666;
}

.category {
    background: #e3f2fd;
    color: #1976d2;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8em;
}

.dashboard-container {
    padding: 20px;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding: 20px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dashboard-controls {
    display: flex;
    align-items: center;
    gap: 15px;
}

.refresh-btn {
    background: #667eea;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9em;
}

.refresh-btn:hover {
    background: #5a6fd8;
}

.last-updated {
    color: #666;
    font-size: 0.9em;
}

.widget {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
    background: #fafafa;
}

.widget-header h3 {
    font-size: 1.1em;
    color: #333;
}

.widget-status {
    font-size: 1.2em;
    color: #28a745;
}

.widget-content {
    padding: 20px;
    height: calc(100% - 60px);
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading {
    color: #666;
    font-style: italic;
}

.metric-value {
    font-size: 2.5em;
    font-weight: bold;
    color: #667eea;
    text-align: center;
}

.metric-unit {
    font-size: 0.6em;
    color: #666;
    margin-left: 5px;
}

.status-healthy { color: #28a745; }
.status-warning { color: #ffc107; }
.status-critical { color: #dc3545; }

.alert-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.alert-item:last-child {
    border-bottom: none;
}

.alert-severity {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.8em;
    font-weight: bold;
}

.alert-severity.warning {
    background: #fff3cd;
    color: #856404;
}

.alert-severity.critical {
    background: #f8d7da;
    color: #721c24;
}

.progress-bar {
    width: 100%;
    height: 20px;
    background: #e9ecef;
    border-radius: 10px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transition: width 0.3s ease;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

th {
    background: #f8f9fa;
    font-weight: 600;
    color: #495057;
}
`
  }

  /**
   * Get dashboard JavaScript
   */
  private getDashboardJS(): string {
    return `
// Dashboard System JavaScript
let dashboardData = {};
let refreshTimer = null;

function initializeDashboard(dashboardId, refreshInterval, autoRefresh) {
    console.log('Initializing dashboard:', dashboardId);
    
    // Load initial data
    refreshDashboard();
    
    // Set up auto-refresh
    if (autoRefresh) {
        refreshTimer = setInterval(refreshDashboard, refreshInterval);
    }
}

async function refreshDashboard() {
    try {
        const response = await fetch(\`/api/data/\${dashboardId}\`);
        const data = await response.json();
        
        dashboardData = data;
        updateWidgets(data.widgets);
        updateLastUpdated(data.timestamp);
        
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showError('Failed to refresh dashboard data');
    }
}

function updateWidgets(widgets) {
    Object.entries(widgets).forEach(([widgetId, data]) => {
        updateWidget(widgetId, data);
    });
}

function updateWidget(widgetId, data) {
    const contentElement = document.getElementById(\`content-\${widgetId}\`);
    const statusElement = document.getElementById(\`status-\${widgetId}\`);
    
    if (!contentElement) return;
    
    // Update status indicator
    if (statusElement) {
        statusElement.style.color = '#28a745'; // Green for active
    }
    
    // Update content based on widget type
    const widget = document.querySelector(\`[data-widget-id="\${widgetId}"]\`);
    const widgetType = getWidgetType(widget);
    
    switch (widgetType) {
        case 'metric':
            updateMetricWidget(contentElement, data);
            break;
        case 'chart':
            updateChartWidget(contentElement, data, widgetId);
            break;
        case 'status':
            updateStatusWidget(contentElement, data);
            break;
        case 'table':
            updateTableWidget(contentElement, data);
            break;
        case 'alert-list':
            updateAlertListWidget(contentElement, data);
            break;
        case 'progress':
            updateProgressWidget(contentElement, data);
            break;
        default:
            contentElement.innerHTML = \`<div class="loading">Unknown widget type</div>\`;
    }
}

function getWidgetType(widget) {
    // In a real implementation, this would be stored as a data attribute
    // For now, we'll infer from the widget ID
    const widgetId = widget.getAttribute('data-widget-id');
    
    if (widgetId.includes('chart') || widgetId.includes('timeline')) return 'chart';
    if (widgetId.includes('status') || widgetId.includes('health')) return 'status';
    if (widgetId.includes('table') || widgetId.includes('environment')) return 'table';
    if (widgetId.includes('alert')) return 'alert-list';
    if (widgetId.includes('progress')) return 'progress';
    
    return 'metric'; // Default
}

function updateMetricWidget(element, data) {
    const trend = data.trend === 'up' ? '↗' : '↘';
    const trendColor = data.trend === 'up' ? '#28a745' : '#dc3545';
    
    element.innerHTML = \`
        <div class="metric-value">
            \${data.value}<span class="metric-unit">\${data.unit}</span>
        </div>
        <div style="margin-top: 10px; color: \${trendColor};">
            \${trend} \${data.change}% from last period
        </div>
    \`;
}

function updateChartWidget(element, data, widgetId) {
    // Create canvas for chart
    element.innerHTML = \`<canvas id="chart-\${widgetId}" width="400" height="200"></canvas>\`;
    
    const ctx = document.getElementById(\`chart-\${widgetId}\`).getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateStatusWidget(element, data) {
    const statusClass = \`status-\${data.status}\`;
    const statusIcon = data.status === 'healthy' ? '✓' : data.status === 'warning' ? '⚠' : '✗';
    
    element.innerHTML = \`
        <div style="text-align: center;">
            <div style="font-size: 3em; margin-bottom: 10px;" class="\${statusClass}">
                \${statusIcon}
            </div>
            <div style="font-size: 1.2em; margin-bottom: 5px;" class="\${statusClass}">
                \${data.status.toUpperCase()}
            </div>
            <div style="color: #666;">
                \${data.message}
            </div>
            <div style="font-size: 0.9em; color: #999; margin-top: 10px;">
                Last checked: \${new Date(data.lastChecked).toLocaleTimeString()}
            </div>
        </div>
    \`;
}

function updateTableWidget(element, data) {
    let html = '<table><thead><tr>';
    
    data.headers.forEach(header => {
        html += \`<th>\${header}</th>\`;
    });
    
    html += '</tr></thead><tbody>';
    
    data.rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
            html += \`<td>\${cell}</td>\`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    element.innerHTML = html;
}

function updateAlertListWidget(element, data) {
    if (!data.alerts || data.alerts.length === 0) {
        element.innerHTML = '<div style="text-align: center; color: #28a745;">No active alerts</div>';
        return;
    }
    
    let html = '';
    data.alerts.forEach(alert => {
        html += \`
            <div class="alert-item">
                <div>
                    <span class="alert-severity \${alert.severity}">\${alert.severity.toUpperCase()}</span>
                    <div style="margin-top: 5px;">\${alert.message}</div>
                </div>
                <div style="color: #666; font-size: 0.9em;">
                    \${alert.time}
                </div>
            </div>
        \`;
    });
    
    element.innerHTML = html;
}

function updateProgressWidget(element, data) {
    const percentage = Math.round((data.current / data.total) * 100);
    
    element.innerHTML = \`
        <div style="width: 100%;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>\${data.label}</span>
                <span>\${percentage}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: \${percentage}%"></div>
            </div>
            <div style="text-align: center; margin-top: 10px; color: #666;">
                \${data.current} / \${data.total}
            </div>
        </div>
    \`;
}

function updateLastUpdated(timestamp) {
    const element = document.getElementById('last-updated');
    if (element) {
        element.textContent = \`Last updated: \${new Date(timestamp).toLocaleTimeString()}\`;
    }
}

function showError(message) {
    // Simple error display
    console.error(message);
    
    // You could implement a toast notification system here
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1000;
    \`;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        document.body.removeChild(errorDiv);
    }, 5000);
}

// Global refresh function
function refreshDashboard() {
    if (typeof dashboardId !== 'undefined') {
        initializeDashboard(dashboardId, refreshInterval, false);
    }
}
`
  }
}