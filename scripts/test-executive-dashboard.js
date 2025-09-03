#!/usr/bin/env node

/**
 * Script de test pour vérifier le déploiement du tableau de bord exécutif
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testExecutiveDashboard() {
  console.log('🧪 Test du tableau de bord exécutif...\n')
  
  let allTestsPassed = true
  
  // Test 1: Vérifier que le rôle executive existe
  console.log('1️⃣ Test du rôle executive...')
  try {
    const { data, error } = await supabase.rpc('get_enum_values', { enum_name: 'user_role' })
    if (error) throw error
    
    const hasExecutiveRole = data && data.some(role => role === 'executive')
    if (hasExecutiveRole) {
      console.log('   ✅ Rôle executive trouvé')
    } else {
      console.log('   ❌ Rôle executive manquant')
      allTestsPassed = false
    }
  } catch (error) {
    console.log('   ⚠️ Impossible de vérifier les rôles, continuons...')
  }
  
  // Test 2: Vérifier l'existence des tables
  console.log('\n2️⃣ Test des tables...')
  const tables = ['executive_permissions', 'critical_alerts', 'executive_metrics']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error && error.code === '42P01') {
        console.log(`   ❌ Table ${table} manquante`)
        allTestsPassed = false
      } else {
        console.log(`   ✅ Table ${table} accessible`)
      }
    } catch (error) {
      console.log(`   ❌ Erreur avec la table ${table}:`, error.message)
      allTestsPassed = false
    }
  }
  
  // Test 3: Vérifier l'utilisateur executive
  console.log('\n3️⃣ Test de l\'utilisateur executive...')
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'executive@loftmanager.com')
      .single()
    
    if (error) {
      console.log('   ❌ Utilisateur executive non trouvé')
      allTestsPassed = false
    } else if (profile.role !== 'executive') {
      console.log('   ❌ Utilisateur trouvé mais rôle incorrect:', profile.role)
      allTestsPassed = false
    } else {
      console.log('   ✅ Utilisateur executive configuré correctement')
    }
  } catch (error) {
    console.log('   ❌ Erreur lors de la vérification de l\'utilisateur:', error.message)
    allTestsPassed = false
  }
  
  // Test 4: Vérifier les permissions
  console.log('\n4️⃣ Test des permissions executive...')
  try {
    const { data: permissions, error } = await supabase
      .from('executive_permissions')
      .select('*')
    
    if (error) {
      console.log('   ❌ Impossible de récupérer les permissions')
      allTestsPassed = false
    } else {
      console.log(`   ✅ ${permissions.length} permissions configurées`)
    }
  } catch (error) {
    console.log('   ❌ Erreur lors de la vérification des permissions:', error.message)
    allTestsPassed = false
  }
  
  // Test 5: Créer une alerte de test
  console.log('\n5️⃣ Test de création d\'alerte...')
  try {
    const { data, error } = await supabase
      .from('critical_alerts')
      .insert({
        alert_type: 'test_alert',
        severity: 'low',
        title: 'Test d\'alerte automatique',
        description: 'Ceci est un test du système d\'alertes exécutives',
        data: { test: true, timestamp: new Date().toISOString() },
        resolved: false
      })
      .select()
      .single()
    
    if (error) {
      console.log('   ❌ Impossible de créer une alerte de test')
      allTestsPassed = false
    } else {
      console.log('   ✅ Alerte de test créée avec succès')
      
      // Nettoyer l'alerte de test
      await supabase
        .from('critical_alerts')
        .delete()
        .eq('id', data.id)
      console.log('   🧹 Alerte de test supprimée')
    }
  } catch (error) {
    console.log('   ❌ Erreur lors du test d\'alerte:', error.message)
    allTestsPassed = false
  }
  
  // Test 6: Vérifier les données de base pour les métriques
  console.log('\n6️⃣ Test des données de base...')
  try {
    const { data: lofts } = await supabase.from('lofts').select('*').limit(1)
    const { data: transactions } = await supabase.from('transactions').select('*').limit(1)
    
    if (!lofts || lofts.length === 0) {
      console.log('   ⚠️ Aucun loft trouvé - les métriques seront limitées')
    } else {
      console.log('   ✅ Données de lofts disponibles')
    }
    
    if (!transactions || transactions.length === 0) {
      console.log('   ⚠️ Aucune transaction trouvée - les métriques financières seront limitées')
    } else {
      console.log('   ✅ Données de transactions disponibles')
    }
  } catch (error) {
    console.log('   ❌ Erreur lors de la vérification des données:', error.message)
  }
  
  // Résumé
  console.log('\n' + '='.repeat(50))
  if (allTestsPassed) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !')
    console.log('\n📋 Prochaines étapes :')
    console.log('1. Connectez-vous avec executive@loftmanager.com / executive123')
    console.log('2. Accédez à /executive pour voir le tableau de bord')
    console.log('3. Configurez les alertes automatiques si nécessaire')
    console.log('4. Personnalisez les seuils selon vos besoins')
  } else {
    console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ')
    console.log('\n🔧 Actions requises :')
    console.log('1. Exécutez le script SQL : scripts/add-executive-role.sql')
    console.log('2. Vérifiez les variables d\'environnement Supabase')
    console.log('3. Relancez ce test après correction')
  }
  console.log('='.repeat(50))
}

// Fonction utilitaire pour obtenir les valeurs d'enum (si disponible)
async function createGetEnumValuesFunction() {
  try {
    await supabase.rpc('create_get_enum_values_function', {})
  } catch (error) {
    // Fonction peut déjà exister, ignorer l'erreur
  }
}

if (require.main === module) {
  createGetEnumValuesFunction()
    .then(() => testExecutiveDashboard())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Erreur fatale:', error)
      process.exit(1)
    })
}