/**
 * Script pour corriger automatiquement les références aux anciennes tables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Correction des références aux anciennes tables...\n');
console.log('═'.repeat(60) + '\n');

const fixes = [];

// Fonction pour corriger un fichier
function fixFile(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    const originalContent = content;

    replacements.forEach(({ from, to, description }) => {
      if (content.includes(from)) {
        content = content.replaceAll(from, to);
        modified = true;
        fixes.push({
          file: filePath,
          description,
          from,
          to
        });
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
    return false;
  }
}

// 1. Corriger app/actions/lofts.ts
console.log('1️⃣  Correction de app/actions/lofts.ts...');
fixFile('app/actions/lofts.ts', [
  {
    from: '.select("*, owner:loft_owners(name)")',
    to: '.select("*, owner:owners(name)")',
    description: 'Remplacer loft_owners par owners dans select'
  }
]);

// 2. Corriger app/actions/availability.ts
console.log('\n2️⃣  Correction de app/actions/availability.ts...');
fixFile('app/actions/availability.ts', [
  {
    from: "Database['public']['Tables']['loft_owners']['Row']",
    to: "Database['public']['Tables']['owners']['Row']",
    description: 'Corriger le type TypeScript'
  },
  {
    from: '.from("loft_owners")',
    to: '.from("owners")',
    description: 'Remplacer table loft_owners'
  },
  {
    from: 'loft_owners!inner(',
    to: 'owners!inner(',
    description: 'Corriger la jointure'
  },
  {
    from: 'loft.loft_owners.name',
    to: 'loft.owners.name',
    description: 'Corriger l\'accès au nom du propriétaire'
  }
]);

console.log('\n═'.repeat(60));
console.log('\n📊 RÉSUMÉ DES CORRECTIONS\n');

if (fixes.length === 0) {
  console.log('✅ Aucune correction nécessaire\n');
} else {
  console.log(`✅ ${fixes.length} correction(s) appliquée(s):\n`);
  
  const fileGroups = {};
  fixes.forEach(fix => {
    if (!fileGroups[fix.file]) {
      fileGroups[fix.file] = [];
    }
    fileGroups[fix.file].push(fix);
  });

  Object.entries(fileGroups).forEach(([file, fileFixes]) => {
    console.log(`📄 ${path.relative(process.cwd(), file)}`);
    fileFixes.forEach(fix => {
      console.log(`   - ${fix.description}`);
      console.log(`     "${fix.from}" → "${fix.to}"`);
    });
    console.log('');
  });
}

console.log('═'.repeat(60));
console.log('\n⚠️  CORRECTIONS MANUELLES NÉCESSAIRES\n');
console.log('Les fichiers suivants contiennent des références à partner_profiles');
console.log('et partner_id qui doivent être corrigées manuellement:\n');
console.log('📁 API Routes (bookings, partners, etc.):');
console.log('   - app/api/admin/bookings/route.ts');
console.log('   - app/api/admin/partners/*/route.ts');
console.log('   - app/api/admin/dashboard/*/route.ts\n');
console.log('Ces fichiers concernent le système de partenaires/bookings');
console.log('qui est différent du système de propriétaires de lofts.\n');
console.log('💡 Si ces systèmes doivent aussi utiliser "owners",');
console.log('   ils nécessitent une migration séparée.\n');

console.log('═'.repeat(60));
console.log('\n✅ Corrections des références loft_owners terminées!');
console.log('\n📝 Prochaines étapes:');
console.log('   1. Vérifier les fichiers modifiés');
console.log('   2. Tester l\'application: npm run dev');
console.log('   3. Finaliser la migration si tout fonctionne\n');
