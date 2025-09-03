#!/usr/bin/env tsx

/**
 * Debug script to check bill data in the database
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createScriptClient } from '@/utils/supabase/script'

// Load environment variables from .env file explicitly
config({ path: resolve(process.cwd(), '.env') })

async function debugBills() {
  const supabase = createScriptClient()
  
  console.log('🔍 Debugging Bill Data...\n')
  
  try {
    // 1. Check if we have any lofts
    console.log('1. Checking lofts...')
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name')
    
    if (loftsError) {
      console.error('❌ Error fetching lofts:', loftsError)
      return
    }
    
    console.log(`✅ Found ${lofts?.length || 0} lofts`)
    
    // 2. Check lofts with bill data
    console.log('\n2. Checking lofts with bill frequencies...')
    const { data: loftsWithBills, error: billsError } = await supabase
      .from('lofts')
      .select(`
        id,
        name,
        frequence_paiement_eau,
        prochaine_echeance_eau,
        frequence_paiement_energie,
        prochaine_echeance_energie,
        frequence_paiement_telephone,
        prochaine_echeance_telephone,
        frequence_paiement_internet,
        prochaine_echeance_internet
      `)
    
    if (billsError) {
      console.error('❌ Error fetching bill data:', billsError)
      return
    }
    
    console.log(`✅ Found ${loftsWithBills?.length || 0} lofts with potential bill data`)
    
    // 3. Show detailed bill data
    console.log('\n3. Detailed bill data:')
    loftsWithBills?.forEach((loft, index) => {
      console.log(`\n--- Loft ${index + 1}: ${loft.name} ---`)
      
      const utilities = ['eau', 'energie', 'telephone', 'internet']
      utilities.forEach(utility => {
        const frequency = (loft as any)[`frequence_paiement_${utility}`]
        const dueDate = (loft as any)[`prochaine_echeance_${utility}`]
        
        if (frequency || dueDate) {
          console.log(`${utility.toUpperCase()}:`)
          console.log(`  Frequency: ${frequency || 'Not set'}`)
          console.log(`  Due Date: ${dueDate || 'Not set'}`)
          
          if (dueDate) {
            const today = new Date()
            const dueDateObj = new Date(dueDate)
            const daysUntilDue = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24))
            console.log(`  Days until due: ${daysUntilDue}`)
          }
        }
      })
    })
    
    // 4. Test database functions
    console.log('\n4. Testing database functions...')
    
    // Test upcoming bills function
    console.log('\nTesting get_upcoming_bills(30):')
    const { data: upcomingBills, error: upcomingError } = await supabase
      .rpc('get_upcoming_bills', { days_ahead: 30 })
    
    if (upcomingError) {
      console.error('❌ Error with get_upcoming_bills:', upcomingError)
    } else {
      console.log(`✅ Found ${upcomingBills?.length || 0} upcoming bills`)
      upcomingBills?.forEach((bill: any, index: number) => {
        console.log(`  ${index + 1}. ${bill.loft_name} - ${bill.utility_type} - Due: ${bill.due_date} (${bill.days_until_due} days)`)
      })
    }
    
    // Test overdue bills function
    console.log('\nTesting get_overdue_bills():')
    const { data: overdueBills, error: overdueError } = await supabase
      .rpc('get_overdue_bills')
    
    if (overdueError) {
      console.error('❌ Error with get_overdue_bills:', overdueError)
    } else {
      console.log(`✅ Found ${overdueBills?.length || 0} overdue bills`)
      overdueBills?.forEach((bill: any, index: number) => {
        console.log(`  ${index + 1}. ${bill.loft_name} - ${bill.utility_type} - Due: ${bill.due_date} (${bill.days_overdue} days overdue)`)
      })
    }
    
    // 5. Check current date
    console.log('\n5. Current date info:')
    console.log(`Today: ${new Date().toISOString().split('T')[0]}`)
    console.log(`Today (local): ${new Date().toLocaleDateString()}`)
    
  } catch (error) {
    console.error('❌ Debug script failed:', error)
  }
}

debugBills().then(() => {
  console.log('\n🏁 Debug complete!')
  process.exit(0)
}).catch((error) => {
  console.error('❌ Debug script error:', error)
  process.exit(1)
})