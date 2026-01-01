#!/usr/bin/env node

/**
 * Debug spécifique pour le profil executive
 * Vérifie pourquoi il ne voit qu'un seul owner
 */

console.log('🔍 Debug Executive - Dropdown Owners...\n');

async function debugExecutiveAccess() {
  try {
    console.log('1️⃣  Vérification de la session executive...');
    
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
      credentials: 'include'
    });
    const sessionData = await sessionResponse.json();
    
    if (!sessionData.isAuthenticated) {
      console.log('❌ Pas de session authentifiée');
      console.log('   Connectez-vous d\'abord');
      return;
    }

    console.log(`✅ Session trouvée:`);
    console.log(`   Email: ${sessionData.user.email}`);
    console.log(`   Rôle: ${sessionData.user.role}`);
    console.log(`   ID: ${sessionData.user.id}`);

    const isEmployee = ['admin', 'manager', 'executive', 'superuser'].includes(sessionData.user.role);
    console.log(`   Est employé: ${isEmployee ? '✅ OUI' : '❌ NON'}`);

    console.log('\n2️⃣  Test de l\'API debug/database...');
    
    const dbResponse = await fetch('http://localhost:3000/api/debug/database', {
      credentials: 'include'
    });
    const dbData = await dbResponse.json();
    
    if (!dbResponse.ok) {
      console.log(`❌ Erreur API: ${dbResponse.status} - ${dbData.error}`);
      return;
    }

    const ownersData = dbData.data?.owners;
    console.log(`✅ API répond: ${ownersData?.count || 0} owners trouvés`);

    if (ownersData?.data && ownersData.data.length > 0) {
      console.log('\n📋 TOUS les owners dans la base:');
      ownersData.data.forEach((owner, index) => {
        const isLinkedToUser = owner.user_id === sessionData.user.id;
        console.log(`   ${index + 1}. ${owner.name || owner.business_name || 'Sans nom'}`);
        console.log(`      ID: ${owner.id}`);
        console.log(`      user_id: ${owner.user_id || 'NULL'}`);
        console.log(`      Lié à vous: ${isLinkedToUser ? '✅ OUI' : '❌ NON'}`);
        console.log('');
      });

      // Vérifier si l'utilisateur executive est lié à un owner
      const linkedOwner = ownersData.data.find(owner => owner.user_id === sessionData.user.id);
      if (linkedOwner) {
        console.log(`⚠️  PROBLÈME DÉTECTÉ:`);
        console.log(`   Votre utilisateur executive est lié à l'owner: ${linkedOwner.name}`);
        console.log(`   Cela peut causer des problèmes de filtrage`);
      } else {
        console.log(`✅ Votre utilisateur executive n'est lié à aucun owner (correct)`);
      }
    }

    console.log('\n3️⃣  Test de l\'API lofts/availability...');
    
    const availabilityResponse = await fetch('http://localhost:3000/api/lofts/availability', {
      credentials: 'include'
    });
    const availabilityData = await availabilityResponse.json();
    
    if (availabilityResponse.ok) {
      console.log(`✅ API availability répond`);
      console.log(`   Owners pour dropdown: ${availabilityData.owners?.length || 0}`);
      
      if (availabilityData.owners && availabilityData.owners.length > 0) {
        console.log('\n📋 Owners dans le dropdown:');
        availabilityData.owners.forEach((owner, index) => {
          console.log(`   ${index + 1}. ${owner.name} (ID: ${owner.id})`);
        });
      } else {
        console.log('❌ Aucun owner dans le dropdown !');
      }
    } else {
      console.log(`❌ Erreur API availability: ${availabilityResponse.status}`);
    }

    console.log('\n4️⃣  Simulation de la logique de la page lofts...');
    
    // Simuler la logique de la page
    const userRole = sessionData.user.role;
    const isEmployeeLogic = ['admin', 'manager', 'executive', 'superuser'].includes(userRole);
    const isOwnerLogic = userRole === 'owner' || !isEmployeeLogic;
    
    console.log(`   Rôle utilisateur: ${userRole}`);
    console.log(`   isEmployee: ${isEmployeeLogic}`);
    console.log(`   isOwner: ${isOwnerLogic}`);
    
    if (isEmployeeLogic) {
      console.log(`✅ Logique: EMPLOYÉ → Devrait voir TOUS les owners`);
      console.log(`   Attendu: ${ownersData?.count || 0} owners`);
    } else {
      console.log(`⚠️  Logique: PROPRIÉTAIRE → Ne verra que ses lofts`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.log('\n💡 Le serveur de développement ne semble pas tourner.');
      console.log('   Lancez: npm run dev');
    }
  }
}

async function checkPageLoftsDirectly() {
  console.log('\n5️⃣  Test direct de la page /fr/lofts...');
  
  try {
    const response = await fetch('http://localhost:3000/fr/lofts', {
      credentials: 'include',
      headers: {
        'Accept': 'text/html'
      }
    });
    
    if (response.ok) {
      console.log('✅ Page /fr/lofts accessible');
      console.log(`   Status: ${response.status}`);
    } else {
      console.log(`❌ Erreur page /fr/lofts: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Erreur accès page: ${error.message}`);
  }
}

// Fonction principale
async function main() {
  await debugExecutiveAccess();
  await checkPageLoftsDirectly();
  
  console.log('\n🎯 Diagnostic:');
  console.log('• Si vous êtes EXECUTIVE → Vous devriez voir TOUS les owners');
  console.log('• Si vous ne voyez qu\'un owner → Problème de logique ou de données');
  console.log('• Vérifiez si votre user_id est lié à un owner dans la table');
  
  console.log('\n📋 Solutions possibles:');
  console.log('1. Vérifiez les logs ci-dessus');
  console.log('2. Si votre executive est lié à un owner → Supprimez le lien');
  console.log('3. Vérifiez la logique dans la page lofts');
  console.log('4. Testez avec un autre compte executive');
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});