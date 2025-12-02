const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeStructures() {
  console.log('📊 ANALYSE DES STRUCTURES DE TABLES\n');
  console.log('='.repeat(70));

  // 1. loft_owners
  console.log('\n1️⃣ LOFT_OWNERS (18 enregistrements)');
  console.log('-'.repeat(70));
  const { data: loftOwner } = await supabase
    .from('loft_owners')
    .select('*')
    .limit(1)
    .single();

  if (loftOwner) {
    console.log('Colonnes:');
    Object.keys(loftOwner).forEach(key => {
      const value = loftOwner[key];
      const type = value === null ? 'NULL' : typeof value;
      console.log(`  - ${key.padEnd(25)} : ${type}`);
    });
  }

  // 2. partner_profiles
  console.log('\n\n2️⃣ PARTNER_PROFILES (8 enregistrements)');
  console.log('-'.repeat(70));
  const { data: partnerProfile } = await supabase
    .from('partner_profiles')
    .select('*')
    .limit(1)
    .single();

  if (partnerProfile) {
    console.log('Colonnes:');
    Object.keys(partnerProfile).forEach(key => {
      const value = partnerProfile[key];
      const type = value === null ? 'NULL' : typeof value;
      console.log(`  - ${key.padEnd(25)} : ${type}`);
    });
  }

  // 3. Comparaison
  console.log('\n\n3️⃣ COMPARAISON');
  console.log('-'.repeat(70));
  
  const loftOwnerFields = loftOwner ? Object.keys(loftOwner) : [];
  const partnerProfileFields = partnerProfile ? Object.keys(partnerProfile) : [];
  
  console.log('\n✅ Champs COMMUNS:');
  const common = loftOwnerFields.filter(f => partnerProfileFields.includes(f));
  common.forEach(f => console.log(`  - ${f}`));
  
  console.log('\n📌 Champs UNIQUEMENT dans loft_owners:');
  const onlyLoftOwners = loftOwnerFields.filter(f => !partnerProfileFields.includes(f));
  onlyLoftOwners.forEach(f => console.log(`  - ${f}`));
  
  console.log('\n📌 Champs UNIQUEMENT dans partner_profiles:');
  const onlyPartnerProfiles = partnerProfileFields.filter(f => !loftOwnerFields.includes(f));
  onlyPartnerProfiles.forEach(f => console.log(`  - ${f}`));

  console.log('\n\n4️⃣ TABLE UNIFIÉE PROPOSÉE');
  console.log('-'.repeat(70));
  console.log('Tous les champs des deux tables:');
  const allFields = [...new Set([...loftOwnerFields, ...partnerProfileFields])].sort();
  allFields.forEach(f => {
    const inLoft = loftOwnerFields.includes(f) ? '✓' : ' ';
    const inPartner = partnerProfileFields.includes(f) ? '✓' : ' ';
    console.log(`  [${inLoft}] loft_owners  [${inPartner}] partner_profiles  → ${f}`);
  });
}

analyzeStructures();
