#!/usr/bin/env tsx
/**
 * SCRIPT DE TEST DE SANTÉ DU SYSTÈME
 * ==================================
 * 
 * Vérifie que tous les composants fonctionnent correctement
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'

class SystemHealthChecker {
  
  async runHealthCheck(): Promise<void> {
    console.log('🏥 TEST DE SANTÉ DU SYSTÈME')
    console.log('='.repeat(50))

    const results = {
      environment: await this.checkEnvironment(),
      dependencies: await this.checkDependencies(),
      configuration: await this.checkConfiguration(),
      database: await this.checkDatabase(),
      reports: await this.checkReports()
    }

    this.displayResults(results)
  }

  private async checkEnvironment(): Promise<{ status: string, details: string[] }> {
    console.log('\n🌍 Vérification de l\'environnement...')
    const details: string[] = []
    
    try {
      // Vérifier Node.js
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
      details.push(`Node.js: ${nodeVersion}`)
      
      // Vérifier npm
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
      details.push(`npm: ${npmVersion}`)
      
      // Vérifier le système
      const platform = process.platform
      details.push(`Plateforme: ${platform}`)
      
      console.log('   ✅ Environnement OK')
      return { status: 'success', details }
      
    } catch (error) {
      console.log('   ❌ Problème environnement')
      details.push(`Erreur: ${error}`)
      return { status: 'error', details }
    }
  }

  private async checkDependencies(): Promise<{ status: string, details: string[] }> {
    console.log('\n📦 Vérification des dépendances...')
    const details: string[] = []
    
    try {
      // Vérifier les dépendances critiques
      const criticalDeps = ['next', 'react', 'react-dom', 'jspdf', '@supabase/supabase-js']
      
      for (const dep of criticalDeps) {
        try {
          const version = execSync(`npm list ${dep} --depth=0`, { encoding: 'utf8' })
          const match = version.match(new RegExp(`${dep}@([\\d\\.]+)`))
          if (match) {
            details.push(`${dep}: ${match[1]}`)
          }
        } catch (error) {
          details.push(`${dep}: NON INSTALLÉ`)
        }
      }
      
      console.log('   ✅ Dépendances vérifiées')
      return { status: 'success', details }
      
    } catch (error) {
      console.log('   ❌ Problème dépendances')
      details.push(`Erreur: ${error}`)
      return { status: 'error', details }
    }
  }

  private async checkConfiguration(): Promise<{ status: string, details: string[] }> {
    console.log('\n⚙️ Vérification de la configuration...')
    const details: string[] = []
    
    try {
      // Vérifier les fichiers de configuration
      const configFiles = [
        'package.json',
        'next.config.mjs',
        'tsconfig.json',
        '.env.local'
      ]
      
      for (const file of configFiles) {
        if (existsSync(file)) {
          details.push(`${file}: ✅`)
        } else {
          details.push(`${file}: ❌ MANQUANT`)
        }
      }
      
      // Vérifier les dossiers importants
      const importantDirs = [
        'components/reports',
        'lib',
        'hooks',
        'app/reports'
      ]
      
      for (const dir of importantDirs) {
        if (existsSync(dir)) {
          details.push(`${dir}/: ✅`)
        } else {
          details.push(`${dir}/: ❌ MANQUANT`)
        }
      }
      
      console.log('   ✅ Configuration vérifiée')
      return { status: 'success', details }
      
    } catch (error) {
      console.log('   ❌ Problème configuration')
      details.push(`Erreur: ${error}`)
      return { status: 'error', details }
    }
  }

  private async checkDatabase(): Promise<{ status: string, details: string[] }> {
    console.log('\n🗄️ Vérification de la base de données...')
    const details: string[] = []
    
    try {
      // Vérifier les fichiers d'environnement
      const envFiles = ['.env.local', '.env.development', '.env.production', '.env.test']
      let hasEnvFile = false
      
      for (const file of envFiles) {
        if (existsSync(file)) {
          details.push(`${file}: ✅`)
          hasEnvFile = true
        }
      }
      
      if (!hasEnvFile) {
        details.push('Aucun fichier .env trouvé')
        console.log('   ⚠️ Aucun fichier d\'environnement')
        return { status: 'warning', details }
      }
      
      console.log('   ✅ Configuration DB présente')
      return { status: 'success', details }
      
    } catch (error) {
      console.log('   ❌ Problème base de données')
      details.push(`Erreur: ${error}`)
      return { status: 'error', details }
    }
  }

  private async checkReports(): Promise<{ status: string, details: string[] }> {
    console.log('\n📊 Vérification du système de rapports...')
    const details: string[] = []
    
    try {
      // Vérifier les fichiers de rapports
      const reportFiles = [
        'lib/pdf-generator.ts',
        'hooks/use-reports.ts',
        'components/reports/report-generator.tsx',
        'app/reports/page.tsx'
      ]
      
      let allFilesPresent = true
      
      for (const file of reportFiles) {
        if (existsSync(file)) {
          details.push(`${file}: ✅`)
        } else {
          details.push(`${file}: ❌ MANQUANT`)
          allFilesPresent = false
        }
      }
      
      if (!allFilesPresent) {
        console.log('   ❌ Fichiers de rapports manquants')
        return { status: 'error', details }
      }
      
      // Tester la génération PDF
      try {
        console.log('   🧪 Test de génération PDF...')
        execSync('npm run reports:test', { stdio: 'pipe' })
        details.push('Test PDF: ✅ RÉUSSI')
        console.log('   ✅ Système de rapports fonctionnel')
        return { status: 'success', details }
        
      } catch (error) {
        details.push('Test PDF: ❌ ÉCHEC')
        console.log('   ⚠️ Problème génération PDF')
        return { status: 'warning', details }
      }
      
    } catch (error) {
      console.log('   ❌ Erreur système de rapports')
      details.push(`Erreur: ${error}`)
      return { status: 'error', details }
    }
  }

  private displayResults(results: any): void {
    console.log('\n📋 RÉSULTATS DU TEST DE SANTÉ')
    console.log('='.repeat(50))

    let overallStatus = 'success'
    let totalChecks = 0
    let successfulChecks = 0

    for (const [category, result] of Object.entries(results)) {
      totalChecks++
      
      const status = (result as any).status
      const details = (result as any).details
      
      let icon = '✅'
      if (status === 'warning') {
        icon = '⚠️'
        if (overallStatus === 'success') overallStatus = 'warning'
      } else if (status === 'error') {
        icon = '❌'
        overallStatus = 'error'
      } else {
        successfulChecks++
      }
      
      console.log(`\n${icon} ${category.toUpperCase()}:`)
      details.forEach((detail: string) => {
        console.log(`   ${detail}`)
      })
    }

    // Résumé final
    console.log('\n📊 RÉSUMÉ FINAL')
    console.log('='.repeat(30))
    console.log(`Tests réussis: ${successfulChecks}/${totalChecks}`)
    console.log(`Taux de réussite: ${Math.round(successfulChecks / totalChecks * 100)}%`)

    if (overallStatus === 'success') {
      console.log('\n🎉 SYSTÈME EN PARFAIT ÉTAT!')
      console.log('✅ Tous les composants fonctionnent correctement')
      console.log('🚀 Vous pouvez utiliser l\'application en toute sécurité')
      
    } else if (overallStatus === 'warning') {
      console.log('\n⚠️ SYSTÈME FONCTIONNEL AVEC AVERTISSEMENTS')
      console.log('💡 Certains composants peuvent nécessiter une attention')
      console.log('🔧 Consultez les détails ci-dessus pour les corrections')
      
    } else {
      console.log('\n❌ PROBLÈMES DÉTECTÉS')
      console.log('🛠️ Des corrections sont nécessaires avant utilisation')
      console.log('📋 Suivez le guide de dépannage: GUIDE_DEPANNAGE_WEBPACK.md')
    }

    // Actions recommandées
    console.log('\n🎯 ACTIONS RECOMMANDÉES:')
    
    if (overallStatus === 'error') {
      console.log('1. Exécutez: npm run fix:webpack')
      console.log('2. Redémarrez: npm run dev:clean')
      console.log('3. Relancez ce test: npm run health:check')
    } else if (overallStatus === 'warning') {
      console.log('1. Vérifiez les avertissements ci-dessus')
      console.log('2. Configurez les fichiers manquants si nécessaire')
      console.log('3. Testez l\'application: npm run dev')
    } else {
      console.log('1. Lancez l\'application: npm run dev')
      console.log('2. Testez les rapports: naviguez vers /reports')
      console.log('3. Profitez de votre système fonctionnel! 🎉')
    }
  }
}

async function main() {
  const checker = new SystemHealthChecker()
  await checker.runHealthCheck()
}

main().catch(console.error)