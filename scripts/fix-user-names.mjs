/**
 * Script pour corriger les noms d'utilisateurs dans la base de données
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
  console.log('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixUserNames() {
  console.log('🔧 Correction des noms d\'utilisateurs...')
  
  try {
    // Récupérer tous les utilisateurs avec des noms génériques
    const { data: users, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .or('full_name.eq.member1,full_name.ilike.%member%')

    if (fetchError) {
      throw fetchError
    }

    console.log(`📋 Trouvé ${users?.length || 0} utilisateurs à corriger`)

    if (!users || users.length === 0) {
      console.log('✅ Aucun utilisateur à corriger')
      return
    }

    // Corriger chaque utilisateur
    for (const user of users) {
      let newName = user.full_name

      // Corrections spécifiques
      if (user.full_name === 'member1') {
        newName = 'Membre 1'
      } else if (user.full_name?.toLowerCase().includes('member')) {
        // Extraire le numéro du membre si possible
        const match = user.full_name.match(/member(\d+)/i)
        if (match) {
          newName = `Membre ${match[1]}`
        } else {
          newName = 'Membre'
        }
      }

      // Si le nom a changé, mettre à jour
      if (newName !== user.full_name) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ full_name: newName })
          .eq('id', user.id)

        if (updateError) {
          console.error(`❌ Erreur lors de la mise à jour de ${user.email}:`, updateError.message)
        } else {
          console.log(`✅ ${user.email}: "${user.full_name}" → "${newName}"`)
        }
      }
    }

    console.log('🎉 Correction des noms d\'utilisateurs terminée !')

  } catch (error) {
    console.error('❌ Erreur lors de la correction des noms:', error.message)
  }
}

// Exécuter le script
fixUserNames()