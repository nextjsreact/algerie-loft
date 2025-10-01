#!/usr/bin/env tsx
/**
 * TEST NEW CREDENTIALS
 * ====================
 * Test final avec les nouveaux identifiants
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testNewCredentials() {
  console.log('🎯 TEST NEW CREDENTIALS')
  console.log('='.repeat(50))

  try {
    // Configuration comme Next.js
    config({ path: resolve(process.cwd(), '.env'), override: true })
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('📋 CONFIGURATION:')
    console.log(`   URL: ${supabaseUrl}`)
    console.log(`   Key: ${supabaseKey.substring(0, 20)}...`)

    // Créer le client comme dans l'interface
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('\n🔐 TEST AVEC NOUVEAUX IDENTIFIANTS:')
    const newCredentials = {
      email: 'devuser@test.local',
      password: 'dev123'
    }

    console.log(`   📧 Email: ${newCredentials.email}`)
    console.log(`   🔑 Password: ${newCredentials.password}`)

    // Simulation exacte du code de l'interface
    console.log('\n⏳ Simulation signInWithPassword (comme l\'interface)...')
    const startTime = Date.now()

    try {
      // Timeout comme dans le code
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de connexion (10s)')), 10000)
      )
      
      const loginPromise = supabase.auth.signInWithPassword({
        email: newCredentials.email,
        password: newCredentials.password,
      })

      const result = await Promise.race([loginPromise, timeoutPromise]) as any
      const { data: signInData, error: signInError } = result

      const loginTime = Date.now() - startTime
      console.log(`   ⏱️ Temps de réponse: ${loginTime}ms`)

      if (signInError) {
        console.log('❌ ÉCHEC:')
        console.log(`   Message: ${signInError.message}`)
        console.log(`   Code: ${signInError.code}`)
        console.log(`   Status: ${signInError.status}`)
        return
      }

      console.log('✅ SUCCÈS - Pas d\'erreur!')

      if (signInData.user && signInData.session) {
        console.log('✅ CONDITIONS DE REDIRECTION REMPLIES')
        console.log(`   User: ${signInData.user.email}`)
        console.log(`   Session: Présente`)
        
        // Test accès profil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single()

        if (profileError) {
          console.log(`   ⚠️ Pas de profil: ${profileError.message}`)
          console.log('   (Ce n\'est pas grave pour la connexion)')
        } else {
          console.log('   ✅ Profil accessible')
          console.log(`   Nom: ${profile.full_name || 'Non défini'}`)
          console.log(`   Rôle: ${profile.role || 'Non défini'}`)
        }
        
        console.log('\n🎯 RÉSULTAT: L\'INTERFACE DEVRAIT FONCTIONNER!')
        console.log('   → Redirection vers /fr/dashboard')
        console.log('   → Plus de blocage sur "Connexion en cours..."')
        
      } else {
        console.log('❌ CONDITIONS NON REMPLIES')
        console.log(`   User: ${signInData.user ? 'Présent' : 'Absent'}`)
        console.log(`   Session: ${signInData.session ? 'Présente' : 'Absente'}`)
      }

    } catch (err: any) {
      const loginTime = Date.now() - startTime
      console.log(`❌ EXCEPTION après ${loginTime}ms: ${err.message}`)
    }

    // Nettoyage
    await supabase.auth.signOut()

    console.log('\n🎉 INSTRUCTIONS FINALES:')
    console.log('='.repeat(40))
    console.log('1. Redémarrez le serveur Next.js')
    console.log('2. Allez sur: http://localhost:3000/fr/login')
    console.log('3. Utilisez les identifiants:')
    console.log(`   📧 ${newCredentials.email}`)
    console.log(`   🔑 ${newCredentials.password}`)
    console.log('4. La connexion devrait maintenant fonctionner!')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

testNewCredentials().catch(console.error)