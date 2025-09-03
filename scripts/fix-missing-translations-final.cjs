const fs = require('fs');
const path = require('path');

// Traductions manquantes identifiées
const missingTranslations = {
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
      'amount': 'Montant',
      'date': 'Date',
      'description': 'Description',
      'category': 'Catégorie',
      'loft': 'Loft',
      'currency': 'Devise',
      'paymentMethod': 'Méthode de Paiement',
      'optional': 'Facultatif',
      'status': 'Statut',
      'type': 'Type'
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
      'amount': 'Amount',
      'date': 'Date',
      'description': 'Description',
      'category': 'Category',
      'loft': 'Loft',
      'currency': 'Currency',
      'paymentMethod': 'Payment Method',
      'optional': 'Optional',
      'status': 'Status',
      'type': 'Type'
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
      'amount': 'المبلغ',
      'date': 'التاريخ',
      'description': 'الوصف',
      'category': 'الفئة',
      'loft': 'الشقة',
      'currency': 'العملة',
      'paymentMethod': 'طريقة الدفع',
      'optional': 'اختياري',
      'status': 'الحالة',
      'type': 'النوع'
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
    
    // Merge translations
    const updatedTranslations = { ...existingTranslations, ...translations };
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(updatedTranslations, null, 2), 'utf8');
    console.log(`✅ Updated ${lang}/${namespace}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}/${namespace}.json:`, error.message);
  }
}

function main() {
  console.log('🔧 Fixing missing translations...\n');
  
  Object.keys(missingTranslations).forEach(lang => {
    Object.keys(missingTranslations[lang]).forEach(namespace => {
      updateTranslationFile(lang, namespace, missingTranslations[lang][namespace]);
    });
  });
  
  console.log('\n✅ All missing translations have been added!');
}

main();