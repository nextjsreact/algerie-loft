#!/usr/bin/env tsx
/**
 * TEST DU CLONAGE INTELLIGENT FINAL - VERSION AUTOMATIQUE
 * =======================================================
 */

import { SmartCloneFinal } from './smart-clone-final'

// Créer une version de test qui ne demande pas de confirmation
class TestSmartCloneFinal extends SmartCloneFinal {
  // Override la méthode de confirmation pour les tests
  private async confirmCloning(): Promise<boolean> {
    console.log('🧪 MODE TEST - Confirmation automatique')
    return true
  }

  // Méthode de test qui clone seulement quelques tables
  public async testClone(): Promise<void> {
    try {
      console.log('🧪 TEST DU CLONAGE INTELLIGENT FINAL')
      console.log('='.repeat(50))

      // Tester seulement les tables problématiques
      const testTables = ['currencies', 'categories']
      
      let totalRecords = 0
      const startTime = Date.now()

      for (const tableName of testTables) {
        const result = await this.cloneTableSmart(tableName)
        totalRecords += result.records
      }

      // Résumé du test
      const duration = Date.now() - startTime
      console.log('\n📊 RÉSUMÉ DU TEST')
      console.log('='.repeat(30))
      console.log(`⏱️ Durée: ${Math.round(duration / 1000)}s`)
      console.log(`📈 Enregistrements: ${totalRecords}`)
      console.log('✅ Test terminé!')

    } catch (error) {
      console.error('💥 ERREUR TEST:', error)
      process.exit(1)
    }
  }

  // Exposer la méthode privée pour les tests
  public async cloneTableSmart(tableName: string) {
    return super['cloneTableSmart'](tableName)
  }
}

// Exécution du test
async function main() {
  const tester = new TestSmartCloneFinal()
  await tester.testClone()
}

main().catch(console.error)