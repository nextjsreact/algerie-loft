#!/usr/bin/env node

/**
 * Script pour découvrir la structure des tables
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

async function discoverStructure() {
  console.log('🔍 Découverte de la structure des tables\n');

  try {
    // Essayer d'insérer un enregistrement vide pour découvrir les colonnes requises
    console.log('📋 Structure de la table lofts:');
    
    try {
      const { error } = await supabase
        .from('lofts')
        .insert({});
      
      if (error) {
        console.log('Colonnes requises pour lofts:', error.message);
      }
    } catch (e) {
      console.log('Erreur lofts:', e.message);
    }

    console.log('\n📋 Structure de la table owners:');
    
    try {
      const { error } = await supabase
        .from('owners')
        .insert({});
      
      if (error) {
        console.log('Colonnes requises pour owners:', error.message);
      }
    } catch (e) {
      console.log('Erreur owners:', e.message);
    }

    // Essayer de récupérer la structure via une requête SELECT avec des colonnes communes
    console.log('\n🔍 Test des colonnes communes pour lofts:');
    
    const commonLoftColumns = [
      'id', 'name', 'nom', 'title', 'titre', 'description', 'address', 'adresse',
      'price', 'prix', 'owner_id', 'proprietaire_id', 'status', 'statut',
      'created_at', 'updated_at', 'prochaine_echeance_eau', 'frequence_paiement_eau'
    ];

    for (const column of commonLoftColumns) {
      try {
        const { error } = await supabase
          .from('lofts')
          .select(column)
          .limit(1);
        
        if (!error) {
          console.log(`✅ ${column}: Existe`);
        }
      } catch (e) {
        // Colonne n'existe pas
      }
    }

    console.log('\n🔍 Test des colonnes communes pour owners:');
    
    const commonOwnerColumns = [
      'id', 'name', 'nom', 'full_name', 'nom_complet', 'email', 'phone', 'telephone',
      'created_at', 'updated_at'
    ];

    for (const column of commonOwnerColumns) {
      try {
        const { error } = await supabase
          .from('owners')
          .select(column)
          .limit(1);
        
        if (!error) {
          console.log(`✅ ${column}: Existe`);
        }
      } catch (e) {
        // Colonne n'existe pas
      }
    }

    // Essayer de créer un loft minimal
    console.log('\n🧪 Test de création d\'un loft minimal:');
    
    const minimalLoft = {
      name: 'Test Loft',
      prochaine_echeance_eau: '2025-01-07',
      frequence_paiement_eau: 'mensuel'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('lofts')
      .insert(minimalLoft)
      .select();

    if (insertError) {
      console.error('❌ Erreur insertion loft minimal:', insertError.message);
    } else {
      console.log('✅ Loft minimal créé:', insertResult);
      
      // Supprimer le loft de test
      if (insertResult && insertResult[0]) {
        await supabase
          .from('lofts')
          .delete()
          .eq('id', insertResult[0].id);
        console.log('🗑️ Loft de test supprimé');
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la découverte
discoverStructure().catch(console.error);