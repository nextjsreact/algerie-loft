/**
 * Logo Health Monitoring System
 * Tracks logo loading performance and failures in real-time
 */

interface LogoHealthMetrics {
  totalAttempts: number;
  successfulLoads: number;
  failedLoads: number;
  averageLoadTime: number;
  lastFailure?: {
    timestamp: Date;
    src: string;
    error: string;
  };
}

interface LogoLoadEvent {
  timestamp: Date;
  src: string;
  success: boolean;
  loadTime: number;
  error?: string;
  variant: 'header' | 'hero' | 'footer';
}

class LogoHealthMonitor {
  private metrics: LogoHealthMetrics = {
    totalAttempts: 0,
    successfulLoads: 0,
    failedLoads: 0,
    averageLoadTime: 0
  };

  private events: LogoLoadEvent[] = [];
  private maxEvents = 100; // Keep last 100 events
  private alertThreshold = 0.7; // Alert if success rate drops below 70%

  /**
   * Record a logo loading attempt
   */
  recordLoadAttempt(
    src: string,
    success: boolean,
    loadTime: number,
    variant: 'header' | 'hero' | 'footer',
    error?: string
  ): void {
    const event: LogoLoadEvent = {
      timestamp: new Date(),
      src,
      success,
      loadTime,
      error,
      variant
    };

    // Add to events history
    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // Update metrics
    this.updateMetrics(event);

    // Log the event
    if (success) {
      console.log(`✅ Logo loaded: ${src} (${loadTime.toFixed(2)}ms) [${variant}]`);
    } else {
      console.error(`❌ Logo failed: ${src} [${variant}]`, error);
    }

    // Check for alerts
    this.checkHealthAlerts();
  }

  /**
   * Update health metrics
   */
  private updateMetrics(event: LogoLoadEvent): void {
    this.metrics.totalAttempts++;
    
    if (event.success) {
      this.metrics.successfulLoads++;
      
      // Update average load time (only for successful loads)
      const totalSuccessTime = this.metrics.averageLoadTime * (this.metrics.successfulLoads - 1) + event.loadTime;
      this.metrics.averageLoadTime = totalSuccessTime / this.metrics.successfulLoads;
    } else {
      this.metrics.failedLoads++;
      this.metrics.lastFailure = {
        timestamp: event.timestamp,
        src: event.src,
        error: event.error || 'Unknown error'
      };
    }
  }

  /**
   * Check if health alerts should be triggered
   */
  private checkHealthAlerts(): void {
    const successRate = this.getSuccessRate();
    
    if (successRate < this.alertThreshold && this.metrics.totalAttempts >= 5) {
      console.warn(`🚨 Logo Health Alert: Success rate dropped to ${(successRate * 100).toFixed(1)}%`);
      this.triggerHealthAlert(successRate);
    }

    // Alert for consistently slow loading
    if (this.metrics.averageLoadTime > 3000 && this.metrics.successfulLoads >= 3) {
      console.warn(`⏰ Logo Performance Alert: Average load time is ${this.metrics.averageLoadTime.toFixed(0)}ms`);
    }
  }

  /**
   * Trigger health alert (can be extended to send notifications)
   */
  private triggerHealthAlert(successRate: number): void {
    const alert = {
      type: 'logo_health_degraded',
      timestamp: new Date(),
      successRate,
      metrics: { ...this.metrics },
      recentFailures: this.getRecentFailures(5)
    };

    // In a real application, this could send alerts to monitoring systems
    console.group('🚨 Logo Health Alert');
    console.error('Success Rate:', `${(successRate * 100).toFixed(1)}%`);
    console.error('Recent Failures:', alert.recentFailures);
    console.error('Metrics:', alert.metrics);
    console.groupEnd();
  }

  /**
   * Get current health metrics
   */
  getHealthMetrics(): LogoHealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Get success rate (0-1)
   */
  getSuccessRate(): number {
    if (this.metrics.totalAttempts === 0) return 1;
    return this.metrics.successfulLoads / this.metrics.totalAttempts;
  }

  /**
   * Get recent loading events
   */
  getRecentEvents(count: number = 10): LogoLoadEvent[] {
    return this.events.slice(0, count);
  }

  /**
   * Get recent failures
   */
  getRecentFailures(count: number = 5): LogoLoadEvent[] {
    return this.events
      .filter(event => !event.success)
      .slice(0, count);
  }

  /**
   * Get performance statistics by variant
   */
  getPerformanceByVariant(): Record<string, { avgLoadTime: number; successRate: number; count: number }> {
    const stats: Record<string, { totalTime: number; successes: number; total: number }> = {};

    this.events.forEach(event => {
      if (!stats[event.variant]) {
        stats[event.variant] = { totalTime: 0, successes: 0, total: 0 };
      }

      stats[event.variant].total++;
      if (event.success) {
        stats[event.variant].successes++;
        stats[event.variant].totalTime += event.loadTime;
      }
    });

    const result: Record<string, { avgLoadTime: number; successRate: number; count: number }> = {};
    
    Object.entries(stats).forEach(([variant, data]) => {
      result[variant] = {
        avgLoadTime: data.successes > 0 ? data.totalTime / data.successes : 0,
        successRate: data.total > 0 ? data.successes / data.total : 0,
        count: data.total
      };
    });

    return result;
  }

  /**
   * Generate health report
   */
  generateHealthReport(): string {
    const metrics = this.getHealthMetrics();
    const successRate = this.getSuccessRate();
    const performanceByVariant = this.getPerformanceByVariant();

    let report = `📊 Logo Health Report\n`;
    report += `==================\n`;
    report += `Total Attempts: ${metrics.totalAttempts}\n`;
    report += `Success Rate: ${(successRate * 100).toFixed(1)}%\n`;
    report += `Average Load Time: ${metrics.averageLoadTime.toFixed(0)}ms\n`;
    
    if (metrics.lastFailure) {
      report += `Last Failure: ${metrics.lastFailure.src} at ${metrics.lastFailure.timestamp.toLocaleString()}\n`;
    }

    report += `\nPerformance by Variant:\n`;
    Object.entries(performanceByVariant).forEach(([variant, stats]) => {
      report += `  ${variant}: ${stats.count} loads, ${(stats.successRate * 100).toFixed(1)}% success, ${stats.avgLoadTime.toFixed(0)}ms avg\n`;
    });

    return report;
  }

  /**
   * Reset all metrics and events
   */
  reset(): void {
    this.metrics = {
      totalAttempts: 0,
      successfulLoads: 0,
      failedLoads: 0,
      averageLoadTime: 0
    };
    this.events = [];
    console.log('🔄 Logo health monitor reset');
  }

  /**
   * Export data for analysis
   */
  exportData(): { metrics: LogoHealthMetrics; events: LogoLoadEvent[] } {
    return {
      metrics: { ...this.metrics },
      events: [...this.events]
    };
  }
}

// Export singleton instance
export const logoHealthMonitor = new LogoHealthMonitor();

// Utility function to easily record logo events
export function recordLogoLoad(
  src: string,
  success: boolean,
  loadTime: number,
  variant: 'header' | 'hero' | 'footer',
  error?: string
): void {
  logoHealthMonitor.recordLoadAttempt(src, success, loadTime, variant, error);
}

// Development helper to log health report
export function logHealthReport(): void {
  console.log(logoHealthMonitor.generateHealthReport());
}