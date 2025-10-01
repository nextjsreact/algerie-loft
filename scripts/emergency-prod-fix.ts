#!/usr/bin/env tsx
/**
 * EMERGENCY PROD FIX
 * ==================
 * Correction d'urgence du problème "Database error granting user" en PROD
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function emergencyProdFix() {
  console.log('🚨 EMERGENCY PROD FIX')
  console.log('='.repeat(60))

  try {
    // Configuration PROD
    config({ path: resolve(process.cwd(), '.env.local'), override: true })
    
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base PROD: ${prodUrl}`)
    console.log('🎯 CORRECTION D\'URGENCE EN COURS...')

    const adminClient = createClient(prodUrl, prodServiceKey)
    const userClient = createClient(prodUrl, prodAnonKey)

    // Étape 1: Diagnostic approfondi
    console.log('\n🔍 ÉTAPE 1: DIAGNOSTIC APPROFONDI')
    
    // Vérifier les utilisateurs existants
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
    
    if (usersError) {
      console.log(`❌ Erreur listUsers: ${usersError.message}`)
      return
    }

    console.log(`📊 ${users.users.length} utilisateurs trouvés`)
    
    // Identifier les utilisateurs récemment connectés (probablement fonctionnels avant)
    const recentUsers = users.users
      .filter(u => u.last_sign_in_at)
      .sort((a, b) => new Date(b.last_sign_in_at!).getTime() - new Date(a.last_sign_in_at!).getTime())
      .slice(0, 3)

    console.log('\n👥 UTILISATEURS RÉCEMMENT ACTIFS:')
    recentUsers.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email}`)
      console.log(`      Dernière connexion: ${user.last_sign_in_at}`)
      console.log(`      ID: ${user.id}`)
    })

    // Étape 2: Tentative de réparation des utilisateurs existants
    console.log('\n🔧 ÉTAPE 2: RÉPARATION UTILISATEURS EXISTANTS')
    
    for (const user of recentUsers) {
      console.log(`\n🔧 Réparation: ${user.email}`)
      
      try {
        // Méthode 1: Reset complet de l'utilisateur
        console.log('   🔄 Reset utilisateur...')
        
        const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
          email_confirm: true,
          phone_confirm: true,
          user_metadata: {
            ...user.user_metadata,
            repaired: true,
            repair_date: new Date().toISOString()
          }
        })

        if (updateError) {
          console.log(`   ❌ Erreur update: ${updateError.message}`)
        } else {
          console.log('   ✅ Reset réussi')
        }

        // Méthode 2: Reset du mot de passe
        console.log('   🔑 Reset mot de passe...')
        
        const newPassword = 'TempPassword123!'
        const { error: passwordError } = await adminClient.auth.admin.updateUserById(user.id, {
          password: newPassword
        })

        if (passwordError) {
          console.log(`   ❌ Erreur password: ${passwordError.message}`)
        } else {
          console.log('   ✅ Mot de passe reseté')
          
          // Test de connexion immédiat
          console.log('   🔐 Test connexion...')
          
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const { data: testLogin, error: testError } = await userClient.auth.signInWithPassword({
            email: user.email!,
            password: newPassword
          })

          if (testError) {
            console.log(`   ❌ Test échoué: ${testError.message}`)
            
            if (testError.code !== 'unexpected_failure') {
              console.log('   💡 Erreur différente - progrès possible!')
            }
          } else {
            console.log('   ✅ TEST RÉUSSI!')
            await userClient.auth.signOut()
            
            console.log('\n🎉 UTILISATEUR RÉPARÉ!')
            console.log('='.repeat(40))
            console.log(`📧 Email: ${user.email}`)
            console.log(`🔑 Nouveau mot de passe: ${newPassword}`)
            console.log('🎯 Utilisez ces identifiants pour vous connecter!')
            return
          }
        }

      } catch (error) {
        console.log(`   ❌ Exception: ${error}`)
      }
    }

    // Étape 3: Création d'un utilisateur d'urgence avec méthode alternative
    console.log('\n🆕 ÉTAPE 3: UTILISATEUR D\'URGENCE')
    
    const emergencyEmail = `emergency.${Date.now()}@prod.local`
    const emergencyPassword = 'Emergency123!'
    
    console.log(`📧 Création: ${emergencyEmail}`)
    
    try {
      // Méthode alternative: Création avec paramètres minimaux
      const { data: emergencyUser, error: emergencyError } = await adminClient.auth.admin.createUser({
        email: emergencyEmail,
        password: emergencyPassword,
        email_confirm: true,
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { 
          emergency_user: true,
          created_for: 'production_fix',
          role: 'admin'
        }
      })

      if (emergencyError) {
        console.log(`❌ Erreur création urgence: ${emergencyError.message}`)
      } else {
        console.log('✅ Utilisateur d\'urgence créé')
        
        // Attendre et tester
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const { data: emergencyTest, error: emergencyTestError } = await userClient.auth.signInWithPassword({
          email: emergencyEmail,
          password: emergencyPassword
        })

        if (emergencyTestError) {
          console.log(`❌ Test urgence échoué: ${emergencyTestError.message}`)
        } else {
          console.log('✅ Test urgence réussi!')
          await userClient.auth.signOut()
          
          console.log('\n🎉 UTILISATEUR D\'URGENCE FONCTIONNEL!')
          console.log('='.repeat(40))
          console.log(`📧 Email: ${emergencyEmail}`)
          console.log(`🔑 Mot de passe: ${emergencyPassword}`)
          console.log('🎯 Utilisez ces identifiants immédiatement!')
          return
        }
      }
    } catch (error) {
      console.log(`❌ Exception urgence: ${error}`)
    }

    // Étape 4: Solutions d'urgence avancées
    console.log('\n🔧 ÉTAPE 4: SOLUTIONS AVANCÉES')
    
    console.log('Le problème persiste. Actions d\'urgence recommandées:')
    console.log('')
    console.log('1. 🚨 DASHBOARD SUPABASE:')
    console.log('   - Allez sur https://supabase.com/dashboard')
    console.log('   - Vérifiez les alertes et quotas')
    console.log('   - Redémarrez le projet si possible')
    console.log('')
    console.log('2. 🔧 SUPPORT SUPABASE:')
    console.log('   - Contactez le support immédiatement')
    console.log('   - Mentionnez "Database error granting user"')
    console.log('   - Indiquez que c\'est une urgence production')
    console.log('')
    console.log('3. 📞 ESCALADE:')
    console.log('   - Si vous avez un plan payant, utilisez le support prioritaire')
    console.log('   - Mentionnez l\'impact sur les utilisateurs')
    console.log('')
    console.log('4. 🔄 WORKAROUND TEMPORAIRE:')
    console.log('   - Utilisez la fonction "Mot de passe oublié"')
    console.log('   - Avec les emails des utilisateurs récents')

    console.log('\n📧 EMAILS POUR "MOT DE PASSE OUBLIÉ":')
    recentUsers.forEach(user => {
      console.log(`   - ${user.email}`)
    })

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

emergencyProdFix().catch(console.error)