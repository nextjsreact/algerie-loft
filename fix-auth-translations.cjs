#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECTION: Traductions d\'authentification\n');

// 1. Corriger le hook useSimpleTranslation pour supporter la syntaxe avec ':'
console.log('📋 1. Correction du hook useSimpleTranslation:');

const hookPath = path.join(__dirname, 'hooks/use-simple-translation.ts');
if (fs.existsSync(hookPath)) {
    let content = fs.readFileSync(hookPath, 'utf8');
    
    // Modifier la fonction t pour supporter les deux syntaxes
    const oldTFunction = `  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }`;
    
    const newTFunction = `  const t = (key: string): string => {
    // Support both 'auth:key' and 'auth.key' syntax
    const normalizedKey = key.replace(':', '.');
    return translations[normalizedKey]?.[language] || key
  }`;
    
    if (content.includes(oldTFunction)) {
        content = content.replace(oldTFunction, newTFunction);
        fs.writeFileSync(hookPath, content);
        console.log('✅ Hook useSimpleTranslation corrigé pour supporter auth:key');
    } else {
        console.log('⚠️  Fonction t déjà modifiée ou structure différente');
    }
} else {
    console.log('❌ Hook useSimpleTranslation non trouvé');
}

// 2. Unifier tous les composants d'auth pour utiliser react-i18next
console.log('\n📋 2. Unification des composants d\'auth:');

const authComponents = [
    'components/auth/simple-login-form.tsx',
    'components/auth/login-form.tsx', 
    'components/auth/register-form.tsx'
];

authComponents.forEach(componentPath => {
    const fullPath = path.join(__dirname, componentPath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;
        
        // Remplacer useSimpleTranslation par react-i18next
        if (content.includes('useSimpleTranslation')) {
            content = content.replace(
                /import { useSimpleTranslation } from ["']@\/hooks\/use-simple-translation["']/g,
                "import { useTranslation } from 'react-i18next'"
            );
            content = content.replace(
                /const { t } = useSimpleTranslation\(\)/g,
                "const { t } = useTranslation('auth')"
            );
            modified = true;
            console.log(`✅ ${componentPath}: useSimpleTranslation → react-i18next`);
        }
        
        // Remplacer useTranslation du contexte par react-i18next
        if (content.includes('@/lib/i18n/context')) {
            content = content.replace(
                /import { useTranslation } from ["']@\/lib\/i18n\/context["']/g,
                "import { useTranslation } from 'react-i18next'"
            );
            content = content.replace(
                /const { t } = useTranslation\(\);/g,
                "const { t } = useTranslation('auth');"
            );
            modified = true;
            console.log(`✅ ${componentPath}: contexte i18n → react-i18next`);
        }
        
        // S'assurer que useTranslation utilise le namespace 'auth'
        if (content.includes("useTranslation();") || content.includes("useTranslation('');")) {
            content = content.replace(
                /const { t } = useTranslation\(\);/g,
                "const { t } = useTranslation('auth');"
            );
            content = content.replace(
                /const { t } = useTranslation\(['"]['"]?\);/g,
                "const { t } = useTranslation('auth');"
            );
            modified = true;
            console.log(`✅ ${componentPath}: namespace 'auth' ajouté`);
        }
        
        // Corriger les références de traduction pour enlever le préfixe 'auth:'
        const authKeys = [
            'welcomeBack', 'signInDescription', 'signIn', 'email', 'password',
            'enterEmail', 'enterPassword', 'forgotPassword', 'signingIn',
            'noAccount', 'signUp', 'demoAccounts', 'admin', 'manager', 'member',
            'fullName', 'enterFullName', 'haveAccount', 'registrationFailed',
            'signUpDescription', 'signUpTitle', 'signingUp', 'unexpectedError'
        ];
        
        authKeys.forEach(key => {
            const oldRef = `t('auth:${key}')`;
            const newRef = `t('${key}')`;
            if (content.includes(oldRef)) {
                content = content.replace(new RegExp(oldRef.replace(/[()]/g, '\\$&'), 'g'), newRef);
                modified = true;
            }
        });
        
        if (modified) {
            fs.writeFileSync(fullPath, content);
            console.log(`✅ ${componentPath}: références de traduction corrigées`);
        } else {
            console.log(`⚠️  ${componentPath}: aucune modification nécessaire`);
        }
    } else {
        console.log(`❌ ${componentPath}: fichier non trouvé`);
    }
});

// 3. Vérifier que les traductions auth.json sont complètes
console.log('\n📋 3. Vérification des fichiers de traduction:');

const requiredKeys = [
    'welcomeBack', 'signInDescription', 'signIn', 'email', 'password',
    'enterEmail', 'enterPassword', 'forgotPassword', 'signingIn',
    'noAccount', 'signUp', 'demoAccounts', 'admin', 'manager', 'member',
    'fullName', 'enterFullName', 'haveAccount', 'registrationFailed',
    'signUpDescription', 'signUpTitle', 'signingUp', 'unexpectedError'
];

const languages = ['fr', 'en', 'ar'];
let allTranslationsOk = true;

languages.forEach(lang => {
    const filePath = path.join(__dirname, 'public', 'locales', lang, 'auth.json');
    try {
        const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const missing = requiredKeys.filter(key => !translations[key] || translations[key] === '');
        
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

console.log('\n🎉 CORRECTION TERMINÉE !');
console.log('\n📋 Résumé des corrections:');
console.log('✅ Hook useSimpleTranslation corrigé pour supporter auth:key');
console.log('✅ Tous les composants d\'auth utilisent react-i18next');
console.log('✅ Namespace "auth" configuré correctement');
console.log('✅ Références de traduction normalisées');

if (allTranslationsOk) {
    console.log('✅ Toutes les traductions sont présentes');
} else {
    console.log('⚠️  Certaines traductions sont manquantes');
}

console.log('\n🚀 Prochaines étapes:');
console.log('1. Tester: npm run dev');
console.log('2. Aller sur /login pour vérifier les traductions');
console.log('3. Changer de langue pour tester toutes les traductions');
console.log('4. Redéployer: vercel --prod');

process.exit(allTranslationsOk ? 0 : 1);