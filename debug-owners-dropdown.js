#!/usr/bin/env node

/**
 * Debug du dropdown owners
 * Vérifie pourquoi un seul owner s'affiche
 */

import { createClient } from '@supabase/supabase-js';

console.log('🔍 Debug du dropdown owners...\n');

async function debugOwners() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Variables d\'environnement Supabase manquantes');
    console.log('Vérifiez votre fichier .env');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('1️⃣  Test de la table owners...');
    
    // Test 1: Compter tous les owners
    const { count: totalCount, error: countError } = await supabase
      .from('owners')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`❌ Erreur lors du comptage: ${countError.message}`);
      return;
    }

    console.log(`📊 Total owners dans la table: ${totalCount}`);

    // Test 2: Récupérer tous les owners avec détails
    const { data: allOwners, error: allOwnersError } = await supabase
      .from('owners')
      .select('*')
      .order('name');

    if (allOwnersError) {
      console.log(`❌ Erreur lors de la récupération: ${allOwnersError.message}`);
      return;
    }

    console.log(`✅ Owners récupérés: ${allOwners?.length || 0}`);

    if (allOwners && allOwners.length > 0) {
      console.log('\n📋 Liste complète des owners:');
      allOwners.forEach((owner, index) => {
        console.log(`   ${index + 1}. ${owner.name || owner.business_name || 'Sans nom'}`);
        console.log(`      ID: ${owner.id}`);
        console.log(`      Email: ${owner.email || 'N/A'}`);
        console.log(`      Type: ${owner.business_type || owner.ownership_type || 'N/A'}`);
        console.log(`      Créé: ${owner.created_at || 'N/A'}`);
        console.log('');
      });
    }

    // Test 3: Vérifier la requête exacte utilisée dans la page
    console.log('2️⃣  Test de la requête exacte de la page lofts...');
    
    const { data: pageOwners, error: pageError } = await supabase
      .from("owners")
      .select("*")
      .order("name");

    if (pageError) {
      console.log(`❌ Erreur requête page: ${pageError.message}`);
      return;
    }

    console.log(`✅ Requête page réussie: ${pageOwners?.length || 0} owners`);

    // Test 4: Vérifier les lofts avec leurs owners
    console.log('\n3️⃣  Test des lofts avec leurs owners...');
    
    const { data: loftsWithOwners, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name, owner_id, owner:owners(id, name)')
      .limit(10);

    if (loftsError) {
      console.log(`❌ Erreur lofts avec owners: ${loftsError.message}`);
    } else {
      console.log(`✅ Lofts avec owners: ${loftsWithOwners?.length || 0}`);
      
      if (loftsWithOwners && loftsWithOwners.length > 0) {
        console.log('\n📋 Exemples de lofts avec owners:');
        loftsWithOwners.slice(0, 5).forEach(loft => {
          console.log(`   • ${loft.name} → Owner: ${loft.owner?.name || 'Pas d\'owner'} (ID: ${loft.owner_id || 'N/A'})`);
        });
      }
    }

    // Test 5: Vérifier les owners utilisés par les lofts
    console.log('\n4️⃣  Analyse des owners utilisés par les lofts...');
    
    const { data: usedOwnerIds, error: usedError } = await supabase
      .from('lofts')
      .select('owner_id')
      .not('owner_id', 'is', null);

    if (usedError) {
      console.log(`❌ Erreur owners utilisés: ${usedError.message}`);
    } else {
      const uniqueOwnerIds = [...new Set(usedOwnerIds?.map(l => l.owner_id) || [])];
      console.log(`✅ Owners uniques utilisés par les lofts: ${uniqueOwnerIds.length}`);
      
      if (uniqueOwnerIds.length > 0) {
        console.log('\n📋 Owners utilisés:');
        for (const ownerId of uniqueOwnerIds) {
          const { data: ownerDetail } = await supabase
            .from('owners')
            .select('name, business_name')
            .eq('id', ownerId)
            .single();
          
          console.log(`   • ID: ${ownerId} → ${ownerDetail?.name || ownerDetail?.business_name || 'Nom inconnu'}`);
        }
      }
    }

    // Test 6: Vérifier s'il y a des doublons ou des problèmes de données
    console.log('\n5️⃣  Vérification des doublons et problèmes...');
    
    if (allOwners) {
      const names = allOwners.map(o => o.name || o.business_name).filter(Boolean);
      const uniqueNames = [...new Set(names)];
      
      if (names.length !== uniqueNames.length) {
        console.log(`⚠️  Doublons détectés: ${names.length} owners, ${uniqueNames.length} noms uniques`);
      } else {
        console.log(`✅ Pas de doublons: ${names.length} owners avec noms uniques`);
      }

      // Vérifier les owners sans nom
      const ownersWithoutName = allOwners.filter(o => !o.name && !o.business_name);
      if (ownersWithoutName.length > 0) {
        console.log(`⚠️  ${ownersWithoutName.length} owners sans nom détectés`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message);
  }
}

// Test de l'API directement
async function testAPI() {
  console.log('\n6️⃣  Test de l\'API debug/database...');
  
  try {
    const response = await fetch('http://localhost:3000/api/debug/database');
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ API répond: ${response.status}`);
      console.log(`📊 Owners dans l'API: ${data.owners?.length || 0}`);
      
      if (data.owners && data.owners.length > 0) {
        console.log('\n📋 Premiers owners de l\'API:');
        data.owners.slice(0, 5).forEach((owner, index) => {
          console.log(`   ${index + 1}. ${owner.name || owner.business_name || 'Sans nom'} (ID: ${owner.id})`);
        });
      }
    } else {
      console.log(`❌ API erreur: ${response.status} - ${data.error || 'Erreur inconnue'}`);
    }
  } catch (error) {
    console.log(`❌ Erreur API: ${error.message}`);
    console.log('   (Assurez-vous que le serveur dev tourne sur localhost:3000)');
  }
}

// Fonction principale
async function main() {
  await debugOwners();
  await testAPI();
  
  console.log('\n🎯 Résumé du diagnostic:');
  console.log('• Vérifiez le nombre total d\'owners dans la table');
  console.log('• Comparez avec ce qui s\'affiche dans le dropdown');
  console.log('• Si les nombres diffèrent, il y a un problème de filtrage ou de requête');
  console.log('• Si les nombres sont identiques, le problème est dans l\'interface');
  
  console.log('\n📋 Prochaines étapes:');
  console.log('1. Vérifiez les logs ci-dessus');
  console.log('2. Comparez avec ce que vous voyez dans le dropdown');
  console.log('3. Si nécessaire, vérifiez les permissions RLS dans Supabase');
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});