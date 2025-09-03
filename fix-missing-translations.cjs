#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECTION: Traductions manquantes identifiées dans les logs\n');

// 1. Corriger les traductions theme manquantes
console.log('📋 1. Correction des traductions theme:');

const themeTranslations = {
  fr: {
    light: "Clair",
    dark: "Sombre", 
    system: "Système"
  },
  en: {
    light: "Light",
    dark: "Dark",
    system: "System"
  },
  ar: {
    light: "فاتح",
    dark: "داكن",
    system: "النظام"
  }
};

const languages = ['fr', 'en', 'ar'];

languages.forEach(lang => {
  const themePath = path.join(__dirname, 'public', 'locales', lang, 'theme.json');
  
  try {
    let themeData = {};
    if (fs.existsSync(themePath)) {
      themeData = JSON.parse(fs.readFileSync(themePath, 'utf8'));
    }
    
    // Ajouter les traductions manquantes
    Object.assign(themeData, themeTranslations[lang]);
    
    fs.writeFileSync(themePath, JSON.stringify(themeData, null, 2));
    console.log(`✅ ${lang}/theme.json: Ajouté light, dark, system`);
  } catch (error) {
    console.log(`❌ ${lang}/theme.json: Erreur - ${error.message}`);
  }
});

// 2. Corriger les traductions lofts manquantes
console.log('\n📋 2. Correction des traductions lofts:');

const loftsAdditions = {
  fr: {
    status: {
      available: "Disponible",
      occupied: "Occupé", 
      maintenance: "Maintenance"
    },
    descriptions: {
      heavenLoft: "Loft Paradise avec vue panoramique sur la mer",
      aidaLoft: "Loft Aida moderne au cœur de la ville",
      nadaLoft: "Loft Nada spacieux avec terrasse privée",
      modernCenterAlger: "Appartement moderne au centre d'Alger",
      studioHydraPremium: "Studio premium à Hydra avec vue",
      loftStudentBabEzzouar: "Loft étudiant à Bab Ezzouar",
      penthouseOranSeaView: "Penthouse à Oran avec vue mer",
      familyLoftConstantine: "Loft familial à Constantine"
    }
  },
  en: {
    status: {
      available: "Available",
      occupied: "Occupied",
      maintenance: "Maintenance"
    },
    descriptions: {
      heavenLoft: "Paradise Loft with panoramic sea view",
      aidaLoft: "Modern Aida Loft in the heart of the city",
      nadaLoft: "Spacious Nada Loft with private terrace",
      modernCenterAlger: "Modern apartment in downtown Algiers",
      studioHydraPremium: "Premium studio in Hydra with view",
      loftStudentBabEzzouar: "Student loft in Bab Ezzouar",
      penthouseOranSeaView: "Penthouse in Oran with sea view",
      familyLoftConstantine: "Family loft in Constantine"
    }
  },
  ar: {
    status: {
      available: "متاح",
      occupied: "مشغول",
      maintenance: "صيانة"
    },
    descriptions: {
      heavenLoft: "لوفت الجنة مع إطلالة بانورامية على البحر",
      aidaLoft: "لوفت عايدة العصري في قلب المدينة",
      nadaLoft: "لوفت ندى الواسع مع تراس خاص",
      modernCenterAlger: "شقة عصرية في وسط الجزائر",
      studioHydraPremium: "استوديو فاخر في حيدرة مع إطلالة",
      loftStudentBabEzzouar: "لوفت طلابي في باب الزوار",
      penthouseOranSeaView: "بنتهاوس في وهران مع إطلالة بحرية",
      familyLoftConstantine: "لوفت عائلي في قسنطينة"
    }
  }
};

