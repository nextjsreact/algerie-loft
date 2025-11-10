import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLofts() {
  console.log('🔍 Vérification des lofts dans la base de données...\n');
  
  const { data, error, count } = await supabase
    .from('lofts')
    .select('id, name, status, address, price_per_night', { count: 'exact' })
    .limit(10);
  
  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }
  
  console.log(`✅ Total de lofts: ${count}`);
  console.log('\n📋 Premiers lofts:');
  console.log(JSON.stringify(data, null, 2));
}

checkLofts();
