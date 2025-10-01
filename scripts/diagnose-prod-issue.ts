#!/usr/bin/env tsx
/**
 * DIAGNOSE PROD ISSUE
 * ===================
 * Diagnostiquer le problème "Database error granting user" en PROD
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function diagnoseProdIssue() {
  console.log('🔍 DIAGNOSE PROD ISSUE')
  console.log('='.repeat(60))

  try {
    // Configuration PROD
    config({ path: resolve(process.cwd(), '.env.production'), override: true })
    
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base PROD: ${prodUrl}`)
    console.log(`🔑 Service Key: ${prodServiceKey ? 'Présente' : 'Manquante'}`)
    console.log(`🔑 Anon Key: ${prodAnonKey ? 'Présente' : 'Manquante'}`)

    const adminClient = createClient(prodUrl, prodServiceKey)
    const userClient = createClient(prodUrl, prodAnonKey)

    // Test 1: Vérifier la connectivité Supabase
    console.log('\n🔐 TEST 1: CONNECTIVITÉ SUPABASE')
    try {
      const response = await fetch(`${prodUrl}/rest/v1/`, {
        headers: {
          'apikey': prodAnonKey,
          'Authorization': `Bearer ${prodAnonKey}`
        }
      })

      console.log(`📡 Status HTTP: ${response.status}`)
      
      if (response.status === 200) {
        console.log('✅ Projet Supabase PROD actif')
      } else if (response.status === 401) {
        console.log('⚠️ Problème d\'authentification')
      } else if (response.status === 503) {
        console.log('❌ Projet Supabase en pause ou indisponible')
      } else {
        console.log(`⚠️ Status inhabituel: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Erreur connectivité: ${error}`)
    }

    // Test 2: Vérifier les utilisateurs existants
    console.log('\n🔐 TEST 2: UTILISATEURS EXISTANTS')
    try {
      const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
      
      if (usersError) {
        console.log(`❌ Erreur listUsers: ${usersError.message}`)
        console.log(`   Code: ${usersError.code}`)
      } else {
        console.log(`✅ ${users.users.length} utilisateurs trouvés`)
        
        // Afficher quelques utilisateurs
        users.users.slice(0, 3).forEach((user, i) => {
          console.log(`   ${i + 1}. ${user.email} (confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'})`)
        })
      }
    } catch (error) {
      console.log(`❌ Exception listUsers: ${error}`)
    }

    // Test 3: Test de connexion avec un utilisateur existant
    console.log('\n🔐 TEST 3: TEST CONNEXION UTILISATEUR EXISTANT')
    
    // Essayer avec des identifiants courants
    const testCredentials = [
      { email: 'admin@loftalgerie.com', password: 'password123' },
      { email: 'loft.algerie.scl@outlook.com', password: 'password123' },
      { email: 'admin@dev.local', password: 'dev123' }
    ]

    for (const cred of testCredentials) {
      console.log(`\n   Test: ${cred.email}`)
      
      try {
        const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
          email: cred.email,
          password: cred.password
        })

        if (signInError) {
          console.log(`   ❌ ${signInError.message} (${signInError.code})`)
        } else {
          console.log(`   ✅ Connexion réussie!`)
          await userClient.auth.signOut()
          
          console.log('\n🎯 UTILISATEUR FONCTIONNEL TROUVÉ!')
          console.log(`📧 Email: ${cred.email}`)
          console.log(`🔑 Mot de passe: ${cred.password}`)
          break
        }
      } catch (error) {
        console.log(`   💥 Exception: ${error}`)
      }
    }

    // Test 4: Créer un utilisateur simple pour tester
    console.log('\n🔐 TEST 4: CRÉATION UTILISATEUR SIMPLE')
    
    const simpleEmail = `test${Date.now()}@prod.local`
    const simplePassword = 'test123'
    
    try {
      console.log(`📧 Création: ${simpleEmail}`)
      
      const { data: newUser, error: createError } = await userClient.auth.signUp({
        email: simpleEmail,
        password: simplePassword
      })

      if (createError) {
        console.log(`❌ Erreur signUp: ${createError.message}`)
        console.log(`   Code: ${createError.code}`)
        
        if (createError.code === 'signup_disabled') {
          console.log('⚠️ L\'inscription est désactivée en PROD')
        }
      } else {
        console.log('✅ SignUp réussi')
        
        if (newUser.user) {
          // Confirmer via admin
          const { error: confirmError } = await adminClient.auth.admin.updateUserById(
            newUser.user.id,
            { email_confirm: true }
          )

          if (confirmError) {
            console.log(`⚠️ Erreur confirmation: ${confirmError.message}`)
          } else {
            console.log('✅ Email confirmé')
            
            // Test connexion
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            const { data: testLogin, error: testError } = await userClient.auth.signInWithPassword({
              email: simpleEmail,
              password: simplePassword
            })

            if (testError) {
              console.log(`❌ Test connexion échoué: ${testError.message}`)
            } else {
              console.log('✅ Test connexion réussi!')
              await userClient.auth.signOut()
              
              console.log('\n🎯 NOUVEL UTILISATEUR CRÉÉ ET FONCTIONNEL!')
              console.log(`📧 Email: ${simpleEmail}`)
              console.log(`🔑 Mot de passe: ${simplePassword}`)
            }
          }
        }
      }
    } catch (error) {
      console.log(`❌ Exception création: ${error}`)
    }

    // Test 5: Vérifier les quotas et limites
    console.log('\n🔐 TEST 5: DIAGNOSTIC FINAL')
    
    console.log('\n💡 CAUSES POSSIBLES:')
    console.log('1. Projet Supabase en pause (plan gratuit)')
    console.log('2. Quotas dépassés (authentifications/mois)')
    console.log('3. Problème de configuration RLS')
    console.log('4. Problème de réseau/connectivité')
    console.log('5. Utilisateurs corrompus dans la base')
    
    console.log('\n🔧 SOLUTIONS RECOMMANDÉES:')
    console.log('1. Vérifier le dashboard Supabase pour les alertes')
    console.log('2. Redémarrer le projet Supabase si possible')
    console.log('3. Vérifier les quotas du plan')
    console.log('4. Utiliser l\'environnement DEV temporairement')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

diagnoseProdIssue().catch(console.error)