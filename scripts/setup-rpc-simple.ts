#!/usr/bin/env tsx
/**
 * SETUP SIMPLE DES FONCTIONS RPC
 * ==============================
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

async function setupSimpleRPC() {
  console.log('🔧 Setup des fonctions RPC simples...')

  try {
    // Lire le fichier SQL
    const sqlContent = readFileSync(resolve(process.cwd(), 'scripts/setup-clone-rpc.sql'), 'utf-8')

    // Setup PRODUCTION
    console.log('📋 Setup PRODUCTION...')
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    const prodClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Essayer d'exécuter via une requête simple
    console.log('⚠️ Note: Vous devez appliquer manuellement ce SQL dans Supabase:')
    console.log('-'.repeat(50))
    console.log(sqlContent)
    console.log('-'.repeat(50))

    // Test si la fonction existe déjà
    try {
      const { data, error } = await prodClient.rpc('get_tables_list')
      if (!error) {
        console.log('✅ Fonction RPC déjà disponible dans PROD')
        console.log(`📋 Tables détectées: ${data?.length || 0}`)
      } else {
        console.log('⚠️ Fonction RPC non disponible dans PROD')
      }
    } catch (error) {
      console.log('⚠️ Fonction RPC non disponible dans PROD')
    }

    // Setup DÉVELOPPEMENT
    console.log('\n📋 Setup DÉVELOPPEMENT...')
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
      const { data, error } = await devClient.rpc('get_tables_list')
      if (!error) {
        console.log('✅ Fonction RPC déjà disponible dans DEV')
        console.log(`📋 Tables détectées: ${data?.length || 0}`)
      } else {
        console.log('⚠️ Fonction RPC non disponible dans DEV')
      }
    } catch (error) {
      console.log('⚠️ Fonction RPC non disponible dans DEV')
    }

    console.log('\n💡 INSTRUCTIONS:')
    console.log('1. Copiez le SQL ci-dessus')
    console.log('2. Allez dans Supabase Dashboard > SQL Editor')
    console.log('3. Collez et exécutez le SQL dans PROD et DEV')
    console.log('4. Puis relancez le clonage')

  } catch (error) {
    console.error('❌ Erreur setup RPC:', error)
  }
}

setupSimpleRPC().catch(console.error)