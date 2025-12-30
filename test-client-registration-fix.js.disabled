/**
 * Test script to verify client registration fix
 * Run this after applying the database fixes
 */

const { createClient } = require('@supabase/supabase-js')

// Use your Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testClientRegistration() {
  console.log('🧪 Testing client registration fix...\n')

  // Test data
  const testEmail = `test-client-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  const testFullName = 'Test Client User'

  try {
    console.log('1️⃣ Testing user creation with client role...')
    
    // Create test user with client role
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: {
        full_name: testFullName,
        role: 'client'
      },
      email_confirm: true
    })

    if (authError) {
      console.error('❌ Auth user creation failed:', authError.message)
      return false
    }

    console.log('✅ Auth user created successfully')
    console.log(`   User ID: ${authData.user.id}`)
    console.log(`   Email: ${authData.user.email}`)

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('\n2️⃣ Checking if customer record was auto-created...')

    // Check if customer record was created by trigger
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (customerError) {
      console.error('❌ Customer record not found:', customerError.message)
      console.log('   This indicates the auto-sync trigger is not working')
      return false
    }

    console.log('✅ Customer record auto-created successfully')
    console.log(`   Customer ID: ${customerData.id}`)
    console.log(`   Name: ${customerData.first_name} ${customerData.last_name}`)
    console.log(`   Email: ${customerData.email}`)
    console.log(`   Status: ${customerData.status}`)

    console.log('\n3️⃣ Testing client login simulation...')

    // Simulate what happens during login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (loginError) {
      console.error('❌ Login test failed:', loginError.message)
      return false
    }

    console.log('✅ Login simulation successful')

    console.log('\n4️⃣ Cleaning up test data...')

    // Clean up test user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id)
    
    if (deleteError) {
      console.warn('⚠️ Could not delete test user:', deleteError.message)
    } else {
      console.log('✅ Test user cleaned up')
    }

    return true

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    return false
  }
}

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...\n')

  try {
    // Check if customers table exists with correct structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'customers' })
      .single()

    if (tableError) {
      console.log('ℹ️ Could not get table info (this is normal if RPC function doesn\'t exist)')
    }

    // Check if we can query customers table
    const { data: customersTest, error: customersError } = await supabase
      .from('customers')
      .select('count(*)')
      .limit(1)

    if (customersError) {
      console.error('❌ Cannot access customers table:', customersError.message)
      return false
    }

    console.log('✅ Customers table is accessible')

    // Check if trigger exists by trying to query information_schema
    const { data: triggerInfo, error: triggerError } = await supabase
      .rpc('check_trigger_exists', { 
        trigger_name: 'sync_client_customers_trigger',
        table_name: 'users',
        schema_name: 'auth'
      })

    if (triggerError) {
      console.log('ℹ️ Could not check trigger (this is normal if RPC function doesn\'t exist)')
    }

    return true

  } catch (error) {
    console.error('❌ Database structure check failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Client Registration Fix Test\n')
  console.log('This script will test if the client registration issue is fixed.\n')

  // Check database structure first
  const structureOk = await checkDatabaseStructure()
  
  if (!structureOk) {
    console.log('\n❌ Database structure issues detected.')
    console.log('Please run the database fix scripts first:')
    console.log('1. Execute database/fix-customers-table-structure.sql in Supabase')
    console.log('2. Execute database/auto-sync-client-customers.sql in Supabase')
    return
  }

  // Test registration flow
  const testPassed = await testClientRegistration()

  console.log('\n' + '='.repeat(50))
  
  if (testPassed) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('✅ Client registration should now work correctly')
    console.log('✅ Auto-sync trigger is working')
    console.log('✅ Database structure is correct')
  } else {
    console.log('❌ TESTS FAILED!')
    console.log('The client registration issue is not fully resolved.')
    console.log('Please check the database fixes and try again.')
  }
  
  console.log('='.repeat(50))
}

// Run the test
main().catch(console.error)