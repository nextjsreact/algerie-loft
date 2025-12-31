#!/usr/bin/env node

/**
 * Test de vérification frontend - Corrections appliquées
 * Vérifie que les corrections sont bien intégrées côté client
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Vérification Frontend - Corrections Appliquées\n');

// Test 1: Vérifier que le formulaire de catégorie a les bonnes valeurs
function testCategoryForm() {
  console.log('📝 Test 1: Formulaire de Catégorie');
  
  const formPath = 'components/settings/category-edit-form.tsx';
  const formContent = fs.readFileSync(formPath, 'utf8');
  
  // Vérifier que les valeurs sont pré-remplies
  const hasPrefilledName = formContent.includes('name: category.name || \'\'');
  const hasPrefilledDesc = formContent.includes('description: category.description || \'\'');
  
  // Vérifier que les clés React sont présentes pour forcer le re-render
  const hasReactKeys = formContent.includes('key={`name-${t(\'form.namePlaceholder\')}`}');
  
  console.log(`   ✅ Valeurs pré-remplies (name): ${hasPrefilledName ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Valeurs pré-remplies (desc): ${hasPrefilledDesc ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Clés React pour re-render: ${hasReactKeys ? 'OUI' : 'NON'}`);
  
  return hasPrefilledName && hasPrefilledDesc && hasReactKeys;
}

// Test 2: Vérifier l'affichage des rôles utilisateur
function testUserRoles() {
  console.log('\n👤 Test 2: Affichage des Rôles');
  
  const profilePath = 'components/profile/user-profile-page.tsx';
  const profileContent = fs.readFileSync(profilePath, 'utf8');
  
  // Vérifier que chaque rôle a son propre label
  const hasAdminRole = profileContent.includes('label: \'Administrateur\'');
  const hasManagerRole = profileContent.includes('label: \'Manager\'');
  const hasExecutiveRole = profileContent.includes('label: \'Exécutif\'');
  
  // Vérifier que chaque rôle a sa propre couleur
  const hasDistinctColors = profileContent.includes('bg-red-500') && 
                           profileContent.includes('bg-blue-500') && 
                           profileContent.includes('bg-purple-500');
  
  console.log(`   ✅ Rôle Admin distinct: ${hasAdminRole ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Rôle Manager distinct: ${hasManagerRole ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Rôle Executive distinct: ${hasExecutiveRole ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Couleurs distinctes: ${hasDistinctColors ? 'OUI' : 'NON'}`);
  
  return hasAdminRole && hasManagerRole && hasExecutiveRole && hasDistinctColors;
}

// Test 3: Vérifier les corrections DataTable
function testDataTable() {
  console.log('\n📊 Test 3: Corrections DataTable');
  
  const tablePath = 'components/ui/data-table.tsx';
  const tableContent = fs.readFileSync(tablePath, 'utf8');
  
  // Vérifier les optional chaining
  const hasOptionalChaining = tableContent.includes('header.column?.columnDef?.header');
  const hasFunctionSafety = tableContent.includes('row.getIsSelected?.()');
  const hasFallbackKeys = tableContent.includes('key={row.id || `row-${rowIndex}`}');
  
  console.log(`   ✅ Optional chaining: ${hasOptionalChaining ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Function safety: ${hasFunctionSafety ? 'OUI' : 'NON'}`);
  console.log(`   ✅ Fallback keys: ${hasFallbackKeys ? 'OUI' : 'NON'}`);
  
  return hasOptionalChaining && hasFunctionSafety && hasFallbackKeys;
}

// Test 4: Vérifier les traductions
function testTranslations() {
  console.log('\n🌐 Test 4: Clés de Traduction');
  
  const translations = {
    'messages/fr.json': 'Nom de la catégorie',
    'messages/en.json': 'Category name',
    'messages/ar.json': 'اسم الفئة'
  };
  
  let allTranslationsExist = true;
  
  Object.entries(translations).forEach(([file, expectedText]) => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const hasTranslation = content.includes(expectedText);
      console.log(`   ✅ ${file}: ${hasTranslation ? 'OUI' : 'NON'}`);
      if (!hasTranslation) allTranslationsExist = false;
    } catch (error) {
      console.log(`   ❌ ${file}: FICHIER NON TROUVÉ`);
      allTranslationsExist = false;
    }
  });
  
  return allTranslationsExist;
}

// Exécuter tous les tests
function runAllTests() {
  console.log('🚀 Démarrage des tests frontend...\n');
  
  const test1 = testCategoryForm();
  const test2 = testUserRoles();
  const test3 = testDataTable();
  const test4 = testTranslations();
  
  console.log('\n📋 RÉSUMÉ DES TESTS:');
  console.log('='.repeat(50));
  console.log(`📝 Formulaire Catégorie: ${test1 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);
  console.log(`👤 Rôles Utilisateur: ${test2 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);
  console.log(`📊 DataTable: ${test3 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);
  console.log(`🌐 Traductions: ${test4 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`);
  
  const allPassed = test1 && test2 && test3 && test4;
  
  console.log('\n🎯 RÉSULTAT FINAL:');
  console.log('='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ Les corrections sont bien appliquées côté frontend');
    console.log('✅ L\'application est prête pour les tests utilisateur');
  } else {
    console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('❌ Vérifiez les corrections mentionnées ci-dessus');
  }
  
  console.log('\n📝 INSTRUCTIONS DE TEST UTILISATEUR:');
  console.log('1. Démarrer l\'application: npm run dev');
  console.log('2. Aller sur /settings/categories/edit/[id]');
  console.log('3. Changer de langue et vider les champs pour voir les placeholders');
  console.log('4. Se connecter avec habib_fr2001@yahoo.fr pour tester les rôles');
  console.log('5. Vérifier qu\'il n\'y a pas d\'erreurs dans la console du navigateur');
  
  return allPassed;
}

// Exécuter les tests
const success = runAllTests();
process.exit(success ? 0 : 1);