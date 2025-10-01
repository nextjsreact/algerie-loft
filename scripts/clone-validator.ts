#!/usr/bin/env tsx
/**
 * VALIDATEUR DE CONFIGURATION DES ENVIRONNEMENTS
 * ============================================
 *
 * Valide la configuration des environnements avant clonage
 * Vérifie les accès, permissions et cohérence
 */

import fetch from 'node-fetch'

interface ValidationResult {
  environment: string
  status: 'valid' | 'invalid' | 'warning'
  checks: {
    connectivity: boolean
    permissions: boolean
    tableAccess: boolean
    dataIntegrity: boolean
  }
  errors: string[]
  warnings: string[]
}

class EnvironmentValidator {
  private environments = ['prod', 'dev', 'test', 'learning'] as const

  /**
   * Validation complète d'un environnement
   */
  private async validateEnvironment(env: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      environment: env,
      status: 'valid',
      checks: {
        connectivity: false,
        permissions: false,
        tableAccess: false,
        dataIntegrity: false
      },
      errors: [],
      warnings: []
    }

    try {
      // Chargement de la configuration
      const config = this.loadEnvironmentConfig(env)
      if (!config) {
        result.status = 'invalid'
        result.errors.push(`Configuration manquante pour ${env}`)
        return result
      }

      // Test de connectivité
      result.checks.connectivity = await this.testConnectivity(config, env)
      if (!result.checks.connectivity) {
        result.status = 'invalid'
        result.errors.push(`Impossible de se connecter à ${env}`)
      }

      // Test des permissions
      if (result.checks.connectivity) {
        result.checks.permissions = await this.testPermissions(config, env)
        if (!result.checks.permissions) {
          result.status = 'invalid'
          result.errors.push(`Permissions insuffisantes pour ${env}`)
        }
      }

      // Test d'accès aux tables
      if (result.checks.permissions) {
        result.checks.tableAccess = await this.testTableAccess(config, env)
        if (!result.checks.tableAccess) {
          result.status = 'warning'
          result.warnings.push(`Accès limité aux tables pour ${env}`)
        }
      }

      // Test d'intégrité des données
      if (result.checks.tableAccess) {
        result.checks.dataIntegrity = await this.testDataIntegrity(config, env)
        if (!result.checks.dataIntegrity) {
          result.warnings.push(`Problèmes d'intégrité détectés pour ${env}`)
        }
      }

    } catch (error) {
      result.status = 'invalid'
      result.errors.push(`Erreur de validation: ${error}`)
    }

