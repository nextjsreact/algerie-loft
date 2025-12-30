/**
 * Rollback System
 * 
 * Provides automated rollback procedures for critical issues
 * in the dual-audience homepage deployment.
 */

import { featureFlagManager } from './feature-flags'
import { deploymentMonitor } from './monitoring'

export interface RollbackTrigger {
  id: string
  name: string
  description: string
  enabled: boolean
  conditions: RollbackCondition[]
  actions: RollbackAction[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldownPeriod: number // minutes
  lastTriggered?: Date
}

export interface RollbackCondition {
  type: 'error_rate' | 'response_time' | 'health_check' | 'manual' | 'web_vitals'
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  threshold: number
  timeWindow: number // minutes
  consecutiveFailures?: number
}

export interface RollbackAction {
  type: 'disable_feature' | 'reduce_rollout' | 'emergency_rollback' | 'notify' | 'redirect'
  config: Record<string, any>
  order: number
}

export interface RollbackEvent {
  id: string
  triggerId: string
  timestamp: Date
  reason: string
  triggeredBy: 'system' | 'manual'
  actions: RollbackAction[]
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  completedAt?: Date
  error?: string
}

export class RollbackManager {
  private triggers: Map<string, RollbackTrigger> = new Map()
  private events: RollbackEvent[] = []
  private isActive = false

  constructor() {
    this.initializeDefaultTriggers()
  }

  /**
   * Initialize default rollback triggers
   */
  private initializeDefaultTriggers(): void {
    const defaultTriggers: RollbackTrigger[] = [
      {
        id: 'critical_error_rate',
        name: 'Critical Error Rate',
        description: 'Rollback when error rate exceeds 10%',
        enabled: true,
        conditions: [
          {
            type: 'error_rate',
            operator: 'gt',
            threshold: 10,
            timeWindow: 5,
            consecutiveFailures: 2
          }
        ],
        actions: [
          {
            type: 'emergency_rollback',
            config: { reason: 'Critical error rate exceeded' },
            order: 1
          },
          {
            type: 'notify',
            config: { 
              channels: ['email', 'webhook'],
              severity: 'critical'
            },
            order: 2
          }
        ],
        severity: 'critical',
        cooldownPeriod: 30
      },
      {
        id: 'severe_performance_degradation',
        name: 'Severe Performance Degradation',
        description: 'Rollback when response time exceeds 5 seconds',
        enabled: true,
        conditions: [
          {
            type: 'response_time',
            operator: 'gt',
            threshold: 5000,
            timeWindow: 10,
            consecutiveFailures: 3
          }
        ],
        actions: [
          {
            type: 'reduce_rollout',
            config: { 
              percentage: 50,
              features: ['dual_audience_homepage', 'enhanced_hero_section']
            },
            order: 1
          },
          {
            type: 'notify',
            config: { 
              channels: ['webhook'],
              severity: 'high'
            },
            order: 2
          }
        ],
        severity: 'high',
        cooldownPeriod: 15
      },
      {
        id: 'poor_web_vitals',
        name: 'Poor Web Vitals',
        description: 'Rollback when Core Web Vitals degrade significantly',
        enabled: true,
        conditions: [
          {
            type: 'web_vitals',
            operator: 'gt',
            threshold: 4000, // LCP > 4 seconds
            timeWindow: 15,
            consecutiveFailures: 5
          }
        ],
        actions: [
          {
            type: 'disable_feature',
            config: { 
              features: ['analytics_conversion_optimization', 'advanced_booking_functionality']
            },
            order: 1
          },
          {
            type: 'notify',
            config: { 
              channels: ['webhook'],
              severity: 'medium'
            },
            order: 2
          }
        ],
        severity: 'medium',
        cooldownPeriod: 60
      },
      {
        id: 'health_check_failures',
        name: 'Health Check Failures',
        description: 'Rollback when multiple health checks fail',
        enabled: true,
        conditions: [
          {
            type: 'health_check',
            operator: 'gte',
            threshold: 2, // 2 or more health checks failing
            timeWindow: 5,
            consecutiveFailures: 1
          }
        ],
        actions: [
          {
            type: 'reduce_rollout',
            config: { 
              percentage: 25,
              features: ['dual_audience_homepage']
            },
            order: 1
          }
        ],
        severity: 'high',
        cooldownPeriod: 20
      }
    ]

    defaultTriggers.forEach(trigger => {
      this.triggers.set(trigger.id, trigger)
    })
  }

