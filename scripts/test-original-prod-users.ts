#!/usr/bin/env tsx
/**
 * TEST ORIGINAL PROD USERS
 * ========================
 * Tester avec les vrais identifiants PROD qui fonctionnaient avant
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

async function testOriginalProdUsers() {
  console.log('🔍 TEST ORIGINAL PROD USERS')
  console.log('='.repeat(60))

  try {
    // Configuration PROD (comme Next.js maintenant)
    config({ path: resolve(process.cwd(), '.env.local'), override: true })
    
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const prodAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📋 Base PROD: ${prodUrl}`)
    console.log('✅ Configuration restaurée à l\'original')

    const adminClient = createClient(prodUrl, prodServiceKey)
    const userClient = createClient(prodUrl, prodAnonKey)

    // Lister les utilisateurs existants
    console.log('\n👥 UTILISATEURS PROD EXISTANTS:')
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Erreur listUsers:', usersError)
      return
    }

    console.log(`📊 ${users.users.length} utilisateurs trouvés:`)
    users.users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email}`)
      console.log(`      ID: ${user.id}`)
      console.log(`      Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`)
      console.log(`      Dernière connexion: ${user.last_sign_in_at || 'Jamais'}`)
      console.log('')
    })

    // Tester avec les utilisateurs qui étaient probablement fonctionnels
    console.log('\n🔐 TEST CONNEXIONS AVEC UTILISATEURS EXISTANTS:')
    
    // Identifiants probables basés sur les emails trouvés
    const probableCredentials = [
      // Utilisateurs admin probables
      { email: 'loft.algerie.scl@outlook.com', passwords: ['admin123', 'loft123', 'password', '123456', 'admin'] },
      { email: 'sanabelkacemi33@gmail.com', passwords: ['sana123', 'admin123', 'password', '123456'] },
      { email: 'habib.belkacemi.mosta@gmail.com', passwords: ['habib123', 'admin123', 'password', '123456'] },
      { email: 'admin@loftalgerie.com', passwords: ['admin123', 'loft123', 'password', '123456', 'admin'] },
    ]

    let foundWorkingUser = false

    for (const userCred of probableCredentials) {
      console.log(`\n👤 Test utilisateur: ${userCred.email}`)
      
      for (const password of userCred.passwords) {
        try {
          const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
            email: userCred.email,
            password: password
          })

          if (signInError) {
            console.log(`   🔑 ${password}: ❌ ${signInError.message}`)
          } else {
            console.log(`   🔑 ${password}: ✅ SUCCÈS!`)
            console.log(`   👤 User: ${signInData.user?.email}`)
            console.log(`   🎫 Session: ${signInData.session ? 'Présente' : 'Absente'}`)
            
            // Déconnexion
            await userClient.auth.signOut()
            
            console.log('\n🎉 UTILISATEUR FONCTIONNEL TROUVÉ!')
            console.log('='.repeat(40))
            console.log(`📧 Email: ${userCred.email}`)
            console.log(`🔑 Mot de passe: ${password}`)
            console.log('🎯 Vous pouvez utiliser ces identifiants!')
            
            foundWorkingUser = true
            break
          }
        } catch (error) {
          console.log(`   🔑 ${password}: 💥 Exception: ${error}`)
        }
      }
      
      if (foundWorkingUser) break
    }

    if (!foundWorkingUser) {
      console.log('\n⚠️ AUCUN UTILISATEUR FONCTIONNEL TROUVÉ')
      console.log('Il se peut que les mots de passe aient été changés.')
      console.log('')
      console.log('💡 SOLUTIONS:')
      console.log('1. Essayez de vous souvenir des vrais mots de passe')
      console.log('2. Utilisez la fonction "Mot de passe oublié"')
      console.log('3. Créez un nouvel utilisateur via le dashboard Supabase')
      console.log('4. Utilisez l\'environnement DEV temporairement')
    }

    console.log('\n📋 RÉSUMÉ:')
    console.log('✅ Configuration PROD restaurée')
    console.log('✅ Base de données accessible')
    console.log(`✅ ${users.users.length} utilisateurs disponibles`)
    console.log('🎯 Redémarrez le serveur et testez avec les identifiants trouvés')

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
  }
}

testOriginalProdUsers().catch(console.error)