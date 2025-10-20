// Uptime monitoring utilities
interface UptimeCheck {
  url: string;
  name: string;
  expectedStatus: number;
  timeout: number;
}

interface UptimeResult {
  name: string;
  url: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: string;
}

export class UptimeMonitor {
  private checks: UptimeCheck[] = [];
  private results: UptimeResult[] = [];

  constructor() {
    this.setupDefaultChecks();
  }

  private setupDefaultChecks() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    this.checks = [
      {
        url: `${baseUrl}/`,
        name: 'Homepage',
        expectedStatus: 200,
        timeout: 5000
      },
      {
        url: `${baseUrl}/api/health`,
        name: 'Health API',
        expectedStatus: 200,
        timeout: 3000
      },
      {
        url: `${baseUrl}/services`,
        name: 'Services Page',
        expectedStatus: 200,
        timeout: 5000
      },
      {
        url: `${baseUrl}/contact`,
        name: 'Contact Page',
        expectedStatus: 200,
        timeout: 5000
      }
    ];
  }

  async runChecks(): Promise<UptimeResult[]> {
    const results: UptimeResult[] = [];

    for (const check of this.checks) {
      const result = await this.performCheck(check);
      results.push(result);
    }

    this.results = results;
    return results;
  }

  private async performCheck(check: UptimeCheck): Promise<UptimeResult> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), check.timeout);

      const response = await fetch(check.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Uptime-Monitor/1.0'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        name: check.name,
        url: check.url,
        status: response.status === check.expectedStatus ? 'up' : 'degraded',
        responseTime,
        statusCode: response.status,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        name: check.name,
        url: check.url,
        status: 'down',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  getStatus(): 'up' | 'down' | 'degraded' {
    if (this.results.length === 0) return 'down';

    const upCount = this.results.filter(r => r.status === 'up').length;
    const downCount = this.results.filter(r => r.status === 'down').length;

    if (downCount > 0) return 'down';
    if (upCount === this.results.length) return 'up';
    return 'degraded';
  }

  getAverageResponseTime(): number {
    if (this.results.length === 0) return 0;
    
    const totalTime = this.results.reduce((sum, result) => sum + result.responseTime, 0);
    return Math.round(totalTime / this.results.length);
  }

  // Integration with external monitoring services
  async reportToUptimeRobot(results: UptimeResult[]) {
    const apiKey = process.env.UPTIME_ROBOT_API_KEY;
    if (!apiKey) return;

    // Implementation for UptimeRobot API integration
    // This would typically be done server-side
    console.log('Reporting to UptimeRobot:', results);
  }

  async reportToPingdom(results: UptimeResult[]) {
    const apiKey = process.env.PINGDOM_API_KEY;
    if (!apiKey) return;

    // Implementation for Pingdom API integration
    console.log('Reporting to Pingdom:', results);
  }
}

// Singleton instance
export const uptimeMonitor = new UptimeMonitor();