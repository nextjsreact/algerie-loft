#!/usr/bin/env tsx
/**
 * TEST FINAL FIX
 * ==============
 * Test final après correction de l'environnement
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testFinalFix() {
  console.log('🎯 TEST FINAL FIX')
  console.log('='.repeat(50))

  try {
    // Charger le fichier .env (maintenant copié depuis .env.development)
    config({ path: resolve(process.cwd(), '.env'), override: true })
    
    // Utiliser les variables d'environnement comme Next.js
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('📋 CONFIGURATION ACTUELLE:')
    console.log(`   URL: ${supabaseUrl}`)
    console.log(`   Key: ${supabaseKey.substring(0, 20)}...`)

    // Créer le client comme dans le frontend
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('\n🔐 TEST CONNEXION (comme dans l\'interface):')
    const testEmail = 'admin@dev.local'
    const testPassword = 'dev123'
    
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}`)

    const startTime = Date.now()
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    const loginTime = Date.now() - startTime

    if (signInError) {
      console.log(`❌ ÉCHEC: ${signInError.message}`)
      console.log(`   Code: ${signInError.code}`)
      console.log(`   Status: ${signInError.status}`)
      return
    }

    console.log(`✅ SUCCÈS en ${loginTime}ms`)
    console.log(`👤 User: ${signInData.user?.email}`)
    console.log(`🎫 Session: ${signInData.session ? 'Présente' : 'Absente'}`)

    if (signInData.user && signInData.session) {
      console.log('\n✅ CONDITIONS DE REDIRECTION REMPLIES')
      console.log('   → L\'interface devrait maintenant fonctionner!')
      
      // Test accès profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single()

      if (profileError) {
        console.log(`   ⚠️ Erreur profil: ${profileError.message}`)
      } else {
        console.log(`   ✅ Profil: ${profile.full_name} (${profile.role})`)
      }
    }

    // Déconnexion
    await supabase.auth.signOut()

    console.log('\n🎉 RÉSULTAT FINAL:')
    console.log('='.repeat(30))
    console.log('✅ Configuration corrigée')
    console.log('✅ Connexion fonctionnelle')
    console.log('✅ L\'interface devrait maintenant marcher!')
    console.log('')
    console.log('🔄 Redémarrez le serveur Next.js si nécessaire')
    console.log('🌐 Testez sur: http://localhost:3000/fr/login')

  } catch (error) {
    console.error('💥 ERREUR:', error)
  }
}

testFinalFix().catch(console.error)