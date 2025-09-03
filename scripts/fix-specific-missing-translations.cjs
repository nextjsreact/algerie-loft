const fs = require('fs');
const path = require('path');

// Traductions spécifiques manquantes identifiées dans l'interface
const specificMissingTranslations = {
  'fr': {
    'common': {
      'appName': 'Loft Manager',
      'admin': 'Admin',
      'manager': 'Gérant', 
      'member': 'Membre',
      'executive': 'Direction'
    },
    'nav': {
      'loftManager': 'Loft Manager'
    },
    'transactions': {
      'addNewTransaction': 'Ajouter une Nouvelle Transaction',
      'createNewTransaction': 'Créer une nouvelle transaction',
      'transactionType': 'Type de Transaction',
      'type': 'Type',
      'status': 'Statut',
      'amountAndDate': 'Montant et Date',
      'amount': 'Montant',
      'date': 'Date',
      'description': 'Description',
      'transactionDescription': 'Description de la transaction',
      'categoriesAndProperties': 'Catégories et Propriétés',
      'category': 'Catégorie',
      'loft': 'Loft',
      'optional': 'Facultatif',
      'paymentDetails': 'Détails de paiement',
      'currency': 'Devise',
      'paymentMethod': 'Méthode de Paiement'
    }
  },
  'en': {
    'common': {
      'appName': 'Loft Manager',
      'admin': 'Admin',
      'manager': 'Manager',
      'member': 'Member', 
      'executive': 'Executive'
    },
    'nav': {
      'loftManager': 'Loft Manager'
    },
    'transactions': {
      'addNewTransaction': 'Add New Transaction',
      'createNewTransaction': 'Create new transaction',
      'transactionType': 'Transaction Type',
      'type': 'Type',
      'status': 'Status',
      'amountAndDate': 'Amount and Date',
      'amount': 'Amount',
      'date': 'Date',
      'description': 'Description',
      'transactionDescription': 'Transaction description',
      'categoriesAndProperties': 'Categories and Properties',
      'category': 'Category',
      'loft': 'Loft',
      'optional': 'Optional',
      'paymentDetails': 'Payment Details',
      'currency': 'Currency',
      'paymentMethod': 'Payment Method'
    }
  },
  'ar': {
    'common': {
      'appName': 'مدير الشقق',
      'admin': 'مدير',
      'manager': 'مدير',
      'member': 'عضو',
      'executive': 'تنفيذي'
    },
    'nav': {
      'loftManager': 'مدير الشقق'
    },
    'transactions': {
      'addNewTransaction': 'إضافة معاملة جديدة',
      'createNewTransaction': 'إنشاء معاملة جديدة',
      'transactionType': 'نوع المعاملة',
      'type': 'النوع',
      'status': 'الحالة',
      'amountAndDate': 'المبلغ والتاريخ',
      'amount': 'المبلغ',
      'date': 'التاريخ',
      'description': 'الوصف',
      'transactionDescription': 'وصف المعاملة',
      'categoriesAndProperties': 'الفئات والخصائص',
      'category': 'الفئة',
      'loft': 'الشقة',
      'optional': 'اختياري',
      'paymentDetails': 'تفاصيل الدفع',
      'currency': 'العملة',
      'paymentMethod': 'طريقة الدفع'
    }
  }
};

function updateTranslationFile(lang, namespace, translations) {
  const filePath = path.join(__dirname, '..', 'public', 'locales', lang, `${namespace}.json`);
  
  try {
    let existingTranslations = {};
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      existingTranslations = JSON.parse(content);
    }
    
    // Merge translations, giving priority to new translations
    const updatedTranslations = { ...existingTranslations, ...translations };
    
    // Write back to file with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(updatedTranslations, null, 2), 'utf8');
    console.log(`✅ Updated ${lang}/${namespace}.json with ${Object.keys(translations).length} translations`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}/${namespace}.json:`, error.message);
  }
}

function main() {
  console.log('🔧 Fixing specific missing translations...\n');
  
  Object.keys(specificMissingTranslations).forEach(lang => {
    console.log(`\n📝 Processing language: ${lang.toUpperCase()}`);
    Object.keys(specificMissingTranslations[lang]).forEach(namespace => {
      updateTranslationFile(lang, namespace, specificMissingTranslations[lang][namespace]);
    });
  });
  
  console.log('\n✅ All specific missing translations have been fixed!');
  console.log('\n📋 Summary of added translations:');
  console.log('- App name: Loft Manager');
  console.log('- User roles: Admin, Manager, Member, Executive');
  console.log('- Transaction form fields: Type, Status, Amount, Date, Description, etc.');
  console.log('- Form sections: Amount and Date, Categories and Properties, Payment Details');
  console.log('- Field labels: Optional, Currency, Payment Method');
}

main();