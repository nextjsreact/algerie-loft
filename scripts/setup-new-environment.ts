#!/usr/bin/env tsx
/**
 * CONFIGURATION RAPIDE D'UN NOUVEL ENVIRONNEMENT
 * ==============================================
 * 
 * Configure automatiquement un nouvel environnement Supabase
 * Crée les fichiers de configuration et applique le schéma
 * 
 * Usage: npm run tsx scripts/setup-new-environment.ts <environment>
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { randomBytes } from 'crypto'

interface EnvironmentConfig {
  name: string
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
  authSecret: string
  appUrl: string
}

class EnvironmentSetup {
  private config!: EnvironmentConfig

  constructor(private envName: string) {}

  private async promptForConfig(): Promise<void> {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const question = (query: string): Promise<string> => {
      return new Promise(resolve => rl.question(query, resolve))
    }

    try {
      console.log(`🚀 Configuration de l'environnement ${this.envName.toUpperCase()}`)
      console.log('='.repeat(60))
      console.log('')
      console.log('📋 Informations requises depuis votre projet Supabase:')
      console.log('   • URL du projet (Settings → API)')
      console.log('   • Clé anonyme (anon/public)')
      console.log('   • Clé service role')
      console.log('')

      const supabaseUrl = await question('🔗 URL Supabase (ex: https://abc123.supabase.co): ')
      const anonKey = await question('🔑 Clé anonyme: ')
      const serviceRoleKey = await question('🔐 Clé service role: ')
      
      let appUrl = 'http://localhost:3000'
      if (this.envName === 'prod') {
        appUrl = await question('🌐 URL de production (ex: https://monapp.com): ')
      } else if (this.envName === 'test') {
        appUrl = await question('🧪 URL de test (ex: https://test.monapp.com) [Entrée pour localhost]: ')
        if (!appUrl.trim()) appUrl = 'http://localhost:3001'
      }

      this.config = {
        name: this.envName,
        supabaseUrl: supabaseUrl.trim(),
        anonKey: anonKey.trim(),
        serviceRoleKey: serviceRoleKey.trim(),
        authSecret: randomBytes(32).toString('hex'),
        appUrl: appUrl.trim()
      }

      console.log('')
      console.log('✅ Configuration collectée')
      console.log(`🔒 Secret d'authentification généré: ${this.config.authSecret.substring(0, 16)}...`)

    } finally {
      rl.close()
    }
  }

  private createEnvironmentFile(): void {
    console.log('\n📝 Création du fichier d\'environnement...')

    const envFileName = this.envName === 'dev' ? '.env.development' : 
                       this.envName === 'prod' ? '.env.production' : 
                       `.env.${this.envName}`

    const envContent = `# ===========================================
# ENVIRONNEMENT ${this.envName.toUpperCase()}
# ===========================================
# Généré automatiquement le ${new Date().toLocaleString()}

# Base de données Supabase
NEXT_PUBLIC_SUPABASE_URL=${this.config.supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${this.config.anonKey}
SUPABASE_SERVICE_ROLE_KEY="${this.config.serviceRoleKey}"

# Authentication
AUTH_SECRET=${this.config.authSecret}

# Application
NEXT_PUBLIC_APP_URL=${this.config.appUrl}
NODE_ENV=${this.envName === 'prod' ? 'production' : 'development'}

# Configuration spécifique à l'environnement
NEXT_PUBLIC_DEBUG_MODE=${this.envName !== 'prod' ? 'true' : 'false'}
LOG_LEVEL=${this.envName === 'prod' ? 'info' : 'debug'}

# Base de données
NEXT_PUBLIC_HAS_DB=true
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.${this.extractProjectRef()}.supabase.co:5432/postgres"

# Notifications temps réel
NEXT_PUBLIC_REALTIME_ENABLED=true

# Sécurité (Production uniquement)
${this.envName === 'prod' ? `
NEXT_PUBLIC_SECURE_MODE=true
NEXT_PUBLIC_ANALYTICS_ENABLED=true
` : `
NEXT_PUBLIC_SECURE_MODE=false
NEXT_PUBLIC_ANALYTICS_ENABLED=false
`}
`

    writeFileSync(envFileName, envContent)
    console.log(`   ✅ Fichier créé: ${envFileName}`)
  }

  private extractProjectRef(): string {
    const match = this.config.supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
    return match ? match[1] : 'unknown'
  }

  private async testConnection(): Promise<boolean> {
    console.log('\n🔌 Test de connexion...')

    try {
      const client = createClient(this.config.supabaseUrl, this.config.serviceRoleKey)
      
      // Test simple de connexion
      const { data, error } = await client
        .from('profiles')
        .select('count')
        .limit(1)

      if (error && !error.message.includes('relation "profiles" does not exist')) {
        console.log(`   ❌ Erreur de connexion: ${error.message}`)
        return false
      }

      console.log('   ✅ Connexion Supabase établie')
      return true

    } catch (error) {
      console.log(`   ❌ Erreur de test: ${error}`)
      return false
    }
  }

  private generateSchemaInstructions(): void {
    console.log('\n📋 Génération des instructions de schéma...')

    const projectRef = this.extractProjectRef()
    const instructions = `
# INSTRUCTIONS DE CONFIGURATION - ${this.envName.toUpperCase()}
# =============================================
# Généré le: ${new Date().toLocaleString()}

## 1. SCHÉMA DE BASE DE DONNÉES

### Option A: Via Supabase Dashboard (Recommandé)
1. Ouvrez: https://supabase.com/dashboard/project/${projectRef}
2. Allez dans "SQL Editor"
3. Créez une nouvelle requête
4. Copiez le contenu de \`database/complete-schema.sql\`
5. Exécutez le script

### Option B: Via Supabase CLI
\`\`\`bash
npx supabase db reset --project-ref ${projectRef} --file database/complete-schema.sql
\`\`\`

## 2. VÉRIFICATION

### Test de l'environnement
\`\`\`bash
npm run env:${this.envName}
npm run test-env
\`\`\`

### Validation complète
\`\`\`bash
npm run tsx scripts/validate-clone.ts ${this.envName}
\`\`\`

## 3. CLONAGE DE DONNÉES (Optionnel)

### Depuis PROD
\`\`\`bash
npm run tsx scripts/clone-environment-complet.ts prod ${this.envName}
\`\`\`

### Depuis TEST
\`\`\`bash
npm run tsx scripts/clone-environment-complet.ts test ${this.envName}
\`\`\`

## 4. DÉMARRAGE

### Basculer vers cet environnement
\`\`\`bash
npm run env:${this.envName}
\`\`\`

### Lancer l'application
\`\`\`bash
npm run dev
\`\`\`

## 5. CONFIGURATION AVANCÉE

### Variables d'environnement supplémentaires
Éditez \`.env.${this.envName === 'dev' ? 'development' : this.envName === 'prod' ? 'production' : this.envName}\` pour ajouter:
- Clés API externes
- Configuration SMTP
- Paramètres de cache
- etc.

### Permissions utilisateurs
Créez votre premier utilisateur admin via l'interface Supabase Auth.

## 6. SÉCURITÉ

### ${this.envName === 'prod' ? 'PRODUCTION' : 'DÉVELOPPEMENT/TEST'}
${this.envName === 'prod' ? `
⚠️ ATTENTION PRODUCTION:
- Vérifiez toutes les politiques RLS
- Configurez les sauvegardes automatiques
- Activez les logs de sécurité
- Testez la récupération d'urgence
` : `
✅ Environnement de développement:
- RLS simplifié pour faciliter les tests
- Logs détaillés activés
- Mode debug disponible
`}

## SUPPORT
- Documentation: GUIDE_CLONAGE_COMPLET.md
- Scripts utiles: scripts/
- Validation: npm run tsx scripts/validate-clone.ts ${this.envName}
`

    const instructionsPath = `setup_instructions_${this.envName}.md`
    writeFileSync(instructionsPath, instructions)
    console.log(`   📄 Instructions sauvegardées: ${instructionsPath}`)
  }

  private updatePackageJsonScripts(): void {
    console.log('\n⚙️ Mise à jour des scripts npm...')

    try {
      const packageJsonPath = 'package.json'
      if (!existsSync(packageJsonPath)) {
        console.log('   ⚠️ package.json non trouvé')
        return
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      
      // Ajouter les scripts spécifiques à l'environnement
      const newScripts = {
        [`env:${this.envName}`]: `powershell -ExecutionPolicy Bypass -File scripts/switch-env.ps1 -Environment ${this.envName}`,
        [`test:${this.envName}`]: `npm run env:${this.envName} && npm run test-env`,
        [`validate:${this.envName}`]: `npm run tsx scripts/validate-clone.ts ${this.envName}`,
        [`export:${this.envName}`]: `npm run tsx scripts/export-database.ts ${this.envName}`,
        [`backup:${this.envName}`]: `npm run tsx scripts/backup-database.ts ${this.envName}`
      }

      // Fusionner avec les scripts existants
      packageJson.scripts = { ...packageJson.scripts, ...newScripts }

      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
      console.log('   ✅ Scripts npm mis à jour')

    } catch (error) {
      console.log(`   ⚠️ Erreur mise à jour package.json: ${error}`)
    }
  }

  async executeSetup(): Promise<void> {
    console.log('🚀 CONFIGURATION NOUVEL ENVIRONNEMENT')
    console.log('='.repeat(60))

    try {
      // 1. Collecter la configuration
      await this.promptForConfig()

      // 2. Créer le fichier d'environnement
      this.createEnvironmentFile()

      // 3. Tester la connexion
      const connectionOk = await this.testConnection()

      // 4. Générer les instructions
      this.generateSchemaInstructions()

      // 5. Mettre à jour package.json
      this.updatePackageJsonScripts()

      // 6. Rapport final
      console.log('\n🎉 CONFIGURATION TERMINÉE!')
      console.log('='.repeat(50))
      console.log(`✅ Environnement ${this.envName.toUpperCase()} configuré`)
      console.log(`🔌 Connexion: ${connectionOk ? 'OK' : 'À vérifier'}`)
      console.log('')
      console.log('📋 PROCHAINES ÉTAPES:')
      console.log('1. Appliquez le schéma de base de données (voir instructions)')
      console.log('2. Testez la configuration: npm run test:' + this.envName)
      console.log('3. Clonez des données si nécessaire')
      console.log('4. Validez l\'environnement: npm run validate:' + this.envName)
      console.log('')
      console.log(`📄 Instructions détaillées: setup_instructions_${this.envName}.md`)

      if (!connectionOk) {
        console.log('')
        console.log('⚠️ ATTENTION: Problème de connexion détecté')
        console.log('   Vérifiez vos clés Supabase avant de continuer')
      }

    } catch (error) {
      console.error('❌ Erreur de configuration:', error)
      throw error
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 1) {
    console.log('📋 CONFIGURATION NOUVEL ENVIRONNEMENT')
    console.log('='.repeat(40))
    console.log('')
    console.log('Usage: npm run tsx scripts/setup-new-environment.ts <environment>')
    console.log('')
    console.log('Environnements disponibles: prod, test, dev')
    console.log('')
    console.log('Exemples:')
    console.log('• npm run tsx scripts/setup-new-environment.ts test')
    console.log('• npm run tsx scripts/setup-new-environment.ts dev')
    console.log('• npm run tsx scripts/setup-new-environment.ts prod')
    console.log('')
    console.log('⚠️ Assurez-vous d\'avoir créé le projet Supabase au préalable')
    return
  }

  const [environment] = args
  
  if (!['prod', 'test', 'dev'].includes(environment)) {
    console.log('❌ Environnement non valide. Utilisez: prod, test, dev')
    return
  }

  try {
    const setup = new EnvironmentSetup(environment)
    await setup.executeSetup()
  } catch (error) {
    console.error('❌ Erreur de configuration:', error)
    process.exit(1)
  }
}

main().catch(console.error)