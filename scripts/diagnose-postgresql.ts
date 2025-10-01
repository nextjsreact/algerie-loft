#!/usr/bin/env tsx
/**
 * Script de Diagnostic Avancé PostgreSQL
 * Identifie et résout les problèmes de configuration PostgreSQL
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

class PostgreSQLDiagnostic {
  async runFullDiagnostic() {
    console.log('🔍 DIAGNOSTIC AVANCÉ POSTGRESQL')
    console.log('='.repeat(50))

    // 1. Vérifier l'installation
    await this.checkInstallation()

    // 2. Vérifier le service
    await this.checkService()

    // 3. Vérifier les utilisateurs
    await this.checkUsers()

    // 4. Vérifier les méthodes d'authentification
    await this.checkAuthentication()

    // 5. Tester les connexions
    await this.testConnections()

    // 6. Proposer des solutions
    await this.proposeSolutions()
  }

  private async checkInstallation() {
    console.log('\n📦 VÉRIFICATION DE L\'INSTALLATION')
    console.log('-'.repeat(40))

    try {
      const version = execSync('psql --version', { encoding: 'utf8' })
      console.log(`✅ PostgreSQL installé: ${version.trim()}`)

      // Vérifier si pg_config existe
      try {
        const pgConfig = execSync('pg_config --version', { encoding: 'utf8' })
        console.log(`✅ Client PostgreSQL: ${pgConfig.trim()}`)
      } catch {
        console.log('⚠️ Client PostgreSQL non trouvé dans PATH')
      }

    } catch (error) {
      console.log('❌ PostgreSQL non installé ou non accessible')
      console.log('💡 Installation: https://www.postgresql.org/download/windows/')
    }
  }

  private async checkService() {
    console.log('\n🔧 VÉRIFICATION DU SERVICE')
    console.log('-'.repeat(40))

    try {
      // Windows
      if (process.platform === 'win32') {
        const serviceStatus = execSync('sc query postgresql-x64-15', { encoding: 'utf8' })
        if (serviceStatus.includes('RUNNING')) {
          console.log('✅ Service PostgreSQL en cours d\'exécution')
        } else {
          console.log('⚠️ Service PostgreSQL arrêté')
          console.log('💡 Démarrer: Services > PostgreSQL > Démarrer')
        }
      } else {
        // Linux/Mac
        const serviceStatus = execSync('systemctl status postgresql', { encoding: 'utf8' })
        if (serviceStatus.includes('active (running)')) {
          console.log('✅ Service PostgreSQL en cours d\'exécution')
        } else {
          console.log('⚠️ Service PostgreSQL arrêté')
        }
      }
    } catch (error) {
      console.log('❌ Impossible de vérifier le statut du service')
    }
  }

  private async checkUsers() {
    console.log('\n👥 VÉRIFICATION DES UTILISATEURS')
    console.log('-'.repeat(40))

    try {
      // Lister les utilisateurs PostgreSQL
      const users = execSync('psql -l -t | cut -d\\| -f1 | sed -e \'s/^[ \\t]*//\'', { encoding: 'utf8' })
      const userList = users.split('\n').filter(u => u.trim())

      console.log('📋 Bases de données trouvées:')
      userList.forEach(user => {
        if (user) console.log(`   - ${user}`)
      })

      // Vérifier si l'utilisateur postgres existe
      if (userList.includes('postgres')) {
        console.log('✅ Utilisateur postgres trouvé')
      } else {
        console.log('⚠️ Utilisateur postgres non trouvé')
        console.log('📋 Utilisateurs disponibles:', userList.join(', '))
      }

    } catch (error: any) {
      console.log('❌ Impossible de lister les utilisateurs')
      console.log('💡 Erreur:', error.message)
    }
  }

  private async checkAuthentication() {
    console.log('\n🔐 VÉRIFICATION DE L\'AUTHENTIFICATION')
    console.log('-'.repeat(40))

    // Vérifier le fichier de configuration PostgreSQL
    const configPaths = [
      'C:\\Program Files\\PostgreSQL\\15\\data\\pg_hba.conf',
      'C:\\Program Files\\PostgreSQL\\15\\data\\postgresql.conf',
      '/etc/postgresql/15/main/pg_hba.conf',
      '/etc/postgresql/15/main/postgresql.conf'
    ]

    let configFound = false
    for (const path of configPaths) {
      if (existsSync(path)) {
        console.log(`📄 Fichier de configuration trouvé: ${path}`)
        configFound = true

        // Afficher les méthodes d'authentification
        try {
          const hbaContent = execSync(`type "${path}" || cat "${path}"`, { encoding: 'utf8' })
          const authLines = hbaContent.split('\n').filter(line =>
            line.includes('local') || line.includes('host') || line.includes('md5') || line.includes('trust')
          )

          console.log('📋 Méthodes d\'authentification:')
          authLines.forEach(line => {
            if (line.trim() && !line.startsWith('#')) {
              console.log(`   ${line.trim()}`)
            }
          })
        } catch {
          console.log('⚠️ Impossible de lire le fichier de configuration')
        }
        break
      }
    }

    if (!configFound) {
      console.log('❌ Aucun fichier de configuration trouvé')
    }
  }

  private async testConnections() {
    console.log('\n🌐 TESTS DE CONNEXION')
    console.log('-'.repeat(40))

    const testCases = [
      { name: 'Connexion locale (trust)', conn: 'postgresql://postgres@localhost:5432/postgres' },
      { name: 'Connexion locale (md5)', conn: 'postgresql://postgres:password@localhost:5432/postgres' },
      { name: 'Connexion peer', conn: 'postgresql:///postgres' }
    ]

    for (const test of testCases) {
      try {
        execSync(`psql "${test.conn}" -c "SELECT version()"`, { stdio: 'pipe', timeout: 5000 })
        console.log(`✅ ${test.name}: RÉUSSI`)
      } catch (error: any) {
        console.log(`❌ ${test.name}: ÉCHEC - ${error.message.split('\n')[0]}`)
      }
    }
  }

  private async proposeSolutions() {
    console.log('\n💡 SOLUTIONS PROPOSÉES')
    console.log('='.repeat(40))

    console.log('\n🔧 SOLUTION 1 - Configuration Rapide (Recommandée)')
    console.log('1. Ouvrez l\'invite de commandes en tant qu\'Administrateur')
    console.log('2. Exécutez: net user postgres /add')
    console.log('3. Exécutez: psql -U postgres -c "ALTER USER postgres PASSWORD \'LoftAlgerie2025!\'"')
    console.log('4. Redémarrez le service PostgreSQL')

    console.log('\n🔧 SOLUTION 2 - Mode Trust Temporaire')
    console.log('1. Modifiez pg_hba.conf (ligne local all postgres: trust)')
    console.log('2. Redémarrez PostgreSQL')
    console.log('3. Exécutez: setup-local-databases.bat')
    console.log('4. Remettez md5 après configuration')

    console.log('\n🔧 SOLUTION 3 - Utilisateur Actuel')
    console.log('1. Identifiez l\'utilisateur actuel: whoami')
    console.log('2. Modifiez le script avec cet utilisateur')
    console.log('3. Utilisez le mot de passe de cet utilisateur')

    console.log('\n🔧 SOLUTION 4 - Réinstallation Propre')
    console.log('1. Désinstallez PostgreSQL complètement')
    console.log('2. Réinstallez avec les options par défaut')
    console.log('3. Utilisez le mot de passe défini lors de l\'installation')

    console.log('\n📞 COMMANDES UTILES:')
    console.log('- Vérifier le service: services.msc (Windows)')
    console.log('- Redémarrer PostgreSQL: pg_ctl restart -D "C:\\Program Files\\PostgreSQL\\15\\data"')
    console.log('- Éditer config: notepad "C:\\Program Files\\PostgreSQL\\15\\data\\pg_hba.conf"')
  }
}

// Exécution du diagnostic
async function main() {
  const diagnostic = new PostgreSQLDiagnostic()
  await diagnostic.runFullDiagnostic()
}

main().catch(console.error)