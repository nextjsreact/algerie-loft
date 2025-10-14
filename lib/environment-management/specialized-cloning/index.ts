/**
 * Specialized System Cloning Module
 * 
 * This module provides specialized cloning capabilities for complex systems
 * within the Loft Algérie application including audit, conversations, and reservations.
 */

export { AuditSystemCloner } from './audit-system-cloner'
export { ConversationsSystemCloner } from './conversations-system-cloner'
export { ReservationsSystemCloner } from './reservations-system-cloner'
export { BillNotificationSystemCloner } from './bill-notification-system-cloner'
export { TransactionReferenceCloner } from './transaction-reference-cloner'
export { NotificationTestingSystem } from './notification-testing-system'
export { BillNotificationIntegration } from './bill-notification-integration'

export type {
  AuditCloneOptions,
  AuditCloneResult,
  AuditTableDefinition,
  AuditColumnDefinition,
  AuditTriggerDefinition,
  AuditFunctionDefinition
} from './audit-system-cloner'

export type {
  ConversationsCloneOptions,
  ConversationsCloneResult,
  ConversationTableDefinition,
  ConversationColumnDefinition,
  ConversationData,
  ParticipantData,
  MessageData
} from './conversations-system-cloner'

export type {
  ReservationsCloneOptions,
  ReservationsCloneResult,
  ReservationTableDefinition,
  ReservationColumnDefinition,
  ReservationData,
  AvailabilityData,
  PricingRuleData,
  PaymentData
} from './reservations-system-cloner'

export type {
  BillNotificationCloneOptions,
  BillNotificationCloneResult,
  BillFrequencyDefinition,
  NotificationTriggerDefinition,
  TransactionReferenceDefinition
} from './bill-notification-system-cloner'

export type {
  TransactionReferenceCloneOptions,
  TransactionReferenceCloneResult,
  TransactionReference,
  TransactionCategory,
  TestTransaction
} from './transaction-reference-cloner'

export type {
  NotificationTestingOptions,
  NotificationTestingResult,
  NotificationTestReport,
  NotificationTypeReport,
  RealTimeTestResult,
  ValidationResult,
  PerformanceMetrics,
  TestNotification
} from './notification-testing-system'

export type {
  BillNotificationIntegrationOptions,
  BillNotificationIntegrationResult,
  BillNotificationComprehensiveReport,
  ComponentReport,
  IntegrationTestReport
} from './bill-notification-integration'

/**
 * Specialized System Cloning Orchestrator
 * 
 * Coordinates the cloning of all specialized systems in the correct order
 * and manages dependencies between systems.
 */
import { Environment } from '../types'
import { AuditSystemCloner } from './audit-system-cloner'
import { ConversationsSystemCloner } from './conversations-system-cloner'
import { ReservationsSystemCloner } from './reservations-system-cloner'

export interface SpecializedSystemsCloneOptions {
  includeAuditSystem: boolean
  includeConversationsSystem: boolean
  includeReservationsSystem: boolean
  
  // Audit system options
  auditOptions?: {
    includeAuditLogs: boolean
    anonymizeAuditData: boolean
    preserveAuditStructure: boolean
    maxLogAge?: number
    logLevelFilter?: ('info' | 'warning' | 'error')[]
  }
  
  // Conversations system options
  conversationsOptions?: {
    includeMessages: boolean
    anonymizeMessageContent: boolean
    preserveConversationStructure: boolean
    maxMessageAge?: number
    messageTypeFilter?: ('text' | 'image' | 'file' | 'system')[]
  }
  
  // Reservations system options
  reservationsOptions?: {
    includeReservations: boolean
    includeAvailability: boolean
    includePricingRules: boolean
    includePayments: boolean
    anonymizeGuestData: boolean
    anonymizePricingData: boolean
    maxReservationAge?: number
    statusFilter?: ('pending' | 'confirmed' | 'cancelled' | 'completed')[]
  }
}

export interface SpecializedSystemsCloneResult {
  success: boolean
  systemsCloned: string[]
  auditResult?: any
  conversationsResult?: any
  reservationsResult?: any
  errors: string[]
  warnings: string[]
  totalDuration: number
}

export class SpecializedSystemsCloner {
  private auditCloner: AuditSystemCloner
  private conversationsCloner: ConversationsSystemCloner
  private reservationsCloner: ReservationsSystemCloner

  constructor() {
    this.auditCloner = new AuditSystemCloner()
    this.conversationsCloner = new ConversationsSystemCloner()
    this.reservationsCloner = new ReservationsSystemCloner()
  }

