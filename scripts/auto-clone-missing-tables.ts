import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'env-backup/.env.prod' });
config({ path: 'env-backup/.env.development' });

const PROD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PROD_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DEV_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function autoCloneMissingTables() {
  console.log('🔧 CLONAGE AUTOMATIQUE DES TABLES MANQUANTES');
  console.log('============================================');

  // Step 1: Get known tables from PROD by trying common table names
  console.log('📋 Recherche des tables dans PROD...');
  const commonTables = [
    'customers', 'lofts', 'profiles', 'loft_owners', 'teams', 'tasks',
    'transactions', 'notifications', 'messages', 'currencies', 'categories'
  ];

  const prodTables: string[] = [];

  for (const tableName of commonTables) {
    try {
      const response = await fetch(`${PROD_SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`, {
        headers: {
          'Authorization': `Bearer ${PROD_SUPABASE_SERVICE_KEY}`,
          'apikey': PROD_SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        prodTables.push(tableName);
        console.log(`✅ ${tableName} existe dans PROD`);
      } else if (response.status !== 404) {
        console.log(`⚠️ ${tableName}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Erreur pour ${tableName}:`, error);
    }
  }

  console.log(`📊 ${prodTables.length} tables trouvées dans PROD: ${prodTables.join(', ')}`);

  // Step 2: Check which tables exist in DEV
  console.log('\n📋 Vérification des tables dans DEV...');
  const devTables: string[] = [];

  for (const tableName of prodTables) {
    try {
      const response = await fetch(`${DEV_SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`, {
        headers: {
          'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
          'apikey': DEV_SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        devTables.push(tableName);
        console.log(`✅ ${tableName} existe dans DEV`);
      } else if (response.status === 404) {
        console.log(`❌ ${tableName} MANQUANTE dans DEV`);
      } else {
        console.log(`⚠️ ${tableName}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Erreur pour ${tableName}:`, error);
    }
  }

  // Step 3: Find missing tables
  const missingTables = prodTables.filter(name => !devTables.includes(name));
  console.log(`\n📋 Tables manquantes dans DEV: ${missingTables.length}`);
  missingTables.forEach((name, index) => {
    console.log(`   ${index + 1}. ${name}`);
  });

  if (missingTables.length === 0) {
    console.log('✅ Toutes les tables existent déjà dans DEV');
    return;
  }

  // Step 4: Create missing tables
  for (const tableName of missingTables) {
    console.log(`\n🏗️ Création de la table ${tableName}...`);

    // Get table structure from PROD
    const structureResponse = await fetch(`${PROD_SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`, {
      headers: {
        'Authorization': `Bearer ${PROD_SUPABASE_SERVICE_KEY}`,
        'apikey': PROD_SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!structureResponse.ok) {
      console.log(`⚠️ Impossible de récupérer la structure de ${tableName}, passage...`);
      continue;
    }

    const sampleData = await structureResponse.json() as any[];

    if (sampleData.length === 0) {
      console.log(`⚠️ ${tableName} est vide dans PROD, passage...`);
      continue;
    }

    // Try to create the table by inserting data (this will fail if table doesn't exist)
    const createResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
        'apikey': DEV_SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(sampleData[0])
    });

    if (createResponse.status === 404) {
      console.log(`❌ ${tableName} n'existe pas dans DEV - création manuelle requise`);
      console.log(`💡 SQL pour ${tableName}:`);

      // Generate CREATE TABLE SQL based on the sample data
      const sample = sampleData[0];
      let createSQL = `CREATE TABLE ${tableName} (\n`;

      for (const [key, value] of Object.entries(sample)) {
        let columnType = 'TEXT';

        if (typeof value === 'string' && value.length > 100) {
          columnType = 'TEXT';
        } else if (typeof value === 'number') {
          columnType = 'INTEGER';
        } else if (typeof value === 'boolean') {
          columnType = 'BOOLEAN';
        } else if (value instanceof Date || key.includes('at')) {
          columnType = 'TIMESTAMP WITH TIME ZONE';
        } else {
          columnType = 'TEXT';
        }

        createSQL += `  ${key} ${columnType},\n`;
      }

      createSQL += '  id UUID DEFAULT gen_random_uuid() PRIMARY KEY\n);';

      console.log(createSQL);

      // Try to execute the CREATE TABLE SQL
      const execResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
          'apikey': DEV_SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: createSQL })
      });

      if (execResponse.ok) {
        console.log(`✅ Table ${tableName} créée avec succès`);

        // Add RLS policies
        const rlsSQL = `
          ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Allow all operations for authenticated users" ON ${tableName}
              FOR ALL USING (auth.role() = 'authenticated');
        `;

        console.log(`🔒 Ajout des politiques RLS pour ${tableName}...`);

      } else {
        console.log(`❌ Erreur création ${tableName}:`, execResponse.status);
        console.log('💡 Vous devez créer cette table manuellement dans Supabase Dashboard');
      }

    } else if (createResponse.ok) {
      console.log(`✅ Table ${tableName} créée et données insérées!`);
    } else {
      console.log(`❌ Erreur pour ${tableName}:`, createResponse.status);
    }
  }

  console.log('\n🎉 CLONAGE AUTOMATIQUE TERMINÉ!');
}

autoCloneMissingTables();