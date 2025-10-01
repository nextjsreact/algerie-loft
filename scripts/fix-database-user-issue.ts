#!/usr/bin/env tsx
/**
 * FIX DATABASE USER ISSUE
 * =======================
 * Corriger le problème "Database error granting user"
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function fixDatabaseUserIssue() {
  console.log('🔧 FIX DATABASE USER ISSUE')
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

    // Solution 1: Nettoyer complètement l'utilisateur problématique
    console.log('\n🧹 SOLUTION 1: NETTOYAGE COMPLET')
    
    const problemEmail = 'admin@dev.local'
    
    // Supprimer de auth.users
    const { data: users } = await adminClient.auth.admin.listUsers()
    const problemUser = users.users.find(u => u.email === problemEmail)
    
    if (problemUser) {
      console.log('🗑️ Suppression utilisateur auth...')
      await adminClient.auth.admin.deleteUser(problemUser.id)
    }

    // Supprimer du profil
    console.log('🗑️ Suppression profil...')
    await adminClient
      .from('profiles')
      .delete()
      .eq('email', problemEmail)

    // Attendre la synchronisation
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Solution 2: Créer un utilisateur avec un email différent
    console.log('\n🆕 SOLUTION 2: NOUVEL UTILISATEUR')
    
    const newEmail = 'devuser@test.local'
    const newPassword = 'dev123'
    
    console.log(`📧 Création: ${newEmail}`)
    
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: newEmail,
      password: newPassword,
      email_confirm: true
    })

    if (createError) {
      console.error('❌ Erreur création:', createError)
      
      // Solution 3: Utiliser signUp au lieu de createUser
      console.log('\n🔄 SOLUTION 3: UTILISER SIGNUP')
      
      const { data: signUpData, error: signUpError } = await userClient.auth.signUp({
        email: newEmail,
        password: newPassword
      })

      if (signUpError) {
        console.error('❌ Erreur signUp:', signUpError)
        return
      }

      console.log('✅ SignUp réussi')
      
      if (signUpData.user) {
        // Confirmer l'email via admin
        const { error: confirmError } = await adminClient.auth.admin.updateUserById(
          signUpData.user.id,
          { email_confirm: true }
        )

        if (confirmError) {
          console.warn('⚠️ Erreur confirmation:', confirmError)
        } else {
          console.log('✅ Email confirmé')
        }

        // Créer profil
        const { error: profileError } = await adminClient
          .from('profiles')
          .insert([{
            id: signUpData.user.id,
            email: newEmail,
            full_name: 'Dev User',
            role: 'admin'
          }])

        if (profileError) {
          console.warn('⚠️ Erreur profil:', profileError)
        } else {
          console.log('✅ Profil créé')
        }
      }
    } else {
      console.log('✅ Utilisateur créé via admin')
      
      // Créer profil
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert([{
          id: newUser.user.id,
          email: newEmail,
          full_name: 'Dev User',
          role: 'admin'
        }])

      if (profileError) {
        console.warn('⚠️ Erreur profil:', profileError)
      } else {
        console.log('✅ Profil créé')
      }
    }

    // Test de connexion avec le nouvel utilisateur
    console.log('\n🔐 TEST CONNEXION NOUVEL UTILISATEUR')
    
    // Attendre la synchronisation
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    const { data: testLogin, error: testError } = await userClient.auth.signInWithPassword({
      email: newEmail,
      password: newPassword
    })

    if (testError) {
      console.log(`❌ Erreur test: ${testError.message}`)
      console.log(`   Code: ${testError.code}`)
      
      // Solution 4: Créer un utilisateur ultra-simple
      console.log('\n🔄 SOLUTION 4: UTILISATEUR ULTRA-SIMPLE')
      
      const simpleEmail = `test${Date.now()}@local.dev`
      const simplePassword = 'test123'
      
      console.log(`📧 Email simple: ${simpleEmail}`)
      
      const { data: simpleSignUp, error: simpleError } = await userClient.auth.signUp({
        email: simpleEmail,
        password: simplePassword
      })

      if (simpleError) {
        console.error('❌ Erreur simple:', simpleError)
      } else {
        console.log('✅ Utilisateur simple créé')
        
        if (simpleSignUp.user) {
          // Confirmer via admin
          await adminClient.auth.admin.updateUserById(
            simpleSignUp.user.id,
            { email_confirm: true }
          )

          // Test immédiat
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const { data: simpleTest, error: simpleTestError } = await userClient.auth.signInWithPassword({
            email: simpleEmail,
            password: simplePassword
          })

          if (simpleTestError) {
            console.log(`❌ Test simple échoué: ${simpleTestError.message}`)
          } else {
            console.log('✅ Test simple réussi!')
            await userClient.auth.signOut()
            
            console.log('\n🎯 UTILISATEUR FONCTIONNEL TROUVÉ!')
            console.log('='.repeat(40))
            console.log(`📧 Email: ${simpleEmail}`)
            console.log(`🔑 Mot de passe: ${simplePassword}`)
            console.log('🎉 Utilisez ces identifiants pour tester!')
            return
          }
        }
      }
    } else {
      console.log('✅ Test connexion réussi!')
      await userClient.auth.signOut()
      
      console.log('\n🎯 UTILISATEUR FONCTIONNEL!')
      console.log('='.repeat(40))
      console.log(`📧 Email: ${newEmail}`)
      console.log(`🔑 Mot de passe: ${newPassword}`)
      console.log('🎉 Utilisez ces identifiants pour tester!')
    }

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

fixDatabaseUserIssue().catch(console.error)