  /**
   * Start rollback monitoring
   */
  public startMonitoring(): void {
    if (this.isActive) return

    this.isActive = true
    console.log('🔄 Rollback monitoring started')

    // Check triggers every 30 seconds
    setInterval(() => this.evaluateTriggers(), 30000)
  }

  /**
   * Stop rollback monitoring
   */
  public stopMonitoring(): void {
    this.isActive = false
    console.log('⏹️ Rollback monitoring stopped')
  }

  /**
   * Evaluate rollback triggers
   */
  private evaluateTriggers(): void {
    if (!this.isActive) return

    const stats = deploymentMonitor.getPerformanceStats(10) // Last 10 minutes

    this.triggers.forEach(trigger => {
      if (!trigger.enabled) return

      // Check cooldown period
      if (trigger.lastTriggered) {
        const cooldownEnd = new Date(trigger.lastTriggered.getTime() + (trigger.cooldownPeriod * 60 * 1000))
        if (new Date() < cooldownEnd) {
          return // Still in cooldown
        }
      }

      // Evaluate conditions
      const shouldTrigger = trigger.conditions.every(condition => {
        return this.evaluateCondition(condition, stats)
      })

      if (shouldTrigger) {
        this.triggerRollback(trigger.id, 'system', `Automatic trigger: ${trigger.name}`)
      }
    })
  }

  /**
   * Evaluate a single rollback condition
   */
  private evaluateCondition(condition: RollbackCondition, stats: any): boolean {
    let value: number = 0

    switch (condition.type) {
      case 'error_rate':
        value = stats.errorRate
        break
      case 'response_time':
        value = stats.averageResponseTime
        break
      case 'web_vitals':
        value = stats.webVitals.averageLCP
        break
      case 'health_check':
        // This would need to be implemented based on health check results
        value = 0 // Placeholder
        break
      default:
        return false
    }

    switch (condition.operator) {
      case 'gt':
        return value > condition.threshold
      case 'gte':
        return value >= condition.threshold
      case 'lt':
        return value < condition.threshold
      case 'lte':
        return value <= condition.threshold
      case 'eq':
        return value === condition.threshold
      default:
        return false
    }
  }

