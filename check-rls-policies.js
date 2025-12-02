/**
 * Script pour vérifier les politiques RLS sur la table owners
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('🔍 Vérification des politiques RLS sur la table owners...\n');

  try {
    // Requête pour vérifier les politiques RLS
    const { data: policies, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies
          WHERE tablename = 'owners'
          ORDER BY policyname;
        `
      })
      .catch(() => {
        // Si la fonction n'existe pas, utiliser une requête directe
        return supabase.from('pg_policies')
          .select('*')
          .eq('tablename', 'owners');
      });

    if (error) {
      console.log('⚠️  Impossible de vérifier les politiques RLS via l\'API');
      console.log('   Vérifiez manuellement dans Supabase Dashboard > Authentication > Policies\n');
      return;
    }

    if (!policies || policies.length === 0) {
      console.log('❌ Aucune politique RLS trouvée sur la table owners');
      console.log('\n📝 Action requise:');
      console.log('   Exécutez le script: 04-add-rls-policies.sql\n');
      console.log('   Ou exécutez manuellement dans Supabase SQL Editor:\n');
      console.log('   ```sql');
      console.log('   ALTER TABLE owners ENABLE ROW LEVEL SECURITY;');
      console.log('   ');
      console.log('   CREATE POLICY "Admins can do everything on owners"');
      console.log('     ON owners FOR ALL');
      console.log('     USING (');
      console.log('       EXISTS (');
      console.log('         SELECT 1 FROM profiles');
      console.log('         WHERE profiles.id = auth.uid()');
      console.log('         AND profiles.role IN (\'admin\', \'superuser\', \'manager\')');
      console.log('       )');
      console.log('     );');
      console.log('   ```\n');
      return false;
    }

    console.log('✅ Politiques RLS trouvées:\n');
    policies.forEach((policy, index) => {
      console.log(`${index + 1}. ${policy.policyname}`);
      console.log(`   - Commande: ${policy.cmd}`);
      console.log(`   - Rôles: ${policy.roles?.join(', ') || 'tous'}`);
      console.log('');
    });

    return true;

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Vérifiez manuellement dans Supabase Dashboard:');
    console.log('   1. Allez dans Table Editor > owners');
    console.log('   2. Cliquez sur "RLS" dans le menu');
    console.log('   3. Vérifiez que RLS est activé et que les politiques existent\n');
    return false;
  }
}

async function testOwnersAccess() {
  console.log('🧪 Test d\'accès à la table owners...\n');

  try {
    // Test avec service role (devrait fonctionner)
    const { data: owners, error } = await supabase
      .from('owners')
      .select('id, name, email, verification_status')
      .limit(5);

    if (error) {
      console.error('❌ Erreur d\'accès:', error.message);
      return false;
    }

    console.log(`✅ Accès réussi avec service role (${owners.length} propriétaires récupérés)\n`);
    
    if (owners.length > 0) {
      console.log('📋 Exemples de propriétaires:');
      owners.forEach((owner, index) => {
        console.log(`   ${index + 1}. ${owner.name} (${owner.verification_status})`);
      });
      console.log('');
    }

    return true;

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

async function checkLoftsRelation() {
  console.log('🏠 Vérification de la relation lofts -> owners...\n');

  try {
    const { data: lofts, error } = await supabase
      .from('lofts')
      .select(`
        id,
        title,
        new_owner_id,
        owner:owners!lofts_new_owner_id_fkey(name, email)
      `)
      .not('new_owner_id', 'is', null)
      .limit(5);

    if (error) {
      console.error('❌ Erreur:', error.message);
      console.log('\n⚠️  La relation lofts -> owners n\'est peut-être pas configurée');
      console.log('   Vérifiez que la foreign key existe:\n');
      console.log('   ALTER TABLE lofts ADD CONSTRAINT lofts_new_owner_id_fkey');
      console.log('   FOREIGN KEY (new_owner_id) REFERENCES owners(id);\n');
      return false;
    }

    console.log(`✅ Relation fonctionnelle (${lofts.length} lofts testés)\n`);
    
    if (lofts.length > 0) {
      console.log('📋 Exemples de lofts avec propriétaires:');
      lofts.forEach((loft, index) => {
        console.log(`   ${index + 1}. ${loft.title} → ${loft.owner?.name || 'N/A'}`);
      });
      console.log('');
    }

    return true;

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

async function runChecks() {
  console.log('🚀 Vérification complète du système owners\n');
  console.log('═'.repeat(60) + '\n');

  const rlsOk = await checkRLSPolicies();
  const accessOk = await testOwnersAccess();
  const relationOk = await checkLoftsRelation();

  console.log('═'.repeat(60));
  console.log('\n📊 Résumé:\n');
  console.log(`  ${rlsOk ? '✅' : '❌'} Politiques RLS`);
  console.log(`  ${accessOk ? '✅' : '❌'} Accès à la table owners`);
  console.log(`  ${relationOk ? '✅' : '❌'} Relation lofts -> owners`);

  if (rlsOk && accessOk && relationOk) {
    console.log('\n🎉 Tout fonctionne correctement!');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Tester la création d\'un loft dans l\'interface');
    console.log('   2. Vérifier que la liste des propriétaires s\'affiche');
    console.log('   3. Tester l\'édition d\'un loft existant');
    console.log('   4. Si tout fonctionne, finaliser la migration (supprimer anciennes tables)\n');
  } else {
    console.log('\n⚠️  Certaines vérifications ont échoué');
    console.log('   Consultez les messages ci-dessus pour plus de détails\n');
  }
}

runChecks()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
