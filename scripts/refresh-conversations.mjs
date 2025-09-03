/**
 * Script pour rafraîchir les données des conversations
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

async function refreshConversations() {
  console.log('🔄 Rafraîchissement des données de conversations...')
  
  try {
    // Récupérer toutes les conversations avec leurs participants
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        name,
        type,
        created_at,
        updated_at,
        participants:conversation_participants (
          id,
          user_id,
          role,
          user:profiles (
            id,
            full_name,
            email
          )
        )
      `)

    if (convError) {
      throw convError
    }

    console.log(`📋 Trouvé ${conversations?.length || 0} conversations`)

    if (!conversations || conversations.length === 0) {
      console.log('✅ Aucune conversation trouvée')
      return
    }

    // Afficher les détails des conversations
    conversations.forEach((conv, index) => {
      console.log(`\n${index + 1}. Conversation: ${conv.name || conv.id.slice(0, 8)}`)
      console.log(`   Type: ${conv.type}`)
      console.log(`   Participants:`)
      
      conv.participants?.forEach((participant) => {
        const user = participant.user
        console.log(`     - ${user?.full_name || 'Sans nom'} (${user?.email || 'Sans email'})`)
      })
    })

    // Vérifier s'il y a des participants avec des noms génériques
    const participantsWithGenericNames = []
    
    conversations.forEach((conv) => {
      conv.participants?.forEach((participant) => {
        const user = participant.user
        if (user?.full_name?.toLowerCase().includes('member') || user?.full_name === 'member1') {
          participantsWithGenericNames.push({
            conversationId: conv.id,
            userId: user.id,
            currentName: user.full_name,
            email: user.email
          })
        }
      })
    })

    if (participantsWithGenericNames.length > 0) {
      console.log('\n⚠️  Participants avec des noms génériques trouvés:')
      participantsWithGenericNames.forEach((p) => {
        console.log(`   - ${p.currentName} (${p.email}) dans conversation ${p.conversationId.slice(0, 8)}`)
      })
      console.log('\n💡 Exécutez "node scripts/fix-user-names.mjs" pour les corriger')
    } else {
      console.log('\n🎉 Tous les noms d\'utilisateurs dans les conversations sont corrects !')
    }

    // Mettre à jour les timestamps des conversations pour forcer le rafraîchissement
    console.log('\n🔄 Mise à jour des timestamps...')
    for (const conv of conversations) {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conv.id)
    }

    console.log('✅ Timestamps mis à jour')
    console.log('🎉 Rafraîchissement terminé !')

  } catch (error) {
    console.error('❌ Erreur lors du rafraîchissement:', error.message)
  }
}

// Exécuter le script
refreshConversations()