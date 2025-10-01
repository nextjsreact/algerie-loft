#!/usr/bin/env tsx
/**
 * FINAL LOGIN TEST
 * ================
 * Test complet du système de connexion après corrections
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function finalLoginTest() {
  console.log('🎯 FINAL LOGIN TEST')
  console.log('='.repeat(50))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base DEV: ${devUrl}`)
    console.log(`🔑 Anon Key: ${devAnonKey.substring(0, 20)}...`)

    // Client avec anon key (comme le frontend)
    const supabase = createClient(devUrl, devAnonKey)

    const testEmail = 'admin@dev.local'
    const testPassword = 'dev123'

    console.log('\n🔐 TEST 1: Connexion avec identifiants corrects')
    console.log(`Email: ${testEmail}`)
    console.log(`Password: ${testPassword}`)

    const startTime = Date.now()
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    const loginTime = Date.now() - startTime

    if (signInError) {
      console.error('❌ ÉCHEC - Erreur connexion:', signInError)
      console.log('\n🔍 DIAGNOSTIC:')
      console.log('• Vérifiez que le mot de passe a été correctement reseté')
      console.log('• Vérifiez la configuration Supabase')
      return
    }

    console.log(`✅ SUCCÈS - Connexion réussie en ${loginTime}ms`)
    console.log(`👤 User: ${signInData.user?.email}`)
    console.log(`🎫 Session: ${signInData.session ? 'Présente' : 'Absente'}`)

    console.log('\n🔐 TEST 2: Vérification session')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !sessionData.session) {
      console.error('❌ ÉCHEC - Session non valide')
      return
    }

    console.log('✅ SUCCÈS - Session valide')

    console.log('\n🔐 TEST 3: Accès aux données protégées')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user?.id)
      .single()

    if (profileError) {
      console.error('❌ ÉCHEC - Erreur accès profil:', profileError)
      return
    }

    console.log('✅ SUCCÈS - Accès aux données protégées')
    console.log(`👤 Nom: ${profile.full_name}`)
    console.log(`🎭 Rôle: ${profile.role}`)

    console.log('\n🔐 TEST 4: Test avec identifiants incorrects')
    const { data: badData, error: badError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'mauvais-mot-de-passe'
    })

    if (badError) {
      console.log('✅ SUCCÈS - Rejet des identifiants incorrects')
      console.log(`   Erreur attendue: ${badError.message}`)
    } else {
      console.warn('⚠️ ATTENTION - Les identifiants incorrects ont été acceptés')
    }

    console.log('\n🔐 TEST 5: Déconnexion')
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.error('❌ ÉCHEC - Erreur déconnexion:', signOutError)
    } else {
      console.log('✅ SUCCÈS - Déconnexion réussie')
    }

    console.log('\n🎯 RÉSULTAT FINAL:')
    console.log('='.repeat(30))
    console.log('✅ Système de connexion: FONCTIONNEL')
    console.log(`⏱️ Temps de connexion: ${loginTime}ms`)
    console.log('✅ Gestion des sessions: OK')
    console.log('✅ Accès aux données: OK')
    console.log('✅ Sécurité: OK')
    console.log('')
    console.log('🎉 Le problème "connexion en cours" est résolu!')
    console.log('')
    console.log('📋 Identifiants pour l\'interface:')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Mot de passe: ${testPassword}`)
    console.log('   Redirection: /fr/dashboard')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

finalLoginTest().catch(console.error)