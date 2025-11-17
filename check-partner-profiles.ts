import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPartnerProfiles() {
  console.log('🔍 Checking partner_profiles and lofts...\n')

  // Check partner_profiles
  const { data: partners, error: partnersError, count: partnersCount } = await supabase
    .from('partner_profiles')
    .select('*', { count: 'exact' })

  if (partnersError) {
    console.error('❌ Error accessing partner_profiles:', partnersError.message)
  } else {
    console.log(`✅ partner_profiles: ${partnersCount} rows`)
    if (partners && partners.length > 0) {
      console.log('\n📋 Sample partner:')
      console.log(JSON.stringify(partners[0], null, 2))
      console.log('\nColumns:', Object.keys(partners[0]))
    }
  }

  // Check lofts
  const { data: lofts, error: loftsError, count: loftsCount } = await supabase
    .from('lofts')
    .select('*', { count: 'exact' })

  if (loftsError) {
    console.error('\n❌ Error accessing lofts:', loftsError.message)
  } else {
    console.log(`\n✅ lofts: ${loftsCount} rows`)
    if (lofts && lofts.length > 0) {
      console.log('\n📋 Sample loft:')
      console.log(JSON.stringify(lofts[0], null, 2))
      console.log('\nColumns:', Object.keys(lofts[0]))
    }
  }

  // Check if lofts have partner_id or owner_id
  if (lofts && lofts.length > 0) {
    const loft = lofts[0]
    console.log('\n🔗 Relationship fields in lofts:')
    if ('partner_id' in loft) console.log('  ✅ partner_id exists')
    if ('owner_id' in loft) console.log('  ✅ owner_id exists')
    if ('loft_owner_id' in loft) console.log('  ✅ loft_owner_id exists')
  }
}

checkPartnerProfiles()
