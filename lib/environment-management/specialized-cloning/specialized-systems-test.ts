/**
 * Test file for Specialized Systems Cloning
 * 
 * This file provides basic tests to verify the functionality of the specialized
 * system cloning components.
 */

import { 
  SpecializedSystemsCloner,
  AuditSystemCloner,
  ConversationsSystemCloner,
  ReservationsSystemCloner
} from './index'
import { Environment } from '../types'

/**
 * Mock environment for testing
 */
const createMockEnvironment = (type: 'production' | 'test' | 'training'): Environment => ({
  id: `env_${type}_${Date.now()}`,
  name: `${type.charAt(0).toUpperCase() + type.slice(1)} Environment`,
  type,
  supabaseUrl: `https://${type}.supabase.co`,
  supabaseAnonKey: `mock_anon_key_${type}`,
  supabaseServiceKey: `mock_service_key_${type}`,
  status: 'active',
  isProduction: type === 'production',
  allowWrites: type !== 'production',
  createdAt: new Date(),
  lastUpdated: new Date(),
  description: `Mock ${type} environment for testing`
})

/**
 * Test the audit system cloner
 */
export async function testAuditSystemCloner(): Promise<void> {
  console.log('🧪 Testing Audit System Cloner...')
  
  const auditCloner = new AuditSystemCloner()
  const sourceEnv = createMockEnvironment('production')
  const targetEnv = createMockEnvironment('test')
  
  const options = {
    includeAuditLogs: true,
    anonymizeAuditData: true,
    preserveAuditStructure: true,
    maxLogAge: 30,
    logLevelFilter: ['info', 'warning', 'error'] as const
  }
  
  try {
    const result = await auditCloner.cloneAuditSystem(
      sourceEnv,
      targetEnv,
      options,
      'test_audit_clone'
    )
    
    console.log('✅ Audit System Cloner Test Results:')
    console.log(`   - Success: ${result.success}`)
    console.log(`   - Tables Cloned: ${result.tablesCloned.length}`)
    console.log(`   - Functions Cloned: ${result.functionsCloned.length}`)
    console.log(`   - Triggers Cloned: ${result.triggersCloned.length}`)
    console.log(`   - Logs Cloned: ${result.logsCloned}`)
    console.log(`   - Logs Anonymized: ${result.logsAnonymized}`)
    console.log(`   - Errors: ${result.errors.length}`)
    console.log(`   - Warnings: ${result.warnings.length}`)
    
  } catch (error) {
    console.error('❌ Audit System Cloner Test Failed:', error.message)
  }
}

/**
 * Test the conversations system cloner
 */
export async function testConversationsSystemCloner(): Promise<void> {
  console.log('🧪 Testing Conversations System Cloner...')
  
  const conversationsCloner = new ConversationsSystemCloner()
  const sourceEnv = createMockEnvironment('production')
  const targetEnv = createMockEnvironment('test')
  
  const options = {
    includeMessages: true,
    anonymizeMessageContent: true,
    preserveConversationStructure: true,
    maxMessageAge: 30,
    messageTypeFilter: ['text', 'image', 'file', 'system'] as const
  }
  
  try {
    const result = await conversationsCloner.cloneConversationsSystem(
      sourceEnv,
      targetEnv,
      options,
      'test_conversations_clone'
    )
    
    console.log('✅ Conversations System Cloner Test Results:')
    console.log(`   - Success: ${result.success}`)
    console.log(`   - Tables Cloned: ${result.tablesCloned.length}`)
    console.log(`   - Conversations Cloned: ${result.conversationsCloned}`)
    console.log(`   - Participants Cloned: ${result.participantsCloned}`)
    console.log(`   - Messages Cloned: ${result.messagesCloned}`)
    console.log(`   - Messages Anonymized: ${result.messagesAnonymized}`)
    console.log(`   - Errors: ${result.errors.length}`)
    console.log(`   - Warnings: ${result.warnings.length}`)
    
  } catch (error) {
    console.error('❌ Conversations System Cloner Test Failed:', error.message)
  }
}

/**
 * Test the reservations system cloner
 */
