/**
 * Script pour vérifier les conversations et leurs participants
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

async function checkConversations() {
  console.log('🔍 Vérification des conversations...')
  
  try {
    // Récupérer toutes les conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, name, type, created_at, updated_at')

    if (convError) {
      throw convError
    }

    console.log(`📋 Trouvé ${conversations?.length || 0} conversations`)

    if (!conversations || conversations.length === 0) {
      console.log('✅ Aucune conversation trouvée')
      return
    }

    // Pour chaque conversation, récupérer les participants
    for (const conv of conversations) {
      console.log(`\n📝 Conversation: ${conv.name || conv.id.slice(0, 8)}`)
      console.log(`   Type: ${conv.type}`)
      console.log(`   ID: ${conv.id}`)

      // Récupérer les participants
      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select('user_id, role')
        .eq('conversation_id', conv.id)

      if (partError) {
        console.log(`   ❌ Erreur participants: ${partError.message}`)
        continue
      }

      console.log(`   Participants (${participants?.length || 0}):`)
      
      // Pour chaque participant, récupérer les infos utilisateur
      for (const participant of participants || []) {
        const { data: user, error: userError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', participant.user_id)
          .single()

        if (userError) {
          console.log(`     - Utilisateur ${participant.user_id}: ❌ Erreur: ${userError.message}`)
        } else {
          console.log(`     - ${user?.full_name || 'Sans nom'} (${user?.email || 'Sans email'}) - ${participant.role}`)
        }
      }
    }

    console.log('\n🎉 Vérification terminée !')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
  }
}

// Exécuter le script
checkConversations()