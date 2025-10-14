/**
 * End-to-End Tests for Specialized Systems Cloning
 * 
 * Tests complete workflows for audit, conversations, and reservations systems
 * Requirements: 8.1, 8.2, 8.3
 */

import { describe, it, expect, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { 
  SpecializedSystemsCloner,
  AuditSystemCloner,
  ConversationsSystemCloner,
  ReservationsSystemCloner
} from '@/lib/environment-management/specialized-cloning'
import { EnvironmentCloner } from '@/lib/environment-management/environment-cloner'
import { Environment } from '@/lib/environment-management/types'
import { ProductionSafetyGuard } from '@/lib/environment-management/production-safety-guard'

// Mock dependencies
jest.mock('@/utils/supabase/server')
jest.mock('@/lib/logger')

// Extended timeout for E2E tests
jest.setTimeout(60000)

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  rpc: jest.fn().mockReturnThis(),
  schema: jest.fn().mockReturnThis(),
  channel: jest.fn(),
  removeChannel: jest.fn()
}

const createTestEnvironment = (type: 'production' | 'test' | 'training'): Environment => ({
  id: `env_${type}_e2e_${Date.now()}`,
  name: `E2E ${type.charAt(0).toUpperCase() + type.slice(1)} Environment`,
  type,
  supabaseUrl: `https://${type}-e2e.supabase.co`,
  supabaseAnonKey: `e2e_anon_key_${type}`,
  supabaseServiceKey: `e2e_service_key_${type}`,
  status: 'active',
  isProduction: type === 'production',
  allowWrites: type !== 'production',
  createdAt: new Date(),
  lastUpdated: new Date(),
  description: `E2E test ${type} environment`
})

