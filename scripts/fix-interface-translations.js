#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script de correction ciblé pour les traductions d'interface manquantes
 */
console.log('🔧 Correction des traductions d\'interface manquantes...\n');

const languages = ['fr', 'en', 'ar'];
const translationFiles = {};

// Charger les fichiers de traduction
languages.forEach(lang => {
  const filePath = path.join('messages', `${lang}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    translationFiles[lang] = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Erreur lors du chargement de ${lang}.json`);
    translationFiles[lang] = {};
  }
});

// Fonction pour définir une valeur dans un objet
function setTranslationValue(obj, key, value) {
  const keys = key.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current) || typeof current[k] !== 'object') {
      current[k] = {};
    }
    current = current[k];
  }
  
  current[keys[keys.length - 1]] = value;
}

// Traductions spécifiques pour l'interface
const interfaceTranslations = {
  // Navigation manquante
  'nav.clients': {
    fr: 'Clients',
    en: 'Clients', 
    ar: 'العملاء'
  },
  'nav.bookings': {
    fr: 'Réservations',
    en: 'Bookings',
    ar: 'الحجوزات'
  },
  'nav.logout': {
    fr: 'Déconnexion',
    en: 'Logout',
    ar: 'تسجيل الخروج'
  },

  // Détails des lofts
  'lofts.details.title': {
    fr: 'Détails du Loft',
    en: 'Loft Details',
    ar: 'تفاصيل الشقة'
  },
  'lofts.details.pricePerNight': {
    fr: 'Prix par nuit',
    en: 'Price per night',
    ar: 'السعر لكل ليلة'
  },
  'lofts.details.owner': {
    fr: 'Propriétaire',
    en: 'Owner',
    ar: 'المالك'
  },
  'lofts.details.propertyType': {
    fr: 'Type de propriété',
    en: 'Property Type',
    ar: 'نوع العقار'
  },
  'lofts.details.description': {
    fr: 'Description',
    en: 'Description',
    ar: 'الوصف'
  },
  'lofts.details.amenities': {
    fr: 'Équipements',
    en: 'Amenities',
    ar: 'المرافق'
  },
  'lofts.details.gallery': {
    fr: 'Galerie photos',
    en: 'Photo Gallery',
    ar: 'معرض الصور'
  },
  'lofts.details.additionalInfo': {
    fr: 'Informations supplémentaires',
    en: 'Additional Information',
    ar: 'معلومات إضافية'
  },
  'lofts.details.createdAt': {
    fr: 'Créé le',
    en: 'Created on',
    ar: 'تم الإنشاء في'
  },
  'lofts.details.lastUpdated': {
    fr: 'Dernière mise à jour',
    en: 'Last updated',
    ar: 'آخر تحديث'
  },
  'lofts.details.edit': {
    fr: 'Modifier l\'appartement',
    en: 'Edit Apartment',
    ar: 'تعديل الشقة'
  },
  'lofts.details.auditHistory': {
    fr: 'Historique d\'audit',
    en: 'Audit History',
    ar: 'سجل التدقيق'
  },
  'lofts.details.apartmentInfo': {
    fr: 'Informations sur l\'appartement',
    en: 'Apartment Information',
    ar: 'معلومات الشقة'
  },

  // Gestion des factures
  'bills.management.title': {
    fr: 'Gestion des factures',
    en: 'Bill Management',
    ar: 'إدارة الفواتير'
  },
  'bills.management.water': {
    fr: 'Eau',
    en: 'Water',
    ar: 'المياه'
  },
  'bills.management.electricity': {
    fr: 'Électricité',
    en: 'Electricity',
    ar: 'الكهرباء'
  },
  'bills.management.gas': {
    fr: 'Gaz',
    en: 'Gas',
    ar: 'الغاز'
  },
  'bills.management.phone': {
    fr: 'Téléphone',
    en: 'Phone',
    ar: 'الهاتف'
  },
  'bills.management.internet': {
    fr: 'Internet',
    en: 'Internet',
    ar: 'الإنترنت'
  },
  'bills.frequency.notSet': {
    fr: 'Fréquence non définie',
    en: 'Frequency not set',
    ar: 'لم يتم تعيين تردد'
  },
  'bills.frequency.undefined': {
    fr: 'Non défini',
    en: 'Undefined',
    ar: 'غير محدد'
  },
  'bills.upcomingBills': {
    fr: 'Factures à venir',
    en: 'Upcoming Bills',
    ar: 'الفواتير القادمة'
  },
  'bills.noDueDatesSet': {
    fr: 'Aucune date d\'échéance définie',
    en: 'No due dates set',
    ar: 'لم يتم تعيين تواريخ استحقاق'
  },
  'bills.editLoftToAddFrequencies': {
    fr: 'Modifiez le loft pour ajouter les fréquences et dates d\'échéance',
    en: 'Edit the loft to add frequencies and due dates',
    ar: 'قم بتعديل الشقة لإضافة ترددات الفواتير وتواريخ الاستحقاق'
  },

  // Éléments communs
  'common.available': {
    fr: 'Disponible',
    en: 'Available',
    ar: 'متاح'
  },
  'common.modify': {
    fr: 'Modifier',
    en: 'Modify',
    ar: 'تعديل'
  },
  'common.company': {
    fr: 'Société',
    en: 'Company',
    ar: 'شركة'
  },
  'common.individual': {
    fr: 'Particulier',
    en: 'Individual',
    ar: 'فرد'
  },
  'common.percentages': {
    fr: 'Pourcentages',
    en: 'Percentages',
    ar: 'النسب المئوية'
  },
  'common.amenityInfo': {
    fr: 'Informations sur les équipements',
    en: 'Amenity Information',
    ar: 'معلومات المرافق'
  },

  // Statuts et actions
  'lofts.status.available': {
    fr: 'Disponible',
    en: 'Available',
    ar: 'متاح'
  },
  'lofts.status.occupied': {
    fr: 'Occupé',
    en: 'Occupied',
    ar: 'مشغول'
  },
  'lofts.status.maintenance': {
    fr: 'Maintenance',
    en: 'Maintenance',
    ar: 'صيانة'
  },

  // Interface utilisateur
  'ui.toggleTheme': {
    fr: 'Basculer le thème',
    en: 'Toggle Theme',
    ar: 'تبديل المظهر'
  },
  'ui.userRole': {
    fr: 'Rôle utilisateur',
    en: 'User Role',
    ar: 'دور المستخدم'
  }
};

