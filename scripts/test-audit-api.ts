#!/usr/bin/env node

/**
 * Script de test pour l'API d'audit
 * Ce script teste les endpoints d'audit pour diagnostiquer les problèmes
 */

import { AuditService } from '../lib/services/audit-service'

async function testAuditService() {
  console.log('🧪 Testing Audit Service...\n')

  try {
    console.log('1. Testing getAuditLogs...')
    const { logs, total } = await AuditService.getAuditLogs({}, 1, 5)
    console.log(`✅ Success: Retrieved ${logs.length} logs (total: ${total})`)
    
    if (logs.length > 0) {
      console.log('   Sample log:', {
        id: logs[0].id,
        tableName: logs[0].tableName,
        action: logs[0].action,
        timestamp: logs[0].timestamp
      })
    }

  } catch (error) {
    console.error('❌ Error in getAuditLogs:', error.message)
  }

  try {
    console.log('\n2. Testing getEntityAuditHistory...')
    
    // First, let's try to get any existing record ID
    const { logs } = await AuditService.getAuditLogs({ tableName: 'transactions' }, 1, 1)
    
    if (logs.length > 0) {
      const recordId = logs[0].recordId
      console.log(`   Testing with record ID: ${recordId}`)
      
      const history = await AuditService.getEntityAuditHistory('transactions', recordId)
      console.log(`✅ Success: Retrieved ${history.length} history entries`)
      
      if (history.length > 0) {
        console.log('   Sample history:', {
          action: history[0].action,
          timestamp: history[0].timestamp,
          userEmail: history[0].userEmail
        })
      }
    } else {
      console.log('   No transaction records found to test with')
    }

  } catch (error) {
    console.error('❌ Error in getEntityAuditHistory:', error.message)
  }

  try {
    console.log('\n3. Testing with fake UUID...')
    const fakeId = '123e4567-e89b-12d3-a456-426614174000'
    const history = await AuditService.getEntityAuditHistory('transactions', fakeId)
    console.log(`✅ Success: Retrieved ${history.length} history entries for fake ID (should be 0)`)

  } catch (error) {
    console.error('❌ Error with fake UUID:', error.message)
  }

  console.log('\n🎯 Test completed!')
}

// Run the test
testAuditService().catch(console.error)