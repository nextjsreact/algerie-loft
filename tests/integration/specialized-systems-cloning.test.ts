/**
 * Specialized Systems Cloning Integration Tests
 * 
 * Tests for audit system, conversations system, and reservations system cloning
 * Requirements: 8.1, 8.2, 8.3
 */

import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { 
  AuditSystemCloner,
  ConversationsSystemCloner,
  ReservationsSystemCloner,
  SpecializedSystemsCloner
} from '@/lib/environment-management/specialized-cloning'
import { Environment } from '@/lib/environment-management/types'
import { ProductionSafetyGuard } from '@/lib/environment-management/production-safety-guard'

// Mock dependencies
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}))

// Mock database client
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
  single: jest.fn().mockReturnThis(),
  rpc: jest.fn().mockReturnThis(),
  schema: jest.fn().mockReturnThis()
}

// Test environments
const createTestEnvironment = (type: 'production' | 'test' | 'training'): Environment => ({
  id: `env_${type}_${Date.now()}`,
  name: `${type.charAt(0).toUpperCase() + type.slice(1)} Environment`,
  type,
  supabaseUrl: `https://${type}-test.supabase.co`,
  supabaseAnonKey: `mock_anon_key_${type}`,
  supabaseServiceKey: `mock_service_key_${type}`,
  status: 'active',
  isProduction: type === 'production',
  allowWrites: type !== 'production',
  createdAt: new Date(),
  lastUpdated: new Date(),
  description: `Test ${type} environment`
})

