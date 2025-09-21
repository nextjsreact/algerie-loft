import { createClient } from '@/utils/supabase/server'

interface LoftPriceData {
  id: string
  name: string
  price_per_month: number | null
  price_per_night: number | null
  status: string
}

async function fixMissingPrices() {
  console.log('🔧 Starting price data fix...')

  const supabase = await createClient()

  try {
    // Get all lofts with price data
    const { data: lofts, error } = await supabase
      .from('lofts')
      .select('id, name, price_per_month, price_per_night, status')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching lofts:', error)
      return
    }

    console.log(`📊 Found ${lofts?.length || 0} lofts`)

    const loftsWithNullPrices = lofts?.filter(loft => loft.price_per_month === null) || []
    console.log(`🚨 Found ${loftsWithNullPrices.length} lofts with null price_per_month`)

    if (loftsWithNullPrices.length === 0) {
      console.log('✅ All lofts have price_per_month values. No fixes needed.')
      return
    }

    // Log the problematic lofts
    console.log('📋 Lofts with missing prices:')
    loftsWithNullPrices.forEach(loft => {
      console.log(`   - ${loft.name} (${loft.id}): price_per_month=${loft.price_per_month}, price_per_night=${loft.price_per_night}`)
    })

    // Fix the prices
    const updates = loftsWithNullPrices.map(loft => {
      let newPrice: number

      // If price_per_night exists, calculate monthly price
      if (loft.price_per_night && loft.price_per_night > 0) {
        newPrice = Math.round(loft.price_per_night * 30)
        console.log(`   💡 ${loft.name}: Using price_per_night (${loft.price_per_night}) -> monthly price: ${newPrice}`)
      } else {
        // Set default based on status
        switch (loft.status) {
          case 'available':
            newPrice = 45000
            break
          case 'occupied':
            newPrice = 55000
            break
          case 'maintenance':
            newPrice = 35000
            break
          default:
            newPrice = 40000
        }
        console.log(`   🎯 ${loft.name}: Setting default price based on status (${loft.status}): ${newPrice}`)
      }

      return {
        id: loft.id,
        price_per_month: newPrice
      }
    })

    // Update the database
    console.log(`\n🔄 Updating ${updates.length} lofts...`)

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('lofts')
        .update({ price_per_month: update.price_per_month })
        .eq('id', update.id)

      if (updateError) {
        console.error(`❌ Error updating loft ${update.id}:`, updateError)
      } else {
        console.log(`✅ Updated loft ${update.id} with price: ${update.price_per_month}`)
      }
    }

    // Verify the fixes
    const { data: updatedLofts, error: verifyError } = await supabase
      .from('lofts')
      .select('id, name, price_per_month, price_per_night, status')
      .in('id', updates.map(u => u.id))

    if (!verifyError && updatedLofts) {
      console.log('\n🎉 Verification:')
      updatedLofts.forEach(loft => {
        console.log(`   ✅ ${loft.name}: price_per_month = ${loft.price_per_month}`)
      })
    }

    console.log('\n🎊 Price fix completed successfully!')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Run the script
fixMissingPrices()