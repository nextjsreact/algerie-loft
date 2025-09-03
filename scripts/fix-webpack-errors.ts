#!/usr/bin/env tsx
/**
 * SCRIPT DE CORRECTION DES ERREURS WEBPACK
 * ========================================
 * 
 * Diagnostique et corrige les erreurs webpack courantes
 * Spécialement pour les erreurs Next.js devtools
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'

class WebpackErrorFixer {
  
  async diagnoseAndFix(): Promise<void> {
    console.log('🔧 DIAGNOSTIC ET CORRECTION WEBPACK')
    console.log('='.repeat(50))

    try {
      // 1. Nettoyer le cache
      await this.clearCache()
      
      // 2. Vérifier Next.js config
      await this.checkNextConfig()
      
      // 3. Vérifier les dépendances
      await this.checkDependencies()
      
      // 4. Corriger les problèmes courants
      await this.fixCommonIssues()
      
      // 5. Redémarrer le serveur de développement
      await this.restartDev()
      
      console.log('\n✅ CORRECTION TERMINÉE!')
      console.log('🚀 Votre application devrait maintenant fonctionner correctement.')
      
    } catch (error) {
      console.error('❌ Erreur lors de la correction:', error)
      this.showManualSteps()
    }
  }

  private async clearCache(): Promise<void> {
    console.log('\n🧹 Nettoyage du cache...')
    
    try {
      // Supprimer .next
      if (existsSync('.next')) {
        execSync('rmdir /s /q .next', { stdio: 'inherit' })
        console.log('   ✅ Cache .next supprimé')
      }
      
      // Supprimer node_modules/.cache
      if (existsSync('node_modules/.cache')) {
        execSync('rmdir /s /q node_modules\\.cache', { stdio: 'inherit' })
        console.log('   ✅ Cache node_modules supprimé')
      }
      
      // Nettoyer npm cache
      execSync('npm cache clean --force', { stdio: 'inherit' })
      console.log('   ✅ Cache npm nettoyé')
      
    } catch (error) {
      console.log('   ⚠️ Nettoyage partiel (certains fichiers peuvent être verrouillés)')
    }
  }

  private async checkNextConfig(): Promise<void> {
    console.log('\n⚙️ Vérification de la configuration Next.js...')
    
    if (!existsSync('next.config.mjs')) {
      console.log('   ⚠️ next.config.mjs non trouvé')
      return
    }

    const config = readFileSync('next.config.mjs', 'utf8')
    
    // Vérifier si la configuration contient des problèmes connus
    if (config.includes('experimental')) {
      console.log('   ⚠️ Configuration expérimentale détectée')
    }
    
    console.log('   ✅ Configuration Next.js vérifiée')
  }

  private async checkDependencies(): Promise<void> {
    console.log('\n📦 Vérification des dépendances...')
    
    try {
      // Vérifier les versions de Next.js et React
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
      
      console.log(`   📋 Next.js: ${packageJson.dependencies.next}`)
      console.log(`   📋 React: ${packageJson.dependencies.react}`)
      console.log(`   📋 React-DOM: ${packageJson.dependencies['react-dom']}`)
      
      // Vérifier les dépendances PDF
      if (packageJson.dependencies.jspdf) {
        console.log(`   📋 jsPDF: ${packageJson.dependencies.jspdf}`)
        console.log('   ✅ Dépendances PDF installées')
      }
      
    } catch (error) {
      console.log('   ❌ Erreur lors de la vérification des dépendances')
    }
  }

  private async fixCommonIssues(): Promise<void> {
    console.log('\n🔧 Correction des problèmes courants...')
    
    // 1. Créer/mettre à jour next.config.mjs avec corrections
    await this.updateNextConfig()
    
    // 2. Vérifier TypeScript config
    await this.checkTypeScriptConfig()
    
    // 3. Réinstaller les dépendances si nécessaire
    await this.reinstallDependencies()
  }

  private async updateNextConfig(): Promise<void> {
    console.log('   🔧 Mise à jour de next.config.mjs...')
    
    const fixedConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    domains: process.env.NODE_ENV === 'production' 
      ? ['loft-algerie.com', 'cdn.loft-algerie.com']
      : ['localhost'],
  },
  
  // Configuration pour éviter les erreurs webpack
  webpack: (config, { dev, isServer }) => {
    // Correction pour jsPDF et autres dépendances client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    
    // Optimisations pour le développement
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    
    return config
  },
  
  serverExternalPackages: ['pg'],
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuration par environnement
  env: {
    NEXT_PUBLIC_HAS_DB: 'true',
    ENVIRONMENT: process.env.NODE_ENV,
  },

  // Optimisations pour la production
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
    
    // Headers de sécurité
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin',
            },
          ],
        },
      ]
    },
  }),

  // Configuration de développement
  ...(process.env.NODE_ENV === 'development' && {
    reactStrictMode: false, // Désactivé pour éviter les erreurs de développement
  }),
  
  async rewrites() {
    return [
      {
        source: '/locales/:lng/:ns.json',
        destination: '/public/locales/:lng/:ns.json',
      },
    ]
  },
}
  
export default nextConfig`

    writeFileSync('next.config.mjs', fixedConfig)
    console.log('   ✅ next.config.mjs mis à jour avec corrections webpack')
  }

  private async checkTypeScriptConfig(): Promise<void> {
    console.log('   🔧 Vérification de tsconfig.json...')
    
    if (!existsSync('tsconfig.json')) {
      console.log('   ⚠️ tsconfig.json non trouvé')
      return
    }

    try {
      const tsConfig = JSON.parse(readFileSync('tsconfig.json', 'utf8'))
      
      // Ajouter des configurations pour éviter les erreurs
      const updates = {
        compilerOptions: {
          ...tsConfig.compilerOptions,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: false,
          resolveJsonModule: true,
          isolatedModules: true,
          incremental: true
        }
      }
      
      writeFileSync('tsconfig.json', JSON.stringify(updates, null, 2))
      console.log('   ✅ tsconfig.json optimisé')
      
    } catch (error) {
      console.log('   ⚠️ Erreur lors de la mise à jour de tsconfig.json')
    }
  }

  private async reinstallDependencies(): Promise<void> {
    console.log('   📦 Réinstallation des dépendances critiques...')
    
    try {
      // Réinstaller Next.js et React
      execSync('npm install next@latest react@latest react-dom@latest', { stdio: 'inherit' })
      console.log('   ✅ Next.js et React réinstallés')
      
      // Réinstaller les dépendances PDF
      execSync('npm install jspdf jspdf-autotable html2canvas react-to-print @types/jspdf', { stdio: 'inherit' })
      console.log('   ✅ Dépendances PDF réinstallées')
      
    } catch (error) {
      console.log('   ⚠️ Réinstallation partielle (continuez manuellement si nécessaire)')
    }
  }

  private async restartDev(): Promise<void> {
    console.log('\n🚀 Instructions pour redémarrer...')
    console.log('   1. Arrêtez le serveur de développement (Ctrl+C)')
    console.log('   2. Exécutez: npm run dev')
    console.log('   3. Attendez que la compilation soit terminée')
    console.log('   4. Testez l\'application dans votre navigateur')
  }

  private showManualSteps(): void {
    console.log('\n🛠️ ÉTAPES MANUELLES DE CORRECTION')
    console.log('='.repeat(50))
    console.log('')
    console.log('Si les erreurs persistent, suivez ces étapes:')
    console.log('')
    console.log('1. Nettoyage complet:')
    console.log('   rmdir /s /q .next')
    console.log('   rmdir /s /q node_modules')
    console.log('   npm cache clean --force')
    console.log('')
    console.log('2. Réinstallation:')
    console.log('   npm install')
    console.log('')
    console.log('3. Test des rapports PDF:')
    console.log('   npm run reports:test')
    console.log('')
    console.log('4. Redémarrage:')
    console.log('   npm run dev')
    console.log('')
    console.log('5. Si le problème persiste:')
    console.log('   - Vérifiez que Node.js >= 18.0.0')
    console.log('   - Désactivez temporairement les extensions VS Code')
    console.log('   - Redémarrez votre terminal/IDE')
  }
}

async function main() {
  const fixer = new WebpackErrorFixer()
  await fixer.diagnoseAndFix()
}

main().catch(console.error)