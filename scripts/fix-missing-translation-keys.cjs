const fs = require('fs');
const path = require('path');

// Configuration
const locales = ['en', 'fr', 'ar'];
const baseDir = path.join(__dirname, '../public/locales');

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

// Toutes les clés manquantes identifiées
const missingKeys = {
  transactions: {
    title: "Transactions",
    subtitle: "Track your income and expenses",
    addNewTransaction: "Add New Transaction",
    referenceAmounts: "Reference Amounts",
    referenceAmountsTitle: "Reference Amounts",
    referenceAmountDZD: "Reference Amount (DZD)",
    addCategory: "Add Category",
    addNewCategory: "Add New Category",
    allCategories: "All Categories",
    allCurrencies: "All Currencies",
    allLofts: "All Lofts",
    allPaymentMethods: "All Payment Methods",
    allTypes: "All Types",
    amount: "Amount",
    category: "Category",
    categoryLabel: "Category",
    categoryPlaceholder: "Select category",
    completed: "Completed",
    continue: "Continue",
    createNewTransaction: "Create New Transaction",
    createTransaction: "Create Transaction",
    currency: "Currency",
    date: "Date",
    deleteConfirmDescription: "This action cannot be undone.",
    deleteConfirmTitle: "Delete Transaction",
    description: "Description",
    editTransaction: "Edit Transaction",
    endDate: "End Date",
    enterAmount: "Enter amount",
    enterTransactionInfo: "Enter transaction information",
    equivalent: "Equivalent",
    expense: "Expense",
    expenses: "Expenses",
    failed: "Failed",
    fillAllFields: "Please fill all required fields",
    howItWorks: "How it works",
    howItWorksSteps: {
      step1: "Enter transaction details",
      step2: "Select category and payment method",
      step3: "Review and confirm",
      step4: "Transaction saved"
    },
    income: "Income",
    loadingError: "Error loading transactions",
    loft: "Loft",
    netIncome: "Net Income",
    noTransactions: "No transactions found",
    optional: "Optional",
    paymentMethod: "Payment Method",
    pending: "Pending",
    ratio: "Ratio",
    selectType: "Select Type",
    startDate: "Start Date",
    status: "Status",
    totalExpenses: "Total Expenses",
    totalIncome: "Total Income",
    transactionDetails: "Transaction Details",
    transactionType: "Transaction Type",
    type: "Type",
    updateError: "Error updating transaction",
    updateSuccess: "Transaction updated successfully",
    updateTransaction: "Update Transaction",
    updateTransactionInfo: "Update transaction information",
    addError: "Error adding transaction"
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
  },
  // Ajout des clés manquantes pour les lofts
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
  }
};

// Fonction principale
function fixMissingTranslationKeys() {
  console.log('🔧 Adding missing translation keys...');

  // Créer/Corriger les fichiers pour chaque locale
  locales.forEach(locale => {
    console.log(`\n📝 Processing locale: ${locale}`);
    
    // Créer/Corriger les fichiers de namespace
    Object.keys(missingKeys).forEach(namespace => {
      const filePath = path.join(baseDir, locale, `${namespace}.json`);
      const keys = missingKeys[namespace];
      
      addMissingKeys(filePath, keys);
    });
  });

  console.log('\n✅ Missing translation keys added!');
}

// Exécuter le script
fixMissingTranslationKeys();

