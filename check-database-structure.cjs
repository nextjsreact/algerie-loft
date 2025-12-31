#!/usr/bin/env node

/**
 * Script pour vérifier la structure de la base de données
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Vérification de la structure de la base de données\n');

  try {
    // Vérifier les tables principales
    const tables = ['lofts', 'owners', 'transactions', 'partner_profiles'];
    
    for (const table of tables) {
      console.log(`📋 Table: ${table}`);
      
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ Erreur pour ${table}:`, error.message);
      } else {
        console.log(`✅ ${table}: ${count || 0} enregistrements`);
      }
    }

    // Vérifier spécifiquement les lofts
    console.log('\n📍 Détails des lofts:');
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name, nom, title, titre')
      .limit(5);

    if (loftsError) {
      console.error('❌ Erreur lofts:', loftsError.message);
    } else if (lofts && lofts.length > 0) {
      lofts.forEach(loft => {
        console.log(`   📍 ID: ${loft.id}, Name: ${loft.name || loft.nom || loft.title || loft.titre || 'Sans nom'}`);
      });
    } else {
      console.log('   ⚠️ Aucun loft trouvé');
    }

    // Vérifier les fonctions RPC
    console.log('\n🔧 Test des fonctions RPC:');
    
    try {
      const { data: upcoming, error: upcomingError } = await supabase
        .rpc('get_upcoming_bills', { days_ahead: 30 });
      
      if (upcomingError) {
        console.error('❌ get_upcoming_bills:', upcomingError.message);
      } else {
        console.log('✅ get_upcoming_bills: Fonction disponible');
      }
    } catch (e) {
      console.error('❌ get_upcoming_bills: Fonction non disponible');
    }

    try {
      const { data: overdue, error: overdueError } = await supabase
        .rpc('get_overdue_bills');
      
      if (overdueError) {
        console.error('❌ get_overdue_bills:', overdueError.message);
      } else {
        console.log('✅ get_overdue_bills: Fonction disponible');
      }
    } catch (e) {
      console.error('❌ get_overdue_bills: Fonction non disponible');
    }

    // Vérifier les colonnes de dates d'échéance
    console.log('\n📅 Vérification des colonnes d\'échéance:');
    const { data: loftSample, error: sampleError } = await supabase
      .from('lofts')
      .select(`
        prochaine_echeance_eau,
        prochaine_echeance_energie,
        prochaine_echeance_telephone,
        prochaine_echeance_internet,
        frequence_paiement_eau,
        frequence_paiement_energie,
        frequence_paiement_telephone,
        frequence_paiement_internet
      `)
      .limit(1);

    if (sampleError) {
      console.error('❌ Colonnes d\'échéance:', sampleError.message);
      console.log('💡 Les colonnes de dates d\'échéance n\'existent peut-être pas encore');
    } else {
      console.log('✅ Colonnes d\'échéance: Disponibles');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la vérification
checkDatabase().catch(console.error);