languages.forEach(lang => {
  const loftsPath = path.join(__dirname, 'public', 'locales', lang, 'lofts.json');
  
  try {
    let loftsData = {};
    if (fs.existsSync(loftsPath)) {
      loftsData = JSON.parse(fs.readFileSync(loftsPath, 'utf8'));
    }
    
    // Fusionner les nouvelles traductions
    if (!loftsData.status) loftsData.status = {};
    if (!loftsData.descriptions) loftsData.descriptions = {};
    
    Object.assign(loftsData.status, loftsAdditions[lang].status);
    Object.assign(loftsData.descriptions, loftsAdditions[lang].descriptions);
    
    fs.writeFileSync(loftsPath, JSON.stringify(loftsData, null, 2));
    console.log(`✅ ${lang}/lofts.json: Ajouté status et descriptions manquantes`);
  } catch (error) {
    console.log(`❌ ${lang}/lofts.json: Erreur - ${error.message}`);
  }
});

// 3. Vérifier et créer roles.json si manquant
console.log('\n📋 3. Vérification des traductions roles:');

const rolesTranslations = {
  fr: {
    admin: "Administrateur",
    manager: "Gestionnaire", 
    member: "Membre",
    owner: "Propriétaire",
    guest: "Invité"
  },
  en: {
    admin: "Administrator",
    manager: "Manager",
    member: "Member", 
    owner: "Owner",
    guest: "Guest"
  },
  ar: {
    admin: "مدير",
    manager: "مدير",
    member: "عضو",
    owner: "مالك", 
    guest: "ضيف"
  }
};

languages.forEach(lang => {
  const rolesPath = path.join(__dirname, 'public', 'locales', lang, 'roles.json');
  
  try {
    let rolesData = {};
    if (fs.existsSync(rolesPath)) {
      rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
    }
    
    // Ajouter les traductions manquantes
    Object.assign(rolesData, rolesTranslations[lang]);
    
    fs.writeFileSync(rolesPath, JSON.stringify(rolesData, null, 2));
    console.log(`✅ ${lang}/roles.json: Créé/mis à jour avec toutes les traductions`);
  } catch (error) {
    console.log(`❌ ${lang}/roles.json: Erreur - ${error.message}`);
  }
});

// 4. Vérifier la configuration i18n pour s'assurer que tous les namespaces sont chargés
console.log('\n📋 4. Vérification de la configuration i18n:');

const i18nConfigPath = path.join(__dirname, 'lib/i18n.ts');
if (fs.existsSync(i18nConfigPath)) {
  let content = fs.readFileSync(i18nConfigPath, 'utf8');
  
  // Vérifier que 'roles' et 'theme' sont dans la liste des namespaces
  const requiredNamespaces = ['roles', 'theme'];
  let modified = false;
  
  requiredNamespaces.forEach(ns => {
    if (!content.includes(`'${ns}'`)) {
      // Ajouter le namespace manquant
      const nsRegex = /(ns:\s*\[[\s\S]*?)(])/;
      content = content.replace(nsRegex, `$1, '${ns}'$2`);
      modified = true;
      console.log(`✅ Namespace '${ns}' ajouté à la configuration i18n`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(i18nConfigPath, content);
    console.log('✅ Configuration i18n mise à jour');
  } else {
    console.log('✅ Configuration i18n déjà correcte');
  }
} else {
  console.log('❌ Fichier de configuration i18n non trouvé');
}

console.log('\n🎉 CORRECTION TERMINÉE !');
console.log('\n📋 Résumé des corrections:');
console.log('✅ Traductions theme ajoutées (light, dark, system)');
console.log('✅ Traductions lofts status ajoutées (available, occupied, maintenance)');
console.log('✅ Traductions lofts descriptions ajoutées');
console.log('✅ Traductions roles créées/mises à jour');
console.log('✅ Configuration i18n vérifiée');

console.log('\n🚀 Prochaines étapes:');
console.log('1. Redémarrer le serveur de dev: npm run dev');
console.log('2. Vérifier que les erreurs ont disparu dans la console');
console.log('3. Tester le changement de thème et de langue');
console.log('4. Redéployer: vercel --prod');

process.exit(0);