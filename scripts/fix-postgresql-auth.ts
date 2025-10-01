#!/usr/bin/env tsx
/**
 * Script de Correction Automatique PostgreSQL
 * Résout les problèmes d'authentification courants
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

class PostgreSQLFixer {
  private pgHbaPath = 'C:\\Program Files\\PostgreSQL\\15\\data\\pg_hba.conf'
  private pgConfPath = 'C:\\Program Files\\PostgreSQL\\15\\data\\postgresql.conf'

  async runAutoFix() {
    console.log('🔧 CORRECTION AUTOMATIQUE POSTGRESQL')
    console.log('='.repeat(50))

    // 1. Diagnostiquer le problème
    const diagnosis = await this.diagnoseIssue()

    // 2. Appliquer les corrections
    await this.applyFixes(diagnosis)

    // 3. Tester les corrections
    await this.testFixes()

    // 4. Proposer les étapes suivantes
    await this.showNextSteps()
  }

  private async diagnoseIssue(): Promise<string> {
    console.log('\n🔍 DIAGNOSTIC DU PROBLÈME')
    console.log('-'.repeat(40))

    try {
      // Tester différentes méthodes de connexion
      const testResults = {
        trust: false,
        peer: false,
        md5: false
      }

      // Test trust
      try {
        execSync('psql -h localhost -U postgres postgres -c "SELECT 1"', { stdio: 'pipe', timeout: 3000 })
        testResults.trust = true
        console.log('✅ Authentification TRUST détectée')
        return 'trust'
      } catch {}

      // Test peer
      try {
        execSync('psql postgres -c "SELECT 1"', { stdio: 'pipe', timeout: 3000 })
        testResults.peer = true
        console.log('✅ Authentification PEER détectée')
        return 'peer'
      } catch {}

      // Test md5 avec mot de passe par défaut
      try {
        execSync('psql -h localhost -U postgres -d postgres -c "SELECT 1"', { stdio: 'pipe', timeout: 3000 })
        testResults.md5 = true
        console.log('✅ Authentification MD5 détectée')
        return 'md5'
      } catch {}

      console.log('❌ Aucune méthode d\'authentification ne fonctionne')
      return 'unknown'

    } catch (error: any) {
      console.log('❌ Erreur lors du diagnostic:', error.message)
      return 'error'
    }
  }

  private async applyFixes(diagnosis: string) {
    console.log('\n🔧 APPLICATION DES CORRECTIONS')
    console.log('-'.repeat(40))

    switch (diagnosis) {
      case 'trust':
        console.log('✅ Configuration TRUST déjà active')
        break

      case 'peer':
        console.log('🔄 Conversion PEER vers TRUST...')
        await this.convertPeerToTrust()
        break

      case 'md5':
        console.log('🔄 Configuration MD5 détectée, test du mot de passe...')
        await this.testDefaultPasswords()
        break

      default:
        console.log('🔧 Application de la solution universelle...')
        await this.applyUniversalFix()
    }
  }

  private async convertPeerToTrust() {
    try {
      if (!existsSync(this.pgHbaPath)) {
        console.log('❌ Fichier pg_hba.conf non trouvé')
        return
      }

      let content = readFileSync(this.pgHbaPath, 'utf8')

      // Remplacer peer par trust pour les connexions locales
      content = content.replace(/local\s+all\s+postgres\s+peer/g, 'local   all             postgres                                trust')

      writeFileSync(this.pgHbaPath, content)
      console.log('✅ Configuration convertie de PEER vers TRUST')

      // Redémarrer PostgreSQL
      await this.restartPostgreSQL()

    } catch (error: any) {
      console.log('❌ Erreur lors de la conversion:', error.message)
    }
  }

  private async testDefaultPasswords() {
    const passwords = ['postgres', 'password', '123456', 'admin', 'root', 'LoftAlgerie2025!']

    for (const pwd of passwords) {
      try {
        const connString = `postgresql://postgres:${pwd}@localhost:5432/postgres`
        execSync(`psql "${connString}" -c "SELECT 1"`, { stdio: 'pipe', timeout: 3000 })
        console.log(`✅ Mot de passe trouvé: ${pwd}`)
        console.log(`💡 Utilisez ce mot de passe dans vos scripts`)
        return
      } catch {
        console.log(`❌ Mot de passe ${pwd} incorrect`)
      }
    }

    console.log('⚠️ Aucun mot de passe par défaut ne fonctionne')
  }

  private async applyUniversalFix() {
    console.log('🔧 Application de la solution universelle...')

    try {
      // 1. Créer l'utilisateur postgres s'il n'existe pas
      console.log('👤 Création de l\'utilisateur postgres...')
      try {
        execSync('net user postgres /add', { stdio: 'pipe' })
        console.log('✅ Utilisateur postgres créé')
      } catch {
        console.log('ℹ️ Utilisateur postgres existe déjà')
      }

      // 2. Modifier pg_hba.conf pour utiliser trust
      if (existsSync(this.pgHbaPath)) {
        let content = readFileSync(this.pgHbaPath, 'utf8')

        // Ajouter ou modifier les lignes pour trust
        const trustLines = [
          'local   all             postgres                                trust',
          'host    all             postgres        127.0.0.1/32            trust',
          'host    all             postgres        ::1/128                 trust'
        ]

        // Supprimer les lignes existantes pour postgres
        content = content.replace(/.*postgres.*\n/g, '')

        // Ajouter les nouvelles lignes
        content += '\n# Configuration pour Loft Algerie\n'
        trustLines.forEach(line => {
          content += line + '\n'
        })

        writeFileSync(this.pgHbaPath, content)
        console.log('✅ Configuration TRUST ajoutée')
      }

      // 3. Redémarrer PostgreSQL
      await this.restartPostgreSQL()

    } catch (error: any) {
      console.log('❌ Erreur lors de la correction universelle:', error.message)
    }
  }

  private async restartPostgreSQL() {
    try {
      console.log('🔄 Redémarrage de PostgreSQL...')

      // Windows
      execSync('sc stop postgresql-x64-15', { stdio: 'pipe' })
      execSync('sc start postgresql-x64-15', { stdio: 'pipe' })

      // Attendre que le service démarre
      await new Promise(resolve => setTimeout(resolve, 3000))

      console.log('✅ PostgreSQL redémarré')
    } catch (error: any) {
      console.log('⚠️ Impossible de redémarrer automatiquement PostgreSQL')
      console.log('💡 Redémarrez manuellement via Services > PostgreSQL')
    }
  }

  private async testFixes() {
    console.log('\n🧪 TEST DES CORRECTIONS')
    console.log('-'.repeat(40))

    try {
      execSync('psql -h localhost -U postgres postgres -c "SELECT version()"', { stdio: 'pipe', timeout: 5000 })
      console.log('✅ Connexion PostgreSQL réussie !')
      console.log('✅ Corrections appliquées avec succès')
    } catch (error: any) {
      console.log('❌ Les corrections n\'ont pas fonctionné')
      console.log('💡 Voir les solutions manuelles ci-dessous')
    }
  }

  private async showNextSteps() {
    console.log('\n🎯 PROCHAINES ÉTAPES')
    console.log('='.repeat(40))

    console.log('\n✅ Si les corrections ont fonctionné :')
    console.log('1. Exécutez: setup-local-databases.bat')
    console.log('2. Testez: diagnose-connections.bat')
    console.log('3. Clonez: clone-pg-to-dev.bat')

    console.log('\n❌ Si les corrections n\'ont pas fonctionné :')
    console.log('1. Ouvrez Services (services.msc)')
    console.log('2. Trouvez "postgresql-x64-15"')
    console.log('3. Cliquez droit > Redémarrer')
    console.log('4. Réessayez: fix-postgresql-auth.bat')

    console.log('\n🔧 Solutions manuelles :')
    console.log('1. Éditez: C:\\Program Files\\PostgreSQL\\15\\data\\pg_hba.conf')
    console.log('2. Changez "md5" par "trust" sur les lignes locales')
    console.log('3. Redémarrez PostgreSQL')
    console.log('4. Testez: psql -U postgres -d postgres -c "SELECT 1"')
  }
}

// Exécution de la correction
async function main() {
  const fixer = new PostgreSQLFixer()
  await fixer.runAutoFix()
}

main().catch(console.error)