// Appliquer les corrections
console.log('🔧 Application des corrections...');
let correctionCount = 0;

Object.entries(interfaceTranslations).forEach(([key, translations]) => {
  languages.forEach(lang => {
    if (translations[lang]) {
      setTranslationValue(translationFiles[lang], key, translations[lang]);
      correctionCount++;
      console.log(`✅ Ajouté ${lang}: ${key} = "${translations[lang]}"`);
    }
  });
});

// Corriger les valeurs en mauvaise langue (garder les noms de marques en latin)
const mixedLanguageFixes = {
  'ar': {
    // Garder les emails et noms de marques en latin, mais ajouter des traductions alternatives si nécessaire
    'auth.passwordReset.emailPlaceholder': 'بريدك الإلكتروني',
    'auth.clientRegistration.emailPlaceholder': 'بريدك الإلكتروني',
    'auth.partnerRegistration.emailPlaceholder': 'بريدك الإلكتروني',
    'blog.comments.form.emailPlaceholder': 'بريدك الإلكتروني',
    'auth.partnerRegistration.phonePlaceholder': '+213 XX XX XX XX', // Garder le format
    'lofts.deleteConfirmationKeyword': 'حذف', // Traduire DELETE
    // PayPal et Stripe sont des noms de marques, on peut les garder
    'superuser.userManagement.placeholders.emailExample': 'مثال@البريد.com'
  }
};

Object.entries(mixedLanguageFixes).forEach(([lang, fixes]) => {
  Object.entries(fixes).forEach(([key, value]) => {
    setTranslationValue(translationFiles[lang], key, value);
    correctionCount++;
    console.log(`🔧 Corrigé ${lang}: ${key} = "${value}"`);
  });
});

console.log(`\n🎉 ${correctionCount} corrections appliquées`);

// Sauvegarder les fichiers
console.log('\n💾 Sauvegarde des fichiers...');
languages.forEach(lang => {
  const filePath = path.join('messages', `${lang}.json`);
  const content = JSON.stringify(translationFiles[lang], null, 2);
  
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${lang}.json sauvegardé`);
  } catch (error) {
    console.error(`❌ Erreur sauvegarde ${lang}.json:`, error.message);
  }
});

console.log('\n✨ Correction des traductions d\'interface terminée !');
console.log('\n💡 Prochaines étapes:');
console.log('   1. Redémarrer l\'application pour voir les changements');
console.log('   2. Vérifier que l\'interface affiche maintenant les bonnes traductions');
console.log('   3. Si le mélange persiste, vérifier la configuration des composants');