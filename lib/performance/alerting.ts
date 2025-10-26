/**
 * Alerting system for performance and system health monitoring
 * Provides configurable alerts with multiple notification channels
 */

import { logger } from '@/lib/logger';
import { PerformanceAlert, SystemHealthMetrics } from './monitoring';

export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  channels: AlertChannel[];
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  timeWindowMinutes: number;
}

export interface AlertChannel {
  type: 'email' | 'webhook' | 'log' | 'console';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertNotification {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  metadata: Record<string, any>;
}

/**
 * Alert manager for handling performance and system alerts
 */
export class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, AlertNotification> = new Map();
  private alertHistory: AlertNotification[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private channels: Map<string, AlertChannelHandler> = new Map();

  constructor() {
    this.setupDefaultChannels();
    this.setupDefaultRules();
  }

  /**
   * Add or update an alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info(`Alert rule added: ${rule.name}`, { ruleId: rule.id });
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      logger.info(`Alert rule removed: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Process performance alert
   */
  async processAlert(alert: PerformanceAlert): Promise<void> {
    // Find matching rules
    const matchingRules = this.findMatchingRules(alert);
    
    for (const rule of matchingRules) {
      if (!rule.enabled) continue;
      
      // Check cooldown
      if (this.isInCooldown(rule.id)) continue;
      
      // Create notification
      const notification = this.createNotification(rule, alert);
      
      // Send notification through configured channels
      await this.sendNotification(notification, rule.channels);
      
      // Track alert
      this.trackAlert(notification);
      this.lastAlertTime.set(rule.id, Date.now());
    }
  }

  /**
   * Process system health metrics and check for alerts
   */
  async processSystemMetrics(metrics: SystemHealthMetrics): Promise<void> {
    for (const [ruleId, rule] of this.rules.entries()) {
      if (!rule.enabled) continue;
      
      const shouldAlert = this.evaluateCondition(rule.condition, metrics);
      
      if (shouldAlert && !this.isInCooldown(ruleId)) {
        const alert: PerformanceAlert = {
          type: 'high_memory', // This would be determined by the rule
          severity: rule.severity,
          message: `System alert: ${rule.name}`,
          timestamp: Date.now(),
          systemMetrics: metrics
        };
        
        await this.processAlert(alert);
      }
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): AlertNotification[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): AlertNotification[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.activeAlerts.delete(alertId);
      
      logger.info(`Alert resolved: ${alert.ruleName}`, { alertId });
      return true;
    }
    return false;
  }

  /**
   * Get alert statistics
   */
  getStats(): AlertStats {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const recentAlerts = this.alertHistory.filter(a => a.timestamp > last24h);
    
    const severityCounts = recentAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRules: this.rules.size,
      activeAlerts: this.activeAlerts.size,
      alertsLast24h: recentAlerts.length,
      severityBreakdown: severityCounts,
      topAlertRules: this.getTopAlertRules(recentAlerts)
    };
  }

  /**
   * Find rules that match the given alert
   */
  private findMatchingRules(alert: PerformanceAlert): AlertRule[] {
    const matchingRules: AlertRule[] = [];
    
    for (const rule of this.rules.values()) {
      if (this.ruleMatches(rule, alert)) {
        matchingRules.push(rule);
      }
    }
    
    return matchingRules;
  }

  /**
   * Check if a rule matches an alert
   */
  private ruleMatches(rule: AlertRule, alert: PerformanceAlert): boolean {
    // This is a simplified matching logic
    // In a real implementation, this would be more sophisticated
    switch (alert.type) {
      case 'slow_response':
        return rule.condition.metric === 'response_time';
      case 'slow_query':
        return rule.condition.metric === 'db_query_time';
      case 'server_error':
        return rule.condition.metric === 'error_rate';
      case 'high_memory':
        return rule.condition.metric === 'memory_usage';
      case 'high_error_rate':
        return rule.condition.metric === 'error_rate';
      default:
        return false;
    }
  }

  /**
   * Evaluate alert condition against metrics
   */
  private evaluateCondition(condition: AlertCondition, metrics: SystemHealthMetrics): boolean {
    let value: number;
    
    switch (condition.metric) {
      case 'memory_usage':
        value = metrics.memoryUsage;
        break;
      case 'error_rate':
        value = metrics.errorRate;
        break;
      case 'response_time':
        value = metrics.responseTimeP95;
        break;
      case 'cache_hit_rate':
        value = metrics.cacheHitRate;
        break;
      default:
        return false;
    }
    
    switch (condition.operator) {
      case 'gt':
        return value > condition.threshold;
      case 'gte':
        return value >= condition.threshold;
      case 'lt':
        return value < condition.threshold;
      case 'lte':
        return value <= condition.threshold;
      case 'eq':
        return value === condition.threshold;
      default:
        return false;
    }
  }

  /**
   * Check if rule is in cooldown period
   */
  private isInCooldown(ruleId: string): boolean {
    const lastAlert = this.lastAlertTime.get(ruleId);
    if (!lastAlert) return false;
    
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    return Date.now() - lastAlert < cooldownMs;
  }

