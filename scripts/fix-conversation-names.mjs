/**
 * Script pour corriger les noms des conversations
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

async function fixConversationNames() {
  console.log('🔧 Correction des noms de conversations...')
  
  try {
    // Récupérer toutes les conversations directes
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, name, type')
      .eq('type', 'direct')

    if (convError) {
      throw convError
    }

    console.log(`📋 Trouvé ${conversations?.length || 0} conversations directes`)

    if (!conversations || conversations.length === 0) {
      console.log('✅ Aucune conversation directe trouvée')
      return
    }

    let updatedCount = 0

    // Pour chaque conversation directe
    for (const conv of conversations) {
      // Récupérer les participants
      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conv.id)

      if (partError) {
        console.log(`❌ Erreur participants pour ${conv.id}: ${partError.message}`)
        continue
      }

      if (!participants || participants.length !== 2) {
        console.log(`⚠️  Conversation ${conv.id} n'a pas exactement 2 participants`)
        continue
      }

      // Récupérer les noms des utilisateurs
      const userNames = []
      for (const participant of participants) {
        const { data: user, error: userError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', participant.user_id)
          .single()

        if (userError) {
          console.log(`❌ Erreur utilisateur ${participant.user_id}: ${userError.message}`)
          break
        }

        userNames.push(user?.full_name || 'Utilisateur')
      }

      if (userNames.length === 2) {
        // Créer le nouveau nom
        const newName = userNames.sort().join(', ')
        
        // Vérifier si le nom a changé
        if (conv.name !== newName) {
          // Mettre à jour le nom de la conversation
          const { error: updateError } = await supabase
            .from('conversations')
            .update({ name: newName })
            .eq('id', conv.id)

          if (updateError) {
            console.log(`❌ Erreur mise à jour ${conv.id}: ${updateError.message}`)
          } else {
            console.log(`✅ ${conv.name} → ${newName}`)
            updatedCount++
          }
        } else {
          console.log(`✓ ${conv.name} (déjà correct)`)
        }
      }
    }

    console.log(`\n🎉 Correction terminée ! ${updatedCount} conversations mises à jour.`)

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message)
  }
}

// Exécuter le script
fixConversationNames()