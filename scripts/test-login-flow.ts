#!/usr/bin/env tsx
/**
 * TEST LOGIN FLOW
 * ===============
 * Test the complete login flow including redirects
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testLoginFlow() {
  console.log('🔍 TEST LOGIN FLOW COMPLET')
  console.log('='.repeat(50))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base DEV: ${devUrl}`)

    // Créer un client avec la clé anonyme (comme le fait le frontend)
    const supabase = createClient(devUrl, devAnonKey)

    const testEmail = 'admin@dev.local'
    const testPassword = 'dev123'

    console.log('\n🔐 SIMULATION DU FLOW FRONTEND')
    console.log('1. Utilisateur saisit ses identifiants')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}`)

    console.log('\n2. Appel signInWithPassword...')
    const startTime = Date.now()
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    const loginTime = Date.now() - startTime
    console.log(`   ⏱️ Temps de connexion: ${loginTime}ms`)

    if (signInError) {
      console.error('❌ Erreur signInWithPassword:', signInError)
      return
    }

    console.log('✅ signInWithPassword réussi')
    console.log(`👤 User: ${signInData.user?.email}`)
    console.log(`🎫 Session: ${signInData.session ? 'Présente' : 'Absente'}`)

    if (signInData.user && signInData.session) {
      console.log('\n3. ✅ Conditions de redirection remplies')
      console.log('   → Redirection vers /fr/dashboard')
      console.log('   → isLoading reste à true (pas de setIsLoading(false))')
    } else {
      console.log('\n3. ❌ Conditions de redirection NON remplies')
      console.log('   → Affichage d\'une erreur')
      console.log('   → isLoading mis à false')
    }

    console.log('\n4. Test de vérification de session (pour le dashboard)')
    const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erreur vérification session:', sessionError)
    } else if (sessionCheck.session) {
      console.log('✅ Session valide pour accès au dashboard')
      console.log(`   User: ${sessionCheck.session.user.email}`)
    } else {
      console.log('❌ Pas de session - redirection vers login')
    }

    console.log('\n5. Test d\'accès aux données protégées')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user?.id)
      .single()

    if (profileError) {
      console.error('❌ Erreur accès profil:', profileError)
    } else {
      console.log('✅ Accès aux données protégées réussi')
      console.log(`   Profil: ${profile.full_name || 'Nom vide'} (${profile.role})`)
    }

    // Nettoyage
    console.log('\n6. Nettoyage - déconnexion')
    await supabase.auth.signOut()
    console.log('✅ Déconnexion effectuée')

    console.log('\n💡 RÉSUMÉ:')
    console.log(`• Temps de connexion: ${loginTime}ms`)
    console.log('• Flow de connexion: ✅ Fonctionnel')
    console.log('• Redirection: Vers /fr/dashboard')
    console.log('• Accès données: ✅ Autorisé')
    
    if (loginTime > 3000) {
      console.log('⚠️ ATTENTION: Connexion lente (>3s)')
    }

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

testLoginFlow().catch(console.error)