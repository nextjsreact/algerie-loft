import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testOwnersData() {
  console.log('🔍 Testing owners data...\n')

  // Test 1: Check if table exists and get count
  const { count, error: countError } = await supabase
    .from('loft_owners')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Error accessing loft_owners table:', countError.message)
    return
  }

  console.log(`✅ Table loft_owners exists`)
  console.log(`📊 Total owners: ${count}\n`)

  // Test 2: Get all owners
  const { data: owners, error: ownersError } = await supabase
    .from('loft_owners')
    .select('*')
    .order('created_at', { ascending: false })

  if (ownersError) {
    console.error('❌ Error fetching owners:', ownersError.message)
    return
  }

  console.log(`📋 Owners data:`)
  owners?.forEach((owner, index) => {
    console.log(`\n${index + 1}. ${owner.name}`)
    console.log(`   ID: ${owner.id}`)
    console.log(`   Email: ${owner.email || 'N/A'}`)
    console.log(`   Phone: ${owner.phone || 'N/A'}`)
    console.log(`   Type: ${owner.ownership_type}`)
  })

  // Test 3: Get owners with lofts
  const { data: ownersWithLofts, error: joinError } = await supabase
    .from('loft_owners')
    .select(`
      *,
      lofts (
        id,
        name,
        price_per_night
      )
    `)
    .order('created_at', { ascending: false })

  if (joinError) {
    console.error('\n❌ Error fetching owners with lofts:', joinError.message)
    return
  }

  console.log(`\n\n📊 Owners with lofts:`)
  ownersWithLofts?.forEach((owner, index) => {
    const lofts = owner.lofts as any[]
    console.log(`\n${index + 1}. ${owner.name}`)
    console.log(`   Lofts count: ${lofts?.length || 0}`)
    if (lofts && lofts.length > 0) {
      lofts.forEach((loft: any) => {
        console.log(`   - ${loft.name}: ${loft.price_per_night} DZD/night`)
      })
    }
  })
}

testOwnersData()
