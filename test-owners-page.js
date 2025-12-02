/**
 * Script pour tester la requête de la page owners
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOwnersPage() {
  console.log('🧪 Test de la requête de la page owners...\n');

  try {
    // Test 1: Requête simple
    console.log('1️⃣  Test requête simple...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('owners')
      .select('*')
      .order('created_at', { ascending: false });

    if (simpleError) {
      console.error('❌ Erreur:', simpleError.message);
    } else {
      console.log(`✅ ${simpleData.length} propriétaires trouvés\n`);
    }

    // Test 2: Requête avec jointure (comme dans la page)
    console.log('2️⃣  Test requête avec jointure lofts...');
    const { data: joinData, error: joinError } = await supabase
      .from('owners')
      .select(`
        *,
        lofts:lofts!lofts_new_owner_id_fkey(id, price_per_night)
      `)
      .order('created_at', { ascending: false });

    if (joinError) {
      console.error('❌ Erreur:', joinError.message);
      console.log('\n💡 La foreign key "lofts_new_owner_id_fkey" n\'existe peut-être pas');
      console.log('   Essayons sans spécifier la foreign key...\n');

      // Test 3: Sans spécifier la foreign key
      console.log('3️⃣  Test requête avec jointure simple...');
      const { data: simpleJoinData, error: simpleJoinError } = await supabase
        .from('owners')
        .select(`
          *,
          lofts(id, price_per_night, new_owner_id)
        `)
        .order('created_at', { ascending: false });

      if (simpleJoinError) {
        console.error('❌ Erreur:', simpleJoinError.message);
      } else {
        console.log(`✅ ${simpleJoinData.length} propriétaires avec lofts\n`);
        
        // Afficher quelques exemples
        console.log('📋 Exemples:\n');
        simpleJoinData.slice(0, 5).forEach((owner, i) => {
          const lofts = owner.lofts || [];
          const loftCount = lofts.filter((l) => l.new_owner_id === owner.id).length;
          console.log(`   ${i + 1}. ${owner.name || owner.business_name}`);
          console.log(`      Lofts: ${loftCount}`);
        });
      }
    } else {
      console.log(`✅ ${joinData.length} propriétaires avec lofts\n`);
      
      // Afficher quelques exemples
      console.log('📋 Exemples:\n');
      joinData.slice(0, 5).forEach((owner, i) => {
        const lofts = owner.lofts || [];
        console.log(`   ${i + 1}. ${owner.name || owner.business_name}`);
        console.log(`      Lofts: ${lofts.length}`);
      });
    }

    console.log('\n═'.repeat(60));
    console.log('\n✅ Tests terminés!\n');

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
  }
}

testOwnersPage()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
