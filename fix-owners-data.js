#!/usr/bin/env node

/**
 * Fix des données owners
 * Vérifie et crée des owners de test si nécessaire
 */

console.log('🔧 Fix des données owners...\n');

// Test direct avec l'API
async function testAndFixOwners() {
  try {
    console.log('1️⃣  Test de l\'API debug/database...');
    
    const response = await fetch('http://localhost:3000/api/debug/database');
    const result = await response.json();
    
    if (!response.ok) {
      console.log(`❌ API erreur: ${response.status}`);
      console.log(`   Message: ${result.error || 'Erreur inconnue'}`);
      return;
    }

    console.log(`✅ API répond correctement`);
    
    const ownersData = result.data?.owners;
    const loftsData = result.data?.lofts;
    
    console.log(`📊 Owners trouvés: ${ownersData?.count || 0}`);
    console.log(`📊 Lofts trouvés: ${loftsData?.count || 0}`);
    
    if (ownersData?.error) {
      console.log(`❌ Erreur owners: ${ownersData.error.message}`);
      console.log(`   Code: ${ownersData.error.code}`);
      
      if (ownersData.error.code === '42P01') {
        console.log('   → La table owners n\'existe pas !');
        console.log('   → Vous devez exécuter la migration pour créer la table owners');
        return;
      }
    }
    
    if (loftsData?.error) {
      console.log(`❌ Erreur lofts: ${loftsData.error.message}`);
    }

    // Si pas d'owners, créer des données de test
    if (ownersData?.count === 0) {
      console.log('\n2️⃣  Aucun owner trouvé, création de données de test...');
      await createTestOwners();
    } else {
      console.log('\n2️⃣  Owners existants:');
      if (ownersData?.data && ownersData.data.length > 0) {
        ownersData.data.forEach((owner, index) => {
          console.log(`   ${index + 1}. ${owner.name || owner.business_name || 'Sans nom'}`);
          console.log(`      ID: ${owner.id}`);
          console.log(`      Type: ${owner.business_type || owner.ownership_type || 'N/A'}`);
        });
      }
    }

    // Vérifier les lofts et leurs owners
    if (loftsData?.data && loftsData.data.length > 0) {
      console.log('\n3️⃣  Vérification des lofts et leurs owners...');
      
      const loftsWithoutOwner = loftsData.data.filter(loft => !loft.owner_id);
      const loftsWithOwner = loftsData.data.filter(loft => loft.owner_id);
      
      console.log(`   • Lofts avec owner: ${loftsWithOwner.length}`);
      console.log(`   • Lofts sans owner: ${loftsWithoutOwner.length}`);
      
      if (loftsWithoutOwner.length > 0) {
        console.log('\n   ⚠️  Lofts sans owner détectés:');
        loftsWithoutOwner.slice(0, 3).forEach(loft => {
          console.log(`      • ${loft.name} (ID: ${loft.id})`);
        });
        
        if (ownersData?.count > 0) {
          console.log('\n   💡 Suggestion: Assignez des owners à ces lofts');
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.log('\n💡 Le serveur de développement ne semble pas tourner.');
      console.log('   Lancez: npm run dev');
      console.log('   Puis relancez ce script.');
    }
  }
}

async function createTestOwners() {
  try {
    console.log('   Création d\'owners de test via API...');
    
    const testOwners = [
      {
        name: 'Loft Algérie',
        business_name: 'Loft Algérie',
        email: 'contact@loftalgerie.com',
        phone: '+213 21 123 456',
        address: 'Alger, Algérie',
        business_type: 'company',
        ownership_type: 'company',
        verification_status: 'verified'
      },
      {
        name: 'Propriétaire Individuel',
        business_name: 'Propriétaire Individuel',
        email: 'proprietaire@example.com',
        phone: '+213 21 654 321',
        address: 'Oran, Algérie',
        business_type: 'individual',
        ownership_type: 'third_party',
        verification_status: 'verified'
      },
      {
        name: 'Immobilier Plus',
        business_name: 'Immobilier Plus SARL',
        email: 'info@immobilierplus.dz',
        phone: '+213 21 789 123',
        address: 'Constantine, Algérie',
        business_type: 'company',
        ownership_type: 'company',
        verification_status: 'verified'
      }
    ];

    // Essayer de créer via l'API owners (si elle existe)
    for (const owner of testOwners) {
      try {
        const response = await fetch('http://localhost:3000/api/owners', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(owner)
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ Owner créé: ${owner.name}`);
        } else {
          console.log(`   ❌ Erreur création ${owner.name}: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Erreur réseau pour ${owner.name}: ${error.message}`);
      }
    }

    console.log('\n   💡 Si la création a échoué, vous devez:');
    console.log('      1. Vérifier que la table owners existe');
    console.log('      2. Créer manuellement des owners dans Supabase');
    console.log('      3. Ou exécuter la migration complète');

  } catch (error) {
    console.error('   ❌ Erreur lors de la création:', error.message);
  }
}

// Instructions pour créer manuellement des owners
function showManualInstructions() {
  console.log('\n📋 Instructions pour créer des owners manuellement:');
  console.log('\n1. Connectez-vous à votre dashboard Supabase');
  console.log('2. Allez dans l\'éditeur SQL');
  console.log('3. Exécutez cette requête:');
  console.log(`
INSERT INTO owners (name, business_name, email, phone, address, business_type, ownership_type, verification_status)
VALUES 
  ('Loft Algérie', 'Loft Algérie', 'contact@loftalgerie.com', '+213 21 123 456', 'Alger, Algérie', 'company', 'company', 'verified'),
  ('Propriétaire Individuel', 'Propriétaire Individuel', 'proprietaire@example.com', '+213 21 654 321', 'Oran, Algérie', 'individual', 'third_party', 'verified'),
  ('Immobilier Plus', 'Immobilier Plus SARL', 'info@immobilierplus.dz', '+213 21 789 123', 'Constantine, Algérie', 'company', 'company', 'verified');
  `);
  console.log('\n4. Puis rechargez votre page lofts');
}

// Fonction principale
async function main() {
  await testAndFixOwners();
  showManualInstructions();
  
  console.log('\n🎯 Résumé:');
  console.log('• Si 0 owners trouvés → Table vide ou inexistante');
  console.log('• Si erreur 42P01 → Table owners n\'existe pas');
  console.log('• Si erreur permissions → Problème RLS');
  console.log('• Sinon → Vérifiez les données dans Supabase');
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});