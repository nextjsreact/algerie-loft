/**
 * Script pour vérifier les noms d'utilisateurs dans la base de données
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserNames() {
  console.log('🔍 Vérification des noms d\'utilisateurs...')
  
  try {
    // Récupérer tous les utilisateurs
    const { data: users, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('created_at', { ascending: true })

    if (fetchError) {
      throw fetchError
    }

    console.log(`\n📋 Utilisateurs dans la base de données (${users?.length || 0}) :`)
    console.log('=' .repeat(60))

    if (!users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé')
      return
    }

    // Afficher chaque utilisateur
    users.forEach((user, index) => {
      const status = user.full_name?.toLowerCase().includes('member') ? '⚠️' : '✅'
      console.log(`${index + 1}. ${status} ${user.full_name || 'Sans nom'}`)
      console.log(`   📧 ${user.email}`)
      console.log(`   👤 ${user.role || 'Sans rôle'}`)
      console.log('')
    })

    // Statistiques
    const genericNames = users.filter(u => 
      u.full_name?.toLowerCase().includes('member') || 
      u.full_name === 'member1'
    )

    console.log('📊 Statistiques :')
    console.log(`   Total utilisateurs: ${users.length}`)
    console.log(`   Noms génériques: ${genericNames.length}`)
    console.log(`   Noms corrects: ${users.length - genericNames.length}`)

    if (genericNames.length > 0) {
      console.log('\n⚠️  Utilisateurs avec des noms génériques :')
      genericNames.forEach(user => {
        console.log(`   - ${user.full_name} (${user.email})`)
      })
      console.log('\n💡 Exécutez "node scripts/fix-user-names.mjs" pour les corriger')
    } else {
      console.log('\n🎉 Tous les noms d\'utilisateurs sont corrects !')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
  }
}

// Exécuter le script
checkUserNames()