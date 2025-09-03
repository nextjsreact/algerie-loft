import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { ALL_TABLES, TABLE_DEPENDENCIES } from './complete-database-clone'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\r?\n/g, '') || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\r?\n/g, '') || ''

async function testCloneSystem() {
  console.log('🧪 TEST DU SYSTÈME DE CLONAGE')
  console.log('==============================')
  console.log('Mode: DRY RUN (aucune modification)')
  console.log('')

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Test 1: Vérifier la connexion
  console.log('1️⃣ TEST DE CONNEXION')
  console.log('-------------------')
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) throw error
    console.log('✅ Connexion à la base de données réussie')
  } catch (error) {
    console.log('❌ Erreur de connexion:', error)
    return
  }

  // Test 2: Vérifier toutes les tables
  console.log('\n2️⃣ VÉRIFICATION DES TABLES')
  console.log('---------------------------')
  
  const tableStats = []
  let totalRecords = 0

  for (const table of ALL_TABLES) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
        tableStats.push({ table, count: 0, status: 'error' })
      } else {
        const recordCount = count || 0
        totalRecords += recordCount
        console.log(`✅ ${table}: ${recordCount} enregistrements`)
        tableStats.push({ table, count: recordCount, status: 'ok' })
      }
    } catch (error) {
      console.log(`❌ ${table}: Erreur d'accès`)
      tableStats.push({ table, count: 0, status: 'error' })
    }
  }

  // Test 3: Analyser l'ordre des dépendances
  console.log('\n3️⃣ ORDRE DES DÉPENDANCES')
  console.log('-------------------------')
  
  Object.entries(TABLE_DEPENDENCIES).forEach(([group, tables]) => {
    console.log(`📋 ${group.toUpperCase()}:`)
    tables.forEach((table, index) => {
      const stat = tableStats.find(s => s.table === table)
      const status = stat?.status === 'ok' ? '✅' : '❌'
      console.log(`   ${index + 1}. ${status} ${table} (${stat?.count || 0} enregistrements)`)
    })
    console.log('')
  })

  // Test 4: Simulation de clonage
  console.log('4️⃣ SIMULATION DE CLONAGE')
  console.log('-------------------------')
  
  const tablesWithData = tableStats.filter(t => t.count > 0 && t.status === 'ok')
  const emptyTables = tableStats.filter(t => t.count === 0 && t.status === 'ok')
  const errorTables = tableStats.filter(t => t.status === 'error')

  console.log(`📊 Tables avec données: ${tablesWithData.length}`)
  console.log(`📋 Tables vides: ${emptyTables.length}`)
  console.log(`❌ Tables en erreur: ${errorTables.length}`)
  console.log(`📈 Total enregistrements: ${totalRecords}`)

  if (tablesWithData.length > 0) {
    console.log('\n🔍 TABLES AVEC LE PLUS DE DONNÉES:')
    tablesWithData
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table}: ${table.count} enregistrements`)
      })
  }

  // Test 5: Estimation du temps de clonage
  console.log('\n5️⃣ ESTIMATION DU CLONAGE')
  console.log('-------------------------')
  
  const batchSize = 1000
  const estimatedBatches = Math.ceil(totalRecords / batchSize)
  const estimatedTimeSeconds = estimatedBatches * 2 // 2 secondes par lot
  const estimatedTimeMinutes = Math.round(estimatedTimeSeconds / 60)

  console.log(`📦 Lots estimés: ${estimatedBatches} (taille: ${batchSize})`)
  console.log(`⏱️ Temps estimé: ${estimatedTimeMinutes} minutes`)

  // Test 6: Recommandations
  console.log('\n6️⃣ RECOMMANDATIONS')
  console.log('------------------')
  
  if (errorTables.length > 0) {
    console.log('⚠️ ATTENTION: Certaines tables ont des erreurs d\'accès')
    console.log('   Vérifiez les permissions et la structure de la base')
  }

  if (totalRecords > 10000) {
    console.log('💡 CONSEIL: Beaucoup de données détectées')
    console.log('   Considérez un clonage par étapes ou en dehors des heures de pointe')
  }

  if (tablesWithData.length > 0) {
    console.log('✅ PRÊT POUR LE CLONAGE')
    console.log('   Le système peut procéder au clonage des données')
  }

  console.log('\n🚀 PROCHAINES ÉTAPES:')
  console.log('=====================')
  console.log('1. Configurez les environnements TEST et DEV')
  console.log('2. Lancez un clonage test: tsx scripts/complete-database-clone.ts prod test --dry-run')
  console.log('3. Si tout va bien, lancez: npm run clone:all:prod-to-test')
}

testCloneSystem().catch(console.error)