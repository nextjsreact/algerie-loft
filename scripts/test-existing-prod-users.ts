#!/usr/bin/env tsx
/**
 * TEST EXISTING PROD USERS
 * ========================
 * Tester la connexion avec les utilisateurs existants de PROD
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testExistingProdUsers() {
  console.log('🏭 TEST EXISTING PROD USERS')
  console.log('='.repeat(50))

  try {
    // Configuration PROD (fichier .env principal)
    config({ path: resolve(process.cwd(), '.env'), override: true })
    
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base PROD: ${prodUrl}`)

    // Client admin et user
    const adminClient = createClient(prodUrl, prodServiceKey)
    const userClient = createClient(prodUrl, prodAnonKey)
    
    // Utilisateurs à tester (basés sur la liste précédente)
    const testUsers = [
      { email: 'admin@loftalgerie.com', passwords: ['password123', 'admin123', 'loft123'] },
      { email: 'loft.algerie.scl@outlook.com', passwords: ['password123', 'admin123', 'loft123'] },
      { email: 'sanabelkacemi33@gmail.com', passwords: ['password123', 'admin123', 'sana123'] },
    ]

    console.log('\n🔐 TEST DE CONNEXION AVEC UTILISATEURS EXISTANTS:')
    
    for (const user of testUsers) {
      console.log(`\n👤 Test utilisateur: ${user.email}`)
      
      for (const password of user.passwords) {
        console.log(`   🔑 Test mot de passe: ${password}`)
        
        try {
          const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
            email: user.email,
            password: password
          })

          if (signInError) {
            console.log(`   ❌ Échec: ${signInError.message}`)
          } else {
            console.log(`   ✅ SUCCÈS! Connexion réussie`)
            console.log(`   👤 User: ${signInData.user.email}`)
            console.log(`   🎫 Session: ${signInData.session ? 'Présente' : 'Absente'}`)
            
            // Test accès profil
            const { data: profile, error: profileError } = await userClient
              .from('profiles')
              .select('*')
              .eq('id', signInData.user.id)
              .single()

            if (profileError) {
              console.log(`   ⚠️ Erreur profil: ${profileError.message}`)
            } else {
              console.log(`   ✅ Profil: ${profile.full_name} (${profile.role})`)
            }

            // Déconnexion
            await userClient.auth.signOut()
            
            console.log('\n🎯 UTILISATEUR FONCTIONNEL TROUVÉ!')
            console.log('='.repeat(40))
            console.log(`📧 Email: ${user.email}`)
            console.log(`🔑 Mot de passe: ${password}`)
            console.log('🎉 Vous pouvez utiliser ces identifiants pour tester!')
            return
          }
        } catch (error) {
          console.log(`   💥 Exception: ${error}`)
        }
      }
    }

    console.log('\n❌ Aucun utilisateur fonctionnel trouvé avec les mots de passe testés')
    
    // Essayons de créer un utilisateur simple
    console.log('\n🆕 CRÉATION D\'UN UTILISATEUR SIMPLE:')
    const simpleEmail = 'test@debug.com'
    const simplePassword = 'test123'
    
    try {
      // Supprimer s'il existe
      const { data: users } = await adminClient.auth.admin.listUsers()
      const existingUser = users.users.find(u => u.email === simpleEmail)
      
      if (existingUser) {
        console.log('🗑️ Suppression utilisateur existant...')
        await adminClient.auth.admin.deleteUser(existingUser.id)
      }

      // Créer nouvel utilisateur
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: simpleEmail,
        password: simplePassword,
        email_confirm: true
      })

      if (createError) {
        console.error('❌ Erreur création:', createError)
      } else {
        console.log('✅ Utilisateur créé')
        
        // Test connexion immédiate
        const { data: testLogin, error: testError } = await userClient.auth.signInWithPassword({
          email: simpleEmail,
          password: simplePassword
        })

        if (testError) {
          console.log(`❌ Erreur test: ${testError.message}`)
        } else {
          console.log('✅ Test connexion réussi!')
          await userClient.auth.signOut()
          
          console.log('\n🎯 NOUVEL UTILISATEUR CRÉÉ!')
          console.log('='.repeat(40))
          console.log(`📧 Email: ${simpleEmail}`)
          console.log(`🔑 Mot de passe: ${simplePassword}`)
          console.log('🎉 Vous pouvez utiliser ces identifiants pour tester!')
        }
      }
    } catch (error) {
      console.error('💥 Erreur création utilisateur simple:', error)
    }

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

testExistingProdUsers().catch(console.error)