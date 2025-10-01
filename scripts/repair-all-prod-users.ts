#!/usr/bin/env tsx
/**
 * REPAIR ALL PROD USERS
 * =====================
 * Réparer tous les utilisateurs de la PROD
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function repairAllProdUsers() {
  console.log('🔧 REPAIR ALL PROD USERS')
  console.log('='.repeat(60))

  try {
    // Configuration PROD
    config({ path: resolve(process.cwd(), '.env.local'), override: true })
    
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base PROD: ${prodUrl}`)
    console.log('🎯 RÉPARATION DE TOUS LES UTILISATEURS...')

    const adminClient = createClient(prodUrl, prodServiceKey)
    const userClient = createClient(prodUrl, prodAnonKey)

    // Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
    
    if (usersError) {
      console.log(`❌ Erreur listUsers: ${usersError.message}`)
      return
    }

    console.log(`📊 ${users.users.length} utilisateurs à réparer`)

    const repairedUsers: Array<{email: string, password: string, success: boolean}> = []
    const failedUsers: Array<{email: string, error: string}> = []

    // Réparer chaque utilisateur
    for (let i = 0; i < users.users.length; i++) {
      const user = users.users[i]
      console.log(`\n🔧 [${i + 1}/${users.users.length}] Réparation: ${user.email}`)
      
      try {
        // Générer un nouveau mot de passe temporaire
        const tempPassword = `Temp${Date.now().toString().slice(-6)}!`
        
        console.log('   🔄 Reset utilisateur...')
        
        // Reset complet de l'utilisateur
        const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
          email_confirm: true,
          phone_confirm: true,
          user_metadata: {
            ...user.user_metadata,
            repaired: true,
            repair_date: new Date().toISOString(),
            original_email: user.email
          }
        })

        if (updateError) {
          console.log(`   ❌ Erreur update: ${updateError.message}`)
          failedUsers.push({email: user.email!, error: updateError.message})
          continue
        }

        console.log('   ✅ Reset réussi')
        
        // Reset du mot de passe
        console.log('   🔑 Reset mot de passe...')
        
        const { error: passwordError } = await adminClient.auth.admin.updateUserById(user.id, {
          password: tempPassword
        })

        if (passwordError) {
          console.log(`   ❌ Erreur password: ${passwordError.message}`)
          failedUsers.push({email: user.email!, error: passwordError.message})
          continue
        }

        console.log('   ✅ Mot de passe reseté')
        
        // Attendre un peu pour la synchronisation
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Test de connexion
        console.log('   🔐 Test connexion...')
        
        const { data: testLogin, error: testError } = await userClient.auth.signInWithPassword({
          email: user.email!,
          password: tempPassword
        })

        if (testError) {
          console.log(`   ❌ Test échoué: ${testError.message}`)
          
          if (testError.code === 'unexpected_failure') {
            console.log('   ⚠️ Même erreur - utilisateur non réparable')
            failedUsers.push({email: user.email!, error: 'Database error granting user (non réparable)'})
          } else {
            console.log('   💡 Erreur différente - peut être réparable manuellement')
            failedUsers.push({email: user.email!, error: testError.message})
          }
        } else {
          console.log('   ✅ TEST RÉUSSI!')
          await userClient.auth.signOut()
          
          repairedUsers.push({
            email: user.email!,
            password: tempPassword,
            success: true
          })
          
          console.log(`   🎉 ${user.email} RÉPARÉ!`)
        }

      } catch (error) {
        console.log(`   ❌ Exception: ${error}`)
        failedUsers.push({email: user.email!, error: `Exception: ${error}`})
      }
    }

    // Résumé final
    console.log('\n🎯 RÉSUMÉ DE LA RÉPARATION')
    console.log('='.repeat(60))
    
    console.log(`✅ UTILISATEURS RÉPARÉS (${repairedUsers.length}):`)
    repairedUsers.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email}`)
      console.log(`      Mot de passe: ${user.password}`)
      console.log('')
    })

    if (failedUsers.length > 0) {
      console.log(`❌ UTILISATEURS NON RÉPARÉS (${failedUsers.length}):`)
      failedUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email}`)
        console.log(`      Erreur: ${user.error}`)
        console.log('')
      })
    }

    console.log('📋 INSTRUCTIONS POUR VOS UTILISATEURS:')
    console.log('='.repeat(40))
    console.log('Communiquez ces nouveaux identifiants à vos utilisateurs:')
    console.log('')
    
    repairedUsers.forEach((user, i) => {
      console.log(`👤 Utilisateur ${i + 1}:`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Mot de passe temporaire: ${user.password}`)
      console.log(`   ⚠️ Demandez-leur de changer le mot de passe après connexion`)
      console.log('')
    })

    if (repairedUsers.length > 0) {
      console.log('🎉 SUCCÈS! Vos utilisateurs peuvent reprendre le travail!')
      console.log('📧 Envoyez-leur leurs nouveaux identifiants')
      console.log('🔒 Demandez-leur de changer leur mot de passe après connexion')
    }

    if (failedUsers.length > 0) {
      console.log('⚠️ Pour les utilisateurs non réparés:')
      console.log('1. Utilisez "Mot de passe oublié" sur la page de connexion')
      console.log('2. Ou créez de nouveaux comptes temporaires')
      console.log('3. Contactez le support Supabase pour les cas persistants')
    }

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

repairAllProdUsers().catch(console.error)