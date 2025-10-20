import * as Sentry from '@sentry/nextjs';

export interface UptimeConfig {
  endpoints: string[];
  interval: number; // in milliseconds
  timeout: number; // in milliseconds
  retries: number;
}

export interface UptimeResult {
  endpoint: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: number;
}

export class UptimeMonitor {
  private static instance: UptimeMonitor;
  private config: UptimeConfig;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private results: Map<string, UptimeResult[]> = new Map();

  constructor(config: UptimeConfig) {
    this.config = config;
  }

  static getInstance(config?: UptimeConfig): UptimeMonitor {
    if (!UptimeMonitor.instance) {
      if (!config) {
        throw new Error('UptimeMonitor requires config on first initialization');
      }
      UptimeMonitor.instance = new UptimeMonitor(config);
    }
    return UptimeMonitor.instance;
  }

  // Check a single endpoint
  async checkEndpoint(endpoint: string): Promise<UptimeResult> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const result: UptimeResult = {
        endpoint,
        status: response.ok ? 'up' : 'degraded',
        responseTime,
        statusCode: response.status,
        timestamp: Date.now(),
      };

      // Log slow responses
      if (responseTime > 2000) {
        console.warn(`[Uptime] Slow response from ${endpoint}: ${responseTime}ms`);
        result.status = 'degraded';
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: UptimeResult = {
        endpoint,
        status: 'down',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };

      console.error(`[Uptime] Endpoint ${endpoint} is down:`, error);
      
      // Send to Sentry
      Sentry.captureMessage(`Uptime check failed: ${endpoint}`, {
        level: 'error',
        tags: {
          monitoring: 'uptime',
          endpoint,
        },
        extra: {
          error: result.error,
          responseTime,
        },
      });

      return result;
    }
  }

  // Check endpoint with retries
  async checkEndpointWithRetries(endpoint: string): Promise<UptimeResult> {
    let lastResult: UptimeResult;
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      lastResult = await this.checkEndpoint(endpoint);
      
      if (lastResult.status === 'up') {
        return lastResult;
      }
      
      if (attempt < this.config.retries) {
        console.log(`[Uptime] Retrying ${endpoint} (attempt ${attempt + 1}/${this.config.retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
    
    return lastResult!;
  }

  // Start monitoring all endpoints
  startMonitoring() {
    if (typeof window !== 'undefined') {
      console.warn('[Uptime] Uptime monitoring should run on server-side only');
      return;
    }

    this.config.endpoints.forEach(endpoint => {
      const intervalId = setInterval(async () => {
        const result = await this.checkEndpointWithRetries(endpoint);
        this.storeResult(endpoint, result);
        
        // Send alerts for down endpoints
        if (result.status === 'down') {
          this.sendAlert(result);
        }
      }, this.config.interval);

      this.intervals.set(endpoint, intervalId);
    });

    console.log(`[Uptime] Started monitoring ${this.config.endpoints.length} endpoints`);
  }

  // Stop monitoring
  stopMonitoring() {
    this.intervals.forEach((intervalId, endpoint) => {
      clearInterval(intervalId);
      console.log(`[Uptime] Stopped monitoring ${endpoint}`);
    });
    this.intervals.clear();
  }

  // Store result in memory (in production, you'd want to use a database)
  private storeResult(endpoint: string, result: UptimeResult) {
    if (!this.results.has(endpoint)) {
      this.results.set(endpoint, []);
    }
    
    const results = this.results.get(endpoint)!;
    results.push(result);
    
    // Keep only last 100 results per endpoint
    if (results.length > 100) {
      results.shift();
    }
  }

  // Send alert for down endpoints
  private sendAlert(result: UptimeResult) {
    console.error(`[Uptime Alert] ${result.endpoint} is DOWN`);
    
    // Send to Sentry
    Sentry.captureMessage(`Service Down: ${result.endpoint}`, {
      level: 'error',
      tags: {
        monitoring: 'uptime-alert',
        endpoint: result.endpoint,
      },
      extra: {
        status: result.status,
        error: result.error,
        responseTime: result.responseTime,
      },
    });

    // Here you could also send to other alerting systems:
    // - Email notifications
    // - Slack webhooks
    // - PagerDuty
    // - Discord webhooks
  }

  // Get uptime statistics
  getUptimeStats(endpoint: string, hours: number = 24): {
    uptime: number;
    avgResponseTime: number;
    totalChecks: number;
    downtime: number;
  } {
    const results = this.results.get(endpoint) || [];
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const recentResults = results.filter(r => r.timestamp > cutoff);
    
    if (recentResults.length === 0) {
      return {
        uptime: 0,
        avgResponseTime: 0,
        totalChecks: 0,
        downtime: 0,
      };
    }

    const upChecks = recentResults.filter(r => r.status === 'up').length;
    const totalChecks = recentResults.length;
    const uptime = (upChecks / totalChecks) * 100;
    const avgResponseTime = recentResults.reduce((sum, r) => sum + r.responseTime, 0) / totalChecks;
    const downtime = 100 - uptime;

    return {
      uptime,
      avgResponseTime,
      totalChecks,
      downtime,
    };
  }

  // Get all results for an endpoint
  getResults(endpoint: string): UptimeResult[] {
    return this.results.get(endpoint) || [];
  }

  // Get current status of all endpoints
  getCurrentStatus(): Record<string, UptimeResult | null> {
    const status: Record<string, UptimeResult | null> = {};
    
    this.config.endpoints.forEach(endpoint => {
      const results = this.results.get(endpoint);
      status[endpoint] = results && results.length > 0 ? results[results.length - 1] : null;
    });
    
    return status;
  }
}

// Default configuration for the public website
export const defaultUptimeConfig: UptimeConfig = {
  endpoints: [
    '/', // Homepage
    '/api/health', // Health check endpoint
    '/api/contact', // Contact form endpoint
    '/api/analytics/web-vitals', // Analytics endpoint
  ],
  interval: 60000, // Check every minute
  timeout: 10000, // 10 second timeout
  retries: 3, // Retry 3 times before marking as down
};

// Initialize uptime monitoring (server-side only)
export function initUptimeMonitoring(config: UptimeConfig = defaultUptimeConfig) {
  if (typeof window !== 'undefined') {
    console.warn('[Uptime] Skipping uptime monitoring on client-side');
    return null;
  }

  try {
    const monitor = UptimeMonitor.getInstance(config);
    monitor.startMonitoring();
    return monitor;
  } catch (error) {
    console.error('[Uptime] Failed to initialize uptime monitoring:', error);
    Sentry.captureException(error, {
      tags: {
        component: 'uptime-monitoring',
      },
    });
    return null;
  }
}