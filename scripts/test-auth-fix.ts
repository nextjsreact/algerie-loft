#!/usr/bin/env tsx
/**
 * TEST DE L'AUTHENTIFICATION CORRIGÉE
 * ===================================
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testAuthFix() {
  console.log('🔐 TEST DE L\'AUTHENTIFICATION CORRIGÉE')
  console.log('='.repeat(50))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base DEV: ${devUrl}`)
    console.log(`🔑 Utilisation de l'anon key pour l'auth`)

    // Créer le client avec l'anon key (comme dans l'app)
    const supabase = createClient(devUrl, devAnonKey)

    // Test avec l'utilisateur DEV existant
    const testEmail = 'admin@dev.local'
    const testPassword = 'dev123'

    console.log('\n🔐 Test de connexion...')
    console.log(`📧 Email: ${testEmail}`)
    console.log(`🔑 Mot de passe: ${testPassword}`)

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.error('❌ Erreur connexion:', signInError.message)
      console.error('Code:', signInError.status)
      
      // Vérifier si l'utilisateur existe
      console.log('\n🔍 Vérification de l\'utilisateur...')
      const serviceClient = createClient(devUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data: users } = await serviceClient.auth.admin.listUsers()
      
      const userExists = users.users.find(u => u.email === testEmail)
      if (userExists) {
        console.log('✅ Utilisateur existe dans auth.users')
        console.log(`   Confirmé: ${userExists.email_confirmed_at ? 'Oui' : 'Non'}`)
        console.log(`   Statut: ${userExists.banned_until ? 'Banni' : 'Actif'}`)
      } else {
        console.log('❌ Utilisateur n\'existe pas dans auth.users')
      }
      
    } else {
      console.log('✅ Connexion réussie!')
      console.log(`👤 Utilisateur: ${signInData.user.email}`)
      console.log(`🆔 ID: ${signInData.user.id}`)
      console.log(`🎫 Token: ${signInData.session?.access_token ? 'Présent' : 'Absent'}`)
      
      // Se déconnecter
      await supabase.auth.signOut()
      console.log('🚪 Déconnexion effectuée')
    }

    // Vérifier la configuration Supabase
    console.log('\n⚙️ VÉRIFICATION DE LA CONFIGURATION:')
    console.log(`📋 URL: ${devUrl}`)
    console.log(`🔑 Anon Key: ${devAnonKey.substring(0, 20)}...`)
    console.log(`🔐 Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...`)

  } catch (error) {
    console.error('💥 ERREUR:', error)
  }
}

testAuthFix().catch(console.error)