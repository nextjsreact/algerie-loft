/**
 * Script pour ajouter les politiques RLS sur la table owners
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addRLSPolicies() {
  console.log('🔒 Ajout des politiques RLS sur la table owners...\n');

  const policies = [
    {
      name: 'Admins can do everything on owners',
      sql: `
        CREATE POLICY "Admins can do everything on owners"
          ON owners
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'superuser', 'manager')
            )
          );
      `
    },
    {
      name: 'Owners can view their own data',
      sql: `
        CREATE POLICY "Owners can view their own data"
          ON owners
          FOR SELECT
          USING (user_id = auth.uid());
      `
    },
    {
      name: 'Owners can update their own data',
      sql: `
        CREATE POLICY "Owners can update their own data"
          ON owners
          FOR UPDATE
          USING (user_id = auth.uid());
      `
    }
  ];

  try {
    // Activer RLS
    console.log('1️⃣  Activation de RLS sur la table owners...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE owners ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError && !rlsError.message.includes('already enabled')) {
      console.log('⚠️  Impossible d\'activer RLS via l\'API');
      console.log('   Exécutez manuellement dans Supabase SQL Editor:\n');
      console.log('   ALTER TABLE owners ENABLE ROW LEVEL SECURITY;\n');
    } else {
      console.log('✅ RLS activé\n');
    }

    // Ajouter les politiques
    console.log('2️⃣  Ajout des politiques...\n');
    
    for (const policy of policies) {
      console.log(`   Ajout: ${policy.name}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: policy.sql
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log('   ⚠️  Politique déjà existante');
        } else {
          console.log(`   ❌ Erreur: ${error.message}`);
        }
      } else {
        console.log('   ✅ Ajoutée');
      }
    }

    console.log('\n✅ Politiques RLS configurées!\n');
    console.log('📝 Vérifiez dans Supabase Dashboard:');
    console.log('   Table Editor > owners > RLS\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.log('\n💡 Solution alternative:');
    console.log('   Exécutez le fichier 04-add-rls-policies.sql');
    console.log('   dans Supabase SQL Editor\n');
  }
}

addRLSPolicies()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
