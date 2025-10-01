#!/usr/bin/env tsx
/**
 * UPDATE DEV USER PROFILE
 * =======================
 * Update the dev user profile to have admin role and proper name
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function updateDevUserProfile() {
  console.log('👤 UPDATE DEV USER PROFILE')
  console.log('='.repeat(50))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log(`📋 Base DEV: ${devUrl}`)

    // Client avec service role pour admin
    const adminClient = createClient(devUrl, devServiceKey)

    const testEmail = 'admin@dev.local'

    console.log('\n👤 ÉTAPE 1: Récupération du profil actuel')
    
    const { data: currentProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single()

    if (profileError) {
      console.error('❌ Erreur récupération profil:', profileError)
      return
    }

    console.log('📋 Profil actuel:')
    console.log(`   Email: ${currentProfile.email}`)
    console.log(`   Nom: ${currentProfile.full_name || 'Vide'}`)
    console.log(`   Rôle: ${currentProfile.role}`)
    console.log(`   ID: ${currentProfile.id}`)

    console.log('\n🔧 ÉTAPE 2: Mise à jour du profil')
    
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({
        full_name: 'Admin DEV',
        role: 'admin'
      })
      .eq('id', currentProfile.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erreur mise à jour profil:', updateError)
      return
    }

    console.log('✅ Profil mis à jour avec succès')
    console.log('📋 Nouveau profil:')
    console.log(`   Email: ${updatedProfile.email}`)
    console.log(`   Nom: ${updatedProfile.full_name}`)
    console.log(`   Rôle: ${updatedProfile.role}`)

    console.log('\n🔐 ÉTAPE 3: Test de connexion et récupération du profil')
    
    // Client avec anon key pour test
    const devAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userClient = createClient(devUrl, devAnonKey)
    
    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email: testEmail,
      password: 'dev123'
    })

    if (signInError) {
      console.error('❌ Erreur connexion:', signInError)
      return
    }

    console.log('✅ Connexion réussie')

    // Test récupération du profil via session
    const { data: sessionProfile, error: sessionProfileError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single()

    if (sessionProfileError) {
      console.error('❌ Erreur récupération profil via session:', sessionProfileError)
    } else {
      console.log('✅ Profil récupéré via session:')
      console.log(`   Nom: ${sessionProfile.full_name}`)
      console.log(`   Rôle: ${sessionProfile.role}`)
    }

    await userClient.auth.signOut()

    console.log('\n💡 RÉSUMÉ:')
    console.log('• Profil mis à jour avec succès')
    console.log('• Nom: Admin DEV')
    console.log('• Rôle: admin')
    console.log('• Connexion et accès profil: ✅')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

updateDevUserProfile().catch(console.error)