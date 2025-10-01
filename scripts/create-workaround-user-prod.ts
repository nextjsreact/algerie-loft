#!/usr/bin/env tsx
/**
 * CREATE WORKAROUND USER PROD
 * ===========================
 * Créer un utilisateur de contournement en PROD
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function createWorkaroundUserProd() {
  console.log('🔧 CREATE WORKAROUND USER PROD')
  console.log('='.repeat(60))

  try {
    // Configuration PROD
    config({ path: resolve(process.cwd(), '.env.local'), override: true })
    
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log(`📋 Base PROD: ${prodUrl}`)

    const adminClient = createClient(prodUrl, prodServiceKey)

    // Créer un utilisateur avec un email très simple
    console.log('\n🆕 CRÉATION UTILISATEUR DE CONTOURNEMENT:')
    
    const workaroundEmail = 'admin@workaround.com'
    const workaroundPassword = 'Workaround123!'
    
    console.log(`📧 Email: ${workaroundEmail}`)
    console.log(`🔑 Password: ${workaroundPassword}`)

    try {
      // Supprimer s'il existe
      const { data: users } = await adminClient.auth.admin.listUsers()
      const existingUser = users.users.find(u => u.email === workaroundEmail)
      
      if (existingUser) {
        console.log('🗑️ Suppression utilisateur existant...')
        await adminClient.auth.admin.deleteUser(existingUser.id)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Créer via admin avec paramètres spéciaux
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: workaroundEmail,
        password: workaroundPassword,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          full_name: 'Admin Workaround',
          created_by: 'system'
        }
      })

      if (createError) {
        console.log(`❌ Erreur création: ${createError.message}`)
        
        // Essayer avec un autre email
        const altEmail = 'test@admin.local'
        console.log(`\n🔄 Essai avec: ${altEmail}`)
        
        const { data: altUser, error: altError } = await adminClient.auth.admin.createUser({
          email: altEmail,
          password: workaroundPassword,
          email_confirm: true
        })

        if (altError) {
          console.log(`❌ Erreur alternative: ${altError.message}`)
        } else {
          console.log('✅ Utilisateur alternatif créé')
          
          console.log('\n🎯 UTILISATEUR DE CONTOURNEMENT CRÉÉ!')
          console.log(`📧 Email: ${altEmail}`)
          console.log(`🔑 Mot de passe: ${workaroundPassword}`)
          console.log('')
          console.log('⚠️ ATTENTION: Cet utilisateur peut avoir le même problème')
          console.log('Si l\'erreur persiste, le problème est au niveau Supabase')
        }
      } else {
        console.log('✅ Utilisateur de contournement créé')
        
        console.log('\n🎯 UTILISATEUR DE CONTOURNEMENT CRÉÉ!')
        console.log(`📧 Email: ${workaroundEmail}`)
        console.log(`🔑 Mot de passe: ${workaroundPassword}`)
        console.log('')
        console.log('⚠️ ATTENTION: Cet utilisateur peut avoir le même problème')
        console.log('Si l\'erreur persiste, le problème est au niveau Supabase')
      }

    } catch (error) {
      console.log(`❌ Exception: ${error}`)
    }

    console.log('\n💡 RECOMMANDATIONS:')
    console.log('='.repeat(40))
    console.log('1. Testez avec le nouvel utilisateur créé')
    console.log('2. Si l\'erreur persiste, contactez le support Supabase')
    console.log('3. Vérifiez le dashboard Supabase pour des alertes')
    console.log('4. Considérez basculer vers DEV temporairement')
    console.log('')
    console.log('🔄 Basculer vers DEV si nécessaire:')
    console.log('copy .env.development .env.local && npm run dev')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

createWorkaroundUserProd().catch(console.error)