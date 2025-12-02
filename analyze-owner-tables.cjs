const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeTables() {
  console.log('🔍 ANALYSE DES TABLES DE PROPRIÉTAIRES\n');
  console.log('='.repeat(60));

  // 1. loft_owners
  console.log('\n1️⃣ TABLE: loft_owners');
  console.log('-'.repeat(60));
  const { data: loftOwners, error: error1, count: count1 } = await supabase
    .from('loft_owners')
    .select('*', { count: 'exact' })
    .limit(5);

  if (error1) {
    console.log('❌ Erreur:', error1.message);
  } else {
    console.log(`✅ Nombre d'enregistrements: ${count1}`);
    if (loftOwners && loftOwners.length > 0) {
      console.log('📋 Colonnes:', Object.keys(loftOwners[0]).join(', '));
      console.log('\n📊 Exemples:');
      loftOwners.forEach((owner, i) => {
        console.log(`   ${i + 1}. ${owner.name || 'N/A'} (ID: ${owner.id})`);
      });
    } else {
      console.log('⚠️  Table vide');
    }
  }

  // 2. partners
  console.log('\n\n2️⃣ TABLE: partners');
  console.log('-'.repeat(60));
  const { data: partners, error: error2, count: count2 } = await supabase
    .from('partners')
    .select('*', { count: 'exact' })
    .limit(5);

  if (error2) {
    console.log('❌ Erreur:', error2.message);
  } else {
    console.log(`✅ Nombre d'enregistrements: ${count2}`);
    if (partners && partners.length > 0) {
      console.log('📋 Colonnes:', Object.keys(partners[0]).join(', '));
      console.log('\n📊 Exemples:');
      partners.forEach((partner, i) => {
        console.log(`   ${i + 1}. ${partner.name || partner.business_name || 'N/A'} (ID: ${partner.id})`);
      });
    } else {
      console.log('⚠️  Table vide');
    }
  }

  // 3. partner_profiles
  console.log('\n\n3️⃣ TABLE: partner_profiles');
  console.log('-'.repeat(60));
  const { data: partnerProfiles, error: error3, count: count3 } = await supabase
    .from('partner_profiles')
    .select('*', { count: 'exact' })
    .limit(5);

  if (error3) {
    console.log('❌ Erreur:', error3.message);
  } else {
    console.log(`✅ Nombre d'enregistrements: ${count3}`);
    if (partnerProfiles && partnerProfiles.length > 0) {
      console.log('📋 Colonnes:', Object.keys(partnerProfiles[0]).join(', '));
      console.log('\n📊 Exemples:');
      partnerProfiles.forEach((profile, i) => {
        console.log(`   ${i + 1}. ${profile.business_name || 'N/A'} (ID: ${profile.id})`);
      });
    } else {
      console.log('⚠️  Table vide');
    }
  }

  // 4. Vérifier l'utilisation dans les lofts
  console.log('\n\n4️⃣ UTILISATION DANS LES LOFTS');
  console.log('-'.repeat(60));
  const { data: lofts } = await supabase
    .from('lofts')
    .select('id, name, owner_id, partner_id')
    .limit(5);

  if (lofts && lofts.length > 0) {
    console.log('📋 Colonnes dans lofts:', Object.keys(lofts[0]).join(', '));
    console.log('\n📊 Exemples de lofts:');
    lofts.forEach((loft, i) => {
      console.log(`   ${i + 1}. ${loft.name}`);
      console.log(`      owner_id: ${loft.owner_id || 'NULL'}`);
      console.log(`      partner_id: ${loft.partner_id || 'NULL'}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 RECOMMANDATION:');
  console.log('   Utilisez UNE SEULE table pour éviter la confusion!');
  console.log('   Suggestion: Garder "partner_profiles" et supprimer les autres');
}

analyzeTables();
