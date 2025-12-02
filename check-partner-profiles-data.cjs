const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPartnerProfiles() {
  console.log('🔍 Vérification de la table partner_profiles...\n');

  const { data, error, count } = await supabase
    .from('partner_profiles')
    .select('*', { count: 'exact' })
    .order('business_name');

  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }

  console.log(`✅ Nombre de partenaires: ${count}\n`);

  if (data && data.length > 0) {
    console.log('📋 Liste des partenaires:');
    data.forEach((partner, index) => {
      console.log(`\n${index + 1}. ${partner.business_name || 'Sans nom'}`);
      console.log(`   ID: ${partner.id}`);
      console.log(`   Type: ${partner.business_type}`);
      console.log(`   Téléphone: ${partner.phone || 'N/A'}`);
      console.log(`   Statut: ${partner.verification_status}`);
    });
  } else {
    console.log('⚠️  Aucun partenaire trouvé dans la table');
    console.log('\n💡 Suggestion: Créez des partenaires via la page /settings/partners');
  }
}

checkPartnerProfiles();
