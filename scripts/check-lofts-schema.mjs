import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Vérification du schéma de la table lofts...\n');
  
  // Essayer d'insérer un loft minimal pour voir les colonnes requises
  const testLoft = {
    name: 'Test Loft',
    address: 'Test Address',
    price_per_night: 5000,
    status: 'available'
  };
  
  const { data, error } = await supabase
    .from('lofts')
    .insert([testLoft])
    .select();
  
  if (error) {
    console.error('❌ Erreur lors de l\'insertion:', error);
  } else {
    console.log('✅ Loft de test créé:', data);
    
    // Supprimer le loft de test
    if (data && data[0]) {
      await supabase.from('lofts').delete().eq('id', data[0].id);
      console.log('🗑️ Loft de test supprimé');
    }
  }
}

checkSchema();
