const fs = require('fs');
const path = require('path');

// Fonction pour charger et vérifier les traductions
function loadTranslations(lang) {
  const filePath = path.join(__dirname, 'public', 'locales', lang, 'lofts.json');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Erreur lors du chargement de ${filePath}:`, error.message);
    return null;
  }
}

// Clés requises pour le composant lofts
const requiredKeys = [
  'title',
  'subtitle', 
  'addLoft',
  'createNewLoft',
  'addNewPropertyListing',
  'createLoft',
  'loftName',
  'loftAddress',
  'pricePerMonth',
  'creating',
  'loftCreatedSuccess',
  'loftCreatedSuccessDescription',
  'errorCreatingLoft',
  'errorCreatingLoftDescription',
  'systemError',
  'systemErrorDescription',
  'loftCreateError',
  'managePropertiesDescription',
  'totalRevenue',
  'filterTitle',
  'available',
  'occupied', 
  'maintenance',
  'noLoftsYet',
  'startYourJourney',
  'addFirstLoft',
  'filterByStatus',
  'allStatuses',
  'filterByOwner',
  'allOwners',
  'filterByZoneArea',
  'allZoneAreas',
  'owner',
  'zoneArea',
  'companyShare',
  'noLoftsFound',
  'noLoftsMatch',
  'unknown',
  'deleteConfirm',
  'deleteConfirmationPrompt',
  'deleteConfirmationKeyword',
  'deletingInProgress',
  'deletingDescription',
  'deleteSuccess',
  'deleteSuccessDescription',
  'deleteError',
  'deleteErrorDescription',
  'deleteCancelled',
  'deleteCancelledDescription',
  'deleteLoft',
  'status.available',
  'status.occupied',
  'status.maintenance',
  'descriptions.heavenLoft',
  'descriptions.aidaLoft',
  'descriptions.nadaLoft',
  'descriptions.modernCenterAlger',
  'descriptions.studioHydraPremium',
  'descriptions.loftStudentBabEzzouar',
  'descriptions.penthouseOranSeaView',
  'descriptions.familyLoftConstantine'
];

function checkTranslations() {
  const languages = ['fr', 'en', 'ar'];
  const results = {};
  
  console.log('🔍 Vérification des traductions des lofts...\n');
  
  languages.forEach(lang => {
    console.log(`📋 Vérification de la langue: ${lang.toUpperCase()}`);
    const translations = loadTranslations(lang);
    
    if (!translations) {
      results[lang] = { status: 'error', missing: requiredKeys };
      return;
    }
    
    const missing = [];
    const present = [];
    
    requiredKeys.forEach(key => {
      const keyParts = key.split('.');
      let current = translations;
      let found = true;
      
      for (const part of keyParts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          found = false;
          break;
        }
      }
      
      if (found && current !== undefined && current !== null && current !== '') {
        present.push(key);
      } else {
        missing.push(key);
      }
    });
    
    results[lang] = {
      status: missing.length === 0 ? 'ok' : 'incomplete',
      missing,
      present,
      total: requiredKeys.length,
      found: present.length
    };
    
    if (missing.length === 0) {
      console.log(`✅ Toutes les clés sont présentes (${present.length}/${requiredKeys.length})`);
    } else {
      console.log(`❌ Clés manquantes (${missing.length}/${requiredKeys.length}):`);
      missing.forEach(key => console.log(`   - ${key}`));
    }
    console.log('');
  });
  
  return results;
}

// Exécution du script
console.log('🚀 Test des traductions des lofts\n');
const results = checkTranslations();

console.log('📊 Résumé:');
Object.keys(results).forEach(lang => {
  const result = results[lang];
  console.log(`${lang.toUpperCase()}: ${result.found}/${result.total} clés présentes (${result.status})`);
});