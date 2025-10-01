#!/usr/bin/env tsx
/**
 * CHECK PROD USERS
 * ================
 * Vérifier les utilisateurs dans la base PROD (celle utilisée par Next.js)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function checkProdUsers() {
  console.log('🏭 CHECK PROD USERS')
  console.log('='.repeat(50))

  try {
    // Configuration PROD (fichier .env principal)
    config({ path: resolve(process.cwd(), '.env'), override: true })
    
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base PROD: ${prodUrl}`)
    console.log(`🔑 Service Key: ${prodServiceKey.substring(0, 20)}...`)
    console.log(`🔑 Anon Key: ${prodAnonKey.substring(0, 20)}...`)

    // Client admin
    const adminClient = createClient(prodUrl, prodServiceKey)
    
    console.log('\n👥 UTILISATEURS DANS AUTH.USERS (PROD):')
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Erreur listUsers:', usersError)
      return
    }

    console.log(`📊 ${users.users.length} utilisateurs trouvés dans PROD:`)
    users.users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email} (${user.id})`)
      console.log(`      Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`)
      console.log(`      Dernière connexion: ${user.last_sign_in_at || 'Jamais'}`)
    })

    console.log('\n👤 PROFILS DANS LA TABLE PROFILES (PROD):')
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('*')

    if (profilesError) {
      console.error('❌ Erreur profiles:', profilesError)
    } else {
      console.log(`📊 ${profiles?.length || 0} profils trouvés dans PROD:`)
      profiles?.forEach((profile, i) => {
        console.log(`   ${i + 1}. ${profile.email} - ${profile.full_name} (${profile.role})`)
      })
    }

    // Test de connexion avec les identifiants DEV
    console.log('\n🔐 TEST CONNEXION admin@dev.local DANS PROD:')
    const userClient = createClient(prodUrl, prodAnonKey)
    
    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email: 'admin@dev.local',
      password: 'dev123'
    })

    if (signInError) {
      console.log(`❌ Échec (attendu): ${signInError.message}`)
      console.log('💡 L\'utilisateur admin@dev.local n\'existe pas dans PROD')
    } else {
      console.log('✅ Succès inattendu!')
      await userClient.auth.signOut()
    }

    // Chercher des utilisateurs admin
    console.log('\n🔍 RECHERCHE D\'UTILISATEURS ADMIN:')
    const adminUsers = users.users.filter(u => 
      u.email?.includes('admin') || 
      u.user_metadata?.role === 'admin'
    )

    if (adminUsers.length > 0) {
      console.log('👑 Utilisateurs admin trouvés:')
      adminUsers.forEach(user => {
        console.log(`   📧 ${user.email}`)
        console.log(`   🎭 Rôle: ${user.user_metadata?.role || 'Non défini'}`)
      })
    } else {
      console.log('❌ Aucun utilisateur admin trouvé dans PROD')
    }

    console.log('\n💡 SOLUTION:')
    console.log('='.repeat(30))
    console.log('Le problème est que Next.js utilise .env (PROD) au lieu de .env.development')
    console.log('Solutions possibles:')
    console.log('1. Copier les variables DEV dans .env')
    console.log('2. Créer un utilisateur admin@dev.local dans PROD')
    console.log('3. Utiliser NODE_ENV=development')
    console.log('4. Renommer .env.development en .env.local')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

checkProdUsers().catch(console.error)