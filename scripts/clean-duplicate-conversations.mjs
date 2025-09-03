/**
 * Script pour nettoyer les conversations en double
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

async function cleanDuplicateConversations() {
  console.log('🧹 Nettoyage des conversations en double...')
  
  try {
    // Récupérer toutes les conversations directes
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, name, type, created_at')
      .eq('type', 'direct')
      .order('created_at', { ascending: true })

    if (convError) {
      throw convError
    }

    console.log(`📋 Trouvé ${conversations?.length || 0} conversations directes`)

    if (!conversations || conversations.length === 0) {
      console.log('✅ Aucune conversation directe trouvée')
      return
    }

    // Grouper les conversations par nom
    const conversationGroups = {}
    
    for (const conv of conversations) {
      const name = conv.name || 'Sans nom'
      if (!conversationGroups[name]) {
        conversationGroups[name] = []
      }
      conversationGroups[name].push(conv)
    }

    // Identifier les doublons
    const duplicates = []
    Object.entries(conversationGroups).forEach(([name, convs]) => {
      if (convs.length > 1) {
        // Garder la plus ancienne, marquer les autres comme doublons
        const [keep, ...toDelete] = convs
        duplicates.push({
          name,
          keep: keep.id,
          delete: toDelete.map(c => c.id)
        })
      }
    })

    if (duplicates.length === 0) {
      console.log('✅ Aucune conversation en double trouvée')
      return
    }

    console.log(`\n⚠️  Trouvé ${duplicates.length} groupes de conversations en double:`)
    
    let totalToDelete = 0
    duplicates.forEach((dup, index) => {
      console.log(`\n${index + 1}. "${dup.name}"`)
      console.log(`   Garder: ${dup.keep}`)
      console.log(`   Supprimer: ${dup.delete.length} conversations`)
      totalToDelete += dup.delete.length
    })

    console.log(`\n📊 Total à supprimer: ${totalToDelete} conversations`)
    
    // Demander confirmation (simulation)
    console.log('\n⚠️  ATTENTION: Cette opération va supprimer définitivement les conversations en double.')
    console.log('💡 Pour exécuter la suppression, décommentez le code ci-dessous.')
    
    /*
    // DÉCOMMENTEZ CETTE SECTION POUR EXÉCUTER LA SUPPRESSION
    console.log('\n🗑️  Suppression des doublons...')
    
    let deletedCount = 0
    for (const dup of duplicates) {
      for (const convId of dup.delete) {
        // Supprimer d'abord les participants
        const { error: partError } = await supabase
          .from('conversation_participants')
          .delete()
          .eq('conversation_id', convId)
        
        if (partError) {
          console.log(`❌ Erreur suppression participants ${convId}: ${partError.message}`)
          continue
        }
        
        // Supprimer les messages
        const { error: msgError } = await supabase
          .from('messages')
          .delete()
          .eq('conversation_id', convId)
        
        if (msgError) {
          console.log(`❌ Erreur suppression messages ${convId}: ${msgError.message}`)
          continue
        }
        
        // Supprimer la conversation
        const { error: convError } = await supabase
          .from('conversations')
          .delete()
          .eq('id', convId)
        
        if (convError) {
          console.log(`❌ Erreur suppression conversation ${convId}: ${convError.message}`)
        } else {
          console.log(`✅ Supprimé: ${convId}`)
          deletedCount++
        }
      }
    }
    
    console.log(`\n🎉 Nettoyage terminé ! ${deletedCount} conversations supprimées.`)
    */

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message)
  }
}

// Exécuter le script
cleanDuplicateConversations()