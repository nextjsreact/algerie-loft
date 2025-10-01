#!/usr/bin/env tsx
/**
 * RESET DEV USER PASSWORD
 * =======================
 * Reset the password for the dev user to ensure it works
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function resetDevUserPassword() {
  console.log('🔧 RESET DEV USER PASSWORD')
  console.log('='.repeat(50))

  try {
    // Configuration DEV
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const devAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base DEV: ${devUrl}`)

    // Client avec service role pour admin
    const adminClient = createClient(devUrl, devServiceKey)
    
    // Client avec anon key pour test
    const userClient = createClient(devUrl, devAnonKey)

    const testEmail = 'admin@dev.local'
    const newPassword = 'dev123'

    console.log('\n🔧 ÉTAPE 1: Reset du mot de passe via admin')
    
    // Trouver l'utilisateur
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers()
    if (listError) {
      console.error('❌ Erreur listUsers:', listError)
      return
    }

    const user = users.users.find(u => u.email === testEmail)
    if (!user) {
      console.error('❌ Utilisateur non trouvé')
      return
    }

    console.log(`👤 Utilisateur trouvé: ${user.email} (${user.id})`)

    // Reset du mot de passe
    const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('❌ Erreur reset password:', updateError)
      return
    }

    console.log('✅ Mot de passe reseté avec succès')

    console.log('\n🔐 ÉTAPE 2: Test de connexion avec nouveau mot de passe')
    
    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email: testEmail,
      password: newPassword
    })

    if (signInError) {
      console.error('❌ Erreur connexion après reset:', signInError)
      
      // Essayer de recréer l'utilisateur complètement
      console.log('\n🆕 ÉTAPE 3: Recréation complète de l\'utilisateur')
      
      // Supprimer l'ancien utilisateur
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
      if (deleteError) {
        console.warn('⚠️ Erreur suppression utilisateur:', deleteError)
      }

      // Créer un nouvel utilisateur
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: newPassword,
        email_confirm: true
      })

      if (createError) {
        console.error('❌ Erreur création utilisateur:', createError)
        return
      }

      console.log('✅ Nouvel utilisateur créé')

      // Créer le profil
      const { error: profileError } = await adminClient
        .from('profiles')
        .upsert([{
          id: newUser.user.id,
          email: testEmail,
          full_name: 'Admin DEV',
          role: 'admin'
        }])

      if (profileError) {
        console.warn('⚠️ Erreur création profil:', profileError)
      } else {
        console.log('✅ Profil créé')
      }

      // Test final
      console.log('\n🔐 ÉTAPE 4: Test final de connexion')
      const { data: finalTest, error: finalError } = await userClient.auth.signInWithPassword({
        email: testEmail,
        password: newPassword
      })

      if (finalError) {
        console.error('❌ Erreur test final:', finalError)
      } else {
        console.log('✅ Test final réussi!')
        console.log(`👤 User: ${finalTest.user.email}`)
        await userClient.auth.signOut()
      }

    } else {
      console.log('✅ Connexion réussie après reset!')
      console.log(`👤 User: ${signInData.user.email}`)
      await userClient.auth.signOut()
    }

    console.log('\n💡 RÉSUMÉ:')
    console.log(`• Email: ${testEmail}`)
    console.log(`• Mot de passe: ${newPassword}`)
    console.log('• Utilisateur prêt pour les tests')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

resetDevUserPassword().catch(console.error)