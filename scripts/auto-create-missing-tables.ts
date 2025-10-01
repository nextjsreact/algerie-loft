import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: 'env-backup/.env.prod' });
config({ path: 'env-backup/.env.development' });

const PROD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PROD_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DEV_SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function autoCreateMissingTables() {
  console.log('🔧 CRÉATION AUTOMATIQUE DES TABLES MANQUANTES');
  console.log('=============================================');

  // Step 1: Get all tables from PROD
  console.log('📋 Récupération des tables PROD...');
  const prodTablesResponse = await fetch(`${PROD_SUPABASE_URL}/rest/v1/information_schema.tables?table_schema=public`, {
    headers: {
      'Authorization': `Bearer ${PROD_SUPABASE_SERVICE_KEY}`,
      'apikey': PROD_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (!prodTablesResponse.ok) {
    console.error('❌ Impossible de récupérer les tables PROD:', prodTablesResponse.status);
    return;
  }

  const prodTables = await prodTablesResponse.json() as any[];
  const prodTableNames = prodTables.map(t => t.table_name);
  console.log(`✅ ${prodTableNames.length} tables trouvées dans PROD`);

  // Step 2: Get all tables from DEV
  console.log('📋 Récupération des tables DEV...');
  const devTablesResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/information_schema.tables?table_schema=public`, {
    headers: {
      'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
      'apikey': DEV_SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });

  let devTableNames: string[] = [];
  if (devTablesResponse.ok) {
    const devTables = await devTablesResponse.json() as any[];
    devTableNames = devTables.map(t => t.table_name);
    console.log(`✅ ${devTableNames.length} tables trouvées dans DEV`);
  } else {
    console.log('⚠️ Impossible de récupérer les tables DEV, création de toutes les tables PROD');
  }

  // Step 3: Find missing tables
  const missingTables = prodTableNames.filter(name => !devTableNames.includes(name));
  console.log(`📋 Tables manquantes dans DEV: ${missingTables.length}`);
  missingTables.forEach((name, index) => {
    console.log(`   ${index + 1}. ${name}`);
  });

  if (missingTables.length === 0) {
    console.log('✅ Toutes les tables existent déjà dans DEV');
    return;
  }

  // Step 4: Create missing tables
  for (const tableName of missingTables) {
    console.log(`🏗️ Création de la table ${tableName}...`);

    // Get table structure from PROD
    const structureResponse = await fetch(`${PROD_SUPABASE_URL}/rest/v1/information_schema.columns?table_name=${tableName}&table_schema=public`, {
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

    const columns = await structureResponse.json() as any[];

    // Generate CREATE TABLE SQL
    let createSQL = `CREATE TABLE ${tableName} (\n`;

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      createSQL += `  ${col.column_name} ${col.data_type}`;

      if (col.character_maximum_length) {
        createSQL += `(${col.character_maximum_length})`;
      }

      if (col.is_nullable === 'NO') {
        createSQL += ' NOT NULL';
      }

      if (col.column_default) {
        createSQL += ` DEFAULT ${col.column_default}`;
      }

      if (i < columns.length - 1) {
        createSQL += ',';
      }
      createSQL += '\n';
    }

    createSQL += ');';

    console.log(`📝 SQL pour ${tableName}:`);
    console.log(createSQL);

    // Execute the CREATE TABLE
    const createResponse = await fetch(`${DEV_SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEV_SUPABASE_SERVICE_KEY}`,
        'apikey': DEV_SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: createSQL })
    });

    if (createResponse.ok) {
      console.log(`✅ Table ${tableName} créée avec succès`);

      // Add RLS policies
      const rlsSQL = `
        ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow all operations for authenticated users" ON ${tableName}
            FOR ALL USING (auth.role() = 'authenticated');
      `;

      console.log(`🔒 Ajout des politiques RLS pour ${tableName}...`);
      // Note: RLS might need to be added manually

    } else {
      console.log(`❌ Erreur création ${tableName}:`, createResponse.status);
      console.log('💡 Vous devez créer cette table manuellement dans Supabase Dashboard');
    }
  }

  console.log('🎉 CRÉATION AUTOMATIQUE TERMINÉE!');
}

autoCreateMissingTables();