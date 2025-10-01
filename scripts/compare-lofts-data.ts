#!/usr/bin/env tsx
/**
 * Compare actual lofts data between PROD and DEV databases
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { parse } from 'dotenv'

async function compareLoftsData() {
  console.log('🔍 COMPARING ACTUAL LOFTS DATA')
  console.log('='.repeat(60))

  // Load PROD environment manually
  const prodEnvContent = readFileSync('env-backup/.env.prod', 'utf8')
  const prodEnv = parse(prodEnvContent)
  const prodUrl = prodEnv.NEXT_PUBLIC_SUPABASE_URL
  const prodKey = prodEnv.SUPABASE_SERVICE_ROLE_KEY
  const prodClient = createClient(prodUrl!, prodKey!, { auth: { persistSession: false } })

  // Load DEV environment manually
  const devEnvContent = readFileSync('env-backup/.env.development', 'utf8')
  const devEnv = parse(devEnvContent)
  const devUrl = devEnv.NEXT_PUBLIC_SUPABASE_URL
  const devKey = devEnv.SUPABASE_SERVICE_ROLE_KEY
  const devClient = createClient(devUrl!, devKey!, { auth: { persistSession: false } })

  console.log(`📤 PROD Database: ${prodUrl}`)
  console.log(`🎯 DEV Database: ${devUrl}`)
  console.log('='.repeat(60))

  try {
    // Get PROD lofts
    console.log('\n📋 FETCHING PROD LOFTS...')
    const { data: prodLofts, error: prodError } = await prodClient
      .from('lofts')
      .select('*')
      .order('id')

    if (prodError) {
      console.log(`❌ PROD Error: ${prodError.message}`)
    } else {
      console.log(`✅ PROD: ${prodLofts?.length || 0} lofts found`)
      if (prodLofts && prodLofts.length > 0) {
        console.log('   Sample PROD loft IDs:')
        prodLofts.slice(0, 3).forEach((loft: any, i: number) => {
          console.log(`   ${i + 1}. ${loft.id} - ${loft.name || 'No name'}`)
        })
      }
    }

    // Get DEV lofts
    console.log('\n📋 FETCHING DEV LOFTS...')
    const { data: devLofts, error: devError } = await devClient
      .from('lofts')
      .select('*')
      .order('id')

    if (devError) {
      console.log(`❌ DEV Error: ${devError.message}`)
      console.log(`🔍 DEV Error details:`, devError)
    } else {
      console.log(`✅ DEV: ${devLofts?.length || 0} lofts found`)
      if (devLofts && devLofts.length > 0) {
        console.log('   Sample DEV loft IDs:')
        devLofts.slice(0, 3).forEach((loft: any, i: number) => {
          console.log(`   ${i + 1}. ${loft.id} - ${loft.name || 'No name'}`)
        })
      } else {
        console.log('   ℹ️ No lofts found in DEV database')
      }
    }

    // Test: Try to insert a test record into DEV
    console.log('\n🧪 TESTING DEV DATABASE ACCESS...')
    try {
      // First, check if loft_owners table has any records
      const { data: owners, error: ownersError } = await devClient
        .from('loft_owners')
        .select('id')
        .limit(1)

      if (ownersError) {
        console.log(`❌ Cannot access loft_owners: ${ownersError.message}`)
      } else {
        console.log(`✅ Found ${owners?.length || 0} loft_owners records`)
        if (owners && owners.length > 0) {
          const ownerId = owners[0].id
          console.log(`🔍 Using owner_id: ${ownerId}`)

          // Generate a proper UUID
          const testId = crypto.randomUUID()
          const testRecord = {
            id: testId,
            name: 'Test Loft - ' + new Date().toISOString(),
            address: 'Test Address',
            status: 'available',
            owner_id: ownerId,
            company_percentage: 50,
            owner_percentage: 50,
            price_per_month: 1000, // Add required field
            price_per_night: 50,   // Add required field
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { data: insertData, error: insertError } = await devClient
            .from('lofts')
            .insert(testRecord)
            .select()

          if (insertError) {
            console.log(`❌ Test insert failed: ${insertError.message}`)
          } else {
            console.log(`✅ Test insert successful: ${JSON.stringify(insertData, null, 2)}`)

            // Try to fetch it back
            const { data: fetchData, error: fetchError } = await devClient
              .from('lofts')
              .select('*')
              .eq('id', testRecord.id)

            if (fetchError) {
              console.log(`❌ Test fetch failed: ${fetchError.message}`)
            } else {
              console.log(`✅ Test fetch successful: ${fetchData?.length || 0} records found`)
            }

            // Clean up test record
            await devClient.from('lofts').delete().eq('id', testRecord.id)
            console.log('🧹 Test record cleaned up')
          }
        } else {
          console.log('❌ No loft_owners found, cannot test insert')
        }
      }
    } catch (testError) {
      console.log(`❌ Test error: ${testError}`)
    }

    // Check all tables in DEV database
    console.log('\n📊 CHECKING ALL TABLES IN DEV DATABASE...')
    const tablesToCheck = ['lofts', 'loft_owners', 'currencies', 'categories', 'profiles', 'tasks']
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await devClient
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`❌ ${table}: Error - ${error.message}`)
        } else {
          const count = data?.length || 0
          console.log(`✅ ${table}: ${count} records`)
        }
      } catch (err) {
        console.log(`❌ ${table}: Exception - ${err}`)
      }
    }

    // Compare
    console.log('\n📊 COMPARISON:')
    const prodCount = prodLofts?.length || 0
    const devCount = devLofts?.length || 0

    if (prodCount === devCount) {
      console.log(`✅ LOFTS COUNT: IDENTICAL (${prodCount})`)
    } else {
      console.log(`⚠️ LOFTS COUNT: DIFFERENT (PROD: ${prodCount}, DEV: ${devCount})`)
    }

    // Check if same IDs
    if (prodLofts && devLofts) {
      const prodIds = new Set(prodLofts.map(l => l.id))
      const devIds = new Set(devLofts.map(l => l.id))
      const commonIds = [...prodIds].filter(id => devIds.has(id))

      console.log(`📋 ID COMPARISON:`)
      console.log(`   PROD unique IDs: ${prodIds.size}`)
      console.log(`   DEV unique IDs: ${devIds.size}`)
      console.log(`   Common IDs: ${commonIds.length}`)

      if (commonIds.length === prodIds.size && commonIds.length === devIds.size) {
        console.log(`✅ SAME LOFTS: Both databases have identical loft records`)
      } else {
        console.log(`⚠️ DIFFERENT LOFTS: Databases have different loft records`)
      }
    }

  } catch (error: any) {
    console.log(`💥 Error: ${error.message}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎯 CONCLUSION:')
  console.log('Check your Supabase dashboards to verify:')
  console.log(`  PROD: ${prodUrl}`)
  console.log(`  DEV: ${devUrl}`)
  console.log('='.repeat(60))
}

compareLoftsData().catch(console.error)