/**
 * Script pour créer la table urgent_announcements
 * 
 * Usage:
 * 1. Assurez-vous que vos variables d'environnement sont configurées
 * 2. Exécutez: npx tsx scripts/setup-announcements.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function setupAnnouncements() {
  // Vérifier les variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement manquantes !');
    console.log('\nAssurez-vous d\'avoir dans votre .env :');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('🚀 Création de la table urgent_announcements...\n');

  // Créer le client Supabase avec la clé service
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Lire le fichier SQL
  const sqlPath = path.join(process.cwd(), 'database', 'migrations', 'create_urgent_announcements.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  try {
    // Exécuter le SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Si la fonction exec_sql n'existe pas, on essaie directement
      console.log('⚠️  Méthode RPC non disponible, utilisez le SQL Editor de Supabase\n');
      console.log('📋 Copiez ce SQL dans Supabase SQL Editor :\n');
      console.log('─'.repeat(60));
      console.log(sql);
      console.log('─'.repeat(60));
      console.log('\n✅ Ensuite, cliquez sur "Run" dans Supabase');
      process.exit(0);
    }

    console.log('✅ Table créée avec succès !');
    console.log('\n📊 Vérification...');

    // Vérifier que la table existe
    const { data, error: checkError } = await supabase
      .from('urgent_announcements')
      .select('count')
      .limit(1);

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError.message);
      process.exit(1);
    }

    console.log('✅ Table vérifiée et opérationnelle !');
    console.log('\n🎉 Vous pouvez maintenant créer des annonces sur /admin/announcements');

  } catch (error) {
    console.error('❌ Erreur:', error);
    console.log('\n📋 Veuillez exécuter le SQL manuellement dans Supabase SQL Editor');
    process.exit(1);
  }
}

setupAnnouncements();
