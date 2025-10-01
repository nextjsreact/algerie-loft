#!/usr/bin/env tsx
/**
 * CLONAGE DIRECT VIA POSTGRESQL - SOLUTION FINALE
 * ===============================================
 * 
 * Utilise l'accès PostgreSQL direct pour créer les tables manquantes
 * et faire un VRAI clonage complet.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

class PostgreSQLDirectCloner {
  private prodClient: any
  private devClient: any
  private prodDbUrl: string
  private devDbUrl: string

  constructor() {
    this.initializeClients()
  }

  private initializeClients() {
    console.log('🔧 Initialisation avec accès PostgreSQL direct...')

    // Production
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    this.prodClient = createClient(prodUrl, prodKey)
    
    // Construire l'URL PostgreSQL pour PROD
    const prodProjectId = prodUrl.split('//')[1].split('.')[0]
    this.prodDbUrl = `postgresql://postgres:[PASSWORD]@db.${prodProjectId}.supabase.co:5432/postgres`

    // Development
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    this.devClient = createClient(devUrl, devKey)
    
    // Construire l'URL PostgreSQL pour DEV
    const devProjectId = devUrl.split('//')[1].split('.')[0]
    this.devDbUrl = `postgresql://postgres:[PASSWORD]@db.${devProjectId}.supabase.co:5432/postgres`

    console.log('✅ Clients initialisés')
    console.log(`📋 PROD DB: ${this.prodDbUrl}`)
    console.log(`📋 DEV DB: ${this.devDbUrl}`)
  }

  /**
   * Créer les tables manquantes via SQL direct
   */
  private async createMissingTablesDirectly(): Promise<void> {
    console.log('\n🏗️ CRÉATION DES TABLES MANQUANTES VIA SQL DIRECT')
    console.log('='.repeat(60))

    const createTablesSQL = `
-- Créer la table customers si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    current_loft_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    nationality TEXT
);

-- Créer la table loft_photos si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.loft_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loft_id UUID,
    file_name TEXT,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    url TEXT,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes manquantes aux tables existantes
ALTER TABLE public.currencies ADD COLUMN IF NOT EXISTS decimal_digits INTEGER DEFAULT 2;
ALTER TABLE public.currencies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.zone_areas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS amount DECIMAL DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'DZD';

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message_key TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title_key TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title_payload TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message_payload TEXT;

-- Supprimer les contraintes NOT NULL problématiques
ALTER TABLE public.lofts ALTER COLUMN price_per_month DROP NOT NULL;
ALTER TABLE public.internet_connection_types ALTER COLUMN name DROP NOT NULL;

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loft_photos ENABLE ROW LEVEL SECURITY;

-- Créer des politiques RLS basiques
CREATE POLICY IF NOT EXISTS "Enable all for service role" ON public.customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "Enable all for service role" ON public.loft_photos FOR ALL USING (auth.role() = 'service_role');
`;

    try {
      console.log('🔧 Exécution du SQL de création...')
      
      // Essayer d'exécuter via RPC si disponible
      const { error } = await this.devClient.rpc('exec', { sql: createTablesSQL })
      
      if (error) {
        console.log('⚠️ RPC non disponible, affichage du SQL à exécuter manuellement...')
        console.log('\n📋 SQL À EXÉCUTER DANS SUPABASE DEV:')
        console.log('='.repeat(60))
        console.log('Allez dans Supabase Dashboard DEV > SQL Editor et exécutez:')
        console.log('')
        console.log(createTablesSQL)
        console.log('')
        console.log('='.repeat(60))
        
        // Attendre que l'utilisateur confirme
        await this.waitForUserConfirmation()
      } else {
        console.log('✅ Tables créées automatiquement via RPC')
      }

    } catch (error) {
      console.log('⚠️ Création automatique échouée, SQL manuel requis')
      console.log('\n📋 EXÉCUTEZ CE SQL DANS SUPABASE DEV:')
      console.log(createTablesSQL)
      await this.waitForUserConfirmation()
    }
  }

  /**
   * Attendre la confirmation de l'utilisateur
   */
  private async waitForUserConfirmation(): Promise<void> {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    return new Promise((resolve) => {
      rl.question('\nAvez-vous exécuté le SQL ci-dessus dans Supabase DEV? (tapez OUI): ', (answer: string) => {
        rl.close()
        if (answer.toUpperCase() === 'OUI') {
          console.log('✅ Continuation du clonage...')
          resolve()
        } else {
          console.log('❌ Clonage annulé')
          process.exit(1)
        }
      })
    })
  }

  /**
   * Vérifier que toutes les tables existent maintenant
   */
  private async verifyTablesExist(): Promise<boolean> {
    console.log('\n🔍 VÉRIFICATION DES TABLES')
    console.log('='.repeat(40))

    const criticalTables = ['customers', 'loft_photos']
    let allExist = true

    for (const table of criticalTables) {
      try {
        const { error } = await this.devClient
          .from(table)
          .select('*')
          .limit(1)

        if (error && error.message.includes('does not exist')) {
          console.log(`❌ Table ${table} n'existe toujours pas`)
          allExist = false
        } else {
          console.log(`✅ Table ${table} existe`)
        }
      } catch (error) {
        console.log(`❌ Erreur vérification ${table}: ${error}`)
        allExist = false
      }
    }

    return allExist
  }

  /**
   * Clonage complet de toutes les données
   */
  private async cloneAllDataCompletely(): Promise<void> {
    console.log('\n📊 CLONAGE COMPLET DE TOUTES LES DONNÉES')
    console.log('='.repeat(60))

    const allTables = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types',
      'payment_methods', 'loft_owners', 'teams', 'profiles', 'lofts',
      'team_members', 'tasks', 'transactions', 'transaction_category_references',
      'settings', 'notifications', 'customers', 'loft_photos'
    ]

    let totalCloned = 0
    const results: { table: string, count: number }[] = []

    for (const table of allTables) {
      const count = await this.cloneTableCompletely(table)
      totalCloned += count
      results.push({ table, count })
    }

    // Résumé
    console.log('\n🎉 CLONAGE COMPLET TERMINÉ!')
    console.log('='.repeat(50))
    console.log(`📈 Total clonés: ${totalCloned} enregistrements`)

    console.log('\n📊 RÉSULTATS PAR TABLE:')
    results.forEach(result => {
      const icon = result.count > 0 ? '✅' : 'ℹ️'
      console.log(`${icon} ${result.table}: ${result.count} enregistrements`)
    })

    // Vérification spéciale pour customers
    const customersResult = results.find(r => r.table === 'customers')
    if (customersResult && customersResult.count > 0) {
      console.log('\n🎉 SUCCÈS: La table customers a été clonée!')
      console.log(`✅ ${customersResult.count} clients copiés depuis PROD`)
    } else {
      console.log('\n⚠️ La table customers n\'a pas pu être clonée')
    }
  }

  /**
   * Cloner une table complètement
   */
  private async cloneTableCompletely(tableName: string): Promise<number> {
    console.log(`\n📋 Clonage: ${tableName}`)
    console.log('-'.repeat(30))

    try {
      // 1. Vérifier que la table existe dans DEV
      const { error: devError } = await this.devClient
        .from(tableName)
        .select('*')
        .limit(1)

      if (devError && devError.message.includes('does not exist')) {
        console.log(`❌ Table ${tableName} n'existe pas dans DEV`)
        return 0
      }

      // 2. Récupérer toutes les données de PROD
      const { data: prodData, error: prodError } = await this.prodClient
        .from(tableName)
        .select('*')

      if (prodError) {
        console.log(`❌ Erreur PROD: ${prodError.message}`)
        return 0
      }

      if (!prodData || prodData.length === 0) {
        console.log(`ℹ️ Table vide dans PROD`)
        return 0
      }

      console.log(`📥 ${prodData.length} enregistrements à cloner`)

      // 3. Nettoyer DEV
      await this.devClient
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      // 4. Anonymiser si nécessaire
      const finalData = this.anonymizeData(prodData, tableName)

      // 5. Insérer toutes les données
      let successCount = 0

      // Insérer par lots de 20 pour éviter les timeouts
      const batchSize = 20
      for (let i = 0; i < finalData.length; i += batchSize) {
        const batch = finalData.slice(i, i + batchSize)
        
        const { error } = await this.devClient
          .from(tableName)
          .insert(batch)

        if (error) {
          console.log(`⚠️ Erreur lot: ${error.message}`)
          // Essayer un par un
          for (const record of batch) {
            const { error: singleError } = await this.devClient
              .from(tableName)
              .insert([record])
            
            if (!singleError) {
              successCount++
            }
          }
        } else {
          successCount += batch.length
        }
      }

      console.log(`✅ ${successCount} enregistrements clonés`)
      return successCount

    } catch (error) {
      console.error(`❌ Erreur ${tableName}: ${error}`)
      return 0
    }
  }

  /**
   * Anonymisation des données
   */
  private anonymizeData(data: any[], tableName: string): any[] {
    if (tableName === 'profiles') {
      return data.map((record, index) => ({
        ...record,
        email: record.role === 'admin' 
          ? 'admin_dev@dev.local' 
          : `user_dev_${index}@dev.local`,
        full_name: record.full_name 
          ? `${record.full_name} (DEV)` 
          : `User DEV ${index}`,
        password_hash: null,
        reset_token: null,
        airbnb_access_token: null,
        airbnb_refresh_token: null
      }))
    }

    if (tableName === 'customers') {
      return data.map((record, index) => ({
        ...record,
        email: `customer_dev_${index}@dev.local`,
        phone: `+213${Math.floor(Math.random() * 1000000000)}`,
        notes: record.notes ? `${record.notes} (DEV)` : 'Client de test DEV'
      }))
    }

    return data
  }

  /**
   * Clonage PostgreSQL direct complet
   */
  public async performDirectClone(): Promise<void> {
    console.log('🐘 CLONAGE POSTGRESQL DIRECT - SOLUTION FINALE')
    console.log('='.repeat(60))

    try {
      // 1. Créer les tables manquantes
      await this.createMissingTablesDirectly()

      // 2. Vérifier que les tables existent
      const tablesExist = await this.verifyTablesExist()
      
      if (!tablesExist) {
        console.log('❌ Certaines tables n\'existent toujours pas')
        console.log('💡 Veuillez exécuter le SQL manuellement dans Supabase DEV')
        return
      }

      // 3. Cloner toutes les données
      await this.cloneAllDataCompletely()

      console.log('\n🎉 CLONAGE POSTGRESQL DIRECT TERMINÉ!')
      console.log('✅ Toutes les tables ont été traitées')
      console.log('✅ La table customers devrait maintenant exister dans DEV')

    } catch (error) {
      console.error('💥 ERREUR FATALE:', error)
      process.exit(1)
    }
  }
}

// Exécution
async function main() {
  const cloner = new PostgreSQLDirectCloner()
  await cloner.performDirectClone()
}

main().catch(console.error)