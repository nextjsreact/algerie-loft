/**
 * Load Testing Utilities for Multi-Role Booking System
 * 
 * Provides utilities for performance testing and load simulation
 */

export interface LoadTestConfig {
  concurrentUsers: number;
  testDuration: number; // in milliseconds
  requestsPerSecond: number;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  headers?: Record<string, string>;
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errors: Array<{
    status: number;
    message: string;
    count: number;
  }>;
}

export class LoadTester {
  private results: LoadTestResult = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    requestsPerSecond: 0,
    errors: []
  };

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    const startTime = Date.now();
    const endTime = startTime + config.testDuration;
    const requestInterval = 1000 / config.requestsPerSecond;
    
    const responseTimes: number[] = [];
    const errors: Map<string, number> = new Map();

    // Create concurrent user sessions
    const userPromises = Array.from({ length: config.concurrentUsers }, async (_, userIndex) => {
      while (Date.now() < endTime) {
        const requestStart = Date.now();
        
        try {
          const response = await fetch(config.endpoint, {
            method: config.method,
            headers: {
              'Content-Type': 'application/json',
              ...config.headers
            },
            body: config.payload ? JSON.stringify(config.payload) : undefined
          });

          const requestEnd = Date.now();
          const responseTime = requestEnd - requestStart;
          
          responseTimes.push(responseTime);
          this.results.totalRequests++;

          if (response.ok) {
            this.results.successfulRequests++;
          } else {
            this.results.failedRequests++;
            const errorKey = `${response.status}: ${response.statusText}`;
            errors.set(errorKey, (errors.get(errorKey) || 0) + 1);
          }

          // Update min/max response times
          this.results.minResponseTime = Math.min(this.results.minResponseTime, responseTime);
          this.results.maxResponseTime = Math.max(this.results.maxResponseTime, responseTime);

        } catch (error) {
          this.results.failedRequests++;
          this.results.totalRequests++;
          const errorKey = `Network Error: ${error instanceof Error ? error.message : 'Unknown'}`;
          errors.set(errorKey, (errors.get(errorKey) || 0) + 1);
        }

        // Wait for next request interval
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }
    });

    await Promise.all(userPromises);

    // Calculate final metrics
    const totalTime = Date.now() - startTime;
    this.results.averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    this.results.requestsPerSecond = this.results.totalRequests / (totalTime / 1000);
    this.results.errors = Array.from(errors.entries()).map(([message, count]) => ({
      status: parseInt(message.split(':')[0]) || 0,
      message,
      count
    }));

    return this.results;
  }

  async testSearchPerformance(): Promise<LoadTestResult> {
    return this.runLoadTest({
      concurrentUsers: 20,
      testDuration: 30000, // 30 seconds
      requestsPerSecond: 10,
      endpoint: '/api/lofts/search',
      method: 'POST',
      payload: {
        check_in: '2024-12-01',
        check_out: '2024-12-03',
        guests: 2,
        location: 'Test City'
      }
    });
  }

  async testBookingPerformance(authToken: string): Promise<LoadTestResult> {
    return this.runLoadTest({
      concurrentUsers: 10,
      testDuration: 20000, // 20 seconds
      requestsPerSecond: 5,
      endpoint: '/api/bookings',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      payload: {
        loft_id: 'test-loft-id',
        check_in: '2024-12-01',
        check_out: '2024-12-03',
        guests: 2,
        total_price: 200
      }
    });
  }

  async testPartnerDashboardPerformance(authToken: string): Promise<LoadTestResult> {
    return this.runLoadTest({
      concurrentUsers: 15,
      testDuration: 25000, // 25 seconds
      requestsPerSecond: 8,
      endpoint: '/api/partner/dashboard',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }
}

export class PerformanceMonitor {
  private metrics: Array<{
    timestamp: number;
    endpoint: string;
    responseTime: number;
    status: number;
    userRole: string;
  }> = [];

  recordRequest(endpoint: string, responseTime: number, status: number, userRole: string) {
    this.metrics.push({
      timestamp: Date.now(),
      endpoint,
      responseTime,
      status,
      userRole
    });
  }

  getAverageResponseTime(endpoint?: string, userRole?: string): number {
    let filteredMetrics = this.metrics;
    
    if (endpoint) {
      filteredMetrics = filteredMetrics.filter(m => m.endpoint === endpoint);
    }
    
    if (userRole) {
      filteredMetrics = filteredMetrics.filter(m => m.userRole === userRole);
    }

    if (filteredMetrics.length === 0) return 0;
    
    return filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / filteredMetrics.length;
  }

  getErrorRate(endpoint?: string, userRole?: string): number {
    let filteredMetrics = this.metrics;
    
    if (endpoint) {
      filteredMetrics = filteredMetrics.filter(m => m.endpoint === endpoint);
    }
    
    if (userRole) {
      filteredMetrics = filteredMetrics.filter(m => m.userRole === userRole);
    }

    if (filteredMetrics.length === 0) return 0;
    
    const errorCount = filteredMetrics.filter(m => m.status >= 400).length;
    return (errorCount / filteredMetrics.length) * 100;
  }

  getRequestsPerSecond(timeWindow: number = 60000): number {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp <= timeWindow);
    return recentMetrics.length / (timeWindow / 1000);
  }

  generateReport(): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    requestsPerSecond: number;
    endpointBreakdown: Array<{
      endpoint: string;
      requests: number;
      averageResponseTime: number;
      errorRate: number;
    }>;
    roleBreakdown: Array<{
      role: string;
      requests: number;
      averageResponseTime: number;
      errorRate: number;
    }>;
  } {
    const endpoints = [...new Set(this.metrics.map(m => m.endpoint))];
    const roles = [...new Set(this.metrics.map(m => m.userRole))];

    return {
      totalRequests: this.metrics.length,
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      requestsPerSecond: this.getRequestsPerSecond(),
      endpointBreakdown: endpoints.map(endpoint => ({
        endpoint,
        requests: this.metrics.filter(m => m.endpoint === endpoint).length,
        averageResponseTime: this.getAverageResponseTime(endpoint),
        errorRate: this.getErrorRate(endpoint)
      })),
      roleBreakdown: roles.map(role => ({
        role,
        requests: this.metrics.filter(m => m.userRole === role).length,
        averageResponseTime: this.getAverageResponseTime(undefined, role),
        errorRate: this.getErrorRate(undefined, role)
      }))
    };
  }

  clear() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();