/**
 * Script simple pour tester le système owners
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOwnersSystem() {
  console.log('🧪 Test du système owners\n');
  console.log('═'.repeat(60) + '\n');

  // 1. Lister tous les propriétaires
  console.log('1️⃣  Liste des propriétaires:\n');
  const { data: owners, error: ownersError } = await supabase
    .from('owners')
    .select('id, name, email, business_name, verification_status')
    .order('name');

  if (ownersError) {
    console.error('❌ Erreur:', ownersError.message);
  } else {
    console.log(`✅ ${owners.length} propriétaires trouvés\n`);
    owners.slice(0, 10).forEach((owner, i) => {
      const displayName = owner.business_name || owner.name;
      console.log(`   ${i + 1}. ${displayName} (${owner.verification_status})`);
    });
    if (owners.length > 10) {
      console.log(`   ... et ${owners.length - 10} autres`);
    }
  }

  // 2. Vérifier les lofts
  console.log('\n\n2️⃣  Vérification des lofts:\n');
  const { data: lofts, error: loftsError } = await supabase
    .from('lofts')
    .select('id, name, new_owner_id')
    .not('new_owner_id', 'is', null)
    .limit(10);

  if (loftsError) {
    console.error('❌ Erreur:', loftsError.message);
  } else {
    console.log(`✅ ${lofts.length} lofts avec new_owner_id\n`);
    lofts.forEach((loft, i) => {
      console.log(`   ${i + 1}. ${loft.name} (owner: ${loft.new_owner_id.substring(0, 8)}...)`);
    });
  }

  // 3. Test de la relation
  console.log('\n\n3️⃣  Test de la relation lofts -> owners:\n');
  const { data: loftsWithOwners, error: relationError } = await supabase
    .from('lofts')
    .select(`
      id,
      name,
      new_owner_id,
      owner:owners!lofts_new_owner_id_fkey(name, email, business_name)
    `)
    .not('new_owner_id', 'is', null)
    .limit(5);

  if (relationError) {
    console.error('❌ Erreur:', relationError.message);
    console.log('\n⚠️  La foreign key n\'existe peut-être pas encore');
    console.log('   Exécutez dans Supabase SQL Editor:\n');
    console.log('   ALTER TABLE lofts ADD CONSTRAINT lofts_new_owner_id_fkey');
    console.log('   FOREIGN KEY (new_owner_id) REFERENCES owners(id);\n');
  } else {
    console.log('✅ Relation fonctionnelle!\n');
    loftsWithOwners.forEach((loft, i) => {
      const ownerName = loft.owner?.business_name || loft.owner?.name || 'N/A';
      console.log(`   ${i + 1}. ${loft.name} → ${ownerName}`);
    });
  }

  // 4. Statistiques
  console.log('\n\n4️⃣  Statistiques:\n');
  
  const { count: totalOwners } = await supabase
    .from('owners')
    .select('*', { count: 'exact', head: true });

  const { count: ownersWithEmail } = await supabase
    .from('owners')
    .select('*', { count: 'exact', head: true })
    .not('email', 'is', null);

  const { count: ownersWithUserId } = await supabase
    .from('owners')
    .select('*', { count: 'exact', head: true })
    .not('user_id', 'is', null);

  const { count: verifiedOwners } = await supabase
    .from('owners')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'verified');

  const { count: totalLofts } = await supabase
    .from('lofts')
    .select('*', { count: 'exact', head: true });

  const { count: loftsWithNewOwnerId } = await supabase
    .from('lofts')
    .select('*', { count: 'exact', head: true })
    .not('new_owner_id', 'is', null);

  console.log('┌─────────────────────────────┬─────────┐');
  console.log('│ Métrique                    │ Valeur  │');
  console.log('├─────────────────────────────┼─────────┤');
  console.log(`│ Total propriétaires         │ ${totalOwners || 0}      │`);
  console.log(`│ Avec email                  │ ${ownersWithEmail || 0}      │`);
  console.log(`│ Avec compte utilisateur     │ ${ownersWithUserId || 0}       │`);
  console.log(`│ Vérifiés                    │ ${verifiedOwners || 0}      │`);
  console.log('├─────────────────────────────┼─────────┤');
  console.log(`│ Total lofts                 │ ${totalLofts || 0}      │`);
  console.log(`│ Lofts avec new_owner_id     │ ${loftsWithNewOwnerId || 0}      │`);
  console.log('└─────────────────────────────┴─────────┘');

  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Test terminé!\n');

  if (loftsWithNewOwnerId === totalLofts) {
    console.log('🎉 Tous les lofts ont un propriétaire assigné!');
  } else {
    console.log(`⚠️  ${totalLofts - loftsWithNewOwnerId} lofts sans propriétaire`);
  }

  console.log('\n📝 Prochaines étapes:');
  console.log('   1. Tester dans l\'interface web');
  console.log('   2. Créer/éditer un loft');
  console.log('   3. Vérifier que la liste des propriétaires s\'affiche');
  console.log('   4. Si tout fonctionne, finaliser la migration\n');
}

testOwnersSystem()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
