#!/usr/bin/env tsx
/**
 * SCRIPT DE DÉMARRAGE SÉCURISÉ
 * ============================
 * 
 * Démarre l'application en gérant les erreurs de compilation
 */

import { execSync, spawn } from 'child_process'
import { existsSync, rmSync } from 'fs'

class SafeDevStarter {
  
  async startDevelopment(): Promise<void> {
    console.log('🚀 DÉMARRAGE SÉCURISÉ DE L\'APPLICATION')
    console.log('='.repeat(50))

    try {
      // 1. Nettoyer l'environnement
      await this.cleanEnvironment()
      
      // 2. Vérifier les dépendances
      await this.checkDependencies()
      
      // 3. Compiler et démarrer
      await this.startNextDev()
      
    } catch (error) {
      console.error('❌ Erreur lors du démarrage:', error)
      await this.showTroubleshooting()
    }
  }

  private async cleanEnvironment(): Promise<void> {
    console.log('\n🧹 Nettoyage de l\'environnement...')
    
    try {
      // Arrêter les processus Node.js existants
      try {
        execSync('taskkill /f /im node.exe', { stdio: 'pipe' })
        console.log('   ✅ Processus Node.js arrêtés')
      } catch (error) {
        console.log('   ℹ️ Aucun processus Node.js à arrêter')
      }

      // Attendre un peu
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Supprimer .next
      if (existsSync('.next')) {
        rmSync('.next', { recursive: true, force: true })
        console.log('   ✅ Cache .next supprimé')
      }

      // Supprimer node_modules/.cache
      if (existsSync('node_modules/.cache')) {
        rmSync('node_modules/.cache', { recursive: true, force: true })
        console.log('   ✅ Cache node_modules supprimé')
      }

      // Nettoyer le cache npm
      execSync('npm cache clean --force', { stdio: 'pipe' })
      console.log('   ✅ Cache npm nettoyé')

    } catch (error) {
      console.log('   ⚠️ Nettoyage partiel effectué')
    }
  }

  private async checkDependencies(): Promise<void> {
    console.log('\n📦 Vérification des dépendances...')
    
    try {
      // Vérifier que les dépendances critiques sont installées
      const criticalDeps = ['next', 'react', 'react-dom']
      
      for (const dep of criticalDeps) {
        try {
          execSync(`npm list ${dep}`, { stdio: 'pipe' })
          console.log(`   ✅ ${dep} installé`)
        } catch (error) {
          console.log(`   ❌ ${dep} manquant - réinstallation...`)
          execSync(`npm install ${dep}`, { stdio: 'inherit' })
        }
      }

    } catch (error) {
      console.log('   ⚠️ Problème avec les dépendances')
      throw error
    }
  }

  private async startNextDev(): Promise<void> {
    console.log('\n🚀 Démarrage du serveur Next.js...')
    console.log('📱 L\'application sera disponible sur http://localhost:3000')
    console.log('📊 Page des rapports : http://localhost:3000/reports')
    console.log('')
    console.log('⏳ Compilation en cours... (cela peut prendre quelques minutes)')
    console.log('')

    // Démarrer Next.js avec gestion des erreurs
    const nextProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    })

    // Gérer les erreurs du processus
    nextProcess.on('error', (error) => {
      console.error('❌ Erreur lors du démarrage de Next.js:', error)
    })

    nextProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ Next.js s'est arrêté avec le code ${code}`)
        this.showTroubleshooting()
      }
    })

    // Attendre que le processus démarre
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    console.log('\n✅ Serveur démarré!')
    console.log('🌐 Ouvrez http://localhost:3000 dans votre navigateur')
  }

  private async showTroubleshooting(): Promise<void> {
    console.log('\n🛠️ GUIDE DE DÉPANNAGE')
    console.log('='.repeat(30))
    console.log('')
    console.log('Si l\'application ne démarre pas:')
    console.log('')
    console.log('1. Vérifiez Node.js:')
    console.log('   node --version  (doit être >= 18.0.0)')
    console.log('')
    console.log('2. Réinstallez les dépendances:')
    console.log('   rmdir /s /q node_modules')
    console.log('   del package-lock.json')
    console.log('   npm install')
    console.log('')
    console.log('3. Redémarrez votre terminal/IDE')
    console.log('')
    console.log('4. Essayez en mode debug:')
    console.log('   set DEBUG=* && npm run dev')
    console.log('')
    console.log('5. Vérifiez les ports:')
    console.log('   netstat -ano | findstr :3000')
    console.log('')
  }
}

async function main() {
  const starter = new SafeDevStarter()
  await starter.startDevelopment()
}

main().catch(console.error)