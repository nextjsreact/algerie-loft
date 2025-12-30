/**
 * Feature Flags System
 * 
 * Provides gradual rollout capabilities with feature toggles
 * for the dual-audience homepage deployment.
 */

export interface FeatureFlag {
  id: string
  name: string
  description: string
  enabled: boolean
  rolloutPercentage: number // 0-100
  conditions?: FeatureFlagCondition[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'country' | 'user_agent' | 'custom'
  operator: 'equals' | 'contains' | 'in' | 'not_in'
  value: string | string[]
}

export interface RolloutConfig {
  strategy: 'percentage' | 'user_list' | 'geographic' | 'gradual'
  percentage?: number
  userList?: string[]
  countries?: string[]
  gradualSteps?: {
    percentage: number
    duration: number // hours
  }[]
}

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map()
  private rolloutConfigs: Map<string, RolloutConfig> = new Map()

  constructor() {
    this.initializeDefaultFlags()
  }

  /**
   * Initialize default feature flags for dual-audience homepage
   */
  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        id: 'dual_audience_homepage',
        name: 'Dual Audience Homepage',
        description: 'Enable the new dual-audience homepage design',
        enabled: true,
        rolloutPercentage: 0, // Start with 0% rollout
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'enhanced_hero_section',
        name: 'Enhanced Hero Section',
        description: 'Enable the guest-focused hero section with booking CTA',
        enabled: true,
        rolloutPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'featured_lofts_showcase',
        name: 'Featured Lofts Showcase',
        description: 'Enable the interactive loft cards with booking functionality',
        enabled: true,
        rolloutPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'trust_social_proof',
        name: 'Trust and Social Proof Section',
        description: 'Enable verified reviews and testimonials display',
        enabled: true,
        rolloutPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'repositioned_owner_section',
        name: 'Repositioned Property Owner Section',
        description: 'Enable the repositioned owner value proposition section',
        enabled: true,
        rolloutPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'multilingual_currency_support',
        name: 'Multilingual and Currency Support',
        description: 'Enable comprehensive language and currency support',
        enabled: true,
        rolloutPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'advanced_booking_functionality',
        name: 'Advanced Booking Functionality',
        description: 'Enable contextual customer support and mobile optimization',
        enabled: true,
        rolloutPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'analytics_conversion_optimization',
        name: 'Analytics and Conversion Optimization',
        description: 'Enable dual-audience analytics tracking and A/B testing',
        enabled: true,
        rolloutPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ]

    defaultFlags.forEach(flag => {
      this.flags.set(flag.id, flag)
    })

    // Set up gradual rollout configurations
    this.setupGradualRollout()
  }

  /**
   * Setup gradual rollout configurations
   */
  private setupGradualRollout(): void {
    const gradualRolloutConfig: RolloutConfig = {
      strategy: 'gradual',
      gradualSteps: [
        { percentage: 5, duration: 24 },   // 5% for 24 hours
        { percentage: 15, duration: 24 },  // 15% for 24 hours
        { percentage: 30, duration: 24 },  // 30% for 24 hours
        { percentage: 50, duration: 48 },  // 50% for 48 hours
        { percentage: 75, duration: 48 },  // 75% for 48 hours
        { percentage: 100, duration: 0 }   // 100% (full rollout)
      ]
    }

    // Apply gradual rollout to main features
    const mainFeatures = [
      'dual_audience_homepage',
      'enhanced_hero_section',
      'featured_lofts_showcase'
    ]

    mainFeatures.forEach(flagId => {
      this.rolloutConfigs.set(flagId, gradualRolloutConfig)
    })
  }

  /**
   * Check if a feature is enabled for a specific context
   */
  public isFeatureEnabled(
    flagId: string,
    context: {
      userId?: string
      country?: string
      userAgent?: string
      customAttributes?: Record<string, any>
    } = {}
  ): boolean {
    const flag = this.flags.get(flagId)
    if (!flag || !flag.enabled) {
      return false
    }

    // Check conditions first
    if (flag.conditions && !this.evaluateConditions(flag.conditions, context)) {
      return false
    }

    // Check rollout percentage
    if (flag.rolloutPercentage === 0) {
      return false
    }

    if (flag.rolloutPercentage === 100) {
      return true
    }

    // Use deterministic hash for consistent user experience
    const hash = this.generateHash(flagId, context.userId || 'anonymous')
    const userPercentile = hash % 100

    return userPercentile < flag.rolloutPercentage
  }

  /**
   * Evaluate feature flag conditions
   */
  private evaluateConditions(
    conditions: FeatureFlagCondition[],
    context: {
      userId?: string
      country?: string
      userAgent?: string
      customAttributes?: Record<string, any>
    }
  ): boolean {
    return conditions.every(condition => {
      let contextValue: string | undefined

      switch (condition.type) {
        case 'user_id':
          contextValue = context.userId
          break
        case 'country':
          contextValue = context.country
          break
        case 'user_agent':
          contextValue = context.userAgent
          break
        case 'custom':
          contextValue = context.customAttributes?.[condition.value as string]
          break
      }

      if (!contextValue) {
        return false
      }

      switch (condition.operator) {
        case 'equals':
          return contextValue === condition.value
        case 'contains':
          return contextValue.includes(condition.value as string)
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(contextValue)
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(contextValue)
        default:
          return false
      }
    })
  }

  /**
   * Generate deterministic hash for consistent rollout
   */
  private generateHash(flagId: string, userId: string): number {
    const str = `${flagId}:${userId}`
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Update feature flag rollout percentage
   */
  public updateRolloutPercentage(flagId: string, percentage: number, updatedBy: string): boolean {
    const flag = this.flags.get(flagId)
    if (!flag) {
      return false
    }

    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100')
    }

    flag.rolloutPercentage = percentage
    flag.updatedAt = new Date()
    flag.createdBy = updatedBy

    console.log(`🎛️ Feature flag '${flagId}' rollout updated to ${percentage}% by ${updatedBy}`)
    return true
  }

  /**
   * Enable/disable feature flag
   */
  public toggleFeatureFlag(flagId: string, enabled: boolean, updatedBy: string): boolean {
    const flag = this.flags.get(flagId)
    if (!flag) {
      return false
    }

    flag.enabled = enabled
    flag.updatedAt = new Date()
    flag.createdBy = updatedBy

    console.log(`🎛️ Feature flag '${flagId}' ${enabled ? 'enabled' : 'disabled'} by ${updatedBy}`)
    return true
  }

  /**
   * Start gradual rollout for a feature
   */
  public startGradualRollout(flagId: string, updatedBy: string): boolean {
    const flag = this.flags.get(flagId)
    const rolloutConfig = this.rolloutConfigs.get(flagId)

    if (!flag || !rolloutConfig || rolloutConfig.strategy !== 'gradual') {
      return false
    }

    if (!rolloutConfig.gradualSteps || rolloutConfig.gradualSteps.length === 0) {
      return false
    }

    console.log(`🚀 Starting gradual rollout for '${flagId}' by ${updatedBy}`)

    // Start with the first step
    const firstStep = rolloutConfig.gradualSteps[0]
    this.updateRolloutPercentage(flagId, firstStep.percentage, updatedBy)

    // Schedule subsequent steps
    let currentStepIndex = 0
    const scheduleNextStep = () => {
      currentStepIndex++
      if (currentStepIndex < rolloutConfig.gradualSteps!.length) {
        const nextStep = rolloutConfig.gradualSteps![currentStepIndex]
        const previousStep = rolloutConfig.gradualSteps![currentStepIndex - 1]
        
        setTimeout(() => {
          this.updateRolloutPercentage(flagId, nextStep.percentage, 'gradual-rollout-system')
          console.log(`📈 Gradual rollout step ${currentStepIndex + 1}: ${nextStep.percentage}% for '${flagId}'`)
          
          if (nextStep.duration > 0) {
            scheduleNextStep()
          }
        }, previousStep.duration * 60 * 60 * 1000) // Convert hours to milliseconds
      }
    }

    if (firstStep.duration > 0) {
      scheduleNextStep()
    }

    return true
  }

  /**
   * Emergency rollback - disable all features
   */
  public emergencyRollback(reason: string, triggeredBy: string): void {
    console.error(`🚨 EMERGENCY ROLLBACK triggered by ${triggeredBy}: ${reason}`)

    this.flags.forEach((flag, flagId) => {
      if (flag.enabled && flag.rolloutPercentage > 0) {
        flag.rolloutPercentage = 0
        flag.updatedAt = new Date()
        flag.createdBy = `emergency-rollback:${triggeredBy}`
        
        console.error(`🔄 Rolled back feature '${flagId}' to 0%`)
      }
    })
  }

  /**
   * Get all feature flags status
   */
  public getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values())
  }

  /**
   * Get feature flag by ID
   */
  public getFlag(flagId: string): FeatureFlag | undefined {
    return this.flags.get(flagId)
  }

  /**
   * Get rollout statistics
   */
  public getRolloutStats(): {
    totalFlags: number
    enabledFlags: number
    activeRollouts: number
    averageRolloutPercentage: number
  } {
    const flags = Array.from(this.flags.values())
    const enabledFlags = flags.filter(f => f.enabled)
    const activeRollouts = enabledFlags.filter(f => f.rolloutPercentage > 0 && f.rolloutPercentage < 100)
    
    const totalPercentage = enabledFlags.reduce((sum, f) => sum + f.rolloutPercentage, 0)
    const averageRolloutPercentage = enabledFlags.length > 0 ? totalPercentage / enabledFlags.length : 0

    return {
      totalFlags: flags.length,
      enabledFlags: enabledFlags.length,
      activeRollouts: activeRollouts.length,
      averageRolloutPercentage
    }
  }
}

// Global feature flag manager instance
export const featureFlagManager = new FeatureFlagManager()