#!/usr/bin/env tsx
/**
 * CHECK CURRENT ENV
 * =================
 * Vérifier quel environnement est réellement utilisé
 */

import { config } from 'dotenv'
import { resolve } from 'path'

async function checkCurrentEnv() {
  console.log('🔍 CHECK CURRENT ENV')
  console.log('='.repeat(50))

  try {
    // Charger .env.local (priorité Next.js)
    config({ path: resolve(process.cwd(), '.env.local'), override: true })
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    
    console.log('📋 ENVIRONNEMENT RÉELLEMENT UTILISÉ:')
    console.log(`   URL: ${url}`)
    
    if (url.includes('mhngbluefyucoesgcjoy')) {
      console.log('✅ PRODUCTION (mhngbluefyucoesgcjoy)')
      console.log('🎯 Vous êtes bien en PROD')
    } else if (url.includes('wtcbyjdwjrrqyzpvjfze')) {
      console.log('✅ DÉVELOPPEMENT (wtcbyjdwjrrqyzpvjfze)')
      console.log('🎯 Vous êtes en DEV')
    } else {
      console.log('❓ Environnement inconnu')
    }

    console.log('\n💡 EXPLICATION:')
    console.log('Next.js affiche tous les fichiers .env trouvés,')
    console.log('mais utilise seulement .env.local (priorité la plus haute)')
    console.log('')
    console.log('📁 Fichiers trouvés par Next.js:')
    console.log('   .env.local ← UTILISÉ (priorité 1)')
    console.log('   .env.development ← Ignoré (priorité 2)')
    console.log('   .env ← Ignoré (priorité 3)')

  } catch (error) {
    console.error('💥 ERREUR:', error)
  }
}

checkCurrentEnv().catch(console.error)