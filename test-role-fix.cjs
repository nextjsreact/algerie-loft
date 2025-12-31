#!/usr/bin/env node

/**
 * Test de vérification - Correction des rôles utilisateur
 */

const fs = require('fs');

console.log('🧪 Test - Correction des Rôles Utilisateur\n');

// Test 1: Vérifier responsive-partner-layout.tsx
function testResponsivePartnerLayout() {
  console.log('📱 Test 1: Responsive Partner Layout');
  
  const filePath = 'components/partner/responsive-partner-layout.tsx';
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifier que la logique ternaire inclut manager et executive
  const hasManagerCheck = content.includes("session.user.role === 'manager' ? 'Manager'");
  const hasExecutiveCheck = content.includes("session.user.role === 'executive' ? 'Exécutif'");
  const hasAdminCheck = content.includes("session.user.role === 'admin' ? 'Administrateur'");
  
  console.log(`   ✅ Admin → Administrateur: ${hasAdminCheck ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Manager → Manager: ${hasManagerCheck ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Executive → Exécutif: ${hasExecutiveCheck ? 'OUI' : 'NON'}`);
  
  return hasAdminCheck && hasManagerCheck && hasExecutiveCheck;
}

// Test 2: Vérifier user-avatar-dropdown.tsx
function testUserAvatarDropdown() {
  console.log('\n👤 Test 2: User Avatar Dropdown');
  
  const filePath = 'components/auth/user-avatar-dropdown.tsx';
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifier que chaque rôle a son propre case
  const hasAdminCase = content.includes("case 'admin':");
  const hasManagerCase = content.includes("case 'manager':");
  const hasExecutiveCase = content.includes("case 'executive':");
  
  // Vérifier que chaque rôle a son propre label
  const hasAdminLabel = content.includes("label: tRoles('admin')");
  const hasManagerLabel = content.includes("label: tRoles('manager')");
  const hasExecutiveLabel = content.includes("label: tRoles('executive')");
  
  // Vérifier qu'il n'y a plus de groupement
  const hasGroupedCases = content.includes("case 'admin':\n      case 'manager':\n      case 'executive':");
  
  console.log(`   ✅ Case Admin séparé: ${hasAdminCase ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Case Manager séparé: ${hasManagerCase ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Case Executive séparé: ${hasExecutiveCase ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Label Admin distinct: ${hasAdminLabel ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Label Manager distinct: ${hasManagerLabel ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Label Executive distinct: ${hasExecutiveLabel ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Plus de groupement: ${!hasGroupedCases ? 'OUI' : 'NON'}`);
  
  return hasAdminCase && hasManagerCase && hasExecutiveCase && 
         hasAdminLabel && hasManagerLabel && hasExecutiveLabel && 
         !hasGroupedCases;
}

// Test 3: Vérifier user-profile-page.tsx
function testUserProfilePage() {
  console.log('\n📄 Test 3: User Profile Page');
  
  const filePath = 'components/profile/user-profile-page.tsx';
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifier que chaque rôle a son propre case avec label distinct
  const hasAdminLabel = content.includes("label: 'Administrateur'");
  const hasManagerLabel = content.includes("label: 'Manager'");
  const hasExecutiveLabel = content.includes("label: 'Exécutif'");
  
  // Vérifier les couleurs distinctes
  const hasAdminColor = content.includes("color: 'bg-red-500'");
  const hasManagerColor = content.includes("color: 'bg-blue-500'");
  const hasExecutiveColor = content.includes("color: 'bg-purple-500'");
  
  console.log(`   ✅ Admin → "Administrateur": ${hasAdminLabel ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Manager → "Manager": ${hasManagerLabel ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Executive → "Exécutif": ${hasExecutiveLabel ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Couleur Admin (rouge): ${hasAdminColor ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Couleur Manager (bleu): ${hasManagerColor ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Couleur Executive (violet): ${hasExecutiveColor ? 'OUI' : 'NON'}`);
  
  return hasAdminLabel && hasManagerLabel && hasExecutiveLabel &&
         hasAdminColor && hasManagerColor && hasExecutiveColor;
}

// Test 4: Vérifier les traductions
function testTranslations() {
  console.log('\n🌐 Test 4: Traductions des Rôles');
  
  const translations = {
    'messages/fr.json': {
      admin: 'Administrateur',
      manager: 'Manager',
      executive: 'Exécutif'
    },
    'messages/en.json': {
      admin: 'Administrator',
      manager: 'Manager',
      executive: 'Executive'
    },
    'messages/ar.json': {
      admin: 'مدير',
      manager: 'مدير',
      executive: 'تنفيذي'
    }
  };
  
  let allTranslationsExist = true;
  
  Object.entries(translations).forEach(([file, expectedTranslations]) => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      Object.entries(expectedTranslations).forEach(([role, translation]) => {
        const hasTranslation = content.includes(`"${role}": "${translation}"`);
        console.log(`   ✅ ${file} - ${role}: ${hasTranslation ? 'OUI' : 'NON'}`);
        if (!hasTranslation) allTranslationsExist = false;
      });
    } catch (error) {
      console.log(`   ❌ ${file}: FICHIER NON TROUVÉ`);
      allTranslationsExist = false;
    }
  });
  
  return allTranslationsExist;
}

// Exécuter tous les tests
function runAllTests() {
  console.log('🚀 Démarrage des tests de correction des rôles...\n');
  
  const test1 = testResponsivePartnerLayout();
  const test2 = testUserAvatarDropdown();
  const test3 = testUserProfilePage();
  const test4 = testTranslations();
  
  console.log('\n📋 RÉSUMÉ DES TESTS:');
  console.log('='.repeat(60));
  console.log(`📱 Responsive Partner Layout: ${test1 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);
  console.log(`👤 User Avatar Dropdown: ${test2 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);
  console.log(`📄 User Profile Page: ${test3 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);
  console.log(`🌐 Traductions: ${test4 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);
  
  const allPassed = test1 && test2 && test3 && test4;
  
  console.log('\n🎯 RÉSULTAT FINAL:');
  console.log('='.repeat(60));
  
  if (allPassed) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ L\'utilisateur habib_fr2001@yahoo.fr devrait maintenant afficher "Manager"');
    console.log('✅ Tous les rôles ont des labels distincts');
    console.log('✅ Les corrections sont appliquées dans tous les composants');
  } else {
    console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('❌ Vérifiez les corrections mentionnées ci-dessus');
  }
  
  console.log('\n📝 INSTRUCTIONS DE TEST:');
  console.log('1. Redémarrer l\'application: npm run dev');
  console.log('2. Se connecter avec habib_fr2001@yahoo.fr');
  console.log('3. Vérifier que le rôle affiché est "Manager" et non "Administrateur"');
  console.log('4. Tester avec d\'autres utilisateurs ayant des rôles différents');
  
  return allPassed;
}

// Exécuter les tests
const success = runAllTests();
process.exit(success ? 0 : 1);