describe('🔍 Specialized Systems Cloning Tests', () => {
  let productionEnv: Environment
  let testEnv: Environment
  let trainingEnv: Environment
  let safetyGuard: ProductionSafetyGuard

  beforeAll(() => {
    productionEnv = createTestEnvironment('production')
    testEnv = createTestEnvironment('test')
    trainingEnv = createTestEnvironment('training')
    safetyGuard = new ProductionSafetyGuard()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    const { createClient } = require('@/utils/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('🔍 Audit System Cloning Tests', () => {
    let auditCloner: AuditSystemCloner

    beforeEach(() => {
      auditCloner = new AuditSystemCloner()
    })

    it('should clone audit schema and tables successfully', async () => {
      // Mock audit tables data
      const mockAuditTables = [
        { table_name: 'audit_logs', table_schema: 'audit' },
        { table_name: 'audit_user_context', table_schema: 'audit' },
        { table_name: 'audit_retention_policies', table_schema: 'audit' }
      ]

      mockSupabase.select.mockResolvedValueOnce({
        data: mockAuditTables,
        error: null
      })

      // Mock table structure
      mockSupabase.select.mockResolvedValue({
        data: [
          { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
          { column_name: 'table_name', data_type: 'text', is_nullable: 'NO' },
          { column_name: 'operation', data_type: 'text', is_nullable: 'NO' },
          { column_name: 'old_data', data_type: 'jsonb', is_nullable: 'YES' },
          { column_name: 'new_data', data_type: 'jsonb', is_nullable: 'YES' },
          { column_name: 'user_id', data_type: 'uuid', is_nullable: 'YES' },
          { column_name: 'timestamp', data_type: 'timestamp with time zone', is_nullable: 'NO' }
        ],
        error: null
      })

      const options = {
        includeAuditLogs: true,
        anonymizeAuditData: true,
        preserveAuditStructure: true,
        maxLogAge: 30,
        logLevelFilter: ['info', 'warning', 'error'] as const
      }

      const result = await auditCloner.cloneAuditSystem(
        productionEnv,
        testEnv,
        options,
        'test_audit_clone'
      )

      expect(result.success).toBe(true)
      expect(result.tablesCloned).toContain('audit_logs')
      expect(result.tablesCloned).toContain('audit_user_context')
      expect(result.errors).toHaveLength(0)
    })

    it('should clone audit functions and triggers', async () => {
      // Mock audit functions
      const mockAuditFunctions = [
        { 
          routine_name: 'audit_trigger_function',
          routine_schema: 'audit',
          routine_definition: 'CREATE OR REPLACE FUNCTION audit.audit_trigger_function()...'
        },
        {
          routine_name: 'set_audit_user_context',
          routine_schema: 'audit',
          routine_definition: 'CREATE OR REPLACE FUNCTION audit.set_audit_user_context()...'
        }
      ]

      // Mock audit triggers
      const mockAuditTriggers = [
        {
          trigger_name: 'lofts_audit_trigger',
          event_object_table: 'lofts',
          action_statement: 'EXECUTE FUNCTION audit.audit_trigger_function()'
        },
        {
          trigger_name: 'transactions_audit_trigger',
          event_object_table: 'transactions',
          action_statement: 'EXECUTE FUNCTION audit.audit_trigger_function()'
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: [], error: null }) // tables
        .mockResolvedValueOnce({ data: mockAuditFunctions, error: null }) // functions
        .mockResolvedValueOnce({ data: mockAuditTriggers, error: null }) // triggers

      const options = {
        includeAuditLogs: false,
        anonymizeAuditData: false,
        preserveAuditStructure: true
      }

      const result = await auditCloner.cloneAuditSystem(
        productionEnv,
        testEnv,
        options,
        'test_audit_functions'
      )

      expect(result.success).toBe(true)
      expect(result.functionsCloned).toContain('audit_trigger_function')
      expect(result.functionsCloned).toContain('set_audit_user_context')
      expect(result.triggersCloned).toContain('lofts_audit_trigger')
      expect(result.triggersCloned).toContain('transactions_audit_trigger')
    })

    it('should anonymize audit logs while preserving structure', async () => {
      // Mock audit logs with sensitive data
      const mockAuditLogs = [
        {
          id: 'log1',
          table_name: 'users',
          operation: 'UPDATE',
          old_data: { email: 'user@example.com', name: 'John Doe' },
          new_data: { email: 'newemail@example.com', name: 'John Doe' },
          user_id: 'user123',
          timestamp: new Date()
        },
        {
          id: 'log2',
          table_name: 'transactions',
          operation: 'INSERT',
          old_data: null,
          new_data: { amount: 1000, description: 'Payment from John' },
          user_id: 'user456',
          timestamp: new Date()
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: [{ table_name: 'audit_logs' }], error: null })
        .mockResolvedValueOnce({ data: [], error: null }) // columns
        .mockResolvedValueOnce({ data: mockAuditLogs, error: null }) // logs data

      const options = {
        includeAuditLogs: true,
        anonymizeAuditData: true,
        preserveAuditStructure: true,
        maxLogAge: 30
      }

      const result = await auditCloner.cloneAuditSystem(
        productionEnv,
        testEnv,
        options,
        'test_audit_anonymization'
      )

      expect(result.success).toBe(true)
      expect(result.logsCloned).toBe(2)
      expect(result.logsAnonymized).toBe(2)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate audit system functionality after cloning', async () => {
      // Mock successful cloning
      mockSupabase.select.mockResolvedValue({ data: [], error: null })
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null })

      const options = {
        includeAuditLogs: true,
        anonymizeAuditData: false,
        preserveAuditStructure: true
      }

      const result = await auditCloner.cloneAuditSystem(
        productionEnv,
        testEnv,
        options,
        'test_audit_validation'
      )

      // Verify audit system is functional
      expect(result.success).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('test_audit_trigger_function')
    })

    it('should handle audit system errors gracefully', async () => {
      // Mock database error
      mockSupabase.select.mockRejectedValue(new Error('Database connection failed'))

      const options = {
        includeAuditLogs: true,
        anonymizeAuditData: true,
        preserveAuditStructure: true
      }

      const result = await auditCloner.cloneAuditSystem(
        productionEnv,
        testEnv,
        options,
        'test_audit_error'
      )

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Database connection failed')
    })
  })

  describe('💬 Conversations System Cloning Tests', () => {
    let conversationsCloner: ConversationsSystemCloner

    beforeEach(() => {
      conversationsCloner = new ConversationsSystemCloner()
    })

    it('should clone conversations tables and preserve relationships', async () => {
      // Mock conversations data
      const mockConversations = [
        { id: 'conv1', title: 'Project Discussion', created_at: new Date() },
        { id: 'conv2', title: 'Support Ticket', created_at: new Date() }
      ]

      const mockParticipants = [
        { id: 'part1', conversation_id: 'conv1', user_id: 'user1', role: 'admin' },
        { id: 'part2', conversation_id: 'conv1', user_id: 'user2', role: 'member' },
        { id: 'part3', conversation_id: 'conv2', user_id: 'user1', role: 'admin' }
      ]

      const mockMessages = [
        { 
          id: 'msg1', 
          conversation_id: 'conv1', 
          sender_id: 'user1', 
          content: 'Hello team!',
          message_type: 'text',
          created_at: new Date()
        },
        {
          id: 'msg2',
          conversation_id: 'conv1',
          sender_id: 'user2',
          content: 'Hi there!',
          message_type: 'text',
          created_at: new Date()
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockConversations, error: null })
        .mockResolvedValueOnce({ data: mockParticipants, error: null })
        .mockResolvedValueOnce({ data: mockMessages, error: null })

      const options = {
        includeMessages: true,
        anonymizeMessageContent: true,
        preserveConversationStructure: true,
        maxMessageAge: 30,
        messageTypeFilter: ['text', 'image', 'file'] as const
      }

      const result = await conversationsCloner.cloneConversationsSystem(
        productionEnv,
        testEnv,
        options,
        'test_conversations_clone'
      )

      expect(result.success).toBe(true)
      expect(result.conversationsCloned).toBe(2)
      expect(result.participantsCloned).toBe(3)
      expect(result.messagesCloned).toBe(2)
      expect(result.tablesCloned).toContain('conversations')
      expect(result.tablesCloned).toContain('conversation_participants')
      expect(result.tablesCloned).toContain('messages')
    })

    it('should anonymize message content while preserving conversation flow', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          conversation_id: 'conv1',
          sender_id: 'user1',
          content: 'Please contact John Doe at john@example.com for payment details',
          message_type: 'text',
          created_at: new Date()
        },
        {
          id: 'msg2',
          conversation_id: 'conv1',
          sender_id: 'user2',
          content: 'The guest phone number is +213555123456',
          message_type: 'text',
          created_at: new Date()
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: [], error: null }) // conversations
        .mockResolvedValueOnce({ data: [], error: null }) // participants
        .mockResolvedValueOnce({ data: mockMessages, error: null }) // messages

      const options = {
        includeMessages: true,
        anonymizeMessageContent: true,
        preserveConversationStructure: true
      }

      const result = await conversationsCloner.cloneConversationsSystem(
        productionEnv,
        testEnv,
        options,
        'test_message_anonymization'
      )

      expect(result.success).toBe(true)
      expect(result.messagesAnonymized).toBe(2)
      expect(result.errors).toHaveLength(0)
    })

    it('should test real-time functionality after cloning', async () => {
      // Mock successful cloning
      mockSupabase.select.mockResolvedValue({ data: [], error: null })
      
      // Mock real-time subscription test
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
        unsubscribe: jest.fn().mockResolvedValue({ status: 'CLOSED' })
      }

      mockSupabase.channel = jest.fn().mockReturnValue(mockChannel)

      const options = {
        includeMessages: true,
        anonymizeMessageContent: false,
        preserveConversationStructure: true
      }

      const result = await conversationsCloner.cloneConversationsSystem(
        productionEnv,
        testEnv,
        options,
        'test_realtime_functionality'
      )

      expect(result.success).toBe(true)
      // Verify real-time subscription was tested
      expect(mockSupabase.channel).toHaveBeenCalledWith('test_conversations_realtime')
    })

    it('should filter messages by type and age', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 45) // 45 days old

      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 15) // 15 days old

      const mockMessages = [
        {
          id: 'msg1',
          conversation_id: 'conv1',
          content: 'Old message',
          message_type: 'text',
          created_at: oldDate
        },
        {
          id: 'msg2',
          conversation_id: 'conv1',
          content: 'Recent message',
          message_type: 'text',
          created_at: recentDate
        },
        {
          id: 'msg3',
          conversation_id: 'conv1',
          content: 'System notification',
          message_type: 'system',
          created_at: recentDate
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: [], error: null }) // conversations
        .mockResolvedValueOnce({ data: [], error: null }) // participants
        .mockResolvedValueOnce({ data: mockMessages, error: null }) // messages

      const options = {
        includeMessages: true,
        anonymizeMessageContent: false,
        preserveConversationStructure: true,
        maxMessageAge: 30, // Only messages newer than 30 days
        messageTypeFilter: ['text'] as const // Only text messages
      }

      const result = await conversationsCloner.cloneConversationsSystem(
        productionEnv,
        testEnv,
        options,
        'test_message_filtering'
      )

      expect(result.success).toBe(true)
      // Should only clone 1 message (recent text message)
      expect(result.messagesCloned).toBe(1)
    })
  })

  describe('🏨 Reservations System Cloning Tests', () => {
    let reservationsCloner: ReservationsSystemCloner

    beforeEach(() => {
      reservationsCloner = new ReservationsSystemCloner()
    })

    it('should clone reservations with calendar and pricing data', async () => {
      // Mock reservations data
      const mockReservations = [
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
        },
        {
          id: 'res2',
          loft_id: 'loft2',
          guest_name: 'Jane Smith',
          guest_email: 'jane@example.com',
          guest_phone: '+213555654321',
          check_in: '2024-02-01',
          check_out: '2024-02-05',
          total_amount: 3200,
          status: 'pending'
        }
      ]

      // Mock availability data
      const mockAvailability = [
        {
          id: 'avail1',
          loft_id: 'loft1',
          date: '2024-01-15',
          is_available: false,
          price_per_night: 1000
        },
        {
          id: 'avail2',
          loft_id: 'loft1',
          date: '2024-01-16',
          is_available: false,
          price_per_night: 1000
        }
      ]

      // Mock pricing rules
      const mockPricingRules = [
        {
          id: 'price1',
          loft_id: 'loft1',
          season: 'high',
          base_price: 1000,
          weekend_multiplier: 1.2,
          holiday_multiplier: 1.5
        }
      ]

      // Mock payments
      const mockPayments = [
        {
          id: 'pay1',
          reservation_id: 'res1',
          amount: 2500,
          payment_method: 'card',
          status: 'completed'
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockReservations, error: null })
        .mockResolvedValueOnce({ data: mockAvailability, error: null })
        .mockResolvedValueOnce({ data: mockPricingRules, error: null })
        .mockResolvedValueOnce({ data: mockPayments, error: null })

      const options = {
        includeReservations: true,
        includeAvailability: true,
        includePricingRules: true,
        includePayments: true,
        anonymizeGuestData: true,
        anonymizePricingData: false,
        maxReservationAge: 90,
        statusFilter: ['confirmed', 'pending'] as const
      }

      const result = await reservationsCloner.cloneReservationsSystem(
        productionEnv,
        testEnv,
        options,
        'test_reservations_clone'
      )

      expect(result.success).toBe(true)
      expect(result.reservationsCloned).toBe(2)
      expect(result.availabilityRecordsCloned).toBe(2)
      expect(result.pricingRulesCloned).toBe(1)
      expect(result.paymentsCloned).toBe(1)
      expect(result.guestDataAnonymized).toBe(2)
      expect(result.tablesCloned).toContain('reservations')
      expect(result.tablesCloned).toContain('loft_availability')
      expect(result.tablesCloned).toContain('pricing_rules')
      expect(result.tablesCloned).toContain('reservation_payments')
    })

    it('should anonymize guest data while preserving reservation structure', async () => {
      const mockReservations = [
        {
          id: 'res1',
          loft_id: 'loft1',
          guest_name: 'John Doe',
          guest_email: 'john.doe@gmail.com',
          guest_phone: '+213555123456',
          guest_address: '123 Main St, Algiers',
          check_in: '2024-01-15',
          check_out: '2024-01-20',
          total_amount: 5000,
          status: 'confirmed'
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockReservations, error: null })
        .mockResolvedValueOnce({ data: [], error: null }) // availability
        .mockResolvedValueOnce({ data: [], error: null }) // pricing
        .mockResolvedValueOnce({ data: [], error: null }) // payments

      const options = {
        includeReservations: true,
        includeAvailability: false,
        includePricingRules: false,
        includePayments: false,
        anonymizeGuestData: true,
        anonymizePricingData: false
      }

      const result = await reservationsCloner.cloneReservationsSystem(
        productionEnv,
        testEnv,
        options,
        'test_guest_anonymization'
      )

      expect(result.success).toBe(true)
      expect(result.guestDataAnonymized).toBe(1)
      expect(result.errors).toHaveLength(0)
    })

    it('should anonymize pricing data while maintaining realistic ranges', async () => {
      const mockPricingRules = [
        {
          id: 'price1',
          loft_id: 'loft1',
          base_price: 1000,
          weekend_multiplier: 1.2,
          holiday_multiplier: 1.5,
          discount_weekly: 0.1,
          discount_monthly: 0.2
        },
        {
          id: 'price2',
          loft_id: 'loft2',
          base_price: 1500,
          weekend_multiplier: 1.3,
          holiday_multiplier: 1.6,
          discount_weekly: 0.15,
          discount_monthly: 0.25
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: [], error: null }) // reservations
        .mockResolvedValueOnce({ data: [], error: null }) // availability
        .mockResolvedValueOnce({ data: mockPricingRules, error: null })
        .mockResolvedValueOnce({ data: [], error: null }) // payments

      const options = {
        includeReservations: false,
        includeAvailability: false,
        includePricingRules: true,
        includePayments: false,
        anonymizeGuestData: false,
        anonymizePricingData: true
      }

      const result = await reservationsCloner.cloneReservationsSystem(
        productionEnv,
        testEnv,
        options,
        'test_pricing_anonymization'
      )

      expect(result.success).toBe(true)
      expect(result.pricingDataAnonymized).toBe(2)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate calendar consistency after cloning', async () => {
      // Mock availability data with potential conflicts
      const mockAvailability = [
        {
          id: 'avail1',
          loft_id: 'loft1',
          date: '2024-01-15',
          is_available: false, // Booked
          price_per_night: 1000
        },
        {
          id: 'avail2',
          loft_id: 'loft1',
          date: '2024-01-16',
          is_available: true, // Available (potential conflict)
          price_per_night: 1000
        }
      ]

      const mockReservations = [
        {
          id: 'res1',
          loft_id: 'loft1',
          check_in: '2024-01-15',
          check_out: '2024-01-17', // Should cover both dates
          status: 'confirmed'
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockReservations, error: null })
        .mockResolvedValueOnce({ data: mockAvailability, error: null })
        .mockResolvedValueOnce({ data: [], error: null }) // pricing
        .mockResolvedValueOnce({ data: [], error: null }) // payments

      const options = {
        includeReservations: true,
        includeAvailability: true,
        includePricingRules: false,
        includePayments: false,
        anonymizeGuestData: false,
        anonymizePricingData: false
      }

      const result = await reservationsCloner.cloneReservationsSystem(
        productionEnv,
        testEnv,
        options,
        'test_calendar_validation'
      )

      expect(result.success).toBe(true)
      // Should detect and report calendar inconsistency
      expect(result.warnings).toContain('Calendar inconsistency detected: availability conflicts with reservation')
    })

    it('should filter reservations by status and age', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 120) // 120 days old

      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 30) // 30 days old

      const mockReservations = [
        {
          id: 'res1',
          loft_id: 'loft1',
          status: 'confirmed',
          created_at: recentDate,
          check_in: '2024-01-15'
        },
        {
          id: 'res2',
          loft_id: 'loft2',
          status: 'cancelled',
          created_at: recentDate,
          check_in: '2024-01-20'
        },
        {
          id: 'res3',
          loft_id: 'loft3',
          status: 'confirmed',
          created_at: oldDate,
          check_in: '2023-10-15'
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockReservations, error: null })
        .mockResolvedValueOnce({ data: [], error: null }) // availability
        .mockResolvedValueOnce({ data: [], error: null }) // pricing
        .mockResolvedValueOnce({ data: [], error: null }) // payments

      const options = {
        includeReservations: true,
        includeAvailability: false,
        includePricingRules: false,
        includePayments: false,
        anonymizeGuestData: false,
        anonymizePricingData: false,
        maxReservationAge: 90, // Only reservations newer than 90 days
        statusFilter: ['confirmed', 'pending'] as const // Exclude cancelled
      }

      const result = await reservationsCloner.cloneReservationsSystem(
        productionEnv,
        testEnv,
        options,
        'test_reservation_filtering'
      )

      expect(result.success).toBe(true)
      // Should only clone 1 reservation (recent confirmed)
      expect(result.reservationsCloned).toBe(1)
    })
  })

  describe('🎯 Specialized Systems Orchestrator Tests', () => {
    let orchestrator: SpecializedSystemsCloner

    beforeEach(() => {
      orchestrator = new SpecializedSystemsCloner()
    })

    it('should orchestrate cloning of all specialized systems', async () => {
      // Mock successful responses for all systems
      mockSupabase.select.mockResolvedValue({ data: [], error: null })
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null })

      const options = SpecializedSystemsCloner.getTrainingOptions()

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        trainingEnv,
        options,
        'test_full_orchestration'
      )

      expect(result.success).toBe(true)
      expect(result.systemsCloned).toContain('audit')
      expect(result.systemsCloned).toContain('conversations')
      expect(result.systemsCloned).toContain('reservations')
      expect(result.auditResult?.success).toBe(true)
      expect(result.conversationsResult?.success).toBe(true)
      expect(result.reservationsResult?.success).toBe(true)
    })

    it('should handle partial failures gracefully', async () => {
      // Mock audit success, conversations failure, reservations success
      let callCount = 0
      mockSupabase.select.mockImplementation(() => {
        callCount++
        if (callCount >= 5 && callCount <= 8) { // Conversations calls
          return Promise.reject(new Error('Conversations system error'))
        }
        return Promise.resolve({ data: [], error: null })
      })

      const options = SpecializedSystemsCloner.getTestOptions()

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        options,
        'test_partial_failure'
      )

      expect(result.success).toBe(false) // Overall failure due to conversations
      expect(result.auditResult?.success).toBe(true)
      expect(result.conversationsResult?.success).toBe(false)
      expect(result.reservationsResult?.success).toBe(true)
      expect(result.errors).toContain('Conversations system error')
    })

    it('should respect production safety guards', async () => {
      // Try to clone from test to production (should be blocked)
      const result = await orchestrator.cloneSpecializedSystems(
        testEnv,
        productionEnv, // Target is production - should be blocked
        SpecializedSystemsCloner.getDefaultOptions(),
        'test_production_safety'
      )

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Production environment cannot be used as target')
    })

    it('should validate system dependencies', async () => {
      // Mock missing audit schema
      mockSupabase.select.mockImplementation((query) => {
        if (query.includes('audit')) {
          return Promise.resolve({ data: [], error: null }) // No audit tables
        }
        return Promise.resolve({ data: [{ table_name: 'test' }], error: null })
      })

      const options = {
        includeAuditSystem: true,
        includeConversationsSystem: true,
        includeReservationsSystem: false,
        auditOptions: { includeAuditLogs: true, anonymizeAuditData: true, preserveAuditStructure: true },
        conversationsOptions: { includeMessages: true, anonymizeMessageContent: true, preserveConversationStructure: true }
      }

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        testEnv,
        options,
        'test_dependency_validation'
      )

      expect(result.warnings).toContain('Audit system appears to be missing or incomplete')
    })

    it('should generate comprehensive operation reports', async () => {
      mockSupabase.select.mockResolvedValue({ data: [], error: null })

      const options = SpecializedSystemsCloner.getTrainingOptions()

      const result = await orchestrator.cloneSpecializedSystems(
        productionEnv,
        trainingEnv,
        options,
        'test_operation_reporting'
      )

      expect(result.success).toBe(true)
      expect(result.totalDuration).toBeGreaterThan(0)
      expect(result.systemsCloned).toHaveLength(3)
      expect(typeof result.auditResult?.tablesCloned).toBe('object')
      expect(typeof result.conversationsResult?.conversationsCloned).toBe('number')
      expect(typeof result.reservationsResult?.reservationsCloned).toBe('number')
    })
  })

  describe('🔧 Configuration and Options Tests', () => {
    it('should provide correct default options', () => {
      const defaultOptions = SpecializedSystemsCloner.getDefaultOptions()

      expect(defaultOptions.includeAuditSystem).toBe(true)
      expect(defaultOptions.includeConversationsSystem).toBe(true)
      expect(defaultOptions.includeReservationsSystem).toBe(true)
      expect(defaultOptions.auditOptions?.includeAuditLogs).toBe(false)
      expect(defaultOptions.conversationsOptions?.includeMessages).toBe(false)
      expect(defaultOptions.reservationsOptions?.includeReservations).toBe(true)
    })

    it('should provide correct training options', () => {
      const trainingOptions = SpecializedSystemsCloner.getTrainingOptions()

      expect(trainingOptions.auditOptions?.includeAuditLogs).toBe(true)
      expect(trainingOptions.auditOptions?.maxLogAge).toBe(90)
      expect(trainingOptions.conversationsOptions?.includeMessages).toBe(true)
      expect(trainingOptions.conversationsOptions?.maxMessageAge).toBe(60)
      expect(trainingOptions.reservationsOptions?.maxReservationAge).toBe(180)
    })

    it('should provide correct test options', () => {
      const testOptions = SpecializedSystemsCloner.getTestOptions()

      expect(testOptions.auditOptions?.includeAuditLogs).toBe(true)
      expect(testOptions.auditOptions?.maxLogAge).toBe(30)
      expect(testOptions.conversationsOptions?.includeMessages).toBe(true)
      expect(testOptions.conversationsOptions?.maxMessageAge).toBe(30)
      expect(testOptions.reservationsOptions?.maxReservationAge).toBe(60)
    })

    it('should validate option combinations', () => {
      const invalidOptions = {
        includeAuditSystem: true,
        auditOptions: undefined // Missing required options
      }

      expect(() => {
        SpecializedSystemsCloner.validateOptions(invalidOptions as any)
      }).toThrow('Audit options are required when includeAuditSystem is true')
    })
  })

  describe('🚨 Error Handling and Recovery Tests', () => {
    it('should handle database connection failures', async () => {
      const auditCloner = new AuditSystemCloner()
      
      // Mock connection failure
      const { createClient } = require('@/utils/supabase/server')
      createClient.mockRejectedValue(new Error('Connection timeout'))

      const options = {
        includeAuditLogs: true,
        anonymizeAuditData: true,
        preserveAuditStructure: true
      }

      const result = await auditCloner.cloneAuditSystem(
        productionEnv,
        testEnv,
        options,
        'test_connection_failure'
      )

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Connection timeout')
    })

    it('should handle schema validation failures', async () => {
      const conversationsCloner = new ConversationsSystemCloner()
      
      // Mock invalid schema
      mockSupabase.select.mockResolvedValue({
        data: [{ table_name: 'invalid_table' }],
        error: null
      })

      const options = {
        includeMessages: true,
        anonymizeMessageContent: true,
        preserveConversationStructure: true
      }

      const result = await conversationsCloner.cloneConversationsSystem(
        productionEnv,
        testEnv,
        options,
        'test_schema_validation'
      )

      expect(result.success).toBe(false)
      expect(result.errors.some(error => error.includes('schema validation'))).toBe(true)
    })

    it('should handle data integrity violations', async () => {
      const reservationsCloner = new ReservationsSystemCloner()
      
      // Mock data with integrity violations
      const mockReservations = [
        {
          id: 'res1',
          loft_id: 'nonexistent_loft', // Foreign key violation
          guest_name: 'John Doe',
          check_in: '2024-01-20',
          check_out: '2024-01-15', // Invalid date range
          status: 'confirmed'
        }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockReservations,
        error: null
      })

      const options = {
        includeReservations: true,
        includeAvailability: false,
        includePricingRules: false,
        includePayments: false,
        anonymizeGuestData: false,
        anonymizePricingData: false
      }

      const result = await reservationsCloner.cloneReservationsSystem(
        productionEnv,
        testEnv,
        options,
        'test_data_integrity'
      )

      expect(result.success).toBe(false)
      expect(result.errors.some(error => error.includes('data integrity'))).toBe(true)
    })
  })
})