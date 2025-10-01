#!/usr/bin/env tsx
/**
 * DEBUG DU PROBLÈME DE CLONAGE
 * ============================
 * 
 * Vérifie ce qui se passe réellement avec le clonage
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function debugCloneIssue() {
  console.log('🔍 DEBUG DU PROBLÈME DE CLONAGE')
  console.log('='.repeat(50))

  try {
    // Configuration Production
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodClient = createClient(prodUrl, prodKey)

    // Configuration Développement
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const devClient = createClient(devUrl, devKey)

    console.log('✅ Clients initialisés')
    console.log(`📋 PROD URL: ${prodUrl}`)
    console.log(`📋 DEV URL: ${devUrl}`)

    // Vérifier si ce sont vraiment des bases différentes
    if (prodUrl === devUrl) {
      console.log('🚨 PROBLÈME CRITIQUE: MÊME URL POUR PROD ET DEV!')
      console.log('❌ Le clonage ne peut pas fonctionner sur la même base')
      return
    }

    console.log('✅ URLs différentes confirmées')

    // Tester une table simple
    const testTable = 'currencies'
    
    console.log(`\n📊 TEST SUR LA TABLE: ${testTable}`)
    console.log('-'.repeat(40))

    // Compter les enregistrements avant
    const { data: prodDataBefore } = await prodClient.from(testTable).select('*')
    const { data: devDataBefore } = await devClient.from(testTable).select('*')
    
    console.log(`📈 AVANT - PROD: ${prodDataBefore?.length || 0} enregistrements`)
    console.log(`📈 AVANT - DEV: ${devDataBefore?.length || 0} enregistrements`)

    // Vérifier le contenu
    if (prodDataBefore && prodDataBefore.length > 0) {
      console.log(`📋 Premier enregistrement PROD:`, prodDataBefore[0])
    }
    
    if (devDataBefore && devDataBefore.length > 0) {
      console.log(`📋 Premier enregistrement DEV:`, devDataBefore[0])
    }

    // Test d'insertion simple
    console.log('\n🧪 TEST D\'INSERTION SIMPLE')
    console.log('-'.repeat(40))

    const testRecord = {
      code: 'TEST',
      name: 'Test Currency',
      symbol: 'T',
      is_default: false,
      ratio: 1.0
    }

    // Essayer d'insérer dans DEV
    const { data: insertResult, error: insertError } = await devClient
      .from(testTable)
      .insert([testRecord])
      .select()

    if (insertError) {
      console.log(`❌ Erreur insertion: ${insertError.message}`)
    } else {
      console.log(`✅ Insertion réussie:`, insertResult)
      
      // Nettoyer le test
      await devClient.from(testTable).delete().eq('code', 'TEST')
      console.log('🗑️ Test nettoyé')
    }

    // Vérifier les schémas
    console.log('\n📋 VÉRIFICATION DES SCHÉMAS')
    console.log('-'.repeat(40))

    // Essayer de récupérer les métadonnées des tables
    const tables = ['currencies', 'categories', 'lofts', 'profiles']
    
    for (const table of tables) {
      try {
        const { data: prodData, error: prodError } = await prodClient
          .from(table)
          .select('*')
          .limit(1)

        const { data: devData, error: devError } = await devClient
          .from(table)
          .select('*')
          .limit(1)

        const prodExists = !prodError
        const devExists = !devError

        console.log(`📋 ${table}:`)
        console.log(`   PROD: ${prodExists ? '✅ Existe' : '❌ N\'existe pas'} ${prodError ? `(${prodError.message})` : ''}`)
        console.log(`   DEV:  ${devExists ? '✅ Existe' : '❌ N\'existe pas'} ${devError ? `(${devError.message})` : ''}`)

        if (prodExists && devExists && prodData && devData) {
          const prodColumns = prodData.length > 0 ? Object.keys(prodData[0]) : []
          const devColumns = devData.length > 0 ? Object.keys(devData[0]) : []
          
          if (prodColumns.length > 0 && devColumns.length > 0) {
            const missingInDev = prodColumns.filter(col => !devColumns.includes(col))
            const extraInDev = devColumns.filter(col => !prodColumns.includes(col))
            
            if (missingInDev.length > 0) {
              console.log(`   ⚠️ Colonnes manquantes dans DEV: ${missingInDev.join(', ')}`)
            }
            if (extraInDev.length > 0) {
              console.log(`   ⚠️ Colonnes supplémentaires dans DEV: ${extraInDev.join(', ')}`)
            }
            if (missingInDev.length === 0 && extraInDev.length === 0) {
              console.log(`   ✅ Schémas identiques`)
            }
          }
        }
      } catch (error) {
        console.log(`❌ Erreur vérification ${table}: ${error}`)
      }
    }

    console.log('\n🎯 DIAGNOSTIC')
    console.log('='.repeat(50))
    console.log('Le problème semble être que nous copions seulement les DONNÉES')
    console.log('mais nous ne clonons pas la STRUCTURE complète de la base.')
    console.log('')
    console.log('Pour un vrai clonage, il faut:')
    console.log('1. 🗑️ Supprimer toutes les tables DEV')
    console.log('2. 📋 Récupérer le schéma complet de PROD')
    console.log('3. 🏗️ Recréer toutes les tables dans DEV')
    console.log('4. 📊 Copier toutes les données')
    console.log('5. 🔗 Recréer les contraintes et index')

  } catch (error) {
    console.error('💥 Erreur debug:', error)
  }
}

debugCloneIssue().catch(console.error)