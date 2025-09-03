/**
 * Script pour vérifier que toutes les traductions sont complètes
 */

import fs from 'fs'
import path from 'path'

async function verifyTranslations() {
  console.log('🔍 Vérification des traductions pour les conversations...')
  
  try {
    const languages = ['fr', 'en', 'ar']
    const requiredKeys = [
      'title',
      'searchOrCreateNewConversation', 
      'all',
      'unread',
      'groups',
      'yesterday',
      'conversation',
      'group',
      'noMessage',
      'startNewConversation',
      'archived',
      'settings',
      'totalUnread',
      'totalUnread_plural'
    ]

    console.log(`\n📋 Clés requises (${requiredKeys.length}) :`)
    requiredKeys.forEach(key => console.log(`  - ${key}`))

    console.log(`\n🌍 Vérification pour ${languages.length} langues :\n`)

    let allComplete = true

    for (const lang of languages) {
      const filePath = `public/locales/${lang}/conversations.json`
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ ${lang.toUpperCase()}: Fichier manquant (${filePath})`)
        allComplete = false
        continue
      }

      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        const missingKeys = requiredKeys.filter(key => !content[key])
        
        if (missingKeys.length === 0) {
          console.log(`✅ ${lang.toUpperCase()}: Toutes les traductions présentes (${Object.keys(content).length} clés)`)
        } else {
          console.log(`⚠️  ${lang.toUpperCase()}: ${missingKeys.length} traductions manquantes :`)
          missingKeys.forEach(key => console.log(`     - ${key}`))
          allComplete = false
        }

        // Vérifier les traductions spécifiques
        const langNames = {
          'fr': 'Français',
          'en': 'English',
          'ar': 'العربية'
        }

        console.log(`   📝 Exemples de traductions en ${langNames[lang]} :`)
        console.log(`     - title: "${content.title || 'MANQUANT'}"`)
        console.log(`     - all: "${content.all || 'MANQUANT'}"`)
        console.log(`     - unread: "${content.unread || 'MANQUANT'}"`)
        console.log(`     - groups: "${content.groups || 'MANQUANT'}"`)
        console.log('')

      } catch (error) {
        console.log(`❌ ${lang.toUpperCase()}: Erreur de parsing JSON - ${error.message}`)
        allComplete = false
      }
    }

    console.log('📊 Résumé :')
    if (allComplete) {
      console.log('🎉 Toutes les traductions sont complètes !')
      console.log('✅ Les 3 langues (français, anglais, arabe) sont prêtes')
    } else {
      console.log('⚠️  Certaines traductions sont manquantes')
      console.log('💡 Ajoutez les clés manquantes dans les fichiers JSON correspondants')
    }

    console.log('\n🔧 Pour tester les traductions :')
    console.log('1. Ouvrir: scripts/test-all-languages.html')
    console.log('2. Tester chaque langue individuellement')
    console.log('3. Aller sur /conversations pour voir le résultat')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
  }
}

// Exécuter le script
verifyTranslations()