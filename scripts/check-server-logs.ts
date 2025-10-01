#!/usr/bin/env tsx
/**
 * CHECK SERVER LOGS
 * =================
 * Vérifier les logs côté serveur et les erreurs potentielles
 */

import { createClient, createReadOnlyClient } from '@/utils/supabase/server'
import { config } from 'dotenv'
import { resolve } from 'path'

async function checkServerLogs() {
  console.log('🖥️ CHECK SERVER LOGS')
  console.log('='.repeat(50))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    
    console.log('📋 VARIABLES D\'ENVIRONNEMENT:')
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}`)
    console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}`)
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'}`)

    console.log('\n🔐 TEST CLIENT SERVER (normal):')
    try {
      const client = await createClient()
      console.log('   ✅ createClient() réussi')
      
      // Test basique
      const { data, error } = await client.from('profiles').select('count').limit(1)
      if (error) {
        console.log(`   ⚠️ Erreur requête: ${error.message}`)
      } else {
        console.log('   ✅ Requête test réussie')
      }
    } catch (error) {
      console.log(`   ❌ Erreur createClient: ${error}`)
    }

    console.log('\n🔐 TEST CLIENT SERVER (read-only):')
    try {
      const readOnlyClient = await createReadOnlyClient()
      console.log('   ✅ createReadOnlyClient() réussi')
      
      // Test basique
      const { data, error } = await readOnlyClient.from('profiles').select('count').limit(1)
      if (error) {
        console.log(`   ⚠️ Erreur requête: ${error.message}`)
      } else {
        console.log('   ✅ Requête test réussie')
      }
    } catch (error) {
      console.log(`   ❌ Erreur createReadOnlyClient: ${error}`)
    }

    console.log('\n🔐 TEST AUTH FUNCTIONS:')
    
    // Simuler les fonctions auth
    try {
      // Import dynamique pour éviter les erreurs de contexte
      const { getSession } = await import('@/lib/auth')
      
      console.log('   🔍 Test getSession()...')
      const session = await getSession()
      console.log(`   Session: ${session ? `✅ ${session.user.email}` : '❌ Null'}`)
      
    } catch (error) {
      console.log(`   ❌ Erreur auth functions: ${error}`)
    }

    console.log('\n🌐 VÉRIFICATION MIDDLEWARE:')
    
    // Vérifier le fichier middleware
    try {
      const fs = await import('fs')
      const middlewarePath = resolve(process.cwd(), 'middleware.ts')
      
      if (fs.existsSync(middlewarePath)) {
        console.log('   ✅ middleware.ts existe')
        
        const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8')
        if (middlewareContent.includes('next-intl')) {
          console.log('   ✅ Middleware next-intl détecté')
        }
        if (middlewareContent.includes('auth')) {
          console.log('   ⚠️ Middleware auth détecté (peut interférer)')
        }
      } else {
        console.log('   ❌ middleware.ts manquant')
      }
    } catch (error) {
      console.log(`   ❌ Erreur vérification middleware: ${error}`)
    }

    console.log('\n📁 VÉRIFICATION STRUCTURE:')
    
    const criticalFiles = [
      'app/[locale]/login/page.tsx',
      'app/[locale]/dashboard/page.tsx',
      'components/auth/simple-login-form-nextintl.tsx',
      'utils/supabase/client.ts',
      'utils/supabase/server.ts',
      'lib/auth.ts'
    ]

    for (const file of criticalFiles) {
      try {
        const fs = await import('fs')
        const filePath = resolve(process.cwd(), file)
        
        if (fs.existsSync(filePath)) {
          console.log(`   ✅ ${file}`)
        } else {
          console.log(`   ❌ ${file} MANQUANT`)
        }
      } catch (error) {
        console.log(`   ❌ ${file} - Erreur: ${error}`)
      }
    }

    console.log('\n💡 RECOMMANDATIONS:')
    console.log('='.repeat(30))
    console.log('1. Testez la page de debug: /fr/debug-login')
    console.log('2. Vérifiez les logs du navigateur (F12)')
    console.log('3. Vérifiez les cookies dans les DevTools')
    console.log('4. Testez en navigation privée')
    console.log('5. Vérifiez les redirections Next.js')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

checkServerLogs().catch(console.error)