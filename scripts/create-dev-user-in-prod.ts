#!/usr/bin/env tsx
/**
 * CREATE DEV USER IN PROD
 * =======================
 * Créer l'utilisateur admin@dev.local dans la base PROD
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function createDevUserInProd() {
  console.log('🏭 CREATE DEV USER IN PROD')
  console.log('='.repeat(50))

  try {
    // Configuration PROD (fichier .env principal)
    config({ path: resolve(process.cwd(), '.env'), override: true })
    
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base PROD: ${prodUrl}`)

    // Client admin
    const adminClient = createClient(prodUrl, prodServiceKey)
    const userClient = createClient(prodUrl, prodAnonKey)
    
    const testEmail = 'admin@dev.local'
    const testPassword = 'dev123'

    console.log('\n🔍 VÉRIFICATION UTILISATEUR EXISTANT:')
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Erreur listUsers:', usersError)
      return
    }

    const existingUser = users.users.find(u => u.email === testEmail)
    
    if (existingUser) {
      console.log('✅ Utilisateur existe déjà')
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Confirmé: ${existingUser.email_confirmed_at ? 'Oui' : 'Non'}`)
      
      // Reset du mot de passe
      console.log('\n🔧 RESET DU MOT DE PASSE:')
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        existingUser.id,
        { password: testPassword }
      )

      if (updateError) {
        console.error('❌ Erreur reset password:', updateError)
        return
      }
      
      console.log('✅ Mot de passe reseté')
      
    } else {
      console.log('❌ Utilisateur n\'existe pas')
      
      // Créer l'utilisateur
      console.log('\n🆕 CRÉATION UTILISATEUR:')
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      })

      if (createError) {
        console.error('❌ Erreur création:', createError)
        return
      }

      console.log('✅ Utilisateur créé avec succès')
      console.log(`   ID: ${newUser.user.id}`)
      
      // Créer le profil
      console.log('\n👤 CRÉATION PROFIL:')
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert([{
          id: newUser.user.id,
          email: testEmail,
          full_name: 'Admin DEV',
          role: 'admin'
        }])

      if (profileError) {
        console.warn('⚠️ Erreur profil:', profileError)
        
        // Essayer de mettre à jour s'il existe
        const { error: updateProfileError } = await adminClient
          .from('profiles')
          .update({
            full_name: 'Admin DEV',
            role: 'admin'
          })
          .eq('id', newUser.user.id)

        if (updateProfileError) {
          console.error('❌ Erreur mise à jour profil:', updateProfileError)
        } else {
          console.log('✅ Profil mis à jour')
        }
      } else {
        console.log('✅ Profil créé')
      }
    }

    // Test de connexion
    console.log('\n🔐 TEST DE CONNEXION FINAL:')
    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.error('❌ Erreur connexion:', signInError)
      return
    }

    console.log('✅ Connexion réussie!')
    console.log(`👤 User: ${signInData.user.email}`)
    console.log(`🎫 Session: ${signInData.session ? 'Présente' : 'Absente'}`)

    // Test accès profil
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single()

    if (profileError) {
      console.warn('⚠️ Erreur accès profil:', profileError)
    } else {
      console.log('✅ Profil accessible')
      console.log(`   Nom: ${profile.full_name}`)
      console.log(`   Rôle: ${profile.role}`)
    }

    // Déconnexion
    await userClient.auth.signOut()

    console.log('\n🎉 SUCCÈS!')
    console.log('='.repeat(30))
    console.log(`✅ Utilisateur ${testEmail} prêt dans PROD`)
    console.log(`🔑 Mot de passe: ${testPassword}`)
    console.log('🎯 Vous pouvez maintenant tester la connexion dans l\'interface')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

createDevUserInProd().catch(console.error)