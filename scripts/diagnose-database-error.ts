#!/usr/bin/env tsx
/**
 * DIAGNOSE DATABASE ERROR
 * =======================
 * Diagnostiquer l'erreur "Database error granting user"
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function diagnoseDatabaseError() {
  console.log('🔍 DIAGNOSE DATABASE ERROR')
  console.log('='.repeat(60))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env'), override: true })
    
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const devAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('📋 CONFIGURATION:')
    console.log(`   URL: ${devUrl}`)
    console.log(`   Service Key: ${devServiceKey ? 'Présente' : 'Manquante'}`)
    console.log(`   Anon Key: ${devAnonKey ? 'Présente' : 'Manquante'}`)

    // Test 1: Connexion avec service role
    console.log('\n🔐 TEST 1: CONNEXION AVEC SERVICE ROLE')
    const adminClient = createClient(devUrl, devServiceKey)
    
    try {
      const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
      
      if (usersError) {
        console.log(`❌ Erreur listUsers: ${usersError.message}`)
      } else {
        console.log(`✅ Service role OK - ${users.users.length} utilisateurs`)
        
        // Chercher notre utilisateur
        const targetUser = users.users.find(u => u.email === 'admin@dev.local')
        if (targetUser) {
          console.log(`✅ Utilisateur trouvé: ${targetUser.email}`)
          console.log(`   ID: ${targetUser.id}`)
          console.log(`   Confirmé: ${targetUser.email_confirmed_at ? 'Oui' : 'Non'}`)
          console.log(`   Dernière connexion: ${targetUser.last_sign_in_at || 'Jamais'}`)
          console.log(`   Statut: ${targetUser.banned_until ? 'Banni' : 'Actif'}`)
        } else {
          console.log('❌ Utilisateur admin@dev.local non trouvé')
        }
      }
    } catch (error) {
      console.log(`❌ Exception service role: ${error}`)
    }

    // Test 2: Vérifier la connectivité de base
    console.log('\n🔐 TEST 2: CONNECTIVITÉ BASE DE DONNÉES')
    try {
      const { data, error } = await adminClient
        .from('profiles')
        .select('count')
        .limit(1)

      if (error) {
        console.log(`❌ Erreur DB: ${error.message}`)
        console.log(`   Code: ${error.code}`)
        console.log(`   Details: ${error.details}`)
      } else {
        console.log('✅ Connectivité DB OK')
      }
    } catch (error) {
      console.log(`❌ Exception DB: ${error}`)
    }

    // Test 3: Vérifier les permissions RLS
    console.log('\n🔐 TEST 3: PERMISSIONS RLS')
    const userClient = createClient(devUrl, devAnonKey)
    
    try {
      const { data, error } = await userClient
        .from('profiles')
        .select('count')
        .limit(1)

      if (error) {
        console.log(`⚠️ RLS bloque l'accès: ${error.message}`)
      } else {
        console.log('✅ RLS permet l\'accès anonyme')
      }
    } catch (error) {
      console.log(`❌ Exception RLS: ${error}`)
    }

    // Test 4: Essayer de recréer l'utilisateur
    console.log('\n🔐 TEST 4: RECRÉATION UTILISATEUR')
    const testEmail = 'admin@dev.local'
    const testPassword = 'dev123'
    
    try {
      // Supprimer l'utilisateur existant
      const { data: users } = await adminClient.auth.admin.listUsers()
      const existingUser = users.users.find(u => u.email === testEmail)
      
      if (existingUser) {
        console.log('🗑️ Suppression utilisateur existant...')
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(existingUser.id)
        
        if (deleteError) {
          console.log(`❌ Erreur suppression: ${deleteError.message}`)
        } else {
          console.log('✅ Utilisateur supprimé')
        }
      }

      // Attendre un peu
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Créer nouvel utilisateur
      console.log('🆕 Création nouvel utilisateur...')
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      })

      if (createError) {
        console.log(`❌ Erreur création: ${createError.message}`)
        console.log(`   Code: ${createError.code}`)
      } else {
        console.log('✅ Utilisateur créé avec succès')
        
        // Créer profil
        const { error: profileError } = await adminClient
          .from('profiles')
          .upsert([{
            id: newUser.user.id,
            email: testEmail,
            full_name: 'Admin DEV',
            role: 'admin'
          }])

        if (profileError) {
          console.log(`⚠️ Erreur profil: ${profileError.message}`)
        } else {
          console.log('✅ Profil créé')
        }

        // Test connexion immédiate
        console.log('🔐 Test connexion immédiate...')
        
        // Attendre un peu pour que la DB se synchronise
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const { data: loginTest, error: loginError } = await userClient.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        })

        if (loginError) {
          console.log(`❌ Erreur connexion: ${loginError.message}`)
          console.log(`   Code: ${loginError.code}`)
          console.log(`   Status: ${loginError.status}`)
        } else {
          console.log('✅ Connexion réussie!')
          await userClient.auth.signOut()
        }
      }
    } catch (error) {
      console.log(`❌ Exception recréation: ${error}`)
    }

    // Test 5: Vérifier l'état du projet Supabase
    console.log('\n🔐 TEST 5: ÉTAT DU PROJET SUPABASE')
    try {
      // Test simple de ping
      const response = await fetch(`${devUrl}/rest/v1/`, {
        headers: {
          'apikey': devAnonKey,
          'Authorization': `Bearer ${devAnonKey}`
        }
      })

      console.log(`📡 Status HTTP: ${response.status}`)
      
      if (response.status === 200) {
        console.log('✅ Projet Supabase actif')
      } else {
        console.log('⚠️ Projet Supabase peut avoir des problèmes')
      }
    } catch (error) {
      console.log(`❌ Erreur ping Supabase: ${error}`)
    }

    console.log('\n💡 RECOMMANDATIONS:')
    console.log('='.repeat(40))
    console.log('1. Vérifiez le dashboard Supabase pour des erreurs')
    console.log('2. Le projet peut être en pause ou avoir des limites')
    console.log('3. Essayez de redémarrer le projet Supabase')
    console.log('4. Vérifiez les quotas et limites du plan')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

diagnoseDatabaseError().catch(console.error)