import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProfiles() {
  console.log('🔍 Checking profiles table for partners...\n')

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`✅ Found ${profiles?.length || 0} profiles\n`)

  // Group by role
  const byRole: any = {}
  profiles?.forEach(profile => {
    const role = profile.role || 'no_role'
    if (!byRole[role]) byRole[role] = []
    byRole[role].push(profile)
  })

  console.log('📊 Profiles by role:')
  Object.keys(byRole).forEach(role => {
    console.log(`   ${role}: ${byRole[role].length}`)
  })

  // Show sample of each role
  console.log('\n📋 Sample profiles:')
  Object.keys(byRole).forEach(role => {
    const sample = byRole[role][0]
    console.log(`\n${role}:`)
    console.log(`   ID: ${sample.id}`)
    console.log(`   Email: ${sample.email}`)
    console.log(`   Name: ${sample.full_name}`)
    console.log(`   Columns: ${Object.keys(sample).join(', ')}`)
  })
}

checkProfiles()
