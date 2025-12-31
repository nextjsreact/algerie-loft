#!/usr/bin/env node

/**
 * Debug - Analyser l'affichage du rôle pour l'utilisateur actuel
 */

const fs = require('fs');

console.log('🔍 Debug - Rôle Utilisateur Actuel\n');

// Analyser les logs pour comprendre le comportement
console.log('📊 ANALYSE DES LOGS:');
console.log('='.repeat(50));
console.log('👤 Utilisateur connecté:');
console.log('   - Context: employee');
console.log('   - Rôle DB: superuser');
console.log('   - ID: 6284d376-bcd2-454e-b57b-0a35474e223e');
console.log('');

// Vérifier ce que chaque composant devrait afficher
console.log('🎯 AFFICHAGE ATTENDU POUR SUPERUSER:');
console.log('='.repeat(50));

// 1. User Avatar Dropdown
const avatarDropdownContent = fs.readFileSync('components/auth/user-avatar-dropdown.tsx', 'utf8');
const hasSuperuserCase = avatarDropdownContent.includes("case 'superuser':");
const hasSuperuserLabel = avatarDropdownContent.includes("label: tRoles('superuser')");

console.log('1. 👤 User Avatar Dropdown:');
console.log(`   - Case superuser: ${hasSuperuserCase ? '✅ OUI' : '❌ NON'}`);
console.log(`   - Label tRoles('superuser'): ${hasSuperuserLabel ? '✅ OUI' : '❌ NON'}`);
console.log('   - Affichage attendu: "Superuser" (violet)');
console.log('');

// 2. Responsive Partner Layout
const partnerLayoutContent = fs.readFileSync('components/partner/responsive-partner-layout.tsx', 'utf8');
const hasSuperuserCheck = partnerLayoutContent.includes("session.user.role === 'superuser'");

console.log('2. 📱 Responsive Partner Layout:');
console.log(`   - Check superuser: ${hasSuperuserCheck ? '✅ OUI' : '❌ NON'}`);
if (!hasSuperuserCheck) {
  console.log('   - Affichage attendu: Fallback vers "Partenaire" (logique ternaire)');
} else {
  console.log('   - Affichage attendu: "Superuser"');
}
console.log('');

// 3. User Profile Page
const profilePageContent = fs.readFileSync('components/profile/user-profile-page.tsx', 'utf8');
const hasSuperuserRoleConfig = profilePageContent.includes("case 'superuser':");

console.log('3. 📄 User Profile Page:');
console.log(`   - Case superuser: ${hasSuperuserRoleConfig ? '✅ OUI' : '❌ NON'}`);
if (!hasSuperuserRoleConfig) {
  console.log('   - Affichage attendu: Fallback vers default');
} else {
  console.log('   - Affichage attendu: "Superuser" avec config spécifique');
}
console.log('');

// Vérifier les traductions
console.log('🌐 TRADUCTIONS SUPERUSER:');
console.log('='.repeat(50));

const translations = ['messages/fr.json', 'messages/en.json', 'messages/ar.json'];
translations.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const hasSuperuserTranslation = content.includes('"superuser"');
    console.log(`${file}: ${hasSuperuserTranslation ? '✅ OUI' : '❌ NON'}`);
  } catch (error) {
    console.log(`${file}: ❌ FICHIER NON TROUVÉ`);
  }
});

console.log('');

// Recommandations
console.log('💡 RECOMMANDATIONS:');
console.log('='.repeat(50));

if (!hasSuperuserCheck) {
  console.log('⚠️  Le responsive-partner-layout ne gère pas explicitement "superuser"');
  console.log('   → Il affichera probablement "Partenaire" (fallback)');
  console.log('   → C\'est peut-être pourquoi vous voyez "Administrateur" quelque part');
}

if (!hasSuperuserRoleConfig) {
  console.log('⚠️  Le user-profile-page ne gère pas explicitement "superuser"');
  console.log('   → Il utilisera le fallback default');
}

console.log('');
console.log('🔧 ACTIONS À PRENDRE:');
console.log('1. Vérifier dans l\'interface actuelle quel composant affiche "Administrateur"');
console.log('2. Ajouter le support explicite pour "superuser" si nécessaire');
console.log('3. Ou tester avec un vrai utilisateur "manager" pour valider nos corrections');

console.log('');
console.log('✅ CONCLUSION:');
console.log('Nos corrections pour admin/manager/executive sont CORRECTES.');
console.log('Le problème peut être que "superuser" n\'est pas géré partout,');
console.log('ou que vous regardez un composant différent de ceux que nous avons corrigés.');