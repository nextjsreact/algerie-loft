#!/usr/bin/env node

/**
 * Vérification de la colonne user_id dans la table owners
 * S'assure que les propriétaires sont bien liés aux utilisateurs
 */

console.log('🔍 Vérification de la liaison owners <-> users...\n');

async function verifyOwnersUserIdStructure() {
  try {
    console.log('1️⃣  Test de l\'API debug/database...');
    
    const response = await fetch('http://localhost:3000/api/debug/database');
    const result = await response.json();
    
    if (!response.ok) {
      console.log(`❌ API erreur: ${response.status}`);
      console.log(`   Message: ${result.error || 'Erreur inconnue'}`);
      return;
    }

    const ownersData = result.data?.owners;
    
    if (!ownersData || ownersData.count === 0) {
      console.log('❌ Aucun owner trouvé dans la base');
      return;
    }

    console.log(`✅ ${ownersData.count} owners trouvés`);

    // Vérifier la structure des owners
    console.log('\n2️⃣  Vérification de la structure owners...');
    
    const owners = ownersData.data || [];
    let ownersWithUserId = 0;
    let ownersWithoutUserId = 0;
    
    console.log('\n📋 Analyse des owners:');
    owners.forEach((owner, index) => {
      const hasUserId = owner.user_id && owner.user_id !== null;
      
      if (hasUserId) {
        ownersWithUserId++;
      } else {
        ownersWithoutUserId++;
      }
      
      if (index < 10) { // Afficher les 10 premiers
        console.log(`   ${index + 1}. ${owner.name || owner.business_name || 'Sans nom'}`);
        console.log(`      user_id: ${owner.user_id || '❌ NULL'}`);
        console.log(`      email: ${owner.email || 'N/A'}`);
        console.log('');
      }
    });

    console.log(`📊 Résumé:`);
    console.log(`   • Owners avec user_id: ${ownersWithUserId}`);
    console.log(`   • Owners sans user_id: ${ownersWithoutUserId}`);
    
    if (ownersWithoutUserId > 0) {
      console.log('\n⚠️  PROBLÈME DÉTECTÉ:');
      console.log(`   ${ownersWithoutUserId} owners n'ont pas de user_id`);
      console.log('   → Ces owners ne pourront pas se connecter comme propriétaires');
      console.log('   → Ils ne verront pas leurs lofts');
      
      console.log('\n💡 SOLUTION:');
      console.log('   1. Créez des comptes utilisateurs pour ces owners');
      console.log('   2. Ou liez-les à des comptes existants');
      console.log('   3. Mettez à jour owners.user_id avec l\'ID utilisateur');
    } else {
      console.log('\n✅ STRUCTURE CORRECTE:');
      console.log('   Tous les owners ont un user_id');
      console.log('   → La logique propriétaire devrait fonctionner');
    }

    // Test avec un owner spécifique
    console.log('\n3️⃣  Test de liaison owner <-> user...');
    
    const ownerWithUserId = owners.find(o => o.user_id);
    if (ownerWithUserId) {
      console.log(`✅ Test avec owner: ${ownerWithUserId.name}`);
      console.log(`   user_id: ${ownerWithUserId.user_id}`);
      console.log('   → Si vous vous connectez avec ce user_id,');
      console.log('   → Vous devriez voir seulement les lofts de cet owner');
    } else {
      console.log('❌ Aucun owner avec user_id trouvé pour le test');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      console.log('\n💡 Le serveur de développement ne semble pas tourner.');
      console.log('   Lancez: npm run dev');
      console.log('   Puis relancez ce script.');
    }
  }
}

// Instructions pour configurer user_id
function showUserIdInstructions() {
  console.log('\n📋 Instructions pour configurer user_id:');
  console.log('\n1. Identifiez les owners sans user_id');
  console.log('2. Pour chaque owner, trouvez ou créez un utilisateur correspondant');
  console.log('3. Mettez à jour la table owners:');
  console.log(`
-- Exemple: Lier l'owner "Ahmed Benali" à l'utilisateur avec email "ahmed@example.com"
UPDATE owners 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'ahmed@example.com'
)
WHERE name = 'Ahmed Benali';
  `);
  console.log('\n4. Vérifiez que l\'utilisateur a le bon rôle:');
  console.log(`
-- Mettre le rôle 'owner' à l'utilisateur
UPDATE profiles 
SET role = 'owner' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'ahmed@example.com');
  `);
}

// Test de connexion propriétaire
async function testOwnerLogin() {
  console.log('\n4️⃣  Test de connexion propriétaire...');
  
  try {
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();
    
    if (sessionData.isAuthenticated) {
      console.log(`✅ Utilisateur connecté: ${sessionData.user.email}`);
      console.log(`   Rôle: ${sessionData.user.role}`);
      console.log(`   ID: ${sessionData.user.id}`);
      
      // Vérifier si cet utilisateur est lié à un owner
      const dbResponse = await fetch('http://localhost:3000/api/debug/database');
      const dbData = await dbResponse.json();
      
      if (dbData.success && dbData.data.owners.data) {
        const userOwner = dbData.data.owners.data.find(owner => 
          owner.user_id === sessionData.user.id
        );
        
        if (userOwner) {
          console.log(`✅ Owner trouvé: ${userOwner.name}`);
          console.log('   → Cet utilisateur devrait voir ses lofts uniquement');
        } else {
          console.log('⚠️  Aucun owner lié à cet utilisateur');
          console.log('   → Cet utilisateur ne verra aucun loft en mode propriétaire');
        }
      }
    } else {
      console.log('ℹ️  Aucun utilisateur connecté');
      console.log('   Connectez-vous pour tester la logique propriétaire');
    }
  } catch (error) {
    console.log(`❌ Erreur test connexion: ${error.message}`);
  }
}

// Fonction principale
async function main() {
  await verifyOwnersUserIdStructure();
  await testOwnerLogin();
  showUserIdInstructions();
  
  console.log('\n🎯 Résumé:');
  console.log('• Si vous êtes EMPLOYÉ (executive) → Vous voyez TOUS les owners');
  console.log('• Si vous êtes PROPRIÉTAIRE → Vous voyez SEULEMENT vos lofts');
  console.log('• La distinction se fait via owners.user_id = session.user.id');
  console.log('');
  console.log('📋 Actions à faire:');
  console.log('1. Vérifiez les owners sans user_id ci-dessus');
  console.log('2. Configurez les liaisons manquantes');
  console.log('3. Testez avec différents types de comptes');
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});