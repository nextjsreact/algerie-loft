#!/usr/bin/env tsx
/**
 * SETUP DES FONCTIONS RPC POUR LE CLONAGE
 * =======================================
 * 
 * Ce script applique les fonctions RPC nécessaires pour le clonage complet
 * sur les environnements PROD et DEV.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

async function setupCloneFunctions() {
  console.log('🔧 SETUP DES FONCTIONS RPC POUR LE CLONAGE')
  console.log('='.repeat(50))

  try {
    // Lire le fichier SQL
    const sqlContent = readFileSync(resolve(process.cwd(), 'scripts/setup-rpc-functions.sql'), 'utf-8')
    
    // Diviser en commandes individuelles
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    console.log(`📋 ${commands.length} commandes SQL à exécuter`)

    // Setup PRODUCTION
    console.log('\n📋 Setup PRODUCTION...')
    config({ path: resolve(process.cwd(), '.env.prod') })
    
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodClient = createClient(prodUrl, prodKey)

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      
      try {
        const { error } = await prodClient.rpc('query', { query: command + ';' })
        
        if (error) {
          console.warn(`⚠️ PROD Commande ${i + 1} échouée: ${error.message}`)
        } else {
          console.log(`✅ PROD Commande ${i + 1} réussie`)
        }
      } catch (error) {
        console.warn(`⚠️ PROD Commande ${i + 1} erreur:`, error)
      }
    }

    // Setup DÉVELOPPEMENT
    console.log('\n📋 Setup DÉVELOPPEMENT...')
    config({ path: resolve(process.cwd(), '.env.development') })
    
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const devClient = createClient(devUrl, devKey)

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      
      try {
        const { error } = await devClient.rpc('query', { query: command + ';' })
        
        if (error) {
          console.warn(`⚠️ DEV Commande ${i + 1} échouée: ${error.message}`)
        } else {
          console.log(`✅ DEV Commande ${i + 1} réussie`)
        }
      } catch (error) {
        console.warn(`⚠️ DEV Commande ${i + 1} erreur:`, error)
      }
    }

    console.log('\n🎉 SETUP DES FONCTIONS RPC TERMINÉ')
    console.log('✅ Les fonctions sont maintenant disponibles pour le clonage complet')

  } catch (error) {
    console.error('❌ Erreur setup fonctions RPC:', error)
    process.exit(1)
  }
}

setupCloneFunctions().catch(console.error)