import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\r?\n/g, '') || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\r?\n/g, '') || ''

async function getCompleteDatabaseStructure() {
  console.log('🔍 ANALYSE COMPLÈTE DE LA BASE DE DONNÉES')
  console.log('==========================================')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Utiliser une requête SQL directe pour obtenir toutes les tables
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            t.table_name,
            t.table_type,
            (SELECT COUNT(*) 
             FROM information_schema.columns c 
             WHERE c.table_name = t.table_name 
             AND c.table_schema = 'public') as column_count
          FROM information_schema.tables t
          WHERE t.table_schema = 'public'
          ORDER BY t.table_name;
        `
      })

    if (tablesError) {
      console.log('❌ Erreur avec rpc, essayons une approche alternative...')
      
      // Approche alternative : tester toutes les tables que vous avez mentionnées
      const allTables = [
        'bills', 'categories', 'conversation_participants', 'conversations', 
        'critical_alerts', 'currencies', 'executive_metrics', 'executive_permissions',
        'guest_communications', 'internet_connection_types', 'loft_availability',
        'loft_owners', 'loft_photos', 'lofts', 'messages', 'notifications',
        'payment_methods', 'pricing_rules', 'profiles', 'reservation_payments',
        'reservation_reviews', 'reservations', 'settings', 'task_category_references',
        'tasks', 'team_members', 'teams', 'transaction_category_references',
        'transactions', 'zone_areas'
      ]
      
      console.log(`📊 VÉRIFICATION DE ${allTables.length} TABLES:`)
      console.log('=' .repeat(60))
      
      const existingTables = []
      
      for (const tableName of allTables) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
          
          if (error) {
            console.log(`❌ ${tableName}: ${error.message}`)
          } else {
            console.log(`✅ ${tableName}: ${count || 0} enregistrements`)
            existingTables.push({ name: tableName, count: count || 0 })
          }
        } catch (err) {
          console.log(`❌ ${tableName}: Erreur lors de la vérification`)
        }
      }
      
      console.log(`\n📋 RÉSUMÉ: ${existingTables.length} tables trouvées`)
      console.log('=' .repeat(60))
      
      // Trier par nombre d'enregistrements (décroissant)
      existingTables.sort((a, b) => b.count - a.count)
      
      existingTables.forEach((table, index) => {
        const status = table.count > 0 ? '📊' : '📋'
        console.log(`${index + 1}. ${status} ${table.name} (${table.count} enregistrements)`)
      })
      
      // Analyser les tables avec le plus de données
      console.log('\n🔍 TABLES AVEC LE PLUS DE DONNÉES:')
      console.log('=' .repeat(60))
      
      const tablesWithData = existingTables.filter(t => t.count > 0).slice(0, 10)
      
      for (const table of tablesWithData) {
        try {
          const { data: sample, error } = await supabase
            .from(table.name)
            .select('*')
            .limit(1)
          
          if (!error && sample && sample.length > 0) {
            console.log(`\n📋 ${table.name.toUpperCase()} (${table.count} enregistrements):`)
            const columns = Object.keys(sample[0])
            console.log(`   Colonnes (${columns.length}): ${columns.join(', ')}`)
            
            // Montrer quelques exemples de données
            columns.slice(0, 5).forEach(col => {
              const value = sample[0][col]
              const displayValue = value !== null ? 
                (typeof value === 'string' ? value.substring(0, 30) : JSON.stringify(value).substring(0, 30)) 
                : 'null'
              console.log(`   - ${col}: ${displayValue}${displayValue.length >= 30 ? '...' : ''}`)
            })
          }
        } catch (err) {
          console.log(`   Erreur lors de l'analyse de ${table.name}`)
        }
      }
      
      // Analyser les nouvelles tables que je n'avais pas détectées
      console.log('\n🆕 NOUVELLES TABLES DÉCOUVERTES:')
      console.log('=' .repeat(60))
      
      const originalTables = [
        'users', 'profiles', 'lofts', 'transactions', 'payment_methods', 
        'categories', 'currencies', 'zone_areas', 'teams', 'tasks', 
        'reservations', 'notifications', 'conversations', 'messages',
        'internet_connection_types', 'bills', 'settings', 'owners'
      ]
      
      const newTables = existingTables.filter(t => !originalTables.includes(t.name))
      
      if (newTables.length > 0) {
        newTables.forEach((table, index) => {
          console.log(`${index + 1}. 🆕 ${table.name} (${table.count} enregistrements)`)
        })
      } else {
        console.log('Aucune nouvelle table détectée.')
      }
      
    } else {
      console.log('✅ Données récupérées via RPC:', tablesData)
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

getCompleteDatabaseStructure()