import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { ALL_TABLES } from './complete-database-clone'

dotenv.config({ path: '.env.production' })

const environments = {
  prod: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\r?\n/g, '') || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\r?\n/g, '') || ''
  },
  test: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_TEST?.replace(/\r?\n/g, '') || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY_TEST?.replace(/\r?\n/g, '') || ''
  },
  dev: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL_DEV?.replace(/\r?\n/g, '') || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY_DEV?.replace(/\r?\n/g, '') || ''
  }
}

async function validateClone(sourceEnv: string, targetEnv: string) {
  console.log('🔍 VALIDATION DU CLONAGE COMPLET')
  console.log('================================')
  console.log(`📤 Source: ${sourceEnv.toUpperCase()}`)
  console.log(`📥 Cible: ${targetEnv.toUpperCase()}`)
  console.log('')

  const sourceClient = createClient(
    environments[sourceEnv as keyof typeof environments].url,
    environments[sourceEnv as keyof typeof environments].key
  )
  
  const targetClient = createClient(
    environments[targetEnv as keyof typeof environments].url,
    environments[targetEnv as keyof typeof environments].key
  )

  let totalDifferences = 0
  const results = []

  for (const table of ALL_TABLES) {
    try {
      // Compter dans la source
      const { count: sourceCount, error: sourceError } = await sourceClient
        .from(table)
        .select('*', { count: 'exact', head: true })

      // Compter dans la cible
      const { count: targetCount, error: targetError } = await targetClient
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (sourceError || targetError) {
        console.log(`❌ ${table}: Erreur de validation`)
        results.push({ table, status: 'error', sourceCount: 0, targetCount: 0, difference: 0 })
        continue
      }

      const difference = Math.abs((sourceCount || 0) - (targetCount || 0))
      const status = difference === 0 ? 'ok' : 'different'
      
      if (difference === 0) {
        console.log(`✅ ${table}: ${sourceCount || 0} enregistrements (identique)`)
      } else {
        console.log(`⚠️ ${table}: Source=${sourceCount || 0}, Cible=${targetCount || 0} (différence: ${difference})`)
        totalDifferences += difference
      }

      results.push({
        table,
        status,
        sourceCount: sourceCount || 0,
        targetCount: targetCount || 0,
        difference
      })

    } catch (error) {
      console.log(`❌ ${table}: Erreur lors de la validation`)
      results.push({ table, status: 'error', sourceCount: 0, targetCount: 0, difference: 0 })
    }
  }

  console.log('\n📊 RÉSUMÉ DE LA VALIDATION')
  console.log('==========================')
  
  const okTables = results.filter(r => r.status === 'ok').length
  const differentTables = results.filter(r => r.status === 'different').length
  const errorTables = results.filter(r => r.status === 'error').length

  console.log(`✅ Tables identiques: ${okTables}`)
  console.log(`⚠️ Tables différentes: ${differentTables}`)
  console.log(`❌ Tables en erreur: ${errorTables}`)
  console.log(`📈 Différence totale: ${totalDifferences} enregistrements`)

  if (differentTables > 0) {
    console.log('\n🔍 DÉTAILS DES DIFFÉRENCES:')
    results.filter(r => r.status === 'different').forEach(r => {
      console.log(`   ${r.table}: ${r.sourceCount} → ${r.targetCount} (${r.difference > 0 ? '+' : ''}${r.targetCount - r.sourceCount})`)
    })
  }

  if (totalDifferences === 0 && errorTables === 0) {
    console.log('\n🎉 VALIDATION RÉUSSIE - Clonage parfait !')
  } else {
    console.log('\n⚠️ VALIDATION AVEC DIFFÉRENCES - Vérifiez les détails ci-dessus')
  }
}

// Exécution
const args = process.argv.slice(2)
if (args.length < 2) {
  console.log('Usage: tsx validate-complete-clone.ts <source> <target>')
  console.log('Exemple: tsx validate-complete-clone.ts prod test')
} else {
  validateClone(args[0], args[1]).catch(console.error)
}