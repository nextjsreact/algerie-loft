#!/usr/bin/env tsx
/**
 * FIX PROD EMERGENCY
 * ==================
 * Solution d'urgence pour la PROD
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function fixProdEmergency() {
  console.log('🚨 FIX PROD EMERGENCY')
  console.log('='.repeat(60))

  try {
    // Configuration PROD
    config({ path: resolve(process.cwd(), '.env.production'), override: true })
    
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base PROD: ${prodUrl}`)

    const adminClient = createClient(prodUrl, prodServiceKey)
    const userClient = createClient(prodUrl, prodAnonKey)

    // Solution 1: Créer un utilisateur avec un email simple
    console.log('\n🆕 SOLUTION 1: UTILISATEUR SIMPLE')
    
    const simpleEmail = 'admin@test.com'
    const simplePassword = 'admin123'
    
    try {
      // Supprimer s'il existe
      const { data: users } = await adminClient.auth.admin.listUsers()
      const existingUser = users.users.find(u => u.email === simpleEmail)
      
      if (existingUser) {
        console.log('🗑️ Suppression utilisateur existant...')
        await adminClient.auth.admin.deleteUser(existingUser.id)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Créer via admin (plus fiable)
      console.log(`📧 Création admin: ${simpleEmail}`)
      
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: simpleEmail,
        password: simplePassword,
        email_confirm: true
      })

      if (createError) {
        console.log(`❌ Erreur admin create: ${createError.message}`)
        
        // Solution 2: Essayer avec un autre email
        console.log('\n🔄 SOLUTION 2: EMAIL ALTERNATIF')
        
        const altEmail = 'test@example.com'
        const altPassword = 'password123'
        
        const { data: altUser, error: altError } = await adminClient.auth.admin.createUser({
          email: altEmail,
          password: altPassword,
          email_confirm: true
        })

        if (altError) {
          console.log(`❌ Erreur email alternatif: ${altError.message}`)
        } else {
          console.log('✅ Utilisateur alternatif créé')
          
          // Test connexion
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          const { data: altTest, error: altTestError } = await userClient.auth.signInWithPassword({
            email: altEmail,
            password: altPassword
          })

          if (altTestError) {
            console.log(`❌ Test alternatif échoué: ${altTestError.message}`)
          } else {
            console.log('✅ Test alternatif réussi!')
            await userClient.auth.signOut()
            
            console.log('\n🎯 UTILISATEUR ALTERNATIF FONCTIONNEL!')
            console.log(`📧 Email: ${altEmail}`)
            console.log(`🔑 Mot de passe: ${altPassword}`)
            return
          }
        }
      } else {
        console.log('✅ Utilisateur admin créé')
        
        // Test connexion
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const { data: testLogin, error: testError } = await userClient.auth.signInWithPassword({
          email: simpleEmail,
          password: simplePassword
        })

        if (testError) {
          console.log(`❌ Test connexion échoué: ${testError.message}`)
        } else {
          console.log('✅ Test connexion réussi!')
          await userClient.auth.signOut()
          
          console.log('\n🎯 UTILISATEUR ADMIN FONCTIONNEL!')
          console.log(`📧 Email: ${simpleEmail}`)
          console.log(`🔑 Mot de passe: ${simplePassword}`)
          return
        }
      }
    } catch (error) {
      console.log(`❌ Exception: ${error}`)
    }

    // Solution 3: Recommandation de basculer vers DEV
    console.log('\n🔄 SOLUTION 3: BASCULER VERS DEV')
    console.log('La base PROD semble avoir des problèmes sérieux.')
    console.log('Recommandation: Utiliser l\'environnement DEV temporairement.')
    console.log('')
    console.log('Commandes pour basculer vers DEV:')
    console.log('copy .env.development .env.local')
    console.log('npm run dev')
    console.log('')
    console.log('Identifiants DEV fonctionnels:')
    console.log('📧 user1759066310913@dev.local')
    console.log('🔑 password123')

    console.log('\n🔧 ACTIONS RECOMMANDÉES:')
    console.log('1. Vérifier le dashboard Supabase PROD')
    console.log('2. Contacter le support Supabase si nécessaire')
    console.log('3. Vérifier les quotas et limites du plan')
    console.log('4. Redémarrer le projet Supabase si possible')
    console.log('5. Utiliser DEV en attendant la résolution')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

fixProdEmergency().catch(console.error)