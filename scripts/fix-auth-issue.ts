#!/usr/bin/env tsx
/**
 * CORRECTION DU PROBLÈME D'AUTHENTIFICATION
 * =========================================
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function fixAuthIssue() {
  console.log('🔧 CORRECTION DU PROBLÈME D\'AUTHENTIFICATION')
  console.log('='.repeat(50))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const devServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    console.log(`📋 Base DEV: ${devUrl}`)

    // Client service pour les opérations admin
    const serviceClient = createClient(devUrl, devServiceKey)
    
    // Client normal pour l'authentification
    const normalClient = createClient(devUrl, devAnonKey)

    // 1. Vérifier l'utilisateur existant
    console.log('\n👤 VÉRIFICATION DE L\'UTILISATEUR EXISTANT:')
    const { data: users } = await serviceClient.auth.admin.listUsers()
    const existingUser = users.users.find(u => u.email === 'admin@dev.local')

    if (!existingUser) {
      console.log('❌ Utilisateur admin@dev.local n\'existe pas')
      
      // Créer l'utilisateur
      console.log('🆕 Création de l\'utilisateur...')
      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email: 'admin@dev.local',
        password: 'dev123',
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin DEV',
          role: 'admin'
        }
      })

      if (createError) {
        console.error('❌ Erreur création:', createError.message)
        return
      }

      console.log('✅ Utilisateur créé avec succès')
      
      // Créer le profil
      const { error: profileError } = await serviceClient
        .from('profiles')
        .upsert([{
          id: newUser.user.id,
          email: 'admin@dev.local',
          full_name: 'Admin DEV',
          role: 'admin'
        }])

      if (profileError) {
        console.warn('⚠️ Erreur profil:', profileError.message)
      } else {
        console.log('✅ Profil créé')
      }
    } else {
      console.log('✅ Utilisateur admin@dev.local existe')
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Confirmé: ${existingUser.email_confirmed_at ? 'Oui' : 'Non'}`)
      
      // Mettre à jour le mot de passe au cas où
      console.log('🔄 Mise à jour du mot de passe...')
      const { error: updateError } = await serviceClient.auth.admin.updateUserById(
        existingUser.id,
        { password: 'dev123' }
      )

      if (updateError) {
        console.warn('⚠️ Erreur mise à jour mot de passe:', updateError.message)
      } else {
        console.log('✅ Mot de passe mis à jour')
      }
    }

    // 2. Test de connexion avec le client normal
    console.log('\n🔐 TEST DE CONNEXION AVEC CLIENT NORMAL:')
    const { data: signInData, error: signInError } = await normalClient.auth.signInWithPassword({
      email: 'admin@dev.local',
      password: 'dev123'
    })

    if (signInError) {
      console.error('❌ Erreur connexion client normal:', signInError.message)
      
      // Diagnostics supplémentaires
      console.log('\n🔍 DIAGNOSTICS:')
      console.log(`📋 URL: ${devUrl}`)
      console.log(`🔑 Anon Key: ${devAnonKey.substring(0, 20)}...`)
      
      // Vérifier si l'utilisateur est confirmé
      if (existingUser && !existingUser.email_confirmed_at) {
        console.log('⚠️ Email non confirmé, confirmation...')
        const { error: confirmError } = await serviceClient.auth.admin.updateUserById(
          existingUser.id,
          { email_confirm: true }
        )
        
        if (confirmError) {
          console.error('❌ Erreur confirmation:', confirmError.message)
        } else {
          console.log('✅ Email confirmé')
        }
      }
      
    } else {
      console.log('✅ Connexion réussie avec client normal!')
      console.log(`👤 Utilisateur: ${signInData.user.email}`)
      
      // Vérifier la session
      const { data: session } = await normalClient.auth.getSession()
      if (session.session) {
        console.log('✅ Session établie')
      } else {
        console.log('⚠️ Pas de session')
      }
      
      // Se déconnecter
      await normalClient.auth.signOut()
    }

    // 3. Créer un utilisateur avec tes identifiants habituels si tu veux
    console.log('\n💡 CRÉATION D\'UN UTILISATEUR AVEC TES IDENTIFIANTS:')
    console.log('Si tu veux utiliser tes identifiants habituels, je peux créer un utilisateur')
    console.log('avec ton email et mot de passe habituels.')

    console.log('\n🎯 RÉSUMÉ:')
    console.log('✅ Utilisateur admin@dev.local configuré')
    console.log('🔑 Mot de passe: dev123')
    console.log('💡 Utilise ces identifiants pour te connecter')

  } catch (error) {
    console.error('💥 ERREUR:', error)
  }
}

fixAuthIssue().catch(console.error)