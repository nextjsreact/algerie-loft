#!/usr/bin/env tsx
/**
 * Script to check what's actually in PROD and DEV databases
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

async function checkDatabases() {
  console.log('🔍 CHECKING ACTUAL DATABASE CONTENT')
  console.log('='.repeat(60))

  // Load PROD
  const prodRes = dotenv.config({ path: 'env-backup/.env.prod' })
  if (prodRes.error) {
    console.error('❌ Cannot load PROD env:', prodRes.error.message)
    return
  }

  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Load DEV
  const devRes = dotenv.config({ path: 'env-backup/.env.development' })
  if (devRes.error) {
    console.error('❌ Cannot load DEV env:', devRes.error.message)
    return
  }

  const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log(`📤 PROD Database: ${prodUrl}`)
  console.log(`🎯 DEV Database: ${devUrl}`)
  console.log('='.repeat(60))

  const prodClient = createClient(prodUrl!, prodKey!, { auth: { persistSession: false } })
  const devClient = createClient(devUrl!, devKey!, { auth: { persistSession: false } })

  const tables = [
    'currencies', 'categories', 'zone_areas', 'lofts', 'profiles',
    'tasks', 'transactions', 'settings', 'messages'
  ]

  for (const table of tables) {
    console.log(`\n📋 TABLE: ${table.toUpperCase()}`)
    console.log('-'.repeat(40))

    try {
      // Check PROD
      const { count: prodCount, error: prodError } = await prodClient
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (prodError) {
        console.log(`  ❌ PROD: Error - ${prodError.message}`)
      } else {
        console.log(`  📊 PROD: ${prodCount || 0} records`)
      }

      // Check DEV
      const { count: devCount, error: devError } = await devClient
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (devError) {
        console.log(`  ❌ DEV: Error - ${devError.message}`)
      } else {
        console.log(`  📊 DEV: ${devCount || 0} records`)
      }

      // Compare
      if (!prodError && !devError) {
        const diff = (prodCount || 0) - (devCount || 0)
        if (diff === 0) {
          console.log(`  ✅ IDENTICAL`)
        } else {
          console.log(`  ⚠️ DIFFERENCE: ${diff > 0 ? '+' : ''}${diff}`)
        }
      }

    } catch (error: any) {
      console.log(`  💥 Error: ${error.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎯 SUMMARY:')
  console.log('Check your Supabase dashboards:')
  console.log(`  PROD: ${prodUrl}`)
  console.log(`  DEV: ${devUrl}`)
  console.log('='.repeat(60))
}

checkDatabases().catch(console.error)