  /**
   * Trigger rollback manually or automatically
   */
  public triggerRollback(
    triggerId: string, 
    triggeredBy: 'system' | 'manual', 
    reason: string
  ): string {
    const trigger = this.triggers.get(triggerId)
    if (!trigger) {
      throw new Error(`Rollback trigger not found: ${triggerId}`)
    }

    const eventId = `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const rollbackEvent: RollbackEvent = {
      id: eventId,
      triggerId,
      timestamp: new Date(),
      reason,
      triggeredBy,
      actions: [...trigger.actions].sort((a, b) => a.order - b.order),
      status: 'pending'
    }

    this.events.push(rollbackEvent)
    trigger.lastTriggered = new Date()

    console.error(`🚨 ROLLBACK TRIGGERED [${trigger.severity.toUpperCase()}]: ${trigger.name}`)
    console.error(`   Reason: ${reason}`)
    console.error(`   Triggered by: ${triggeredBy}`)
    console.error(`   Event ID: ${eventId}`)

    // Execute rollback actions
    this.executeRollback(rollbackEvent)

    return eventId
  }

  /**
   * Execute rollback actions
   */
  private async executeRollback(event: RollbackEvent): Promise<void> {
    event.status = 'in_progress'

    try {
      for (const action of event.actions) {
        await this.executeRollbackAction(action, event)
      }

      event.status = 'completed'
      event.completedAt = new Date()
      
      console.log(`✅ Rollback completed successfully: ${event.id}`)
    } catch (error) {
      event.status = 'failed'
      event.error = error instanceof Error ? error.message : 'Unknown error'
      event.completedAt = new Date()
      
      console.error(`❌ Rollback failed: ${event.id} - ${event.error}`)
    }
  }

  /**
   * Execute a single rollback action
   */
  private async executeRollbackAction(action: RollbackAction, event: RollbackEvent): Promise<void> {
    console.log(`🔄 Executing rollback action: ${action.type}`)

    switch (action.type) {
      case 'emergency_rollback':
        featureFlagManager.emergencyRollback(
          action.config.reason || event.reason,
          `rollback-system:${event.id}`
        )
        break

      case 'disable_feature':
        if (action.config.features && Array.isArray(action.config.features)) {
          action.config.features.forEach((featureId: string) => {
            featureFlagManager.toggleFeatureFlag(
              featureId, 
              false, 
              `rollback-system:${event.id}`
            )
          })
        }
        break

      case 'reduce_rollout':
        if (action.config.features && Array.isArray(action.config.features)) {
          const percentage = action.config.percentage || 0
          action.config.features.forEach((featureId: string) => {
            featureFlagManager.updateRolloutPercentage(
              featureId, 
              percentage, 
              `rollback-system:${event.id}`
            )
          })
        }
        break

      case 'notify':
        await this.sendNotification(action.config, event)
        break

      case 'redirect':
        // This would implement traffic redirection logic
        console.log('🔀 Traffic redirection would be implemented here')
        break

      default:
        console.warn(`⚠️ Unknown rollback action type: ${action.type}`)
    }
  }

  /**
   * Send notification for rollback event
   */
  private async sendNotification(config: any, event: RollbackEvent): Promise<void> {
    const message = `
🚨 ROLLBACK EXECUTED

Event ID: ${event.id}
Trigger: ${event.triggerId}
Reason: ${event.reason}
Triggered by: ${event.triggeredBy}
Timestamp: ${event.timestamp.toISOString()}
Status: ${event.status}

Please review the system status and take appropriate action.
`

    if (config.channels?.includes('email')) {
      console.log('📧 Email notification would be sent')
      // In a real implementation, this would send an email
    }

    if (config.channels?.includes('webhook')) {
      console.log('🔗 Webhook notification would be triggered')
      // In a real implementation, this would call a webhook
    }

    console.log('📢 Rollback notification sent')
  }

  /**
   * Manual emergency rollback
   */
  public emergencyRollback(reason: string, triggeredBy: string): string {
    // Create a temporary manual trigger for emergency rollback
    const manualTrigger: RollbackTrigger = {
      id: 'manual_emergency',
      name: 'Manual Emergency Rollback',
      description: 'Manual emergency rollback triggered by user',
      enabled: true,
      conditions: [],
      actions: [
        {
          type: 'emergency_rollback',
          config: { reason },
          order: 1
        }
      ],
      severity: 'critical',
      cooldownPeriod: 0
    }

    // Temporarily add the trigger
    this.triggers.set('manual_emergency', manualTrigger)
    
    const result = this.triggerRollback('manual_emergency', 'manual', reason)
    
    // Remove the temporary trigger
    this.triggers.delete('manual_emergency')
    
    return result
  }

  /**
   * Get rollback history
   */
  public getRollbackHistory(limit: number = 50): RollbackEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get rollback statistics
   */
  public getRollbackStats(): {
    totalEvents: number
    successfulRollbacks: number
    failedRollbacks: number
    averageExecutionTime: number
    lastRollback?: Date
  } {
    const completedEvents = this.events.filter(e => e.completedAt)
    const successfulEvents = completedEvents.filter(e => e.status === 'completed')
    const failedEvents = completedEvents.filter(e => e.status === 'failed')

    const executionTimes = completedEvents
      .filter(e => e.completedAt)
      .map(e => e.completedAt!.getTime() - e.timestamp.getTime())

    const averageExecutionTime = executionTimes.length > 0 
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length 
      : 0

    const lastRollback = this.events.length > 0 
      ? this.events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
      : undefined

    return {
      totalEvents: this.events.length,
      successfulRollbacks: successfulEvents.length,
      failedRollbacks: failedEvents.length,
      averageExecutionTime,
      lastRollback
    }
  }

  /**
   * Get monitoring status
   */
  public getMonitoringStatus(): {
    isActive: boolean
    enabledTriggers: number
    totalTriggers: number
    recentEvents: number
  } {
    const recentEvents = this.events.filter(
      e => e.timestamp.getTime() > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    ).length

    return {
      isActive: this.isActive,
      enabledTriggers: Array.from(this.triggers.values()).filter(t => t.enabled).length,
      totalTriggers: this.triggers.size,
      recentEvents
    }
  }
}

// Global rollback manager instance
export const rollbackManager = new RollbackManager()