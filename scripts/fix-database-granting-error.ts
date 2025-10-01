#!/usr/bin/env tsx
/**
 * FIX DATABASE GRANTING ERROR
 * ===========================
 * Résoudre l'erreur "Database error granting user"
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function fixDatabaseGrantingError() {
  console.log('🔧 FIX DATABASE GRANTING ERROR')
  console.log('='.repeat(60))

  try {
    // Configuration actuelle (PROD)
    config({ path: resolve(process.cwd(), '.env.local'), override: true })
    
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base: ${prodUrl}`)
    console.log('🎯 Diagnostic de l\'erreur "Database error granting user"')

    const adminClient = createClient(prodUrl, prodServiceKey)
    const userClient = createClient(prodUrl, prodAnonKey)

    // Étape 1: Vérifier l'état du projet Supabase
    console.log('\n🔍 ÉTAPE 1: ÉTAT DU PROJET SUPABASE')
    
    try {
      const healthCheck = await fetch(`${prodUrl}/rest/v1/`, {
        headers: {
          'apikey': prodAnonKey,
          'Authorization': `Bearer ${prodAnonKey}`
        }
      })

      console.log(`📡 Health Check: ${healthCheck.status}`)
      
      if (healthCheck.status !== 200) {
        console.log('⚠️ Le projet Supabase peut avoir des problèmes')
      }
    } catch (error) {
      console.log(`❌ Erreur health check: ${error}`)
    }

    // Étape 2: Vérifier les utilisateurs avec service role
    console.log('\n🔍 ÉTAPE 2: VÉRIFICATION AVEC SERVICE ROLE')
    
    try {
      const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
      
      if (usersError) {
        console.log(`❌ Erreur service role: ${usersError.message}`)
      } else {
        console.log(`✅ Service role OK: ${users.users.length} utilisateurs`)
      }
    } catch (error) {
      console.log(`❌ Exception service role: ${error}`)
    }

    // Étape 3: Créer un utilisateur de test simple
    console.log('\n🔧 ÉTAPE 3: CRÉATION UTILISATEUR DE TEST')
    
    const testEmail = `test.${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    console.log(`📧 Création: ${testEmail}`)
    
    try {
      // Méthode 1: Création via admin (plus fiable)
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      })

      if (createError) {
        console.log(`❌ Erreur création admin: ${createError.message}`)
        
        // Méthode 2: SignUp normal
        console.log('\n🔄 Essai avec signUp normal...')
        
        const { data: signUpData, error: signUpError } = await userClient.auth.signUp({
          email: testEmail,
          password: testPassword
        })

        if (signUpError) {
          console.log(`❌ Erreur signUp: ${signUpError.message}`)
        } else {
          console.log('✅ SignUp réussi')
          
          if (signUpData.user) {
            // Confirmer via admin
            await adminClient.auth.admin.updateUserById(
              signUpData.user.id,
              { email_confirm: true }
            )
            console.log('✅ Email confirmé via admin')
          }
        }
      } else {
        console.log('✅ Création admin réussie')
      }

      // Attendre la synchronisation
      console.log('⏳ Attente synchronisation (5s)...')
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Test de connexion
      console.log('\n🔐 TEST DE CONNEXION')
      
      const { data: loginData, error: loginError } = await userClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (loginError) {
        console.log(`❌ Erreur connexion: ${loginError.message}`)
        console.log(`   Code: ${loginError.code}`)
        
        if (loginError.code === 'unexpected_failure') {
          console.log('\n🔧 DIAGNOSTIC: Erreur "Database error granting user"')
          console.log('Cette erreur indique généralement:')
          console.log('1. Problème de permissions dans la base de données')
          console.log('2. Problème de configuration RLS (Row Level Security)')
          console.log('3. Problème temporaire du serveur Supabase')
          console.log('4. Corruption de données utilisateur')
          
          // Solution: Reset des permissions
          console.log('\n🔧 TENTATIVE DE RÉSOLUTION:')
          
          try {
            // Essayer de supprimer et recréer l'utilisateur
            if (newUser?.user) {
              console.log('🗑️ Suppression utilisateur de test...')
              await adminClient.auth.admin.deleteUser(newUser.user.id)
              
              await new Promise(resolve => setTimeout(resolve, 2000))
              
              // Recréer avec des paramètres différents
              console.log('🆕 Recréation avec paramètres différents...')
              
              const { data: newUser2, error: createError2 } = await adminClient.auth.admin.createUser({
                email: testEmail.replace('@example.com', '@test.local'),
                password: testPassword,
                email_confirm: true,
                user_metadata: { role: 'member' }
              })

              if (createError2) {
                console.log(`❌ Erreur recréation: ${createError2.message}`)
              } else {
                console.log('✅ Recréation réussie')
                
                await new Promise(resolve => setTimeout(resolve, 3000))
                
                const { data: loginData2, error: loginError2 } = await userClient.auth.signInWithPassword({
                  email: testEmail.replace('@example.com', '@test.local'),
                  password: testPassword
                })

                if (loginError2) {
                  console.log(`❌ Erreur connexion 2: ${loginError2.message}`)
                } else {
                  console.log('✅ Connexion réussie après recréation!')
                  await userClient.auth.signOut()
                  
                  console.log('\n🎉 PROBLÈME RÉSOLU!')
                  console.log(`📧 Utilisateur fonctionnel: ${testEmail.replace('@example.com', '@test.local')}`)
                  console.log(`🔑 Mot de passe: ${testPassword}`)
                  return
                }
              }
            }
          } catch (error) {
            console.log(`❌ Erreur lors de la résolution: ${error}`)
          }
        }
      } else {
        console.log('✅ Connexion réussie!')
        await userClient.auth.signOut()
        
        console.log('\n🎉 UTILISATEUR DE TEST FONCTIONNEL!')
        console.log(`📧 Email: ${testEmail}`)
        console.log(`🔑 Mot de passe: ${testPassword}`)
        return
      }

    } catch (error) {
      console.log(`❌ Exception création: ${error}`)
    }

    // Étape 4: Recommandations finales
    console.log('\n💡 RECOMMANDATIONS FINALES:')
    console.log('='.repeat(40))
    console.log('L\'erreur "Database error granting user" persiste.')
    console.log('')
    console.log('🔧 Actions recommandées:')
    console.log('1. Vérifier le dashboard Supabase pour des alertes')
    console.log('2. Contacter le support Supabase')
    console.log('3. Vérifier les quotas du plan (authentifications/mois)')
    console.log('4. Redémarrer le projet Supabase si possible')
    console.log('5. Vérifier la configuration RLS des tables')
    console.log('')
    console.log('🔄 Solution temporaire:')
    console.log('Utiliser l\'environnement DEV pendant la résolution:')
    console.log('copy .env.development .env.local && npm run dev')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

fixDatabaseGrantingError().catch(console.error)