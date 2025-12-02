const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUnifiedOwners() {
  console.log('🧪 TEST DE LA TABLE UNIFIÉE "owners"\n');
  console.log('='.repeat(70));

  // 1. Compter les propriétaires
  console.log('\n1️⃣ Comptage des propriétaires...');
  const { count, error: countError } = await supabase
    .from('owners')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Erreur:', countError.message);
    return;
  }

  console.log(`✅ Total: ${count} propriétaires`);

  // 2. Vérifier les types
  console.log('\n2️⃣ Répartition par type...');
  const { data: byType } = await supabase
    .from('owners')
    .select('verification_status, user_id')
    .order('verification_status');

  const withAccount = byType?.filter(o => o.user_id !== null).length || 0;
  const withoutAccount = byType?.filter(o => o.user_id === null).length || 0;
  const verified = byType?.filter(o => o.verification_status === 'verified').length || 0;
  const pending = byType?.filter(o => o.verification_status === 'pending').length || 0;

  console.log(`   Avec compte utilisateur: ${withAccount}`);
  console.log(`   Sans compte utilisateur: ${withoutAccount}`);
  console.log(`   Vérifiés: ${verified}`);
  console.log(`   En attente: ${pending}`);

  // 3. Afficher quelques exemples
  console.log('\n3️⃣ Exemples de propriétaires...');
  const { data: sample } = await supabase
    .from('owners')
    .select('name, email, business_name, verification_status, user_id')
    .limit(10);

  sample?.forEach((owner, i) => {
    const hasAccount = owner.user_id ? '👤' : '📋';
    const status = owner.verification_status === 'verified' ? '✅' : '⏳';
    console.log(`   ${i + 1}. ${hasAccount} ${status} ${owner.name}`);
    if (owner.business_name && owner.business_name !== owner.name) {
      console.log(`      Business: ${owner.business_name}`);
    }
  });

  // 4. Vérifier les lofts
  console.log('\n4️⃣ Vérification des lofts...');
  const { data: loftsCheck } = await supabase
    .from('lofts')
    .select('id, name, new_owner_id')
    .limit(5);

  const loftsWithOwner = loftsCheck?.filter(l => l.new_owner_id !== null).length || 0;
  console.log(`   Lofts avec new_owner_id: ${loftsWithOwner}/${loftsCheck?.length || 0}`);

  if (loftsCheck && loftsCheck.length > 0) {
    console.log('\n   Exemples:');
    loftsCheck.forEach((loft, i) => {
      const hasOwner = loft.new_owner_id ? '✅' : '❌';
      console.log(`   ${i + 1}. ${hasOwner} ${loft.name}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ TEST TERMINÉ!\n');
}

testUnifiedOwners();
