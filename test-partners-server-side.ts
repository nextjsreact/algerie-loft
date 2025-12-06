/**
 * Test Server-Side : Vérifier les partners depuis le serveur
 * 
 * Exécutez : npx tsx test-partners-server-side.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes !');
  console.error('Vérifiez : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function testPartners() {
  console.log('🔍 Test des Partners - Server Side\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Créer un client Supabase avec la clé service (bypass RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Test 1 : Compter tous les owners
    console.log('📊 Test 1 : Compter tous les owners');
    const { count: totalCount, error: countError } = await supabase
      .from('owners')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur:', countError.message);
    } else {
      console.log(`✅ Total owners : ${totalCount}`);
    }
    console.log('');

    // Test 2 : Compter les partners (user_id NOT NULL)
    console.log('📊 Test 2 : Compter les partners');
    const { count: partnersCount, error: partnersCountError } = await supabase
      .from('owners')
      .select('*', { count: 'exact', head: true })
      .not('user_id', 'is', null);

    if (partnersCountError) {
      console.error('❌ Erreur:', partnersCountError.message);
    } else {
      console.log(`✅ Total partners : ${partnersCount}`);
    }
    console.log('');

    // Test 3 : Récupérer les partners avec détails
    console.log('📊 Test 3 : Récupérer les partners');
    const { data: partners, error: partnersError } = await supabase
      .from('owners')
      .select('*')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false });

    if (partnersError) {
      console.error('❌ Erreur:', partnersError.message);
    } else {
      console.log(`✅ Partners récupérés : ${partners?.length || 0}\n`);
      
      if (partners && partners.length > 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Détails des Partners :');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        partners.forEach((partner, index) => {
          console.log(`Partner ${index + 1}:`);
          console.log(`  ID: ${partner.id}`);
          console.log(`  Nom: ${partner.name || 'N/A'}`);
          console.log(`  Business: ${partner.business_name || 'N/A'}`);
          console.log(`  Email: ${partner.email || 'N/A'}`);
          console.log(`  Téléphone: ${partner.phone || 'N/A'}`);
          console.log(`  Statut: ${partner.verification_status || 'N/A'}`);
          console.log(`  User ID: ${partner.user_id}`);
          console.log(`  Créé le: ${partner.created_at}`);
          
          if (partner.approved_at) {
            console.log(`  ✅ Approuvé le: ${partner.approved_at}`);
          }
          if (partner.rejected_at) {
            console.log(`  ❌ Rejeté le: ${partner.rejected_at}`);
            console.log(`  Raison: ${partner.rejection_reason || 'N/A'}`);
          }
          
          console.log('');
        });
      }
    }
    console.log('');

    // Test 4 : Vérifier les statuts
    console.log('📊 Test 4 : Répartition par statut');
    const { data: statusData, error: statusError } = await supabase
      .from('owners')
      .select('verification_status')
      .not('user_id', 'is', null);

    if (statusError) {
      console.error('❌ Erreur:', statusError.message);
    } else {
      const statusCount: Record<string, number> = {};
      statusData?.forEach(item => {
        const status = item.verification_status || 'unknown';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      console.log('Répartition :');
      Object.entries(statusCount).forEach(([status, count]) => {
        const emoji = {
          'pending': '⏳',
          'verified': '✅',
          'approved': '✅',
          'rejected': '❌',
          'suspended': '⏸️',
          'unknown': '❓'
        }[status] || '❓';
        console.log(`  ${emoji} ${status}: ${count}`);
      });
    }
    console.log('');

    // Test 5 : Vérifier RLS
    console.log('📊 Test 5 : Vérifier RLS');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'owners')
      .single();

    if (rlsError) {
      console.log('⚠️  Impossible de vérifier RLS (normal avec service key)');
    } else {
      console.log(`RLS activé : ${rlsData?.rowsecurity ? 'Oui' : 'Non'}`);
    }
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Tests terminés !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

// Exécuter les tests
testPartners();
