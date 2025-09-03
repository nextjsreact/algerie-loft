/**
 * Script pour diagnostiquer les problèmes de langue
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Charger les variables d'environnement
dotenv.config()

async function diagnoseLanguage() {
  console.log('🔍 Diagnostic des problèmes de langue...')
  
  try {
    // 1. Vérifier les fichiers de traduction
    console.log('\n📁 Vérification des fichiers de traduction :')
    
    const localesDir = 'public/locales'
    const languages = ['fr', 'en', 'ar']
    
    for (const lang of languages) {
      const langDir = path.join(localesDir, lang)
      if (fs.existsSync(langDir)) {
        const files = fs.readdirSync(langDir)
        console.log(`  ✅ ${lang}: ${files.length} fichiers (${files.join(', ')})`)
        
        // Vérifier le fichier common.json
        const commonFile = path.join(langDir, 'common.json')
        if (fs.existsSync(commonFile)) {
          const content = JSON.parse(fs.readFileSync(commonFile, 'utf8'))
          if (content.nav && content.nav.dashboard) {
            console.log(`     Navigation: "${content.nav.dashboard}"`)
          }
        }
      } else {
        console.log(`  ❌ ${lang}: Dossier manquant`)
      }
    }

    // 2. Vérifier la configuration i18n
    console.log('\n⚙️ Vérification de la configuration i18n :')
    
    const i18nFiles = [
      'lib/i18n/index.ts',
      'lib/i18n/context.tsx',
      'middleware.ts'
    ]
    
    for (const file of i18nFiles) {
      if (fs.existsSync(file)) {
        console.log(`  ✅ ${file} existe`)
      } else {
        console.log(`  ❌ ${file} manquant`)
      }
    }

    // 3. Vérifier les cookies (simulation)
    console.log('\n🍪 Configuration des cookies :')
    console.log('  - Cookie de langue: language=fr (recommandé)')
    console.log('  - Path: /')
    console.log('  - Max-Age: 31536000 (1 an)')
    console.log('  - SameSite: Lax')

    // 4. Recommandations
    console.log('\n💡 Recommandations pour corriger le problème :')
    console.log('  1. Ouvrir scripts/force-french-language.html dans le navigateur')
    console.log('  2. Cliquer sur "Forcer le Français"')
    console.log('  3. Vider le cache du navigateur (Ctrl+Shift+R)')
    console.log('  4. Redémarrer le serveur de développement')

    // 5. Vérifier les composants de navigation
    console.log('\n🧭 Vérification des composants de navigation :')
    
    const navComponents = [
      'components/layout/sidebar.tsx',
      'components/layout/enhanced-sidebar.tsx',
      'components/language-selector.tsx'
    ]
    
    for (const component of navComponents) {
      if (fs.existsSync(component)) {
        console.log(`  ✅ ${component} existe`)
      } else {
        console.log(`  ❌ ${component} manquant`)
      }
    }

    console.log('\n🎯 Actions à effectuer :')
    console.log('  1. Ouvrir: http://localhost:3000/../scripts/force-french-language.html')
    console.log('  2. Forcer la langue française')
    console.log('  3. Redémarrer le serveur si nécessaire')
    console.log('  4. Vider le cache du navigateur')

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message)
  }
}

// Exécuter le script
diagnoseLanguage()