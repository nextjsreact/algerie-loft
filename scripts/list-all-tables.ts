import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\r?\n/g, '') || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\r?\n/g, '') || ''

async function listAllTables() {
  console.log('🔍 ANALYSE DE LA BASE DE DONNÉES')
  console.log('==================================')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Liste des tables connues à vérifier
  const knownTables = [
    'users', 'profiles', 'lofts', 'transactions', 'payment_methods', 
    'categories', 'currencies', 'zone_areas', 'teams', 'tasks', 
    'reservations', 'notifications', 'conversations', 'messages',
    'internet_connection_types', 'bills', 'settings', 'owners'
  ]
  
  console.log('📊 VÉRIFICATION DES TABLES:')
  console.log('=' .repeat(50))
  
  const existingTables = []
  
  for (const tableName of knownTables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${tableName}: Table n'existe pas ou erreur d'accès`)
      } else {
        console.log(`✅ ${tableName}: ${count || 0} enregistrements`)
        existingTables.push({ name: tableName, count: count || 0 })
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Erreur lors de la vérification`)
    }
  }
  
  console.log(`\n📋 RÉSUMÉ: ${existingTables.length} tables trouvées`)
  console.log('=' .repeat(50))
  
  existingTables.forEach((table, index) => {
    console.log(`${index + 1}. ${table.name} (${table.count} enregistrements)`)
  })
  
  // Obtenir la structure des tables principales
  console.log('\n🏗️ STRUCTURE DES TABLES PRINCIPALES:')
  console.log('=' .repeat(50))
  
  const mainTables = ['users', 'lofts', 'transactions', 'payment_methods', 'categories']
  
  for (const tableName of mainTables) {
    if (existingTables.some(t => t.name === tableName)) {
      try {
        // Essayer d'obtenir un échantillon pour voir la structure
        const { data: sample, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!error && sample && sample.length > 0) {
          console.log(`\n📋 ${tableName.toUpperCase()}:`)
          const columns = Object.keys(sample[0])
          columns.forEach(col => {
            const value = sample[0][col]
            const type = typeof value
            console.log(`   - ${col}: ${type} (exemple: ${value !== null ? JSON.stringify(value).substring(0, 50) : 'null'})`)
          })
        }
      } catch (err) {
        console.log(`   Erreur lors de la récupération de la structure de ${tableName}`)
      }
    }
  }
  
  try {
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des tables:', error)
      return
    }
    
    console.log(`📊 TABLES TROUVÉES (${tables?.length || 0} tables):`)
    console.log('=' .repeat(50))
    
    if (tables && tables.length > 0) {
      tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name} (${table.table_type})`)
      })
      
      console.log('\n🔍 DÉTAILS DES TABLES:')
      console.log('=' .repeat(50))
      
      // Pour chaque table, obtenir le nombre de lignes
      for (const table of tables) {
        try {
          const { count, error: countError } = await supabase
            .from(table.table_name)
            .select('*', { count: 'exact', head: true })
          
          if (countError) {
            console.log(`📋 ${table.table_name}: Erreur de comptage (${countError.message})`)
          } else {
            console.log(`📋 ${table.table_name}: ${count || 0} enregistrements`)
          }
        } catch (err) {
          console.log(`📋 ${table.table_name}: Erreur lors du comptage`)
        }
      }
      
      console.log('\n🏗️ STRUCTURE DES TABLES PRINCIPALES:')
      console.log('=' .repeat(50))
      
      // Obtenir la structure des tables principales
      const mainTables = ['users', 'lofts', 'transactions', 'payment_methods', 'categories', 'currencies']
      
      for (const tableName of mainTables) {
        if (tables.some(t => t.table_name === tableName)) {
          try {
            const { data: columns, error: colError } = await supabase
              .from('information_schema.columns')
              .select('column_name, data_type, is_nullable')
              .eq('table_schema', 'public')
              .eq('table_name', tableName)
              .order('ordinal_position')
            
            if (!colError && columns) {
              console.log(`\n📋 ${tableName.toUpperCase()}:`)
              columns.forEach(col => {
                const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)'
                console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}`)
              })
            }
          } catch (err) {
            console.log(`   Erreur lors de la récupération de la structure de ${tableName}`)
          }
        }
      }
      
    } else {
      console.log('❌ Aucune table trouvée dans le schéma public')
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

listAllTables()