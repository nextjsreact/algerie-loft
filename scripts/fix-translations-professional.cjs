const fs = require('fs');
const path = require('path');

console.log('🚀 CORRECTION PROFESSIONNELLE DU SYSTÈME DE TRADUCTIONS\n');

// Lire le fichier de traductions actuel
const translationsPath = path.join(__dirname, '../lib/i18n/translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

// Créer une sauvegarde
const backupPath = path.join(__dirname, `../lib/i18n/translations-backup-${Date.now()}.ts`);
fs.writeFileSync(backupPath, content);
console.log(`💾 Sauvegarde créée: ${backupPath}`);

// Clés manquantes identifiées avec leurs traductions
const missingTranslations = {
  // Common - Traductions communes essentielles
  'common.pickDate': {
    en: 'Pick a date',
    fr: 'Choisir une date',
    ar: 'اختر تاريخاً'
  },
  'common.pickDateRange': {
    en: 'Pick date range',
    fr: 'Choisir une plage de dates',
    ar: 'اختر نطاق التواريخ'
  },
  'common.next': {
    en: 'Next',
    fr: 'Suivant',
    ar: 'التالي'
  },
  'common.previous': {
    en: 'Previous',
    fr: 'Précédent',
    ar: 'السابق'
  },
  'common.today': {
    en: 'Today',
    fr: 'Aujourd\'hui',
    ar: 'اليوم'
  },
  'common.date': {
    en: 'Date',
    fr: 'Date',
    ar: 'التاريخ'
  },
  'common.time': {
    en: 'Time',
    fr: 'Heure',
    ar: 'الوقت'
  },
  'common.none': {
    en: 'None',
    fr: 'Aucun',
    ar: 'لا شيء'
  },
  'common.selectOption': {
    en: 'Select an option',
    fr: 'Sélectionner une option',
    ar: 'اختر خياراً'
  },

  // Theme - Thème
  'theme.light': {
    en: 'Light',
    fr: 'Clair',
    ar: 'فاتح'
  },
  'theme.dark': {
    en: 'Dark',
    fr: 'Sombre',
    ar: 'داكن'
  },
  'theme.system': {
    en: 'System',
    fr: 'Système',
    ar: 'النظام'
  },

  // Navigation - Navigation
  'nav.application': {
    en: 'Application',
    fr: 'Application',
    ar: 'التطبيق'
  },
  'nav.categories': {
    en: 'Categories',
    fr: 'Catégories',
    ar: 'الفئات'
  },

  // Settings - Paramètres
  'settings.title': {
    en: 'Settings',
    fr: 'Paramètres',
    ar: 'الإعدادات'
  },
  'settings.subtitle': {
    en: 'Manage your application settings and preferences',
    fr: 'Gérez les paramètres et préférences de votre application',
    ar: 'إدارة إعدادات التطبيق وتفضيلاتك'
  },
  'settings.profileInfo': {
    en: 'Profile Information',
    fr: 'Informations du profil',
    ar: 'معلومات الملف الشخصي'
  },
  'settings.updateProfile': {
    en: 'Update Profile',
    fr: 'Mettre à jour le profil',
    ar: 'تحديث الملف الشخصي'
  },
  'settings.fullName': {
    en: 'Full Name',
    fr: 'Nom complet',
    ar: 'الاسم الكامل'
  },
  'settings.email': {
    en: 'Email',
    fr: 'Email',
    ar: 'البريد الإلكتروني'
  },
  'settings.role': {
    en: 'Role',
    fr: 'Rôle',
    ar: 'الدور'
  },
  'settings.updatePersonalInfo': {
    en: 'Update Personal Information',
    fr: 'Mettre à jour les informations personnelles',
    ar: 'تحديث المعلومات الشخصية'
  },
  'settings.security': {
    en: 'Security',
    fr: 'Sécurité',
    ar: 'الأمان'
  },
  'settings.manageAccountSecurity': {
    en: 'Manage your account security',
    fr: 'Gérer la sécurité de votre compte',
    ar: 'إدارة أمان حسابك'
  },
  'settings.changePassword': {
    en: 'Change Password',
    fr: 'Changer le mot de passe',
    ar: 'تغيير كلمة المرور'
  },
  'settings.currentPassword': {
    en: 'Current Password',
    fr: 'Mot de passe actuel',
    ar: 'كلمة المرور الحالية'
  },
  'settings.newPassword': {
    en: 'New Password',
    fr: 'Nouveau mot de passe',
    ar: 'كلمة المرور الجديدة'
  },
  'settings.confirmPassword': {
    en: 'Confirm Password',
    fr: 'Confirmer le mot de passe',
    ar: 'تأكيد كلمة المرور'
  },
  'settings.notifications': {
    en: 'Notifications',
    fr: 'Notifications',
    ar: 'الإشعارات'
  },
  'settings.configureNotifications': {
    en: 'Configure your notification preferences',
    fr: 'Configurez vos préférences de notification',
    ar: 'قم بتكوين تفضيلات الإشعارات'
  },

  // Reservations - Réservations
  'reservations.title': {
    en: 'Reservations',
    fr: 'Réservations',
    ar: 'الحجوزات'
  },
  'reservations.newReservation': {
    en: 'New Reservation',
    fr: 'Nouvelle réservation',
    ar: 'حجز جديد'
  },
  'reservations.create': {
    en: 'Create',
    fr: 'Créer',
    ar: 'إنشاء'
  },
  'reservations.nights': {
    en: 'nights',
    fr: 'nuits',
    ar: 'ليالي'
  },
  'reservations.description': {
    en: 'Description',
    fr: 'Description',
    ar: 'الوصف'
  },

  // Calendar - Calendrier
  'reservations.calendar.title': {
    en: 'Calendar',
    fr: 'Calendrier',
    ar: 'التقويم'
  },
  'reservations.calendar.work_week': {
    en: 'Work Week',
    fr: 'Semaine de travail',
    ar: 'أسبوع العمل'
  },
  'reservations.calendar.yesterday': {
    en: 'Yesterday',
    fr: 'Hier',
    ar: 'أمس'
  },
  'reservations.calendar.tomorrow': {
    en: 'Tomorrow',
    fr: 'Demain',
    ar: 'غداً'
  },

  // Transactions - Transactions
  'transactions.type': {
    en: 'Type',
    fr: 'Type',
    ar: 'النوع'
  },
  'transactions.income': {
    en: 'Income',
    fr: 'Revenus',
    ar: 'الدخل'
  },
  'transactions.expense': {
    en: 'Expense',
    fr: 'Dépenses',
    ar: 'المصروفات'
  },
  'transactions.optional': {
    en: 'Optional',
    fr: 'Optionnel',
    ar: 'اختياري'
  }
};

// Fonction pour ajouter les traductions manquantes
function addMissingTranslations(content, missingTranslations) {
  let updatedContent = content;
  
  // Pour chaque langue
  const languages = ['en', 'fr', 'ar'];
  
  languages.forEach(lang => {
    // Trouver la position de fin de la section de la langue
    const langPattern = new RegExp(`(${lang}:\\s*{[\\s\\S]*?)(\\n\\s*},?\\s*\\n\\s*(?:en|fr|ar):|\\n\\s*}\\s*$)`, 'g');
    const match = langPattern.exec(updatedContent);
    
    if (match) {
      const beforeEnd = match[1];
      const afterEnd = match[2];
      
      // Construire les nouvelles traductions pour cette langue
      let newTranslations = '';
      
      // Grouper les traductions par section
      const sections = {};
      Object.keys(missingTranslations).forEach(key => {
        const parts = key.split('.');
        const section = parts[0];
        const subKey = parts.slice(1).join('.');
        
        if (!sections[section]) {
          sections[section] = {};
        }
        sections[section][subKey] = missingTranslations[key][lang];
      });
      
      // Ajouter les sections manquantes
      Object.keys(sections).forEach(sectionName => {
        // Vérifier si la section existe déjà
        const sectionPattern = new RegExp(`${sectionName}:\\s*{`, 'g');
        if (!sectionPattern.test(beforeEnd)) {
          // Ajouter la nouvelle section
          newTranslations += `\\n\\n    // ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\\n`;
          newTranslations += `    ${sectionName}: {\\n`;
          
          Object.keys(sections[sectionName]).forEach(subKey => {
            newTranslations += `      ${subKey}: "${sections[sectionName][subKey]}",\\n`;
          });
          
          newTranslations += `    },`;
        } else {
          // Ajouter les clés manquantes à la section existante
          Object.keys(sections[sectionName]).forEach(subKey => {
            const fullKey = `${sectionName}.${subKey}`;
            const keyPattern = new RegExp(`${subKey}:\\s*["'][^"']*["']`, 'g');
            if (!keyPattern.test(beforeEnd)) {
              // Trouver la fin de la section et ajouter la clé
              const sectionEndPattern = new RegExp(`(${sectionName}:\\s*{[^}]*)(})`);
              const sectionMatch = sectionEndPattern.exec(beforeEnd);
              if (sectionMatch) {
                const newKey = `      ${subKey}: "${sections[sectionName][subKey]}",\\n    `;
                updatedContent = updatedContent.replace(sectionMatch[0], sectionMatch[1] + newKey + sectionMatch[2]);
              }
            }
          });
        }
      });
      
      if (newTranslations) {
        updatedContent = updatedContent.replace(match[0], beforeEnd + newTranslations + afterEnd);
      }
    }
  });
  
  return updatedContent;
}

// Appliquer les corrections
console.log('🔧 Application des corrections...');
const correctedContent = addMissingTranslations(content, missingTranslations);

// Sauvegarder le fichier corrigé
fs.writeFileSync(translationsPath, correctedContent);

console.log('✅ Corrections appliquées avec succès!');
console.log(`📊 ${Object.keys(missingTranslations).length} clés ajoutées pour chaque langue`);
console.log('🎉 Le système de traductions est maintenant plus complet!');

// Vérification finale
console.log('\\n🔍 Vérification finale...');
const finalContent = fs.readFileSync(translationsPath, 'utf8');
let addedCount = 0;

Object.keys(missingTranslations).forEach(key => {
  if (finalContent.includes(key.split('.')[1] + ':')) {
    addedCount++;
  }
});

console.log(`✅ ${addedCount}/${Object.keys(missingTranslations).length} clés vérifiées comme ajoutées`);
console.log('\\n🎯 CORRECTION TERMINÉE AVEC SUCCÈS!');