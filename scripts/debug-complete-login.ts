#!/usr/bin/env tsx
/**
 * DEBUG COMPLET LOGIN
 * ===================
 * Debug approfondi pour identifier le vrai problème
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function debugCompleteLogin() {
  console.log('🔍 DEBUG COMPLET LOGIN')
  console.log('='.repeat(60))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const devServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log('📋 CONFIGURATION:')
    console.log(`   URL: ${devUrl}`)
    console.log(`   Anon Key: ${devAnonKey ? devAnonKey.substring(0, 20) + '...' : 'MANQUANT'}`)
    console.log(`   Service Key: ${devServiceKey ? devServiceKey.substring(0, 20) + '...' : 'MANQUANT'}`)

    // Test 1: Vérifier les utilisateurs existants
    console.log('\n🔐 ÉTAPE 1: VÉRIFICATION DES UTILISATEURS')
    const adminClient = createClient(devUrl, devServiceKey)
    
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
    if (usersError) {
      console.error('❌ Erreur listUsers:', usersError)
      return
    }

    console.log(`📊 ${users.users.length} utilisateurs trouvés:`)
    users.users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email} (${user.id})`)
      console.log(`      Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`)
      console.log(`      Dernière connexion: ${user.last_sign_in_at || 'Jamais'}`)
    })

    // Test 2: Vérifier les profils
    console.log('\n👤 ÉTAPE 2: VÉRIFICATION DES PROFILS')
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('*')

    if (profilesError) {
      console.error('❌ Erreur profiles:', profilesError)
    } else {
      console.log(`📊 ${profiles?.length || 0} profils trouvés:`)
      profiles?.forEach((profile, i) => {
        console.log(`   ${i + 1}. ${profile.email} - ${profile.full_name} (${profile.role})`)
      })
    }

    // Test 3: Test avec différents clients
    console.log('\n🔐 ÉTAPE 3: TEST AVEC CLIENT ANON')
    const userClient = createClient(devUrl, devAnonKey)
    
    const testCredentials = [
      { email: 'admin@dev.local', password: 'dev123' },
      { email: 'admin@loftmanager.com', password: 'password123' },
    ]

    for (const cred of testCredentials) {
      console.log(`\n   Test: ${cred.email} / ${cred.password}`)
      
      try {
        const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
          email: cred.email,
          password: cred.password,
        })

        if (signInError) {
          console.log(`   ❌ Échec: ${signInError.message}`)
        } else {
          console.log(`   ✅ Succès: ${signInData.user?.email}`)
          console.log(`   🎫 Session: ${signInData.session ? 'Présente' : 'Absente'}`)
          
          // Déconnexion immédiate
          await userClient.auth.signOut()
        }
      } catch (error) {
        console.log(`   💥 Exception: ${error}`)
      }
    }

    // Test 4: Créer un nouvel utilisateur de test
    console.log('\n🆕 ÉTAPE 4: CRÉATION UTILISATEUR DE TEST')
    const testEmail = 'test@debug.local'
    const testPassword = 'debug123'

    // Supprimer s'il existe
    const existingUser = users.users.find(u => u.email === testEmail)
    if (existingUser) {
      console.log('   🗑️ Suppression utilisateur existant...')
      await adminClient.auth.admin.deleteUser(existingUser.id)
    }

    // Créer nouvel utilisateur
    console.log('   🆕 Création nouvel utilisateur...')
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })

    if (createError) {
      console.error('   ❌ Erreur création:', createError)
    } else {
      console.log('   ✅ Utilisateur créé avec succès')
      
      // Créer profil
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert([{
          id: newUser.user.id,
          email: testEmail,
          full_name: 'Debug User',
          role: 'member'
        }])

      if (profileError) {
        console.warn('   ⚠️ Erreur profil:', profileError)
      } else {
        console.log('   ✅ Profil créé')
      }

      // Test connexion immédiate
      console.log('   🔐 Test connexion immédiate...')
      const { data: testLogin, error: testError } = await userClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (testError) {
        console.log(`   ❌ Échec connexion immédiate: ${testError.message}`)
      } else {
        console.log('   ✅ Connexion immédiate réussie!')
        await userClient.auth.signOut()
      }
    }

    // Test 5: Vérifier la configuration RLS
    console.log('\n🔒 ÉTAPE 5: VÉRIFICATION RLS')
    try {
      const { data: rlsData, error: rlsError } = await adminClient
        .from('profiles')
        .select('*')
        .limit(1)

      if (rlsError) {
        console.log(`   ⚠️ RLS actif: ${rlsError.message}`)
      } else {
        console.log('   ✅ Accès RLS OK')
      }
    } catch (error) {
      console.log(`   ❌ Erreur RLS: ${error}`)
    }

    // Test 6: Vérifier les variables d'environnement
    console.log('\n🌍 ÉTAPE 6: VARIABLES D\'ENVIRONNEMENT')
    const envVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATABASE_URL'
    ]

    envVars.forEach(varName => {
      const value = process.env[varName]
      console.log(`   ${varName}: ${value ? '✅ Définie' : '❌ Manquante'}`)
    })

    console.log('\n💡 DIAGNOSTIC FINAL:')
    console.log('='.repeat(40))
    
    // Recommandations basées sur les tests
    const workingUser = users.users.find(u => u.email_confirmed_at)
    if (workingUser) {
      console.log(`✅ Utilisateur confirmé trouvé: ${workingUser.email}`)
      console.log('💡 Essayez de resetter le mot de passe de cet utilisateur')
    } else {
      console.log('❌ Aucun utilisateur confirmé trouvé')
      console.log('💡 Créez un nouvel utilisateur via l\'interface admin')
    }

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

debugCompleteLogin().catch(console.error)