  /**
   * Clone all requested specialized systems
   */
  public async cloneSpecializedSystems(
    sourceEnv: Environment,
    targetEnv: Environment,
    options: SpecializedSystemsCloneOptions,
    operationId: string
  ): Promise<SpecializedSystemsCloneResult> {
    const startTime = Date.now()
    
    const result: SpecializedSystemsCloneResult = {
      success: false,
      systemsCloned: [],
      errors: [],
      warnings: [],
      totalDuration: 0
    }

    try {
      this.log(operationId, 'info', 'Starting specialized systems cloning...')

      // Phase 1: Clone audit system (foundational - should be first)
      if (options.includeAuditSystem && options.auditOptions) {
        this.log(operationId, 'info', 'Cloning audit system...')
        
        result.auditResult = await this.auditCloner.cloneAuditSystem(
          sourceEnv,
          targetEnv,
          options.auditOptions,
          operationId
        )
        
        if (result.auditResult.success) {
          result.systemsCloned.push('audit')
          this.log(operationId, 'info', '✅ Audit system cloning completed successfully')
        } else {
          result.errors.push(...result.auditResult.errors)
          result.warnings.push(...result.auditResult.warnings)
          this.log(operationId, 'error', '❌ Audit system cloning failed')
        }
      }

      // Phase 2: Clone conversations system
      if (options.includeConversationsSystem && options.conversationsOptions) {
        this.log(operationId, 'info', 'Cloning conversations system...')
        
        result.conversationsResult = await this.conversationsCloner.cloneConversationsSystem(
          sourceEnv,
          targetEnv,
          options.conversationsOptions,
          operationId
        )
        
        if (result.conversationsResult.success) {
          result.systemsCloned.push('conversations')
          this.log(operationId, 'info', '✅ Conversations system cloning completed successfully')
        } else {
          result.errors.push(...result.conversationsResult.errors)
          result.warnings.push(...result.conversationsResult.warnings)
          this.log(operationId, 'error', '❌ Conversations system cloning failed')
        }
      }

      // Phase 3: Clone reservations system
      if (options.includeReservationsSystem && options.reservationsOptions) {
        this.log(operationId, 'info', 'Cloning reservations system...')
        
        result.reservationsResult = await this.reservationsCloner.cloneReservationsSystem(
          sourceEnv,
          targetEnv,
          options.reservationsOptions,
          operationId
        )
        
        if (result.reservationsResult.success) {
          result.systemsCloned.push('reservations')
          this.log(operationId, 'info', '✅ Reservations system cloning completed successfully')
        } else {
          result.errors.push(...result.reservationsResult.errors)
          result.warnings.push(...result.reservationsResult.warnings)
          this.log(operationId, 'error', '❌ Reservations system cloning failed')
        }
      }

      // Determine overall success
      result.success = result.errors.length === 0
      result.totalDuration = Date.now() - startTime

      this.log(operationId, 'info', 
        `Specialized systems cloning completed. ` +
        `Systems cloned: ${result.systemsCloned.join(', ')}. ` +
        `Success: ${result.success}. ` +
        `Duration: ${result.totalDuration}ms`
      )

      return result

    } catch (error) {
      result.errors.push(`Specialized systems cloning failed: ${error.message}`)
      result.totalDuration = Date.now() - startTime
      
      this.log(operationId, 'error', `Specialized systems cloning failed: ${error.message}`)
      
      return result
    }
  }

  /**
   * Get default options for specialized systems cloning
   */
  public static getDefaultOptions(): SpecializedSystemsCloneOptions {
    return {
      includeAuditSystem: true,
      includeConversationsSystem: true,
      includeReservationsSystem: true,
      
      auditOptions: {
        includeAuditLogs: true,
        anonymizeAuditData: true,
        preserveAuditStructure: true,
        maxLogAge: 90, // 3 months
        logLevelFilter: ['info', 'warning', 'error']
      },
      
      conversationsOptions: {
        includeMessages: true,
        anonymizeMessageContent: true,
        preserveConversationStructure: true,
        maxMessageAge: 30, // 1 month
        messageTypeFilter: ['text', 'image', 'file', 'system']
      },
      
      reservationsOptions: {
        includeReservations: true,
        includeAvailability: true,
        includePricingRules: true,
        includePayments: true,
        anonymizeGuestData: true,
        anonymizePricingData: true,
        maxReservationAge: 365, // 1 year
        statusFilter: ['pending', 'confirmed', 'cancelled', 'completed']
      }
    }
  }

  /**
   * Get training environment options (more comprehensive data)
   */
  public static getTrainingOptions(): SpecializedSystemsCloneOptions {
    const defaultOptions = SpecializedSystemsCloner.getDefaultOptions()
    
    return {
      ...defaultOptions,
      auditOptions: {
        ...defaultOptions.auditOptions,
        maxLogAge: 180, // 6 months for training
        includeAuditLogs: true
      },
      conversationsOptions: {
        ...defaultOptions.conversationsOptions,
        maxMessageAge: 60, // 2 months for training
        includeMessages: true
      },
      reservationsOptions: {
        ...defaultOptions.reservationsOptions,
        maxReservationAge: 730, // 2 years for training
        includeReservations: true,
        includeAvailability: true,
        includePricingRules: true,
        includePayments: true
      }
    }
  }

  /**
   * Get test environment options (minimal data for testing)
   */
  public static getTestOptions(): SpecializedSystemsCloneOptions {
    const defaultOptions = SpecializedSystemsCloner.getDefaultOptions()
    
    return {
      ...defaultOptions,
      auditOptions: {
        ...defaultOptions.auditOptions,
        maxLogAge: 30, // 1 month for testing
        includeAuditLogs: false // Skip logs for faster testing
      },
      conversationsOptions: {
        ...defaultOptions.conversationsOptions,
        maxMessageAge: 7, // 1 week for testing
        includeMessages: false // Skip messages for faster testing
      },
      reservationsOptions: {
        ...defaultOptions.reservationsOptions,
        maxReservationAge: 90, // 3 months for testing
        includeReservations: true,
        includeAvailability: false, // Skip availability for faster testing
        includePricingRules: true,
        includePayments: false // Skip payments for faster testing
      }
    }
  }

  /**
   * Log operation events
   */
  private log(operationId: string, level: 'info' | 'warning' | 'error', message: string): void {
    console.log(`[${level.toUpperCase()}] [SpecializedSystemsCloner] [${operationId}] ${message}`)
  }
}