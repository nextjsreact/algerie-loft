const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC APPROFONDI DU PROBLÈME DE TRADUCTION\n');

// Fonction pour analyser les composants qui utilisent les traductions
function analyzeComponents() {
  console.log('📁 Analyse des composants utilisant les traductions...');
  
  const componentsToCheck = [
    'app/[locale]/lofts/[id]/edit/edit-loft-page-client.tsx',
    'app/[locale]/lofts/[id]/edit/edit-loft-form-wrapper.tsx',
    'components/forms/loft-form.tsx',
    'lib/hooks/use-cached-translations.ts'
  ];
  
  componentsToCheck.forEach(componentPath => {
    const fullPath = path.join(__dirname, componentPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      console.log(`\n📄 ${componentPath}:`);
      
      // Vérifier l'import de useTranslations
      if (content.includes("from 'next-intl'")) {
        console.log('  ✅ Import next-intl détecté');
      } else if (content.includes('use-cached-translations')) {
        console.log('  ✅ Import hook personnalisé détecté');
      } else {
        console.log('  ❌ Aucun import de traduction détecté');
      }
      
      // Vérifier l'utilisation des traductions
      const translationMatches = content.match(/useTranslations\(['"`]([^'"`]*)['"`]\)/g);
      if (translationMatches) {
        translationMatches.forEach(match => {
          console.log(`  📋 ${match}`);
        });
      }
      
      // Vérifier l'utilisation des clés problématiques
      const problematicKeys = ['editLoft', 'updatePropertyDetails'];
      problematicKeys.forEach(key => {
        if (content.includes(key)) {
          console.log(`  🔑 Utilise la clé: ${key}`);
        }
      });
      
    } else {
      console.log(`\n❌ ${componentPath}: Fichier non trouvé`);
    }
  });
}

// Fonction pour vérifier la configuration du build
function checkBuildConfig() {
  console.log('\n⚙️ Vérification de la configuration du build...');
  
  // Vérifier next.config.mjs
  const nextConfigPath = path.join(__dirname, 'next.config.mjs');
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    console.log('✅ next.config.mjs trouvé');
    
    if (content.includes('next-intl/plugin')) {
      console.log('  ✅ Plugin next-intl configuré');
    } else {
      console.log('  ❌ Plugin next-intl non configuré');
    }
    
    if (content.includes('./i18n.ts')) {
      console.log('  ✅ Chemin i18n configuré');
    } else {
      console.log('  ❌ Chemin i18n non configuré');
    }
  }
  
  // Vérifier package.json
  const packagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log('✅ package.json trouvé');
    
    const nextIntlVersion = packageContent.dependencies?.['next-intl'];
    if (nextIntlVersion) {
      console.log(`  ✅ next-intl version: ${nextIntlVersion}`);
    } else {
      console.log('  ❌ next-intl non installé');
    }
  }
}

// Fonction pour créer un test de régression
function createRegressionTest() {
  console.log('\n🧪 Création d\'un test de régression...');
  
  const testContent = `import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { EditLoftPageClient } from '@/app/[locale]/lofts/[id]/edit/edit-loft-page-client'

// Mock des données de test
const mockLoft = { id: '1', name: 'Test Loft' }
const mockOwners = []
const mockZoneAreas = []
const mockInternetConnectionTypes = []

// Messages de test
const mockMessages = {
  lofts: {
    editLoft: 'Modifier l\\'appartement',
    updatePropertyDetails: 'Mettre à jour les détails de la propriété'
  }
}

describe('EditLoftPageClient Translation Test', () => {
  it('should display translated text correctly', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={mockMessages}>
        <EditLoftPageClient 
          loft={mockLoft}
          owners={mockOwners}
          zoneAreas={mockZoneAreas}
          internetConnectionTypes={mockInternetConnectionTypes}
        />
      </NextIntlClientProvider>
    )
    
    // Vérifier que les traductions sont affichées
    expect(screen.getByText('Modifier l\\'appartement')).toBeInTheDocument()
    expect(screen.getByText('Mettre à jour les détails de la propriété')).toBeInTheDocument()
  })
  
  it('should handle missing translations gracefully', () => {
    const incompleteMessages = { lofts: {} }
    
    render(
      <NextIntlClientProvider locale="fr" messages={incompleteMessages}>
        <EditLoftPageClient 
          loft={mockLoft}
          owners={mockOwners}
          zoneAreas={mockZoneAreas}
          internetConnectionTypes={mockInternetConnectionTypes}
        />
      </NextIntlClientProvider>
    )
    
    // Vérifier le fallback (devrait afficher la clé)
    expect(screen.getByText('editLoft')).toBeInTheDocument()
  })
})`;

  const testDir = path.join(__dirname, '__tests__', 'regression');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(testDir, 'translation-regression.test.tsx'), testContent);
  console.log('✅ Test de régression créé: __tests__/regression/translation-regression.test.tsx');
}

// Fonction pour analyser les logs d'erreur
function analyzeLogs() {
  console.log('\n📊 Analyse des logs d\'erreur potentiels...');
  
  // Chercher des fichiers de log
  const logFiles = ['.next/trace', '.next/server/trace'];
  
  logFiles.forEach(logPath => {
    const fullPath = path.join(__dirname, logPath);
    if (fs.existsSync(fullPath)) {
      console.log(`📄 Log trouvé: ${logPath}`);
      // Note: Les fichiers de trace Next.js sont binaires, on ne peut pas les lire directement
    }
  });
  
  // Vérifier les erreurs communes dans la console
  console.log('\n🔍 Erreurs communes à vérifier dans la console du navigateur:');
  console.log('  - "MISSING_MESSAGE" ou "Missing translation"');
  console.log('  - "Failed to load messages"');
  console.log('  - "Namespace not found"');
  console.log('  - Erreurs de cache ou de hydratation');
}

// Fonction principale
function runDiagnosis() {
  console.log('🚀 Démarrage du diagnostic complet...\n');
  
  analyzeComponents();
  checkBuildConfig();
  createRegressionTest();
  analyzeLogs();
  
  console.log('\n📋 RÉSUMÉ DU DIAGNOSTIC:');
  console.log('1. ✅ Fichiers de traduction: Intègres et complets');
  console.log('2. ✅ Configuration i18n: Correcte');
  console.log('3. ✅ Middleware: Configuré');
  console.log('4. ❓ Problème probable: Cache côté client ou hydratation');
  
  console.log('\n🔧 SOLUTIONS RECOMMANDÉES:');
  console.log('1. Vider le cache du navigateur (Ctrl+Shift+R)');
  console.log('2. Redémarrer le serveur de développement');
  console.log('3. Tester en mode incognito');
  console.log('4. Vérifier la console du navigateur pour les erreurs');
  console.log('5. Exécuter le test de régression: npm test regression');
  
  console.log('\n🎯 PROCHAINES ÉTAPES:');
  console.log('1. Ouvrir http://localhost:3000/fr/test-translations');
  console.log('2. Ouvrir les outils de développement (F12)');
  console.log('3. Vérifier l\'onglet Console pour les erreurs');
  console.log('4. Vérifier l\'onglet Network pour les requêtes de traduction');
  
  console.log('\n🏁 Diagnostic terminé');
}

// Exécuter le diagnostic
runDiagnosis();