    return result
  }

  /**
   * Chargement de la configuration d'environnement
   */
  private loadEnvironmentConfig(env: string): any {
    const envFiles = {
      prod: 'env-backup/.env.prod',
      dev: 'env-backup/.env.development',
      test: 'env-backup/.env.test',
      learning: 'env-backup/.env.learning'
    }

    try {
      require('dotenv').config({ path: envFiles[env as keyof typeof envFiles] })

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !serviceKey || !anonKey) {
        return null
      }

      return { url, serviceKey, anonKey }
    } catch (error) {
      return null
    }
  }

  /**
   * Test de connectivité de base
   */
  private async testConnectivity(config: any, env: string): Promise<boolean> {
    try {
      const response = await fetch(`${config.url}/rest/v1/`, {
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
          'apikey': config.anonKey
        }
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Test des permissions
   */
  private async testPermissions(config: any, env: string): Promise<boolean> {
    try {
      // Test d'écriture
      const testData = { name: 'test', description: 'test' }

      const response = await fetch(`${config.url}/rest/v1/lofts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
          'apikey': config.anonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })

      // Nettoyage du test
      if (response.ok) {
        const result = await response.json()
        if (result && result[0] && result[0].id) {
          await fetch(`${config.url}/rest/v1/lofts?id=eq.${result[0].id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${config.serviceKey}`,
              'apikey': config.anonKey
            }
          })
        }
      }

      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Test d'accès aux tables principales
   */
  private async testTableAccess(config: any, env: string): Promise<boolean> {
    const testTables = ['lofts', 'profiles', 'settings']

    for (const table of testTables) {
      try {
        const response = await fetch(`${config.url}/rest/v1/${table}?select=id&limit=1`, {
          headers: {
            'Authorization': `Bearer ${config.serviceKey}`,
            'apikey': config.anonKey
          }
        })

        if (!response.ok) {
          return false
        }
      } catch (error) {
        return false
      }
    }

    return true
  }

  /**
   * Test d'intégrité des données
   */
  private async testDataIntegrity(config: any, env: string): Promise<boolean> {
    try {
      // Vérification de la cohérence des données
      const response = await fetch(`${config.url}/rest/v1/lofts?select=id,owner_id&limit=10`, {
        headers: {
          'Authorization': `Bearer ${config.serviceKey}`,
          'apikey': config.anonKey
        }
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json() as any[]

      // Vérification basique de cohérence
      for (const record of data) {
        if (!record.id || !record.owner_id) {
          return false
        }
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Validation complète de tous les environnements
   */
  public async validateAll(): Promise<void> {
    console.log('🔍 VALIDATION DES ENVIRONNEMENTS')
    console.log('='.repeat(50))

    const results: ValidationResult[] = []

    for (const env of this.environments) {
      console.log(`\n📋 VALIDATION: ${env.toUpperCase()}`)
      console.log('-'.repeat(30))

      const result = await this.validateEnvironment(env)
      results.push(result)

      // Affichage du résultat
      const icon = result.status === 'valid' ? '✅' :
                   result.status === 'warning' ? '⚠️' : '❌'

      console.log(`${icon} Statut: ${result.status.toUpperCase()}`)

      if (result.errors.length > 0) {
        console.log('❌ Erreurs:')
        result.errors.forEach(error => console.log(`   • ${error}`))
      }

      if (result.warnings.length > 0) {
        console.log('⚠️ Avertissements:')
        result.warnings.forEach(warning => console.log(`   • ${warning}`))
      }

      // Détail des vérifications
      console.log('🔍 Vérifications:')
      console.log(`   • Connectivité: ${result.checks.connectivity ? '✅' : '❌'}`)
      console.log(`   • Permissions: ${result.checks.permissions ? '✅' : '❌'}`)
      console.log(`   • Accès tables: ${result.checks.tableAccess ? '✅' : '❌'}`)
      console.log(`   • Intégrité: ${result.checks.dataIntegrity ? '✅' : '❌'}`)
    }

    // Résumé final
    this.printSummary(results)
  }

  /**
   * Affichage du résumé
   */
  private printSummary(results: ValidationResult[]): void {
    const valid = results.filter(r => r.status === 'valid').length
    const warnings = results.filter(r => r.status === 'warning').length
    const invalid = results.filter(r => r.status === 'invalid').length

    console.log('\n📊 RÉSUMÉ DE LA VALIDATION')
    console.log('='.repeat(50))
    console.log(`✅ Valides: ${valid}`)
    console.log(`⚠️ Avertissements: ${warnings}`)
    console.log(`❌ Invalides: ${invalid}`)

    if (invalid > 0) {
      console.log('\n❌ ERREURS CRITIQUES DÉTECTÉES:')
      results.forEach(result => {
        if (result.status === 'invalid') {
          console.log(`• ${result.environment.toUpperCase()}:`)
          result.errors.forEach(error => console.log(`  - ${error}`))
        }
      })
      console.log('\n💡 Le clonage ne peut pas fonctionner avec ces erreurs')
    } else if (warnings > 0) {
      console.log('\n⚠️ AVERTISSEMENTS:')
      results.forEach(result => {
        if (result.status === 'warning') {
          result.warnings.forEach(warning => console.log(`• ${result.environment.toUpperCase()}: ${warning}`))
        }
      })
      console.log('\n💡 Le clonage peut fonctionner mais avec des limitations')
    } else {
      console.log('\n✅ TOUS LES ENVIRONNEMENTS SONT VALIDES')
      console.log('💡 Le clonage peut procéder en toute sécurité')
    }
  }
}

// Exécution
async function main() {
  const validator = new EnvironmentValidator()
  await validator.validateAll()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}