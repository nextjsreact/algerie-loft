const fs = require('fs');
const path = require('path');

// Configuration
const locales = ['en', 'fr', 'ar'];
const baseDir = path.join(__dirname, '../public/locales');

// Fonction pour créer un fichier JSON s'il n'existe pas
function ensureFile(filePath, defaultContent = {}) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf8');
    console.log(`✅ Created: ${filePath}`);
  }
}

// Fonction pour ajouter les clés manquantes à un fichier existant
function addMissingKeys(filePath, newKeys) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(newKeys, null, 2), 'utf8');
    console.log(`✅ Created: ${filePath}`);
    return;
  }

  try {
    const existingContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const updatedContent = { ...existingContent, ...newKeys };
    fs.writeFileSync(filePath, JSON.stringify(updatedContent, null, 2), 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Clés manquantes pour chaque namespace
const missingKeys = {
  lofts: {
    title: "Lofts",
    subtitle: "Manage your property listings",
    addLoft: "Add Loft",
    createLoft: "Create Loft",
    editLoft: "Edit Loft",
    deleteLoft: "Delete Loft",
    dailyRent: "Daily Rent",
    companyShare: "Company Share",
    loftName: "Loft Name",
    loftAddress: "Loft Address",
    pricePerMonth: "Price per month",
    couldNotLoadData: "Could not load data",
    deleteConfirm: "Are you sure you want to delete this loft? All associated data will be permanently deleted.",
    deleteConfirmationKeyword: "Please type \"DELETE\" to confirm loft deletion.",
    deleteConfirmationPrompt: "Type DELETE to confirm",
    deleteError: "Error deleting loft.",
    deleteErrorDescription: "An error occurred while deleting the loft.",
    deleteSuccess: "Loft deleted successfully!",
    deleteSuccessDescription: "The loft has been permanently deleted.",
    deleteCancelled: "Delete Cancelled",
    deleteCancelledDescription: "Loft deletion was cancelled.",
    deletingDescription: "Deleting loft...",
    deletingInProgress: "Deleting in progress...",
    errorCreatingLoft: "Error creating loft.",
    errorCreatingLoftDescription: "An error occurred while creating the loft.",
    loftCreatedSuccess: "Loft created successfully!",
    loftCreatedSuccessDescription: "The new loft has been added to your properties.",
    loftCreateError: "Loft creation error",
    loftUpdated: "Loft updated successfully!",
    updatePropertyDetails: "Update property details",
    creating: "Creating...",
    systemError: "System Error",
    systemErrorDescription: "An unexpected system error occurred.",
    noLoftsMatch: "No lofts match your search.",
    unknown: "Unknown",
    status: {
      available: "Available",
      occupied: "Occupied",
      maintenance: "Maintenance"
    }
  },
  nav: {
    application: "Application",
    categories: "Categories",
    conversations: "Conversations",
    currencies: "Currencies",
    dashboard: "Dashboard",
    internetConnections: "Internet Connections",
    lofts: "Lofts",
    notifications: "Notifications",
    owners: "Owners",
    paymentMethods: "Payment Methods",
    paymentMethodsNav: "Payment Methods",
    reports: "Reports",
    reservations: "Reservations",
    settings: "Settings",
    tasks: "Tasks",
    teams: "Teams",
    transactions: "Transactions",
    zoneAreas: "Geographic Zones"
  },
  theme: {
    dark: "Dark",
    light: "Light",
    system: "System"
  },
  testTranslations: {
    title: "Test Translations",
    currentLanguage: "Current Language",
    testedTranslations: "Tested Translations",
    english: "English",
    french: "French",
    arabic: "Arabic"
  }
};

// Fonction principale
function fixAllTranslations() {
  console.log('🔧 Fixing all translation files...');

  // Créer/Corriger les fichiers pour chaque locale
  locales.forEach(locale => {
    console.log(`\n📝 Processing locale: ${locale}`);
    
    // Corriger le fichier common.json
    const commonPath = path.join(baseDir, locale, 'common.json');
    if (fs.existsSync(commonPath)) {
      console.log(`✅ ${locale}/common.json exists`);
    } else {
      console.log(`❌ ${locale}/common.json missing`);
    }

    // Créer/Corriger les fichiers de namespace
    Object.keys(missingKeys).forEach(namespace => {
      const filePath = path.join(baseDir, locale, `${namespace}.json`);
      const keys = missingKeys[namespace];
      
      // Pour l'anglais, utiliser les clés telles quelles
      // Pour le français et l'arabe, on pourrait ajouter des traductions
      if (locale === 'en') {
        addMissingKeys(filePath, keys);
      } else {
        // Pour l'instant, copier les clés anglaises (à traduire plus tard)
        addMissingKeys(filePath, keys);
      }
    });
  });

  console.log('\n✅ Translation files fixed!');
}

// Exécuter le script
fixAllTranslations();