export async function testReservationsSystemCloner(): Promise<void> {
  console.log('🧪 Testing Reservations System Cloner...')
  
  const reservationsCloner = new ReservationsSystemCloner()
  const sourceEnv = createMockEnvironment('production')
  const targetEnv = createMockEnvironment('test')
  
  const options = {
    includeReservations: true,
    includeAvailability: true,
    includePricingRules: true,
    includePayments: true,
    anonymizeGuestData: true,
    anonymizePricingData: true,
    maxReservationAge: 90,
    statusFilter: ['pending', 'confirmed', 'cancelled', 'completed'] as const
  }
  
  try {
    const result = await reservationsCloner.cloneReservationsSystem(
      sourceEnv,
      targetEnv,
      options,
      'test_reservations_clone'
    )
    
    console.log('✅ Reservations System Cloner Test Results:')
    console.log(`   - Success: ${result.success}`)
    console.log(`   - Tables Cloned: ${result.tablesCloned.length}`)
    console.log(`   - Reservations Cloned: ${result.reservationsCloned}`)
    console.log(`   - Availability Records Cloned: ${result.availabilityRecordsCloned}`)
    console.log(`   - Pricing Rules Cloned: ${result.pricingRulesCloned}`)
    console.log(`   - Payments Cloned: ${result.paymentsCloned}`)
    console.log(`   - Guest Data Anonymized: ${result.guestDataAnonymized}`)
    console.log(`   - Pricing Data Anonymized: ${result.pricingDataAnonymized}`)
    console.log(`   - Errors: ${result.errors.length}`)
    console.log(`   - Warnings: ${result.warnings.length}`)
    
  } catch (error) {
    console.error('❌ Reservations System Cloner Test Failed:', error.message)
  }
}

/**
 * Test the specialized systems orchestrator
 */
export async function testSpecializedSystemsOrchestrator(): Promise<void> {
  console.log('🧪 Testing Specialized Systems Orchestrator...')
  
  const orchestrator = new SpecializedSystemsCloner()
  const sourceEnv = createMockEnvironment('production')
  const targetEnv = createMockEnvironment('training')
  
  // Use training options for comprehensive testing
  const options = SpecializedSystemsCloner.getTrainingOptions()
  
  try {
    const result = await orchestrator.cloneSpecializedSystems(
      sourceEnv,
      targetEnv,
      options,
      'test_orchestrator_clone'
    )
    
    console.log('✅ Specialized Systems Orchestrator Test Results:')
    console.log(`   - Success: ${result.success}`)
    console.log(`   - Systems Cloned: ${result.systemsCloned.join(', ')}`)
    console.log(`   - Total Duration: ${result.totalDuration}ms`)
    console.log(`   - Errors: ${result.errors.length}`)
    console.log(`   - Warnings: ${result.warnings.length}`)
    
    if (result.auditResult) {
      console.log(`   - Audit System: ${result.auditResult.success ? '✅' : '❌'}`)
    }
    
    if (result.conversationsResult) {
      console.log(`   - Conversations System: ${result.conversationsResult.success ? '✅' : '❌'}`)
    }
    
    if (result.reservationsResult) {
      console.log(`   - Reservations System: ${result.reservationsResult.success ? '✅' : '❌'}`)
    }
    
  } catch (error) {
    console.error('❌ Specialized Systems Orchestrator Test Failed:', error.message)
  }
}

/**
 * Test different option configurations
 */
export async function testOptionConfigurations(): Promise<void> {
  console.log('🧪 Testing Option Configurations...')
  
  // Test default options
  const defaultOptions = SpecializedSystemsCloner.getDefaultOptions()
  console.log('✅ Default Options:')
  console.log(`   - Include Audit: ${defaultOptions.includeAuditSystem}`)
  console.log(`   - Include Conversations: ${defaultOptions.includeConversationsSystem}`)
  console.log(`   - Include Reservations: ${defaultOptions.includeReservationsSystem}`)
  
  // Test training options
  const trainingOptions = SpecializedSystemsCloner.getTrainingOptions()
  console.log('✅ Training Options:')
  console.log(`   - Audit Max Log Age: ${trainingOptions.auditOptions?.maxLogAge} days`)
  console.log(`   - Conversations Max Message Age: ${trainingOptions.conversationsOptions?.maxMessageAge} days`)
  console.log(`   - Reservations Max Age: ${trainingOptions.reservationsOptions?.maxReservationAge} days`)
  
  // Test test options
  const testOptions = SpecializedSystemsCloner.getTestOptions()
  console.log('✅ Test Options:')
  console.log(`   - Include Audit Logs: ${testOptions.auditOptions?.includeAuditLogs}`)
  console.log(`   - Include Messages: ${testOptions.conversationsOptions?.includeMessages}`)
  console.log(`   - Include Availability: ${testOptions.reservationsOptions?.includeAvailability}`)
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Specialized Systems Cloning Tests...\n')
  
  try {
    await testAuditSystemCloner()
    console.log('')
    
    await testConversationsSystemCloner()
    console.log('')
    
    await testReservationsSystemCloner()
    console.log('')
    
    await testSpecializedSystemsOrchestrator()
    console.log('')
    
    await testOptionConfigurations()
    console.log('')
    
    console.log('🎉 All Specialized Systems Cloning Tests Completed!')
    
  } catch (error) {
    console.error('💥 Test Suite Failed:', error.message)
  }
}

// Export for use in other test files
export {
  createMockEnvironment
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error)
}