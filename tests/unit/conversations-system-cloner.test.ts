/**
 * Unit Tests for Conversations System Cloner
 * 
 * Tests the conversations system cloning functionality with real-time features
 * Requirements: 8.2
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { ConversationsSystemCloner } from '@/lib/environment-management/specialized-cloning/conversations-system-cloner'
import { Environment } from '@/lib/environment-management/types'

// Mock dependencies
jest.mock('@/utils/supabase/server')
jest.mock('@/lib/logger')
jest.mock('@/lib/environment-management/production-safety-guard')
jest.mock('@/lib/environment-management/anonymization')

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  channel: jest.fn(),
  removeChannel: jest.fn()
}

const createMockEnvironment = (type: 'production' | 'test'): Environment => ({
  id: `env_${type}`,
  name: `${type} Environment`,
  type,
  supabaseUrl: `https://${type}.supabase.co`,
  supabaseAnonKey: 'mock_key',
  supabaseServiceKey: 'mock_service_key',
  status: 'active',
  isProduction: type === 'production',
  allowWrites: type !== 'production',
  createdAt: new Date(),
  lastUpdated: new Date(),
  description: `Mock ${type} environment`
})

describe('💬 Conversations System Cloner Unit Tests', () => {
  let conversationsCloner: ConversationsSystemCloner
  let productionEnv: Environment
  let testEnv: Environment

  beforeEach(() => {
    jest.clearAllMocks()
    conversationsCloner = new ConversationsSystemCloner()
    productionEnv = createMockEnvironment('production')
    testEnv = createMockEnvironment('test')
    
    const { createClient } = require('@/utils/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Schema Analysis', () => {
    it('should identify conversations tables correctly', async () => {
      const mockConversationTables = [
        { table_name: 'conversations', table_schema: 'public' },
        { table_name: 'conversation_participants', table_schema: 'public' },
        { table_name: 'messages', table_schema: 'public' }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockConversationTables,
        error: null
      })

      const tables = await conversationsCloner.analyzeConversationsSchema(productionEnv)

      expect(tables).toHaveLength(3)
      expect(tables.map(t => t.tableName)).toContain('conversations')
      expect(tables.map(t => t.tableName)).toContain('conversation_participants')
      expect(tables.map(t => t.tableName)).toContain('messages')
    })

    it('should extract conversation relationships correctly', async () => {
      const mockRelationships = [
        {
          table_name: 'conversation_participants',
          column_name: 'conversation_id',
          foreign_table_name: 'conversations',
          foreign_column_name: 'id'
        },
        {
          table_name: 'messages',
          column_name: 'conversation_id',
          foreign_table_name: 'conversations',
          foreign_column_name: 'id'
        },
        {
          table_name: 'messages',
          column_name: 'sender_id',
          foreign_table_name: 'users',
          foreign_column_name: 'id'
        }
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockRelationships,
        error: null
      })

      const relationships = await conversationsCloner.extractConversationRelationships(productionEnv)

      expect(relationships).toHaveLength(3)
      expect(relationships.some(r => r.fromTable === 'conversation_participants' && r.toTable === 'conversations')).toBe(true)
      expect(relationships.some(r => r.fromTable === 'messages' && r.toTable === 'conversations')).toBe(true)
      expect(relationships.some(r => r.fromTable === 'messages' && r.toTable === 'users')).toBe(true)
    })
  })

  describe('Data Cloning and Relationships', () => {
    it('should clone conversations with proper relationship preservation', async () => {
      const mockConversations = [
        { 
          id: 'conv1', 
          title: 'Project Discussion', 
          created_at: new Date(),
          updated_at: new Date(),
          status: 'active'
        },
        { 
          id: 'conv2', 
          title: 'Support Ticket #123', 
          created_at: new Date(),
          updated_at: new Date(),
          status: 'closed'
        }
      ]

      const mockParticipants = [
        { id: 'part1', conversation_id: 'conv1', user_id: 'user1', role: 'admin', joined_at: new Date() },
        { id: 'part2', conversation_id: 'conv1', user_id: 'user2', role: 'member', joined_at: new Date() },
        { id: 'part3', conversation_id: 'conv2', user_id: 'user1', role: 'admin', joined_at: new Date() }
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

      const result = await conversationsCloner.cloneConversationData(
        productionEnv,
        testEnv,
        {
          includeMessages: true,
          preserveConversationStructure: true,
          anonymizeMessageContent: false
        }
      )

      expect(result.conversationsCloned).toBe(2)
      expect(result.participantsCloned).toBe(3)
      expect(result.messagesCloned).toBe(2)
      expect(result.relationshipsPreserved).toBe(true)
    })

    it('should maintain conversation thread integrity', async () => {
      const mockMessages = [
        { 
          id: 'msg1', 
          conversation_id: 'conv1', 
          sender_id: 'user1', 
          content: 'Original message',
          parent_message_id: null,
          thread_id: 'thread1',
          created_at: new Date('2024-01-01T10:00:00Z')
        },
        {
          id: 'msg2',
          conversation_id: 'conv1',
          sender_id: 'user2',
          content: 'Reply to original',
          parent_message_id: 'msg1',
          thread_id: 'thread1',
          created_at: new Date('2024-01-01T10:05:00Z')
        },
        {
          id: 'msg3',
          conversation_id: 'conv1',
          sender_id: 'user1',
          content: 'Follow-up reply',
          parent_message_id: 'msg2',
          thread_id: 'thread1',
          created_at: new Date('2024-01-01T10:10:00Z')
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: [], error: null }) // conversations
        .mockResolvedValueOnce({ data: [], error: null }) // participants
        .mockResolvedValueOnce({ data: mockMessages, error: null }) // messages

      const result = await conversationsCloner.cloneConversationData(
        productionEnv,
        testEnv,
        {
          includeMessages: true,
          preserveConversationStructure: true,
          preserveThreadStructure: true
        }
      )

      expect(result.messagesCloned).toBe(3)
      expect(result.threadsPreserved).toBe(1)
      expect(result.threadIntegrityValid).toBe(true)
    })
  })

  describe('Message Content Anonymization', () => {
    it('should anonymize sensitive content in messages', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          conversation_id: 'conv1',
          sender_id: 'user1',
          content: 'Please contact John Doe at john.doe@example.com or call +213555123456',
          message_type: 'text',
          created_at: new Date()
        },
        {
          id: 'msg2',
          conversation_id: 'conv1',
          sender_id: 'user2',
          content: 'The guest address is 123 Main Street, Algiers, Algeria',
          message_type: 'text',
          created_at: new Date()
        },
        {
          id: 'msg3',
          conversation_id: 'conv1',
          sender_id: 'user1',
          content: 'Payment of 15000 DZD received from account 1234567890',
          message_type: 'text',
          created_at: new Date()
        }
      ]

      const anonymizedMessages = await conversationsCloner.anonymizeMessageContent(mockMessages, {
        anonymizeEmails: true,
        anonymizePhones: true,
        anonymizeNames: true,
        anonymizeAddresses: true,
        anonymizeFinancialData: true,
        preserveMessageStructure: true
      })

      expect(anonymizedMessages).toHaveLength(3)
      
      // Check that sensitive data is anonymized
      expect(anonymizedMessages[0].content).not.toContain('john.doe@example.com')
      expect(anonymizedMessages[0].content).not.toContain('+213555123456')
      expect(anonymizedMessages[0].content).not.toContain('John Doe')
      
      expect(anonymizedMessages[1].content).not.toContain('123 Main Street')
      expect(anonymizedMessages[1].content).not.toContain('Algiers')
      
      expect(anonymizedMessages[2].content).not.toContain('1234567890')
      
      // Check that message structure is preserved
      expect(anonymizedMessages[0].id).toBe('msg1')
      expect(anonymizedMessages[0].conversation_id).toBe('conv1')
      expect(anonymizedMessages[0].message_type).toBe('text')
    })

    it('should handle different message types appropriately', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          content: 'Text message with email: user@example.com',
          message_type: 'text',
          attachments: null
        },
        {
          id: 'msg2',
          content: 'Image shared',
          message_type: 'image',
          attachments: [{ filename: 'photo.jpg', url: 'https://example.com/photo.jpg' }]
        },
        {
          id: 'msg3',
          content: 'File shared: contract_john_doe.pdf',
          message_type: 'file',
          attachments: [{ filename: 'contract_john_doe.pdf', url: 'https://example.com/file.pdf' }]
        },
        {
          id: 'msg4',
          content: 'User John Doe joined the conversation',
          message_type: 'system',
          attachments: null
        }
      ]

      const anonymizedMessages = await conversationsCloner.anonymizeMessageContent(mockMessages, {
        anonymizeEmails: true,
        anonymizeNames: true,
        anonymizeFileNames: true,
        preserveMessageStructure: true
      })

      // Text message should be anonymized
      expect(anonymizedMessages[0].content).not.toContain('user@example.com')
      
      // Image message content should be preserved, but attachments anonymized if needed
      expect(anonymizedMessages[1].message_type).toBe('image')
      expect(anonymizedMessages[1].content).toBe('Image shared')
      
      // File message should have filename anonymized
      expect(anonymizedMessages[2].attachments[0].filename).not.toContain('john_doe')
      
      // System message should be anonymized
      expect(anonymizedMessages[3].content).not.toContain('John Doe')
    })

    it('should preserve message formatting and structure', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          content: '**Bold text** with *italic* and `code` formatting\n\nNew paragraph with email: user@example.com',
          message_type: 'text',
          formatting: {
            bold: [[0, 11]],
            italic: [[17, 24]],
            code: [[29, 34]]
          }
        }
      ]

      const anonymizedMessages = await conversationsCloner.anonymizeMessageContent(mockMessages, {
        anonymizeEmails: true,
        preserveFormatting: true,
        preserveMessageStructure: true
      })

      // Formatting should be preserved
      expect(anonymizedMessages[0].formatting).toEqual(mockMessages[0].formatting)
      expect(anonymizedMessages[0].content).toContain('**Bold text**')
      expect(anonymizedMessages[0].content).toContain('*italic*')
      expect(anonymizedMessages[0].content).toContain('`code`')
      
      // Email should be anonymized
      expect(anonymizedMessages[0].content).not.toContain('user@example.com')
    })
  })

  describe('Real-time Functionality Testing', () => {
    it('should test real-time message subscriptions', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
        unsubscribe: jest.fn().mockResolvedValue({ status: 'CLOSED' })
      }

      mockSupabase.channel.mockReturnValue(mockChannel)

      const realtimeTest = await conversationsCloner.testRealtimeMessaging(testEnv, 'conv1')

      expect(realtimeTest.subscriptionSuccessful).toBe(true)
      expect(realtimeTest.channelName).toBe('conversation:conv1')
      expect(mockChannel.on).toHaveBeenCalledWith('postgres_changes', 
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: 'conversation_id=eq.conv1'
        }),
        expect.any(Function)
      )
    })

    it('should test real-time presence functionality', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
        track: jest.fn().mockResolvedValue({ status: 'ok' }),
        untrack: jest.fn().mockResolvedValue({ status: 'ok' }),
        unsubscribe: jest.fn().mockResolvedValue({ status: 'CLOSED' })
      }

      mockSupabase.channel.mockReturnValue(mockChannel)

      const presenceTest = await conversationsCloner.testRealtimePresence(testEnv, 'conv1', 'user1')

      expect(presenceTest.presenceTrackingSuccessful).toBe(true)
      expect(mockChannel.track).toHaveBeenCalledWith({
        user_id: 'user1',
        online_at: expect.any(String)
      })
    })

    it('should test real-time typing indicators', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
        send: jest.fn().mockResolvedValue({ status: 'ok' }),
        unsubscribe: jest.fn().mockResolvedValue({ status: 'CLOSED' })
      }

      mockSupabase.channel.mockReturnValue(mockChannel)

      const typingTest = await conversationsCloner.testTypingIndicators(testEnv, 'conv1', 'user1')

      expect(typingTest.typingIndicatorsWorking).toBe(true)
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: 'user1',
          conversation_id: 'conv1',
          is_typing: true
        }
      })
    })

    it('should handle real-time connection failures gracefully', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockRejectedValue(new Error('Connection failed')),
        unsubscribe: jest.fn().mockResolvedValue({ status: 'CLOSED' })
      }

      mockSupabase.channel.mockReturnValue(mockChannel)

      const realtimeTest = await conversationsCloner.testRealtimeMessaging(testEnv, 'conv1')

      expect(realtimeTest.subscriptionSuccessful).toBe(false)
      expect(realtimeTest.error).toBe('Connection failed')
    })
  })

  describe('Message Filtering and Pagination', () => {
    it('should filter messages by age correctly', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 45) // 45 days old

      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 15) // 15 days old

      const mockMessages = [
        {
          id: 'msg1',
          conversation_id: 'conv1',
          content: 'Old message',
          created_at: oldDate
        },
        {
          id: 'msg2',
          conversation_id: 'conv1',
          content: 'Recent message',
          created_at: recentDate
        }
      ]

      const filteredMessages = await conversationsCloner.filterMessages(mockMessages, {
        maxAge: 30 // Only messages newer than 30 days
      })

      expect(filteredMessages).toHaveLength(1)
      expect(filteredMessages[0].id).toBe('msg2')
    })

    it('should filter messages by type correctly', async () => {
      const mockMessages = [
        { id: 'msg1', message_type: 'text', content: 'Text message' },
        { id: 'msg2', message_type: 'image', content: 'Image shared' },
        { id: 'msg3', message_type: 'file', content: 'File shared' },
        { id: 'msg4', message_type: 'system', content: 'System notification' }
      ]

      const filteredMessages = await conversationsCloner.filterMessages(mockMessages, {
        messageTypeFilter: ['text', 'image'] // Only text and image messages
      })

      expect(filteredMessages).toHaveLength(2)
      expect(filteredMessages.map(m => m.message_type)).toEqual(['text', 'image'])
    })

    it('should handle large conversation datasets with pagination', async () => {
      // Mock large conversation with many messages
      const largeMessageSet = Array.from({ length: 5000 }, (_, i) => ({
        id: `msg${i}`,
        conversation_id: 'conv1',
        content: `Message ${i}`,
        created_at: new Date(Date.now() - i * 60000) // Messages 1 minute apart
      }))

      // Mock paginated responses
      let pageCount = 0
      mockSupabase.select.mockImplementation(() => ({
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockImplementation((start, end) => {
          const pageSize = end - start + 1
          const pageData = largeMessageSet.slice(start, end + 1)
          pageCount++
          return Promise.resolve({ data: pageData, error: null })
        })
      }))

      const result = await conversationsCloner.cloneConversationData(
        productionEnv,
        testEnv,
        {
          includeMessages: true,
          paginationSize: 1000,
          preserveConversationStructure: true
        }
      )

      expect(result.messagesCloned).toBe(5000)
      expect(pageCount).toBe(5) // 5000 messages / 1000 per page
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle conversation data corruption gracefully', async () => {
      const corruptedConversations = [
        {
          id: null, // Corrupted ID
          title: 'Valid conversation',
          created_at: 'invalid_date' // Invalid date format
        },
        {
          id: 'conv2',
          title: null, // Missing title
          created_at: new Date()
        }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: corruptedConversations, error: null })
        .mockResolvedValueOnce({ data: [], error: null }) // participants
        .mockResolvedValueOnce({ data: [], error: null }) // messages

      const result = await conversationsCloner.cloneConversationData(
        productionEnv,
        testEnv,
        { includeMessages: true, preserveConversationStructure: true }
      )

      expect(result.success).toBe(false)
      expect(result.errors.some(error => error.includes('data corruption'))).toBe(true)
      expect(result.conversationsSkipped).toBe(2)
    })

    it('should handle orphaned messages gracefully', async () => {
      const mockConversations = [
        { id: 'conv1', title: 'Valid conversation' }
      ]

      const mockMessages = [
        { id: 'msg1', conversation_id: 'conv1', content: 'Valid message' },
        { id: 'msg2', conversation_id: 'conv_nonexistent', content: 'Orphaned message' }
      ]

      mockSupabase.select
        .mockResolvedValueOnce({ data: mockConversations, error: null })
        .mockResolvedValueOnce({ data: [], error: null }) // participants
        .mockResolvedValueOnce({ data: mockMessages, error: null })

      const result = await conversationsCloner.cloneConversationData(
        productionEnv,
        testEnv,
        { includeMessages: true, preserveConversationStructure: true }
      )

      expect(result.success).toBe(true)
      expect(result.messagesCloned).toBe(1) // Only valid message
      expect(result.orphanedMessages).toBe(1)
      expect(result.warnings).toContain('Found 1 orphaned messages without valid conversation references')
    })

    it('should handle real-time service unavailability', async () => {
      // Mock real-time service being unavailable
      mockSupabase.channel.mockImplementation(() => {
        throw new Error('Real-time service unavailable')
      })

      const realtimeValidation = await conversationsCloner.validateRealtimeFeatures(testEnv)

      expect(realtimeValidation.isAvailable).toBe(false)
      expect(realtimeValidation.error).toBe('Real-time service unavailable')
      expect(realtimeValidation.features.messaging).toBe(false)
      expect(realtimeValidation.features.presence).toBe(false)
      expect(realtimeValidation.features.typing).toBe(false)
    })
  })

  describe('Performance Optimization', () => {
    it('should optimize message cloning for large conversations', async () => {
      const startTime = Date.now()

      // Mock large conversation
      const largeConversation = {
        id: 'conv1',
        title: 'Large conversation',
        messageCount: 50000
      }

      const mockMessages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg${i}`,
        conversation_id: 'conv1',
        content: `Message ${i}`,
        created_at: new Date()
      }))

      mockSupabase.select
        .mockResolvedValueOnce({ data: [largeConversation], error: null })
        .mockResolvedValueOnce({ data: [], error: null }) // participants
        .mockResolvedValue({ data: mockMessages, error: null }) // messages (paginated)

      const result = await conversationsCloner.cloneConversationData(
        productionEnv,
        testEnv,
        {
          includeMessages: true,
          optimizeForLargeConversations: true,
          batchSize: 1000,
          parallelProcessing: true
        }
      )

      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
      expect(result.optimizationsApplied).toContain('batch_processing')
      expect(result.optimizationsApplied).toContain('parallel_processing')
    })
  })
})