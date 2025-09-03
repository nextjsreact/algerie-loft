#!/usr/bin/env tsx
/**
 * GUIDE INTERACTIF DE CLONAGE RAPIDE
 * ==================================
 * 
 * Guide l'utilisateur pas à pas pour cloner un environnement
 * Interface interactive pour simplifier le processus
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'

class CloneGuide {
  private async prompt(question: string): Promise<string> {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    return new Promise(resolve => {
      rl.question(question, (answer: string) => {
        rl.close()
        resolve(answer.trim())
      })
    })
  }

  private async showWelcome(): Promise<void> {
    console.log('🚀 GUIDE INTERACTIF DE CLONAGE D\'ENVIRONNEMENT')
    console.log('='.repeat(60))
    console.log('')
    console.log('Ce guide vous aidera à cloner complètement un environnement')
    console.log('de base de données vers un autre en quelques étapes simples.')
    console.log('')
    console.log('📋 Fonctionnalités:')
    console.log('✅ Clonage complet du schéma et des données')
    console.log('✅ Sauvegarde automatique avant clonage')
    console.log('✅ Validation post-clonage')
    console.log('✅ Instructions détaillées')
    console.log('')
  }

  private checkEnvironmentFiles(): { [key: string]: boolean } {
    return {
      prod: existsSync('.env.production'),
      test: existsSync('.env.test'),
      dev: existsSync('.env.development')
    }
  }

  private async selectEnvironments(): Promise<{ source: string, target: string }> {
    const envFiles = this.checkEnvironmentFiles()
    
    console.log('📁 ENVIRONNEMENTS DÉTECTÉS:')
    console.log(`${envFiles.prod ? '✅' : '❌'} PROD (.env.production)`)
    console.log(`${envFiles.test ? '✅' : '❌'} TEST (.env.test)`)
    console.log(`${envFiles.dev ? '✅' : '❌'} DEV (.env.development)`)
    console.log('')

    // Sélection de la source
    let source = ''
    while (!source) {
      const sourceInput = await this.prompt('🔗 Environnement SOURCE (prod/test/dev): ')
      
      if (!['prod', 'test', 'dev'].includes(sourceInput)) {
        console.log('❌ Environnement invalide. Utilisez: prod, test, dev')
        continue
      }
      
      if (!envFiles[sourceInput as keyof typeof envFiles]) {
        console.log(`❌ Fichier .env.${sourceInput === 'dev' ? 'development' : sourceInput} non trouvé`)
        const create = await this.prompt('Voulez-vous le créer maintenant? (o/n): ')
        if (create.toLowerCase() === 'o') {
          console.log(`💡 Utilisez: npm run setup:${sourceInput}`)
          return { source: '', target: '' }
        }
        continue
      }
      
      source = sourceInput
    }

    // Sélection de la cible
    let target = ''
    while (!target) {
      const targetInput = await this.prompt('🎯 Environnement CIBLE (prod/test/dev): ')
      
      if (!['prod', 'test', 'dev'].includes(targetInput)) {
        console.log('❌ Environnement invalide. Utilisez: prod, test, dev')
        continue
      }
      
      if (targetInput === source) {
        console.log('❌ La source et la cible ne peuvent pas être identiques')
        continue
      }
      
      if (targetInput === 'prod') {
        console.log('❌ Clonage vers PROD interdit pour des raisons de sécurité')
        continue
      }
      
      if (!envFiles[targetInput as keyof typeof envFiles]) {
        console.log(`❌ Fichier .env.${targetInput === 'dev' ? 'development' : targetInput} non trouvé`)
        const create = await this.prompt('Voulez-vous le créer maintenant? (o/n): ')
        if (create.toLowerCase() === 'o') {
          console.log(`💡 Utilisez: npm run setup:${targetInput}`)
          return { source: '', target: '' }
        }
        continue
      }
      
      target = targetInput
    }

    return { source, target }
  }

  private async confirmClone(source: string, target: string): Promise<boolean> {
    console.log('')
    console.log('⚠️ CONFIRMATION DE CLONAGE')
    console.log('='.repeat(40))
    console.log(`📊 Source: ${source.toUpperCase()}`)
    console.log(`🎯 Cible: ${target.toUpperCase()}`)
    console.log('')
    console.log('🔄 Cette opération va:')
    console.log('• Créer une sauvegarde de la cible')
    console.log('• Remplacer COMPLÈTEMENT la base cible')
    console.log('• Cloner toutes les données et le schéma')
    console.log('• Générer un rapport détaillé')
    console.log('')
    
    if (source === 'prod') {
      console.log('⚠️ ATTENTION: Vous clonez depuis la PRODUCTION!')
      console.log('📋 Assurez-vous que c\'est bien nécessaire.')
      console.log('')
    }

    const confirm = await this.prompt('Continuer? (oui/non): ')
    return confirm.toLowerCase() === 'oui' || confirm.toLowerCase() === 'o'
  }

  private async executeClone(source: string, target: string): Promise<boolean> {
    console.log('')
    console.log('🚀 DÉMARRAGE DU CLONAGE')
    console.log('='.repeat(40))
    
    try {
      console.log('📋 Exécution du script de clonage complet...')
      console.log('')
      
      execSync(`npm run tsx scripts/clone-environment-complet.ts ${source} ${target}`, {
        stdio: 'inherit'
      })
      
      return true
      
    } catch (error) {
      console.log('')
      console.log('❌ ERREUR LORS DU CLONAGE')
      console.log(`Détails: ${error}`)
      return false
    }
  }

  private async executeValidation(target: string): Promise<boolean> {
    console.log('')
    console.log('🔍 VALIDATION POST-CLONAGE')
    console.log('='.repeat(40))
    
    try {
      execSync(`npm run tsx scripts/validate-clone.ts ${target}`, {
        stdio: 'inherit'
      })
      
      return true
      
    } catch (error) {
      console.log('')
      console.log('⚠️ PROBLÈMES DÉTECTÉS LORS DE LA VALIDATION')
      console.log(`Détails: ${error}`)
      return false
    }
  }

  private async showNextSteps(source: string, target: string, success: boolean): Promise<void> {
    console.log('')
    console.log('📋 PROCHAINES ÉTAPES')
    console.log('='.repeat(40))
    
    if (success) {
      console.log('🎉 Clonage terminé avec succès!')
      console.log('')
      console.log('✅ Actions recommandées:')
      console.log(`1. Basculer vers l'environnement: npm run env:${target}`)
      console.log('2. Tester la connexion: npm run test-env')
      console.log('3. Lancer l\'application: npm run dev')
      console.log('4. Vérifier l\'interface utilisateur')
      console.log('')
      console.log('📄 Fichiers générés:')
      console.log('• Rapport de clonage (clone_report_*.json)')
      console.log('• Instructions détaillées (clone_instructions_*.md)')
      console.log('• Sauvegarde de sécurité (backup_*.json)')
      
    } else {
      console.log('⚠️ Clonage terminé avec des problèmes')
      console.log('')
      console.log('🔧 Actions de dépannage:')
      console.log('1. Consultez le rapport de clonage')
      console.log('2. Vérifiez les logs d\'erreur')
      console.log('3. Appliquez manuellement le schéma si nécessaire')
      console.log('4. Relancez le clonage si les problèmes persistent')
      console.log('')
      console.log('💡 Restauration possible:')
      console.log(`   npm run restore:database backup_${target}_[timestamp].json`)
    }

    console.log('')
    console.log('📚 Documentation complète: GUIDE_CLONAGE_COMPLET.md')
  }

  private async offerAdditionalActions(): Promise<void> {
    console.log('')
    console.log('🛠️ ACTIONS SUPPLÉMENTAIRES DISPONIBLES')
    console.log('='.repeat(50))
    
    while (true) {
      console.log('')
      console.log('Que souhaitez-vous faire?')
      console.log('1. Valider un autre environnement')
      console.log('2. Configurer un nouvel environnement')
      console.log('3. Voir l\'aide des scripts')
      console.log('4. Quitter')
      console.log('')
      
      const choice = await this.prompt('Votre choix (1-4): ')
      
      switch (choice) {
        case '1':
          const env = await this.prompt('Environnement à valider (test/dev): ')
          if (['test', 'dev'].includes(env)) {
            try {
              execSync(`npm run validate:${env}`, { stdio: 'inherit' })
            } catch (error) {
              console.log('❌ Erreur de validation')
            }
          }
          break
          
        case '2':
          const newEnv = await this.prompt('Nouvel environnement (test/dev/prod): ')
          if (['test', 'dev', 'prod'].includes(newEnv)) {
            try {
              execSync(`npm run setup:${newEnv}`, { stdio: 'inherit' })
            } catch (error) {
              console.log('❌ Erreur de configuration')
            }
          }
          break
          
        case '3':
          this.showScriptHelp()
          break
          
        case '4':
          console.log('👋 Au revoir!')
          return
          
        default:
          console.log('❌ Choix invalide')
      }
    }
  }

  private showScriptHelp(): void {
    console.log('')
    console.log('📚 AIDE DES SCRIPTS DISPONIBLES')
    console.log('='.repeat(50))
    console.log('')
    console.log('🔄 CLONAGE:')
    console.log('• npm run clone:complete:prod-to-test  - Clone PROD vers TEST')
    console.log('• npm run clone:complete:prod-to-dev   - Clone PROD vers DEV')
    console.log('• npm run clone:complete:test-to-dev   - Clone TEST vers DEV')
    console.log('')
    console.log('🔍 VALIDATION:')
    console.log('• npm run validate:test               - Valide l\'environnement TEST')
    console.log('• npm run validate:dev                - Valide l\'environnement DEV')
    console.log('')
    console.log('⚙️ CONFIGURATION:')
    console.log('• npm run setup:test                  - Configure nouvel env TEST')
    console.log('• npm run setup:dev                   - Configure nouvel env DEV')
    console.log('')
    console.log('💾 SAUVEGARDE/RESTAURATION:')
    console.log('• npm run export:test                 - Exporte TEST')
    console.log('• npm run restore:database [file]     - Restaure depuis sauvegarde')
    console.log('')
    console.log('🔧 ENVIRONNEMENT:')
    console.log('• npm run env:test                    - Bascule vers TEST')
    console.log('• npm run env:dev                     - Bascule vers DEV')
    console.log('• npm run test-env                    - Test environnement actuel')
  }

  async executeGuide(): Promise<void> {
    try {
      await this.showWelcome()
      
      const { source, target } = await this.selectEnvironments()
      
      if (!source || !target) {
        console.log('👋 Configuration d\'environnement requise. Relancez le guide après.')
        return
      }
      
      const confirmed = await this.confirmClone(source, target)
      if (!confirmed) {
        console.log('❌ Clonage annulé par l\'utilisateur')
        return
      }
      
      const cloneSuccess = await this.executeClone(source, target)
      const validationSuccess = cloneSuccess ? await this.executeValidation(target) : false
      
      await this.showNextSteps(source, target, cloneSuccess && validationSuccess)
      await this.offerAdditionalActions()
      
    } catch (error) {
      console.error('❌ Erreur dans le guide:', error)
    }
  }
}

async function main() {
  const guide = new CloneGuide()
  await guide.executeGuide()
}

main().catch(console.error)