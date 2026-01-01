/**
 * Script pour vérifier l'intégration de la table owners dans tout le code
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 Vérification de l\'intégration de la table owners...\n');
console.log('═'.repeat(60) + '\n');

const issues = [];

// Fonction pour chercher dans les fichiers
function searchInFiles(pattern, description) {
  try {
    const result = execSync(
      `powershell -Command "Get-ChildItem -Path app,components -Recurse -Include *.ts,*.tsx | Select-String -Pattern '${pattern}' | Select-Object -First 20"`,
      { encoding: 'utf-8' }
    );
    
    if (result.trim()) {
      issues.push({
        description,
        pattern,
        results: result.trim().split('\n')
      });
      return true;
    }
    return false;
  } catch (error) {
    // Pas de résultats trouvés
    return false;
  }
}

// 1. Vérifier les références à owners
console.log('1️⃣  Recherche de références à "owners"...');
if (searchInFiles('owners', 'Références à l\'ancienne table owners')) {
  console.log('   ❌ Trouvé des références à owners\n');
} else {
  console.log('   ✅ Aucune référence à owners\n');
}

// 2. Vérifier les références à partner_profiles
console.log('2️⃣  Recherche de références à "partner_profiles"...');
if (searchInFiles('partner_profiles', 'Références à l\'ancienne table partner_profiles')) {
  console.log('   ❌ Trouvé des références à partner_profiles\n');
} else {
  console.log('   ✅ Aucune référence à partner_profiles\n');
}

// 3. Vérifier les références à partner_id
console.log('3️⃣  Recherche de références à "partner_id"...');
if (searchInFiles('partner_id', 'Références à l\'ancienne colonne partner_id')) {
  console.log('   ❌ Trouvé des références à partner_id\n');
} else {
  console.log('   ✅ Aucune référence à partner_id\n');
}

// 4. Vérifier le fichier lofts.ts spécifiquement
console.log('4️⃣  Vérification de app/actions/lofts.ts...');
try {
  const loftsContent = fs.readFileSync('app/actions/lofts.ts', 'utf-8');
  
  if (loftsContent.includes('owners')) {
    console.log('   ❌ Contient "owners" - DOIT ÊTRE CORRIGÉ\n');
    issues.push({
      description: 'app/actions/lofts.ts contient owners',
      file: 'app/actions/lofts.ts',
      line: loftsContent.split('\n').findIndex(line => line.includes('owners')) + 1
    });
  } else {
    console.log('   ✅ Pas de référence à owners\n');
  }
} catch (error) {
  console.log('   ⚠️  Impossible de lire le fichier\n');
}

// 5. Vérifier le fichier owners.ts
console.log('5️⃣  Vérification de app/actions/owners.ts...');
try {
  const ownersContent = fs.readFileSync('app/actions/owners.ts', 'utf-8');
  
  if (ownersContent.includes('from("owners")') || ownersContent.includes("from('owners')")) {
    console.log('   ✅ Utilise la table owners\n');
  } else {
    console.log('   ❌ N\'utilise pas la table owners\n');
    issues.push({
      description: 'app/actions/owners.ts n\'utilise pas la table owners',
      file: 'app/actions/owners.ts'
    });
  }
} catch (error) {
  console.log('   ⚠️  Impossible de lire le fichier\n');
}

// Afficher le résumé
console.log('═'.repeat(60));
console.log('\n📊 RÉSUMÉ\n');

if (issues.length === 0) {
  console.log('✅ Aucun problème détecté!');
  console.log('   Tous les fichiers utilisent correctement la table owners.\n');
} else {
  console.log(`❌ ${issues.length} problème(s) détecté(s):\n`);
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.description}`);
    if (issue.file) {
      console.log(`   Fichier: ${issue.file}`);
      if (issue.line) {
        console.log(`   Ligne: ${issue.line}`);
      }
    }
    if (issue.results) {
      console.log(`   Résultats:`);
      issue.results.slice(0, 5).forEach(result => {
        console.log(`     ${result}`);
      });
      if (issue.results.length > 5) {
        console.log(`     ... et ${issue.results.length - 5} autres`);
      }
    }
    console.log('');
  });
  
  console.log('📝 Actions requises:');
  console.log('   1. Corriger les références trouvées');
  console.log('   2. Remplacer owners par owners');
  console.log('   3. Supprimer les références à partner_id\n');
}

console.log('═'.repeat(60));
console.log('\n💡 Fichiers à vérifier manuellement:');
console.log('   - app/actions/lofts.ts (ligne 122)');
console.log('   - app/actions/owners.ts');
console.log('   - components/forms/loft-form.tsx');
console.log('   - lib/types.ts (types TypeScript)\n');

process.exit(issues.length > 0 ? 1 : 0);
