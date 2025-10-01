#!/usr/bin/env tsx
/**
 * TEST DEV WORKING
 * ================
 * Test que l'environnement DEV fonctionne
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testDevWorking() {
  console.log('🎯 TEST DEV WORKING')
  console.log('='.repeat(50))

  try {
    // Configuration DEV (comme Next.js maintenant)
    config({ path: resolve(process.cwd(), '.env.local'), override: true })
    
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base: ${devUrl}`)
    console.log(`🔑 Key: ${devAnonKey.substring(0, 20)}...`)

    if (devUrl.includes('wtcbyjdwjrrqyzpvjfze')) {
      console.log('✅ Environnement DEV confirmé')
    } else {
      console.log('❌ Pas en environnement DEV')
      return
    }

    // Créer le client
    const supabase = createClient(devUrl, devAnonKey)

    console.log('\n🔐 TEST CONNEXION DEV:')
    const credentials = {
      email: 'user1759066310913@dev.local',
      password: 'password123'
    }

    console.log(`   📧 Email: ${credentials.email}`)
    console.log(`   🔑 Password: ${credentials.password}`)

    const startTime = Date.now()
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    const loginTime = Date.now() - startTime
    console.log(`   ⏱️ Temps de réponse: ${loginTime}ms`)

    if (signInError) {
      console.log(`❌ Erreur: ${signInError.message}`)
      console.log(`   Code: ${signInError.code}`)
      
      // Essayer de créer un nouvel utilisateur
      console.log('\n🆕 Création nouvel utilisateur DEV...')
      
      const newEmail = `devuser${Date.now()}@dev.local`
      const newPassword = 'dev123'
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword
      })

      if (signUpError) {
        console.log(`❌ Erreur signUp: ${signUpError.message}`)
      } else {
        console.log('✅ Nouvel utilisateur créé')
        
        // Test connexion immédiate
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const { data: testLogin, error: testError } = await supabase.auth.signInWithPassword({
          email: newEmail,
          password: newPassword
        })

        if (testError) {
          console.log(`❌ Test connexion échoué: ${testError.message}`)
        } else {
          console.log('✅ Test connexion réussi!')
          await supabase.auth.signOut()
          
          console.log('\n🎯 NOUVEL UTILISATEUR DEV FONCTIONNEL!')
          console.log(`📧 Email: ${newEmail}`)
          console.log(`🔑 Mot de passe: ${newPassword}`)
          return
        }
      }
    } else {
      console.log('✅ Connexion réussie!')
      console.log(`👤 User: ${signInData.user?.email}`)
      console.log(`🎫 Session: ${signInData.session ? 'Présente' : 'Absente'}`)
      
      await supabase.auth.signOut()
      
      console.log('\n🎯 ENVIRONNEMENT DEV FONCTIONNEL!')
      console.log(`📧 Email: ${credentials.email}`)
      console.log(`🔑 Mot de passe: ${credentials.password}`)
    }

    console.log('\n🚀 INSTRUCTIONS:')
    console.log('1. Redémarrez le serveur Next.js')
    console.log('2. Allez sur: http://localhost:3000/fr/login')
    console.log('3. Utilisez les identifiants affichés ci-dessus')
    console.log('4. Vous devriez pouvoir vous connecter sans erreur!')

  } catch (error) {
    console.error('💥 ERREUR:', error)
  }
}

testDevWorking().catch(console.error)