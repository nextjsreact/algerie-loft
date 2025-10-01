#!/usr/bin/env tsx
/**
 * SIMPLE CLONE VALIDATION TEST
 * ============================
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testValidation() {
  console.log('🔍 SIMPLE CLONE VALIDATION TEST')
  console.log('='.repeat(40))

  try {
    // Initialize clients
    console.log('🔧 Initializing clients...')
    
    // Production
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodClient = createClient(prodUrl, prodKey)
    
    // Development
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const devClient = createClient(devUrl, devKey)
    
    console.log('✅ Clients initialized')

    // Test key tables
    const testTables = ['currencies', 'categories', 'lofts']
    
    console.log('\n📊 COMPARING RECORD COUNTS:')
    console.log('-'.repeat(40))
    
    for (const table of testTables) {
      try {
        // Get PROD count
        const { data: prodData, error: prodError } = await prodClient
          .from(table)
          .select('*')
        
        const prodCount = prodData?.length || 0
        
        // Get DEV count
        const { data: devData, error: devError } = await devClient
          .from(table)
          .select('*')
        
        const devCount = devData?.length || 0
        
        // Calculate success rate
        const successRate = prodCount > 0 ? (devCount / prodCount) * 100 : 100
        
        const status = successRate >= 90 ? '✅' : 
                      successRate >= 50 ? '⚠️' : '❌'
        
        console.log(`${status} ${table}: PROD=${prodCount}, DEV=${devCount} (${successRate.toFixed(1)}%)`)
        
      } catch (error) {
        console.log(`❌ ${table}: Error - ${error}`)
      }
    }

    // Test anonymization
    console.log('\n🔒 CHECKING ANONYMIZATION:')
    console.log('-'.repeat(40))
    
    try {
      const { data: profiles } = await devClient
        .from('profiles')
        .select('email')
        .limit(3)
      
      if (profiles && profiles.length > 0) {
        const anonymized = profiles.every(p => 
          !p.email || p.email.includes('dev.local') || p.email.includes('@dev')
        )
        
        if (anonymized) {
          console.log('✅ Email anonymization: SUCCESS')
        } else {
          console.log('⚠️ Email anonymization: Some production emails detected')
        }
        
        console.log('   Sample emails:', profiles.map(p => p.email).join(', '))
      } else {
        console.log('ℹ️ No profiles found to check anonymization')
      }
    } catch (error) {
      console.log(`⚠️ Anonymization check failed: ${error}`)
    }

    // Test basic functionality
    console.log('\n🧪 TESTING BASIC FUNCTIONALITY:')
    console.log('-'.repeat(40))
    
    const functionalityTests = [
      { table: 'currencies', test: 'Currency lookup' },
      { table: 'categories', test: 'Category lookup' },
      { table: 'lofts', test: 'Loft listing' }
    ]
    
    for (const test of functionalityTests) {
      try {
        const { data, error } = await devClient
          .from(test.table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${test.test}: ${error.message}`)
        } else if (data && data.length > 0) {
          console.log(`✅ ${test.test}: Working`)
        } else {
          console.log(`⚠️ ${test.test}: No data available`)
        }
      } catch (error) {
        console.log(`❌ ${test.test}: ${error}`)
      }
    }

    console.log('\n🎯 VALIDATION SUMMARY:')
    console.log('='.repeat(40))
    console.log('✅ Clone validation completed')
    console.log('💡 Check results above for any issues')
    console.log('🚀 You can now test your app: npm run dev')

  } catch (error) {
    console.error('💥 VALIDATION ERROR:', error)
    process.exit(1)
  }
}

testValidation().catch(console.error)