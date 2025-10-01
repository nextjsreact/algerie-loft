#!/usr/bin/env tsx
/**
 * CREATE WORKING USER
 * ===================
 * Créer un utilisateur qui fonctionne vraiment dans l'interface
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function createWorkingUser() {
  console.log('🔧 CREATE WORKING USER')
  console.log('='.repeat(60))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env'), override: true })
    
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const devAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base DEV: ${devUrl}`)

    const adminClient = createClient(devUrl, devServiceKey)
    const userClient = createClient(devUrl, devAnonKey)

    // Vérifier l'état actuel
    console.log('\n🔍 ÉTAT ACTUEL:')
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Erreur listUsers:', usersError)
      return
    }

    console.log(`📊 ${users.users.length} utilisateurs trouvés:`)
    users.users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email} (${user.id})`)
      console.log(`      Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`)
    })

    // Nettoyer tous les utilisateurs de test
    console.log('\n🧹 NETTOYAGE:')
    const testEmails = ['admin@dev.local', 'devuser@test.local', 'test@debug.local']
    
    for (const email of testEmails) {
      const user = users.users.find(u => u.email === email)
      if (user) {
        console.log(`🗑️ Suppression ${email}...`)
        await adminClient.auth.admin.deleteUser(user.id)
        
        // Supprimer aussi du profil
        await adminClient
          .from('profiles')
          .delete()
          .eq('email', email)
      }
    }

    // Attendre la synchronisation
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Créer un utilisateur ultra-simple avec un email unique
    console.log('\n🆕 CRÉATION UTILISATEUR ULTRA-SIMPLE:')
    
    const timestamp = Date.now()
    const simpleEmail = `user${timestamp}@dev.local`
    const simplePassword = 'password123'
    
    console.log(`📧 Email: ${simpleEmail}`)
    console.log(`🔑 Password: ${simplePassword}`)

    // Méthode 1: signUp (plus fiable)
    console.log('\n📝 Méthode signUp...')
    const { data: signUpData, error: signUpError } = await userClient.auth.signUp({
      email: simpleEmail,
      password: simplePassword
    })

    if (signUpError) {
      console.log(`❌ SignUp échoué: ${signUpError.message}`)
      
      // Méthode 2: createUser admin
      console.log('\n👑 Méthode admin createUser...')
      const { data: adminCreateData, error: adminCreateError } = await adminClient.auth.admin.createUser({
        email: simpleEmail,
        password: simplePassword,
        email_confirm: true
      })

      if (adminCreateError) {
        console.error('❌ Admin create échoué:', adminCreateError)
        return
      }

      console.log('✅ Utilisateur créé via admin')
    } else {
      console.log('✅ Utilisateur créé via signUp')
      
      if (signUpData.user) {
        // Confirmer l'email
        console.log('📧 Confirmation email...')
        const { error: confirmError } = await adminClient.auth.admin.updateUserById(
          signUpData.user.id,
          { email_confirm: true }
        )

        if (confirmError) {
          console.warn('⚠️ Erreur confirmation:', confirmError)
        } else {
          console.log('✅ Email confirmé')
        }
      }
    }

    // Attendre la synchronisation
    console.log('\n⏳ Attente synchronisation (5s)...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Test de connexion immédiat
    console.log('\n🔐 TEST CONNEXION IMMÉDIAT:')
    
    const { data: testLogin, error: testError } = await userClient.auth.signInWithPassword({
      email: simpleEmail,
      password: simplePassword
    })

    if (testError) {
      console.log(`❌ Test échoué: ${testError.message}`)
      console.log(`   Code: ${testError.code}`)
      
      // Essayer avec un délai plus long
      console.log('\n⏳ Attente supplémentaire (10s)...')
      await new Promise(resolve => setTimeout(resolve, 10000))
      
      const { data: retryLogin, error: retryError } = await userClient.auth.signInWithPassword({
        email: simpleEmail,
        password: simplePassword
      })

      if (retryError) {
        console.log(`❌ Retry échoué: ${retryError.message}`)
        
        // Créer un utilisateur avec un email encore plus simple
        console.log('\n🔄 PLAN B: EMAIL ENCORE PLUS SIMPLE')
        
        const planBEmail = 'test@test.com'
        const planBPassword = '123456'
        
        console.log(`📧 Plan B Email: ${planBEmail}`)
        
        const { data: planBSignUp, error: planBError } = await userClient.auth.signUp({
          email: planBEmail,
          password: planBPassword
        })

        if (planBError) {
          console.error('❌ Plan B échoué:', planBError)
        } else {
          console.log('✅ Plan B créé')
          
          if (planBSignUp.user) {
            await adminClient.auth.admin.updateUserById(
              planBSignUp.user.id,
              { email_confirm: true }
            )

            await new Promise(resolve => setTimeout(resolve, 5000))
            
            const { data: planBTest, error: planBTestError } = await userClient.auth.signInWithPassword({
              email: planBEmail,
              password: planBPassword
            })

            if (planBTestError) {
              console.log(`❌ Plan B test échoué: ${planBTestError.message}`)
            } else {
              console.log('✅ Plan B test réussi!')
              await userClient.auth.signOut()
              
              console.log('\n🎯 UTILISATEUR PLAN B FONCTIONNEL!')
              console.log('='.repeat(40))
              console.log(`📧 Email: ${planBEmail}`)
              console.log(`🔑 Mot de passe: ${planBPassword}`)
              return
            }
          }
        }
      } else {
        console.log('✅ Retry test réussi!')
        await userClient.auth.signOut()
        
        console.log('\n🎯 UTILISATEUR FONCTIONNEL (RETRY)!')
        console.log('='.repeat(40))
        console.log(`📧 Email: ${simpleEmail}`)
        console.log(`🔑 Mot de passe: ${simplePassword}`)
        return
      }
    } else {
      console.log('✅ Test connexion réussi!')
      await userClient.auth.signOut()
      
      console.log('\n🎯 UTILISATEUR FONCTIONNEL!')
      console.log('='.repeat(40))
      console.log(`📧 Email: ${simpleEmail}`)
      console.log(`🔑 Mot de passe: ${simplePassword}`)
      return
    }

    console.log('\n❌ AUCUNE SOLUTION N\'A FONCTIONNÉ')
    console.log('💡 Le problème peut être plus profond dans la configuration Supabase')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

createWorkingUser().catch(console.error)