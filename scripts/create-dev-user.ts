#!/usr/bin/env tsx
/**
 * CRÉATION D'UTILISATEUR DEV
 * ==========================
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import * as readline from 'readline'

async function createDevUser() {
  console.log('👤 CRÉATION D\'UTILISATEUR DEV')
  console.log('='.repeat(40))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Demander les informations utilisateur
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const email = await new Promise<string>(resolve => {
      rl.question('📧 Email de l\'utilisateur: ', resolve)
    })

    const password = await new Promise<string>(resolve => {
      rl.question('🔑 Mot de passe: ', resolve)
    })

    const fullName = await new Promise<string>(resolve => {
      rl.question('👤 Nom complet (optionnel): ', resolve)
    })

    rl.close()

    console.log('\n🔧 Création de l\'utilisateur...')

    // Créer l'utilisateur dans auth.users
    const { data: newUser, error: createError } = await devClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (createError) {
      console.error('❌ Erreur création utilisateur:', createError.message)
      return
    }

    console.log('✅ Utilisateur créé dans auth.users')

    // Créer le profil correspondant
    const { error: profileError } = await devClient
      .from('profiles')
      .insert([{
        id: newUser.user.id,
        email,
        full_name: fullName || 'Utilisateur DEV',
        role: 'admin'
      }])

    if (profileError) {
      console.warn('⚠️ Erreur création profil:', profileError.message)
    } else {
      console.log('✅ Profil créé dans la table profiles')
    }

    // Test de connexion
    console.log('\n🔐 Test de connexion...')
    const { data: signInData, error: signInError } = await devClient.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      console.error('❌ Erreur test connexion:', signInError.message)
    } else {
      console.log('✅ Test de connexion réussi!')
      await devClient.auth.signOut()
    }

    console.log('\n🎉 UTILISATEUR CRÉÉ AVEC SUCCÈS!')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Mot de passe: ${password}`)
    console.log('💡 Vous pouvez maintenant vous connecter avec ces identifiants')

  } catch (error) {
    console.error('💥 ERREUR:', error)
  }
}

createDevUser().catch(console.error)