describe('🚀 Specialized Systems E2E Tests', () => {
  let productionEnv: Environment
  let testEnv: Environment
  let trainingEnv: Environment
  let orchestrator: SpecializedSystemsCloner
  let environmentCloner: EnvironmentCloner

  beforeAll(async () => {
    productionEnv = createTestEnvironment('production')
    testEnv = createTestEnvironment('test')
    trainingEnv = createTestEnvironment('training')
    orchestrator = new SpecializedSystemsCloner()
    environmentCloner = new EnvironmentCloner()

    const { createClient } = require('@/utils/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock responses for successful operations
    mockSupabase.select.mockResolvedValue({ data: [], error: null })
    mockSupabase.insert.mockResolvedValue({ data: [], error: null })
    mockSupabase.rpc.mockResolvedValue({ data: true, error: null })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('🔄 Complete Environment Cloning Workflow', () => {
    it('should perform full production to test environment clone with all specialized systems', async () => {
      // Mock production data for all systems
      const mockProductionData = {
        // Audit system data
        auditTables: [
          { table_name: 'audit_logs', table_schema: 'audit' },
          { table_name: 'audit_user_context', table_schema: 'audit' }
        ],
        auditLogs: [
          {
            id: 'log1',
            table_name: 'users',
            operation: 'UPDATE',
            old_data: { email: 'user@example.com', name: 'John Doe' },
            new_data: { email: 'newemail@example.com', name: 'John Doe' },
            timestamp: new Date()
          }
        ],
        auditFunctions: [
          {
            routine_name: 'audit_trigger_function',
            routine_schema: 'audit',
            routine_definition: 'CREATE OR REPLACE FUNCTION audit.audit_trigger_function()...'
          }
        ],

        // Conversations system data
        conversations: [
          { id: 'conv1', title: 'Project Discussion', created_at: new Date() },
          { id: 'conv2', title: 'Support Ticket', created_at: new Date() }
        ],
        conversationParticipants: [
          { id: 'part1', conversation_id: 'conv1', user_id: 'user1', role: 'admin' },
          { id: 'part2', conversation_id: 'conv1', user_id: 'user2', role: 'member' }
        ],
        messages: [
          {
            id: 'msg1',
            conversation_id: 'conv1',
            sender_id: 'user1',
            content: 'Hello team! Please contact john@example.com',
            message_type: 'text',
            created_at: new Date()
          }
        ],

        // Reservations system data
        reservations: [
          {
            id: 'res1',
            loft_id: 'loft1',
            guest_name: 'John Doe',
            guest_email: 'john@example.com',
            guest_phone: '+213555123456',
            check_in: '2024-01-15',
            check_out: '2024-01-20',
            total_amount: 5000,
            status: 'confirmed'
          }
        ],
        loftAvailability: [
          {
            id: 'avail1',
            loft_id: 'loft1',
            date: '2024-01-15',
            is_available: false,
            price_per_night: 1000
          }
        ],
        pricingRules: [
          {
            id: 'price1',
            loft_id: 'loft1',
            base_price: 1000,
            weekend_multiplier: 1.2,
            holiday_multiplier: 1.5
          }
        ],
        reservationPayments: [
          {
            id: 'pay1',
            reservation_id: 'res1',
            amount: 2500,
            payment_method: 'card',
            status: 'completed'
          }
        ]
      }

      // Setup mock responses in sequence
      let callCount = 0
      mockSupabase.select.mockImplementation(() => {
        callCount++
        switch (callCount) {
          case 1: return Promise.resolve({ data: mockProductionData.auditTables, error: null })
          case 2: return Promise.resolve({ data: mockProductionData.auditLogs, error: null })
          case 3: return Promise.resolve({ data: mockProductionData.auditFunctions, error: null })
          case 4: return Promise.resolve({ data: mockProductionData.conversations, error: null })
          case 5: return Promise.resolve({ data: mockProductionData.conversationParticipants, error: null })
          case 6: return Promise.resolve({ data: mockProductionData.messages, error: null })
          case 7: return Promise.resolve({ data: mockProductionData.reservations, error: null })
          case 8: return Promise.resolve({ data: mockProductionData.loftAvailability, error: null })
          case 9: return Promise.resolve({ data: mockProductionData.pricingRules, error: null })
          case 10: return Promise.resolve({ data: mockProductionData.reservationPayments, error: null })
          default: return Promise.resolve({ data: [], error: null })
        }
      })

      // Execute full clone with all specialized systems
      const cloneOptions = {
        includeAuditSystem: true,
        includeConversationsSystem: true,
        includeReservationsSystem: true,
        auditOptions: {
          includeAuditLogs: true,
          anonymizeAuditData: true,
          preserveAuditStructure: true,
          maxLogAge: 30
        },
        conversationsOptions: {
          includeMessages: true,
          anonymizeMessageContent: true,
          preserveConversationStructure: true,
          maxMessageAge: 30
        },
        reservationsOptions: {
          includeReservations: true,
          includeAvailability: true,
          includePricingRules: true,
          includePayments: true,
          anonymizeGuestData: true,
          anonymizePricingData: false,
          maxReservationAge: 90
        }
      }

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        cloneOptions,
        'e2e_full_clone_test'
      )

      // Verify overall success
      expect(result.success).toBe(true)
      expect(result.systemsCloned).toHaveLength(3)
      expect(result.systemsCloned).toContain('audit')
      expect(result.systemsCloned).toContain('conversations')
      expect(result.systemsCloned).toContain('reservations')

      // Verify audit system results
      expect(result.auditResult?.success).toBe(true)
      expect(result.auditResult?.tablesCloned).toContain('audit_logs')
      expect(result.auditResult?.logsCloned).toBe(1)
      expect(result.auditResult?.logsAnonymized).toBe(1)

      // Verify conversations system results
      expect(result.conversationsResult?.success).toBe(true)
      expect(result.conversationsResult?.conversationsCloned).toBe(2)
      expect(result.conversationsResult?.messagesCloned).toBe(1)
      expect(result.conversationsResult?.messagesAnonymized).toBe(1)

      // Verify reservations system results
      expect(result.reservationsResult?.success).toBe(true)
      expect(result.reservationsResult?.reservationsCloned).toBe(1)
      expect(result.reservationsResult?.availabilityRecordsCloned).toBe(1)
      expect(result.reservationsResult?.pricingRulesCloned).toBe(1)
      expect(result.reservationsResult?.paymentsCloned).toBe(1)
      expect(result.reservationsResult?.guestDataAnonymized).toBe(1)

      // Verify no errors occurred
      expect(result.errors).toHaveLength(0)
      expect(result.totalDuration).toBeGreaterThan(0)
    })

    it('should perform training environment setup with comprehensive data', async () => {
      // Mock comprehensive training data
      const mockTrainingData = {
        auditLogs: Array.from({ length: 100 }, (_, i) => ({
          id: `log${i}`,
          table_name: ['users', 'transactions', 'lofts'][i % 3],
          operation: ['INSERT', 'UPDATE', 'DELETE'][i % 3],
          old_data: { id: `record${i}`, email: `user${i}@example.com` },
          timestamp: new Date(Date.now() - i * 86400000) // Spread over 100 days
        })),
        conversations: Array.from({ length: 20 }, (_, i) => ({
          id: `conv${i}`,
          title: `Training Conversation ${i}`,
          created_at: new Date(Date.now() - i * 86400000)
        })),
        messages: Array.from({ length: 200 }, (_, i) => ({
          id: `msg${i}`,
          conversation_id: `conv${i % 20}`,
          content: `Training message ${i} with email user${i}@example.com`,
          created_at: new Date(Date.now() - i * 3600000) // Spread over hours
        })),
        reservations: Array.from({ length: 50 }, (_, i) => ({
          id: `res${i}`,
          loft_id: `loft${i % 10}`,
          guest_name: `Training Guest ${i}`,
          guest_email: `guest${i}@example.com`,
          check_in: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
          check_out: new Date(Date.now() + (i + 3) * 86400000).toISOString().split('T')[0],
          status: ['confirmed', 'pending', 'completed'][i % 3]
        }))
      }

      // Setup mock responses for training data
      mockSupabase.select.mockImplementation((query) => {
        if (query.includes('audit_logs')) {
          return Promise.resolve({ data: mockTrainingData.auditLogs, error: null })
        }
        if (query.includes('conversations')) {
          return Promise.resolve({ data: mockTrainingData.conversations, error: null })
        }
        if (query.includes('messages')) {
          return Promise.resolve({ data: mockTrainingData.messages, error: null })
        }
        if (query.includes('reservations')) {
          return Promise.resolve({ data: mockTrainingData.reservations, error: null })
        }
        return Promise.resolve({ data: [], error: null })
      })

      const trainingOptions = SpecializedSystemsCloner.getTrainingOptions()

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        trainingEnv,
        trainingOptions,
        'e2e_training_setup'
      )

      expect(result.success).toBe(true)
      expect(result.auditResult?.logsCloned).toBe(100)
      expect(result.conversationsResult?.conversationsCloned).toBe(20)
      expect(result.conversationsResult?.messagesCloned).toBe(200)
      expect(result.reservationsResult?.reservationsCloned).toBe(50)

      // Verify training-specific configurations
      expect(result.auditResult?.logsAnonymized).toBe(100) // All logs anonymized for training
      expect(result.conversationsResult?.messagesAnonymized).toBe(200) // All messages anonymized
      expect(result.reservationsResult?.guestDataAnonymized).toBe(50) // All guest data anonymized
    })
  })

  describe('🔍 System Integration and Validation', () => {
    it('should validate all systems work together after cloning', async () => {
      // Mock successful cloning
      mockSupabase.select.mockResolvedValue({ data: [], error: null })
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null })

      // Mock real-time functionality
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
        unsubscribe: jest.fn().mockResolvedValue({ status: 'CLOSED' })
      }
      mockSupabase.channel.mockReturnValue(mockChannel)

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        SpecializedSystemsCloner.getTestOptions(),
        'e2e_integration_validation'
      )

      expect(result.success).toBe(true)

      // Validate audit system integration
      expect(mockSupabase.rpc).toHaveBeenCalledWith('test_audit_trigger_function')

      // Validate conversations real-time integration
      expect(mockSupabase.channel).toHaveBeenCalledWith('test_conversations_realtime')

      // Verify all systems are operational
      expect(result.systemsCloned).toContain('audit')
      expect(result.systemsCloned).toContain('conversations')
      expect(result.systemsCloned).toContain('reservations')
    })

    it('should handle cross-system data dependencies correctly', async () => {
      // Mock data with cross-system dependencies
      const mockDependentData = {
        users: [
          { id: 'user1', email: 'user1@example.com', name: 'John Doe' },
          { id: 'user2', email: 'user2@example.com', name: 'Jane Smith' }
        ],
        auditLogs: [
          {
            id: 'log1',
            table_name: 'users',
            operation: 'UPDATE',
            user_id: 'user1', // References user1
            old_data: { email: 'old@example.com' }
          }
        ],
        conversations: [
          { id: 'conv1', title: 'User Discussion' }
        ],
        conversationParticipants: [
          { id: 'part1', conversation_id: 'conv1', user_id: 'user1' }, // References user1
          { id: 'part2', conversation_id: 'conv1', user_id: 'user2' }  // References user2
        ],
        reservations: [
          {
            id: 'res1',
            loft_id: 'loft1',
            created_by: 'user1', // References user1
            guest_name: 'External Guest'
          }
        ]
      }

      let callCount = 0
      mockSupabase.select.mockImplementation(() => {
        callCount++
        switch (callCount) {
          case 1: return Promise.resolve({ data: mockDependentData.users, error: null })
          case 2: return Promise.resolve({ data: mockDependentData.auditLogs, error: null })
          case 3: return Promise.resolve({ data: mockDependentData.conversations, error: null })
          case 4: return Promise.resolve({ data: mockDependentData.conversationParticipants, error: null })
          case 5: return Promise.resolve({ data: mockDependentData.reservations, error: null })
          default: return Promise.resolve({ data: [], error: null })
        }
      })

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        {
          includeAuditSystem: true,
          includeConversationsSystem: true,
          includeReservationsSystem: true,
          preserveCrossSystemReferences: true,
          auditOptions: { includeAuditLogs: true, anonymizeAuditData: true, preserveAuditStructure: true },
          conversationsOptions: { includeMessages: false, preserveConversationStructure: true },
          reservationsOptions: { includeReservations: true, anonymizeGuestData: true }
        },
        'e2e_cross_system_dependencies'
      )

      expect(result.success).toBe(true)
      expect(result.warnings.some(w => w.includes('cross-system references'))).toBe(false) // No reference issues
    })
  })

  describe('🚨 Error Recovery and Resilience', () => {
    it('should handle partial system failures and continue with other systems', async () => {
      // Mock audit system failure, but conversations and reservations success
      let callCount = 0
      mockSupabase.select.mockImplementation(() => {
        callCount++
        if (callCount <= 3) { // Audit system calls
          return Promise.reject(new Error('Audit system database error'))
        }
        return Promise.resolve({ data: [], error: null }) // Other systems succeed
      })

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        SpecializedSystemsCloner.getDefaultOptions(),
        'e2e_partial_failure_recovery'
      )

      expect(result.success).toBe(false) // Overall failure due to audit system
      expect(result.auditResult?.success).toBe(false)
      expect(result.conversationsResult?.success).toBe(true)
      expect(result.reservationsResult?.success).toBe(true)
      expect(result.errors.some(e => e.includes('Audit system database error'))).toBe(true)
    })

    it('should perform rollback when critical errors occur', async () => {
      // Mock critical error during conversations cloning
      let callCount = 0
      mockSupabase.select.mockImplementation(() => {
        callCount++
        if (callCount === 5) { // Conversations system critical call
          return Promise.reject(new Error('Critical database corruption detected'))
        }
        return Promise.resolve({ data: [], error: null })
      })

      // Mock rollback functionality
      mockSupabase.delete.mockResolvedValue({ data: [], error: null })

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        {
          ...SpecializedSystemsCloner.getDefaultOptions(),
          rollbackOnCriticalError: true
        },
        'e2e_critical_error_rollback'
      )

      expect(result.success).toBe(false)
      expect(result.rollbackPerformed).toBe(true)
      expect(result.errors.some(e => e.includes('Critical database corruption detected'))).toBe(true)
    })

    it('should handle network interruptions gracefully', async () => {
      // Mock network interruption during cloning
      let callCount = 0
      mockSupabase.select.mockImplementation(() => {
        callCount++
        if (callCount >= 3 && callCount <= 5) {
          return Promise.reject(new Error('Network timeout'))
        }
        return Promise.resolve({ data: [], error: null })
      })

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        {
          ...SpecializedSystemsCloner.getDefaultOptions(),
          retryOnNetworkError: true,
          maxRetries: 3
        },
        'e2e_network_interruption'
      )

      // Should eventually succeed after retries
      expect(result.success).toBe(true)
      expect(result.retriesPerformed).toBeGreaterThan(0)
    })
  })

  describe('📊 Performance and Scalability', () => {
    it('should handle large-scale environment cloning efficiently', async () => {
      const startTime = Date.now()

      // Mock large-scale data
      const largeScaleData = {
        auditLogs: Array.from({ length: 10000 }, (_, i) => ({
          id: `log${i}`,
          table_name: 'users',
          operation: 'UPDATE',
          timestamp: new Date()
        })),
        conversations: Array.from({ length: 1000 }, (_, i) => ({
          id: `conv${i}`,
          title: `Conversation ${i}`
        })),
        messages: Array.from({ length: 50000 }, (_, i) => ({
          id: `msg${i}`,
          conversation_id: `conv${i % 1000}`,
          content: `Message ${i}`
        })),
        reservations: Array.from({ length: 5000 }, (_, i) => ({
          id: `res${i}`,
          loft_id: `loft${i % 100}`,
          guest_name: `Guest ${i}`
        }))
      }

      // Mock paginated responses for large data
      mockSupabase.select.mockImplementation(() => ({
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockImplementation((start, end) => {
          const pageSize = end - start + 1
          return Promise.resolve({ 
            data: Array.from({ length: Math.min(pageSize, 1000) }, (_, i) => ({ id: `item${start + i}` })), 
            error: null 
          })
        })
      }))

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        {
          ...SpecializedSystemsCloner.getDefaultOptions(),
          optimizeForLargeDatasets: true,
          batchSize: 1000,
          parallelProcessing: true
        },
        'e2e_large_scale_performance'
      )

      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(60000) // Should complete within 60 seconds
      expect(result.optimizationsApplied).toContain('batch_processing')
      expect(result.optimizationsApplied).toContain('parallel_processing')
    })

    it('should monitor memory usage during large operations', async () => {
      const memoryBefore = process.memoryUsage().heapUsed

      // Mock memory-intensive operation
      const memoryIntensiveData = Array.from({ length: 10000 }, (_, i) => ({
        id: `item${i}`,
        largeData: 'x'.repeat(1000), // 1KB per item = 10MB total
        metadata: { index: i, timestamp: new Date() }
      }))

      mockSupabase.select.mockResolvedValue({
        data: memoryIntensiveData,
        error: null
      })

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        {
          ...SpecializedSystemsCloner.getDefaultOptions(),
          memoryOptimization: true,
          streamProcessing: true
        },
        'e2e_memory_monitoring'
      )

      const memoryAfter = process.memoryUsage().heapUsed
      const memoryIncrease = memoryAfter - memoryBefore

      expect(result.success).toBe(true)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB increase
      expect(result.memoryOptimizationsApplied).toBe(true)
    })
  })

  describe('🔒 Security and Production Safety', () => {
    it('should enforce production safety guards throughout the process', async () => {
      // Attempt to clone TO production (should be blocked)
      const result = await orchestrator.cloneSpecializedSystems(
        testEnv,
        productionEnv, // Target is production - should be blocked
        SpecializedSystemsCloner.getDefaultOptions(),
        'e2e_production_safety_test'
      )

      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.includes('Production environment cannot be used as target'))).toBe(true)
      expect(result.safetyViolation).toBe(true)
    })

    it('should validate data anonymization completeness', async () => {
      // Mock sensitive data
      const sensitiveData = {
        auditLogs: [
          {
            id: 'log1',
            old_data: { 
              email: 'sensitive@company.com',
              phone: '+213555123456',
              name: 'Confidential User'
            }
          }
        ],
        messages: [
          {
            id: 'msg1',
            content: 'Contact john.doe@company.com for details about account 1234567890'
          }
        ],
        reservations: [
          {
            id: 'res1',
            guest_name: 'VIP Guest',
            guest_email: 'vip@company.com',
            guest_phone: '+213555987654'
          }
        ]
      }

      let callCount = 0
      mockSupabase.select.mockImplementation(() => {
        callCount++
        switch (callCount) {
          case 1: return Promise.resolve({ data: sensitiveData.auditLogs, error: null })
          case 2: return Promise.resolve({ data: sensitiveData.messages, error: null })
          case 3: return Promise.resolve({ data: sensitiveData.reservations, error: null })
          default: return Promise.resolve({ data: [], error: null })
        }
      })

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        {
          includeAuditSystem: true,
          includeConversationsSystem: true,
          includeReservationsSystem: true,
          auditOptions: { includeAuditLogs: true, anonymizeAuditData: true, preserveAuditStructure: true },
          conversationsOptions: { includeMessages: true, anonymizeMessageContent: true, preserveConversationStructure: true },
          reservationsOptions: { includeReservations: true, anonymizeGuestData: true },
          validateAnonymization: true
        },
        'e2e_anonymization_validation'
      )

      expect(result.success).toBe(true)
      expect(result.anonymizationValidation?.isComplete).toBe(true)
      expect(result.anonymizationValidation?.sensitiveDataFound).toBe(false)
      expect(result.auditResult?.logsAnonymized).toBe(1)
      expect(result.conversationsResult?.messagesAnonymized).toBe(1)
      expect(result.reservationsResult?.guestDataAnonymized).toBe(1)
    })
  })

  describe('📋 Comprehensive Reporting and Monitoring', () => {
    it('should generate detailed operation reports', async () => {
      mockSupabase.select.mockResolvedValue({ data: [], error: null })

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        SpecializedSystemsCloner.getTestOptions(),
        'e2e_comprehensive_reporting'
      )

      expect(result.success).toBe(true)
      
      // Verify comprehensive reporting
      expect(result.operationId).toBe('e2e_comprehensive_reporting')
      expect(result.totalDuration).toBeGreaterThan(0)
      expect(result.systemsCloned).toHaveLength(3)
      expect(result.startTime).toBeInstanceOf(Date)
      expect(result.endTime).toBeInstanceOf(Date)
      
      // Verify system-specific reports
      expect(result.auditResult).toBeDefined()
      expect(result.conversationsResult).toBeDefined()
      expect(result.reservationsResult).toBeDefined()
      
      // Verify metadata
      expect(result.sourceEnvironment).toBe(productionEnv.id)
      expect(result.targetEnvironment).toBe(testEnv.id)
      expect(result.cloneOptions).toBeDefined()
    })

    it('should provide real-time progress monitoring', async () => {
      const progressUpdates: any[] = []
      
      // Mock progress callback
      const progressCallback = (progress: any) => {
        progressUpdates.push(progress)
      }

      mockSupabase.select.mockResolvedValue({ data: [], error: null })

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        {
          ...SpecializedSystemsCloner.getDefaultOptions(),
          progressCallback
        },
        'e2e_progress_monitoring'
      )

      expect(result.success).toBe(true)
      expect(progressUpdates.length).toBeGreaterThan(0)
      
      // Verify progress updates contain required information
      const lastUpdate = progressUpdates[progressUpdates.length - 1]
      expect(lastUpdate.percentage).toBe(100)
      expect(lastUpdate.currentSystem).toBeDefined()
      expect(lastUpdate.systemsCompleted).toBeDefined()
    })
  })
})