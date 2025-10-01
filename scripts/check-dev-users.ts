#!/usr/bin/env tsx
/**
 * VÉRIFICATION DES UTILISATEURS DEV
 * =================================
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function checkDevUsers() {
  console.log('🔍 VÉRIFICATION DES UTILISATEURS DEV')
  console.log('='.repeat(50))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const devClient = createClient(devUrl, devKey)

    console.log(`📋 Base DEV: ${devUrl}`)

    // Vérifier les utilisateurs dans auth.users
    console.log('\n👥 UTILISATEURS DANS AUTH.USERS:')
    try {
      const { data: authUsers, error: authError } = await devClient.auth.admin.listUsers()
      
      if (authError) {
        console.error('❌ Erreur récupération auth.users:', authError.message)
      } else {
        console.log(`📊 ${authUsers.users.length} utilisateurs trouvés dans auth.users`)
        
        authUsers.users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} (${user.id})`)
          console.log(`   Créé: ${user.created_at}`)
          console.log(`   Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`)
          console.log(`   Dernière connexion: ${user.last_sign_in_at || 'Jamais'}`)
        })
      }
    } catch (error) {
      console.error('❌ Erreur auth.users:', error)
    }

    // Vérifier les profils dans la table profiles
    console.log('\n👤 PROFILS DANS LA TABLE PROFILES:')
    try {
      const { data: profiles, error: profilesError } = await devClient
        .from('profiles')
        .select('*')

      if (profilesError) {
        console.error('❌ Erreur récupération profiles:', profilesError.message)
      } else {
        console.log(`📊 ${profiles?.length || 0} profils trouvés dans la table profiles`)
        
        profiles?.forEach((profile, index) => {
          console.log(`${index + 1}. ${profile.email} (${profile.role})`)
          console.log(`   Nom: ${profile.full_name}`)
          console.log(`   ID: ${profile.id}`)
        })
      }
    } catch (error) {
      console.error('❌ Erreur profiles:', error)
    }

    // Créer un utilisateur de test
    console.log('\n🆕 CRÉATION D\'UN UTILISATEUR DE TEST:')
    try {
      const testEmail = 'admin@dev.local'
      const testPassword = 'dev123'
      
      // Vérifier s'il existe déjà
      const { data: existingUser } = await devClient.auth.admin.listUsers()
      const userExists = existingUser.users.some(u => u.email === testEmail)
      
      if (userExists) {
        console.log('✅ Utilisateur de test existe déjà')
      } else {
        const { data: newUser, error: createError } = await devClient.auth.admin.createUser({
          email: testEmail,
          password: testPassword,
          email_confirm: true
        })

        if (createError) {
          console.error('❌ Erreur création utilisateur:', createError.message)
        } else {
          console.log('✅ Utilisateur de test créé avec succès')
          console.log(`📧 Email: ${testEmail}`)
          console.log(`🔑 Mot de passe: ${testPassword}`)
          
          // Créer le profil correspondant
          const { error: profileError } = await devClient
            .from('profiles')
            .insert([{
              id: newUser.user.id,
              email: testEmail,
              full_name: 'Admin DEV',
              role: 'admin'
            }])

          if (profileError) {
            console.warn('⚠️ Erreur création profil:', profileError.message)
          } else {
            console.log('✅ Profil créé avec succès')
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur création utilisateur de test:', error)
    }

    // Test de connexion
    console.log('\n🔐 TEST DE CONNEXION:')
    try {
      const testEmail = 'admin@dev.local'
      const testPassword = 'dev123'
      
      const { data: signInData, error: signInError } = await devClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (signInError) {
        console.error('❌ Erreur connexion:', signInError.message)
      } else {
        console.log('✅ Connexion réussie!')
        console.log(`👤 Utilisateur: ${signInData.user.email}`)
        
        // Se déconnecter
        await devClient.auth.signOut()
      }
    } catch (error) {
      console.error('❌ Erreur test connexion:', error)
    }

    console.log('\n💡 RECOMMANDATIONS:')
    console.log('• Utilisez admin@dev.local / dev123 pour vous connecter')
    console.log('• Ou créez un nouvel utilisateur via l\'interface')
    console.log('• Les utilisateurs de PROD ne sont pas dans DEV')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

checkDevUsers().catch(console.error)