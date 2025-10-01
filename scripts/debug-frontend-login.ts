#!/usr/bin/env tsx
/**
 * DEBUG FRONTEND LOGIN
 * ====================
 * Simuler exactement ce qui se passe dans le frontend
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function debugFrontendLogin() {
  console.log('🖥️ DEBUG FRONTEND LOGIN')
  console.log('='.repeat(60))

  try {
    // Configuration DEV (comme dans le frontend)
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('📋 SIMULATION FRONTEND:')
    console.log(`   URL: ${devUrl}`)
    console.log(`   Anon Key: ${devAnonKey.substring(0, 20)}...`)

    // Créer le client exactement comme dans le frontend
    const supabase = createClient(devUrl, devAnonKey)

    console.log('\n🔐 SIMULATION FORM SUBMIT')
    console.log('   Email saisi: admin@dev.local')
    console.log('   Password saisi: dev123')

    // Simuler exactement le code du formulaire
    const formData = {
      email: 'admin@dev.local',
      password: 'dev123'
    }

    console.log('\n⏱️ ÉTAPE 1: setIsLoading(true)')
    console.log('⏱️ ÉTAPE 2: setError("")')
    
    console.log('\n🔐 ÉTAPE 3: Appel signInWithPassword...')
    const startTime = Date.now()

    try {
      // Timeout comme dans le code
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de connexion (10s)')), 10000)
      )
      
      const loginPromise = supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      console.log('   ⏳ Attente de la réponse...')
      
      const result = await Promise.race([loginPromise, timeoutPromise]) as any
      const { data: signInData, error: signInError } = result

      const loginTime = Date.now() - startTime
      console.log(`   ⏱️ Temps de réponse: ${loginTime}ms`)

      if (signInError) {
        console.log('❌ ÉTAPE 4: Erreur détectée')
        console.log(`   Error: ${signInError.message}`)
        console.log(`   Code: ${signInError.code || 'N/A'}`)
        console.log(`   Status: ${signInError.status || 'N/A'}`)
        console.log('   → setError(signInError.message)')
        console.log('   → setIsLoading(false)')
        console.log('   → return (arrêt du processus)')
        return
      }

      console.log('✅ ÉTAPE 4: Pas d\'erreur signInWithPassword')

      if (signInData.user && signInData.session) {
        console.log('✅ ÉTAPE 5: Conditions de redirection remplies')
        console.log(`   User: ${signInData.user.email}`)
        console.log(`   Session: Présente`)
        console.log(`   Session ID: ${signInData.session.access_token.substring(0, 20)}...`)
        
        // Simuler la redirection
        const locale = 'fr' // Valeur par défaut
        const redirectUrl = `/${locale}/dashboard`
        console.log(`   → router.push("${redirectUrl}")`)
        console.log('   → Pas de setIsLoading(false) car redirection')
        
        console.log('\n🎯 RÉSULTAT: SUCCÈS - Redirection vers dashboard')
        
      } else {
        console.log('❌ ÉTAPE 5: Conditions de redirection NON remplies')
        console.log(`   User: ${signInData.user ? 'Présent' : 'Absent'}`)
        console.log(`   Session: ${signInData.session ? 'Présente' : 'Absente'}`)
        console.log('   → setError("Erreur d\'authentification - session non établie")')
        console.log('   → setIsLoading(false)')
      }

    } catch (err: any) {
      const loginTime = Date.now() - startTime
      console.log(`❌ ÉTAPE 4: Exception attrapée après ${loginTime}ms`)
      console.log(`   Error: ${err.message}`)
      console.log('   → setError(err.message)')
      console.log('   → setIsLoading(false)')
    }

    // Test supplémentaire: vérifier l'état après connexion
    console.log('\n🔍 VÉRIFICATION POST-CONNEXION:')
    
    const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.log(`   ❌ Erreur getSession: ${sessionError.message}`)
    } else if (sessionCheck.session) {
      console.log('   ✅ Session active détectée')
      console.log(`   User: ${sessionCheck.session.user.email}`)
      
      // Test accès dashboard (simulation)
      console.log('\n🏠 SIMULATION ACCÈS DASHBOARD:')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionCheck.session.user.id)
        .single()

      if (profileError) {
        console.log(`   ❌ Erreur accès profil: ${profileError.message}`)
        console.log('   → Possible problème RLS ou permissions')
      } else {
        console.log('   ✅ Accès profil réussi')
        console.log(`   Nom: ${profile.full_name}`)
        console.log(`   Rôle: ${profile.role}`)
      }
    } else {
      console.log('   ❌ Aucune session active')
    }

    // Nettoyage
    await supabase.auth.signOut()

    console.log('\n💡 DIAGNOSTIC:')
    console.log('='.repeat(40))
    console.log('Si ce test montre un succès mais que l\'interface ne fonctionne pas,')
    console.log('le problème est probablement dans:')
    console.log('• La gestion d\'état React (useState)')
    console.log('• Les redirections Next.js')
    console.log('• Les cookies/sessions côté navigateur')
    console.log('• Le middleware next-intl')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

debugFrontendLogin().catch(console.error)