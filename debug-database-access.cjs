/**
 * DEBUG ACCÈS BASE DE DONNÉES
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

console.log('🔍 CONFIGURATION SUPABASE:')
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Définie' : 'Manquante')
console.log('ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Définie' : 'Manquante')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function debugDatabaseAccess() {
  console.log('\n🔍 DEBUG ACCÈS BASE DE DONNÉES\n')

  try {
    // Test 1: Vérifier la connexion de base
    console.log('📡 Test de connexion de base...')
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Erreur de connexion:', testError)
      return
    } else {
      console.log('✅ Connexion OK')
    }

    // Test 2: Essayer différentes approches pour lofts
    console.log('\n🏠 Tests d\'accès aux lofts:')
    
    // Approche 1: Select simple
    console.log('   Test 1: Select simple...')
    const { data: lofts1, error: error1 } = await supabase
      .from('lofts')
      .select('*')
    
    console.log('   Résultat:', lofts1?.length || 0, 'enregistrements')
    if (error1) console.log('   Erreur:', error1.message)

    // Approche 2: Select avec limit
    console.log('   Test 2: Select avec limit...')
    const { data: lofts2, error: error2 } = await supabase
      .from('lofts')
      .select('*')
      .limit(5)
    
    console.log('   Résultat:', lofts2?.length || 0, 'enregistrements')
    if (error2) console.log('   Erreur:', error2.message)

    // Approche 3: Select avec colonnes spécifiques
    console.log('   Test 3: Select colonnes spécifiques...')
    const { data: lofts3, error: error3 } = await supabase
      .from('lofts')
      .select('id, name')
      .limit(3)
    
    console.log('   Résultat:', lofts3?.length || 0, 'enregistrements')
    if (error3) console.log('   Erreur:', error3.message)
    if (lofts3 && lofts3.length > 0) {
      console.log('   Données:', lofts3)
    }

    // Test 3: Vérifier les politiques RLS
    console.log('\n🔒 Test des politiques RLS:')
    
    // Essayer avec un utilisateur authentifié (si possible)
    console.log('   Utilisateur actuel:', supabase.auth.getUser ? 'API disponible' : 'API non disponible')

    // Test 4: Essayer d'autres tables
    console.log('\n📊 Test d\'autres tables:')
    
    const tables = ['profiles', 'reservations', 'bookings']
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1)
      
      console.log(`   ${table}: ${count || 0} enregistrements ${error ? '(Erreur: ' + error.message + ')' : ''}`)
    }

    // Test 5: Vérifier les variables d'environnement
    console.log('\n🔧 Variables d\'environnement:')
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'non défini')
    console.log('   Fichiers .env détectés:')
    const fs = require('fs')
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production']
    envFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`     ✅ ${file}`)
      } else {
        console.log(`     ❌ ${file}`)
      }
    })

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }
}

debugDatabaseAccess()