  /**
   * Create notification from rule and alert
   */
  private createNotification(rule: AlertRule, alert: PerformanceAlert): AlertNotification {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      message: alert.message,
      severity: rule.severity,
      timestamp: Date.now(),
      resolved: false,
      metadata: {
        alertType: alert.type,
        originalAlert: alert
      }
    };
  }

  /**
   * Send notification through configured channels
   */
  private async sendNotification(notification: AlertNotification, channels: AlertChannel[]): Promise<void> {
    const promises = channels
      .filter(channel => channel.enabled)
      .map(channel => this.sendToChannel(notification, channel));
    
    await Promise.allSettled(promises);
  }

  /**
   * Send notification to specific channel
   */
  private async sendToChannel(notification: AlertNotification, channel: AlertChannel): Promise<void> {
    const handler = this.channels.get(channel.type);
    if (!handler) {
      logger.warn(`No handler found for channel type: ${channel.type}`);
      return;
    }
    
    try {
      await handler.send(notification, channel.config);
    } catch (error) {
      logger.error(`Failed to send alert to ${channel.type}`, { error, notification });
    }
  }

  /**
   * Track alert in history and active alerts
   */
  private trackAlert(notification: AlertNotification): void {
    this.activeAlerts.set(notification.id, notification);
    this.alertHistory.push(notification);
    
    // Keep only last 1000 alerts in history
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }
  }

  /**
   * Get top alert rules by frequency
   */
  private getTopAlertRules(alerts: AlertNotification[]): Array<{ ruleName: string; count: number }> {
    const ruleCounts = alerts.reduce((acc, alert) => {
      acc[alert.ruleName] = (acc[alert.ruleName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(ruleCounts)
      .map(([ruleName, count]) => ({ ruleName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Setup default alert channels
   */
  private setupDefaultChannels(): void {
    this.channels.set('log', new LogChannelHandler());
    this.channels.set('console', new ConsoleChannelHandler());
    this.channels.set('webhook', new WebhookChannelHandler());
    this.channels.set('email', new EmailChannelHandler());
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        condition: {
          metric: 'response_time',
          operator: 'gt',
          threshold: 5000,
          timeWindowMinutes: 5
        },
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 15,
        channels: [
          { type: 'log', config: {}, enabled: true },
          { type: 'console', config: {}, enabled: process.env.NODE_ENV === 'development' }
        ]
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: {
          metric: 'error_rate',
          operator: 'gt',
          threshold: 5,
          timeWindowMinutes: 10
        },
        severity: 'error',
        enabled: true,
        cooldownMinutes: 30,
        channels: [
          { type: 'log', config: {}, enabled: true },
          { type: 'console', config: {}, enabled: true }
        ]
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: {
          metric: 'memory_usage',
          operator: 'gt',
          threshold: 80,
          timeWindowMinutes: 5
        },
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 20,
        channels: [
          { type: 'log', config: {}, enabled: true }
        ]
      }
    ];

    defaultRules.forEach(rule => this.addRule(rule));
  }
}

/**
 * Alert statistics interface
 */
export interface AlertStats {
  totalRules: number;
  activeAlerts: number;
  alertsLast24h: number;
  severityBreakdown: Record<string, number>;
  topAlertRules: Array<{ ruleName: string; count: number }>;
}

/**
 * Base class for alert channel handlers
 */
abstract class AlertChannelHandler {
  abstract send(notification: AlertNotification, config: Record<string, any>): Promise<void>;
}

/**
 * Log channel handler
 */
class LogChannelHandler extends AlertChannelHandler {
  async send(notification: AlertNotification, config: Record<string, any>): Promise<void> {
    logger.warn(`ALERT: ${notification.message}`, {
      alertId: notification.id,
      ruleName: notification.ruleName,
      severity: notification.severity,
      timestamp: notification.timestamp
    });
  }
}

/**
 * Console channel handler
 */
class ConsoleChannelHandler extends AlertChannelHandler {
  async send(notification: AlertNotification, config: Record<string, any>): Promise<void> {
    const timestamp = new Date(notification.timestamp).toISOString();
    console.warn(`[${timestamp}] ALERT [${notification.severity.toUpperCase()}]: ${notification.message}`);
  }
}

/**
 * Webhook channel handler
 */
class WebhookChannelHandler extends AlertChannelHandler {
  async send(notification: AlertNotification, config: Record<string, any>): Promise<void> {
    if (!config.url) {
      throw new Error('Webhook URL not configured');
    }

    const payload = {
      alert: notification,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }
  }
}

/**
 * Email channel handler (placeholder implementation)
 */
class EmailChannelHandler extends AlertChannelHandler {
  async send(notification: AlertNotification, config: Record<string, any>): Promise<void> {
    // This would integrate with an email service like SendGrid, AWS SES, etc.
    logger.info('Email alert would be sent', {
      to: config.recipients,
      subject: `Alert: ${notification.ruleName}`,
      message: notification.message
    });
  }
}

// Global alert manager instance
export const globalAlertManager = new AlertManager();