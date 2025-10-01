#!/usr/bin/env tsx
/**
 * QUICK CLONE VALIDATION
 * ======================
 * Fast validation of essential tables only
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function quickValidate() {
  console.log('⚡ QUICK CLONE VALIDATION')
  console.log('='.repeat(30))

  try {
    // Initialize clients
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    const prodClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Essential tables only
    const essentialTables = ['currencies', 'categories', 'lofts']
    let totalSuccess = 0
    let totalTables = essentialTables.length

    console.log('📊 Essential Tables:')
    for (const table of essentialTables) {
      try {
        const [prodResult, devResult] = await Promise.all([
          prodClient.from(table).select('*'),
          devClient.from(table).select('*')
        ])

        const prodCount = prodResult.data?.length || 0
        const devCount = devResult.data?.length || 0
        const rate = prodCount > 0 ? (devCount / prodCount) * 100 : 100

        if (rate >= 70) {
          console.log(`✅ ${table}: ${rate.toFixed(0)}% (${devCount}/${prodCount})`)
          totalSuccess++
        } else {
          console.log(`❌ ${table}: ${rate.toFixed(0)}% (${devCount}/${prodCount})`)
        }
      } catch (error) {
        console.log(`❌ ${table}: Error`)
      }
    }

    // Quick functionality test
    console.log('\n🧪 Quick Test:')
    try {
      const { data } = await devClient.from('lofts').select('*').limit(1)
      if (data && data.length > 0) {
        console.log('✅ App should work')
      } else {
        console.log('⚠️ No lofts - limited functionality')
      }
    } catch (error) {
      console.log('❌ Basic functionality may be broken')
    }

    // Summary
    const successRate = (totalSuccess / totalTables) * 100
    console.log('\n🎯 Quick Summary:')
    if (successRate >= 80) {
      console.log('✅ GOOD - Ready for development')
    } else if (successRate >= 50) {
      console.log('⚠️ PARTIAL - Some issues but usable')
    } else {
      console.log('❌ POOR - Consider re-cloning')
    }

    console.log(`📈 Success: ${totalSuccess}/${totalTables} essential tables`)

  } catch (error) {
    console.error('💥 Quick validation failed:', error)
  }
}

quickValidate().catch(console.error)