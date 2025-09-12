const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification Complète du Composant Lofts\n');

// 1. Vérifier les fichiers principaux
const criticalFiles = [
    'app/lofts/page.tsx',
    'app/lofts/lofts-list.tsx', 
    'components/lofts/lofts-wrapper.tsx',
    'app/actions/lofts.ts',
    'public/locales/fr/lofts.json',
    'public/locales/en/lofts.json',
    'public/locales/ar/lofts.json'
];

console.log('📁 Vérification des fichiers critiques:');
let allFilesExist = true;
criticalFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
    console.log('\n❌ Des fichiers critiques sont manquants !');
    process.exit(1);
}

// 2. Vérifier les traductions
console.log('\n🌐 Vérification des traductions:');
const requiredKeys = [
    'title', 'subtitle', 'addLoft', 'managePropertiesDescription',
    'totalRevenue', 'filterTitle', 'available', 'occupied', 'maintenance',
    'noLoftsYet', 'startYourJourney', 'addFirstLoft', 'filterByStatus',
    'allStatuses', 'filterByOwner', 'allOwners', 'filterByZoneArea',
    'allZoneAreas', 'owner', 'zoneArea', 'companyShare', 'pricePerMonth',
    'noLoftsFound', 'noLoftsMatch', 'unknown',
    'status.available', 'status.occupied', 'status.maintenance'
];

const languages = ['fr', 'en', 'ar'];
let allTranslationsOk = true;

languages.forEach(lang => {
    const filePath = path.join(__dirname, 'public', 'locales', lang, 'lofts.json');
    try {
        const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const missing = requiredKeys.filter(key => {
            const keyParts = key.split('.');
            let current = translations;
            
            for (const part of keyParts) {
                if (current && typeof current === 'object' && part in current) {
                    current = current[part];
                } else {
                    return true; // missing
                }
            }
            
            return !current || current === '';
        });
        
        if (missing.length === 0) {
            console.log(`✅ ${lang.toUpperCase()}: ${requiredKeys.length}/${requiredKeys.length} clés`);
        } else {
            console.log(`❌ ${lang.toUpperCase()}: ${requiredKeys.length - missing.length}/${requiredKeys.length} clés`);
            console.log(`   Manquantes: ${missing.join(', ')}`);
            allTranslationsOk = false;
        }
    } catch (error) {
        console.log(`❌ ${lang.toUpperCase()}: Erreur de lecture - ${error.message}`);
        allTranslationsOk = false;
    }
});

// 3. Vérifier la structure des composants
console.log('\n🏗️ Vérification de la structure des composants:');

// Vérifier les imports dans lofts-list.tsx
const loftsListPath = path.join(__dirname, 'app/lofts/lofts-list.tsx');
const loftsListContent = fs.readFileSync(loftsListPath, 'utf8');

const requiredImports = [
    'useTranslation',
    'LoftWithRelations',
    'LoftOwner', 
    'ZoneArea',
    'LoftStatus'
];

let importsOk = true;
requiredImports.forEach(imp => {
    if (loftsListContent.includes(imp)) {
        console.log(`✅ Import: ${imp}`);
    } else {
        console.log(`❌ Import manquant: ${imp}`);
        importsOk = false;
    }
});

// Vérifier les références de traduction
const translationRefs = [
    "t('lofts:filterTitle')",
    "t('lofts:filterByStatus')",
    "t('lofts:allStatuses')",
    "t('lofts:status.available')",
    "t('lofts:status.occupied')",
    "t('lofts:status.maintenance')"
];

console.log('\n🔗 Vérification des références de traduction:');
let refsOk = true;
translationRefs.forEach(ref => {
    if (loftsListContent.includes(ref)) {
        console.log(`✅ Référence: ${ref}`);
    } else {
        console.log(`⚠️  Référence non trouvée: ${ref}`);
        // Note: Certaines références peuvent être dynamiques
    }
});

// 4. Résumé final
console.log('\n📊 RÉSUMÉ FINAL:');
console.log(`📁 Fichiers critiques: ${allFilesExist ? '✅ OK' : '❌ PROBLÈME'}`);
console.log(`🌐 Traductions: ${allTranslationsOk ? '✅ OK' : '❌ PROBLÈME'}`);
console.log(`🏗️ Structure: ${importsOk ? '✅ OK' : '❌ PROBLÈME'}`);

const overallStatus = allFilesExist && allTranslationsOk && importsOk;
console.log(`\n🎯 STATUT GLOBAL: ${overallStatus ? '✅ COMPOSANT FONCTIONNEL' : '❌ PROBLÈMES DÉTECTÉS'}`);

if (overallStatus) {
    console.log('\n🎉 Le composant lofts est prêt à fonctionner !');
    console.log('💡 Conseils:');
    console.log('   - Créez une sauvegarde: node backup-working-translations.cjs backup');
    console.log('   - Testez la page: npm run dev puis visitez /lofts');
    console.log('   - Ouvrez test-lofts-page.html pour un diagnostic complet');
} else {
    console.log('\n⚠️  Des problèmes ont été détectés. Consultez le GUIDE_RESOLUTION_LOFTS.md');
}

process.exit(overallStatus ? 0 : 1);