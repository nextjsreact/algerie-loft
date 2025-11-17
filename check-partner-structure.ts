import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPartnerStructure() {
  console.log('🔍 Checking partner_profiles structure...\n')

  // Get schema info
  const { data, error } = await supabase
    .from('partner_profiles')
    .select('*')
    .limit(5)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`✅ Found ${data?.length || 0} partner profiles\n`)

  if (data && data.length > 0) {
    console.log('📋 Sample partner profile:')
    console.log(JSON.stringify(data[0], null, 2))
    
    console.log('\n📊 All partners:')
    data.forEach((partner, index) => {
      console.log(`\n${index + 1}. ${partner.business_name || partner.full_name || 'N/A'}`)
      console.log(`   ID: ${partner.id}`)
      console.log(`   Email: ${partner.email || 'N/A'}`)
      console.log(`   Phone: ${partner.phone || 'N/A'}`)
      console.log(`   Status: ${partner.status || 'N/A'}`)
    })
  } else {
    console.log('⚠️ No partner profiles found in database')
  }

  // Check if there's a relationship with lofts
  console.log('\n\n🔗 Checking lofts table...')
  const { data: lofts } = await supabase
    .from('lofts')
    .select('*')
    .limit(1)

  if (lofts && lofts.length > 0) {
    console.log('Loft columns:', Object.keys(lofts[0]))
  } else {
    console.log('⚠️ No lofts found in database')
  }
}

checkPartnerStructure()
