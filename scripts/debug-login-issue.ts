#!/usr/bin/env tsx
/**
 * DEBUG LOGIN ISSUE
 * =================
 * Test the complete login flow to identify where it gets stuck
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function debugLoginIssue() {
  console.log('🔍 DEBUG LOGIN ISSUE')
  console.log('='.repeat(50))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base DEV: ${devUrl}`)
    console.log(`🔑 Anon Key: ${devAnonKey.substring(0, 20)}...`)

    // Créer un client avec la clé anonyme (comme le fait le frontend)
    const supabase = createClient(devUrl, devAnonKey)

    const testEmail = 'admin@dev.local'
    const testPassword = 'dev123'

    console.log('\n🔐 ÉTAPE 1: Test de connexion avec signInWithPassword')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (signInError) {
      console.error('❌ Erreur signInWithPassword:', signInError)
      return
    }

    console.log('✅ signInWithPassword réussi')
    console.log(`👤 User ID: ${signInData.user?.id}`)
    console.log(`📧 Email: ${signInData.user?.email}`)
    console.log(`🎫 Session: ${signInData.session ? 'Présente' : 'Absente'}`)

    console.log('\n🔐 ÉTAPE 2: Vérification de la session')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('❌ Erreur getSession:', sessionError)
      return
    }

    console.log('✅ getSession réussi')
    console.log(`🎫 Session active: ${sessionData.session ? 'Oui' : 'Non'}`)
    if (sessionData.session) {
      console.log(`👤 User dans session: ${sessionData.session.user?.email}`)
      console.log(`⏰ Expire à: ${new Date(sessionData.session.expires_at! * 1000)}`)
    }

    console.log('\n🔐 ÉTAPE 3: Test d\'accès aux données utilisateur')
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('❌ Erreur getUser:', userError)
      return
    }

    console.log('✅ getUser réussi')
    console.log(`👤 User: ${userData.user?.email}`)

    console.log('\n🔐 ÉTAPE 4: Test d\'accès au profil')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user?.id)
      .single()

    if (profileError) {
      console.error('❌ Erreur récupération profil:', profileError)
    } else {
      console.log('✅ Profil récupéré')
      console.log(`👤 Nom: ${profile.full_name}`)
      console.log(`🎭 Rôle: ${profile.role}`)
    }

    console.log('\n🔐 ÉTAPE 5: Test de déconnexion')
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.error('❌ Erreur signOut:', signOutError)
    } else {
      console.log('✅ Déconnexion réussie')
    }

    console.log('\n💡 DIAGNOSTIC:')
    console.log('• La connexion fonctionne correctement')
    console.log('• Le problème est probablement côté frontend')
    console.log('• Vérifiez les redirections et la gestion d\'état')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

debugLoginIssue().catch(console.error)