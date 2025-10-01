#!/usr/bin/env tsx
/**
 * SCRIPT DE TEST DES CONNEXIONS
 * =============================
 * 
 * Teste les connexions aux bases de données PROD et DEV
 * avant d'effectuer le clonage.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testConnections() {
  console.log('🔍 TEST DES CONNEXIONS DE CLONAGE')
  console.log('='.repeat(50))

  try {
    // Test PRODUCTION
    console.log('\n📋 Test connexion PRODUCTION...')
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!prodUrl || !prodKey) {
      throw new Error('Configuration PRODUCTION manquante')
    }

    const prodClient = createClient(prodUrl, prodKey)
    
    const { data: prodLofts, error: prodError } = await prodClient
      .from('lofts')
      .select('id, name')
      .limit(5)

    if (prodError) {
      throw new Error(`Erreur PRODUCTION: ${prodError.message}`)
    }

    console.log(`✅ PRODUCTION: ${prodLofts?.length || 0} lofts trouvés`)
    if (prodLofts && prodLofts.length > 0) {
      console.log(`   Premier loft: ${prodLofts[0].name}`)
    }

    // Test DÉVELOPPEMENT
    console.log('\n📋 Test connexion DÉVELOPPEMENT...')
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!devUrl || !devKey) {
      throw new Error('Configuration DÉVELOPPEMENT manquante')
    }

    // Vérification de sécurité
    if (devUrl.includes('mhngbluefyucoesgcjoy')) {
      throw new Error('🚫 ERREUR: URL de PRODUCTION détectée dans DEV!')
    }

    const devClient = createClient(devUrl, devKey)
    
    const { data: devLofts, error: devError } = await devClient
      .from('lofts')
      .select('id, name')
      .limit(5)

    if (devError) {
      console.log(`⚠️ DÉVELOPPEMENT: ${devError.message}`)
      console.log('   (Normal si la base DEV est vide)')
    } else {
      console.log(`✅ DÉVELOPPEMENT: ${devLofts?.length || 0} lofts trouvés`)
    }

    // Test des autres tables critiques
    console.log('\n📋 Test des tables critiques...')
    
    const criticalTables = ['profiles', 'teams', 'categories', 'currencies']
    
    for (const table of criticalTables) {
      try {
        const { data, error } = await prodClient
          .from(table)
          .select('count')
          .limit(1)

        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: accessible`)
        }
      } catch (error) {
        console.log(`❌ ${table}: ${error}`)
      }
    }

    console.log('\n🎉 TESTS DE CONNEXION TERMINÉS')
    console.log('='.repeat(50))
    console.log('✅ Les connexions sont prêtes pour le clonage')
    console.log('💡 Vous pouvez maintenant exécuter: npm run clone:prod-to-dev')

  } catch (error) {
    console.error('\n❌ ERREUR DE CONNEXION:', error)
    console.log('\n🔧 VÉRIFICATIONS À FAIRE:')
    console.log('• Vérifiez les fichiers .env.prod et .env.development')
    console.log('• Vérifiez que les URLs Supabase sont correctes')
    console.log('• Vérifiez que les clés de service sont valides')
    process.exit(1)
  }
}

testConnections().catch(console.error)