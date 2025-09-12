#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC: Problème de Traduction après Déploiement Vercel\n');

// 1. Vérifier la configuration i18n
console.log('📋 1. Vérification de la configuration i18n:');

const i18nConfigs = [
    'lib/i18n.ts',
    'lib/i18n/index.ts', 
    'lib/i18n/settings.ts',
    'lib/i18n/context.tsx'
];

let configIssues = [];

i18nConfigs.forEach(configFile => {
    const filePath = path.join(__dirname, configFile);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${configFile} existe`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Vérifier les problèmes courants
        if (content.includes('useSuspense: true')) {
            configIssues.push(`${configFile}: useSuspense: true peut causer des problèmes sur Vercel`);
        }
        
        if (content.includes('process.cwd()')) {
            configIssues.push(`${configFile}: process.cwd() ne fonctionne pas côté client`);
        }
        
        if (content.includes('loadPath') && content.includes('process.cwd()')) {
            configIssues.push(`${configFile}: loadPath avec process.cwd() problématique`);
        }
        
    } else {
        console.log(`❌ ${configFile} manquant`);
    }
});

// 2. Vérifier les hooks de traduction
console.log('\n📋 2. Vérification des hooks de traduction:');

const hookFiles = [
    'lib/i18n/hooks/useTranslation.ts',
    'lib/i18n/context.tsx'
];

let hookIssues = [];

hookFiles.forEach(hookFile => {
    const filePath = path.join(__dirname, hookFile);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${hookFile} existe`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Chercher les imports conflictuels
        if (content.includes("from 'react-i18next'") && content.includes("from '../context'")) {
            hookIssues.push(`${hookFile}: Imports conflictuels détectés`);
        }
        
    } else {
        console.log(`❌ ${hookFile} manquant`);
    }
});

// 3. Analyser les imports dans les composants
console.log('\n📋 3. Analyse des imports de traduction dans les composants:');

const componentDirs = ['app', 'components'];
let importIssues = [];

function scanDirectory(dir) {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) return;
    
    const items = fs.readdirSync(fullPath);
    
    items.forEach(item => {
        const itemPath = path.join(fullPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
            scanDirectory(path.join(dir, item));
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
            const content = fs.readFileSync(itemPath, 'utf8');
            
            // Compter les différents types d'imports
            const reactI18nextImport = content.includes("from 'react-i18next'");
            const customHookImport = content.includes("from '@/lib/i18n/hooks/useTranslation'");
            const contextImport = content.includes("from '@/lib/i18n/context'");
            
            const importCount = [reactI18nextImport, customHookImport, contextImport].filter(Boolean).length;
            
            if (importCount > 1) {
                importIssues.push(`${path.join(dir, item)}: Imports multiples détectés`);
            }
            
            // Vérifier les références de namespace incorrectes
            if (content.includes("t('lofts.") && !content.includes("useTranslation('lofts')")) {
                importIssues.push(`${path.join(dir, item)}: Référence namespace incorrecte`);
            }
        }
    });
}

componentDirs.forEach(scanDirectory);

// 4. Vérifier les fichiers de traduction
console.log('\n📋 4. Vérification des fichiers de traduction:');

const languages = ['fr', 'en', 'ar'];
let translationIssues = [];

languages.forEach(lang => {
    const loftsPath = path.join(__dirname, 'public', 'locales', lang, 'lofts.json');
    
    if (fs.existsSync(loftsPath)) {
        try {
            const content = fs.readFileSync(loftsPath, 'utf8');
            const translations = JSON.parse(content);
            
            // Vérifier la structure
            if (!translations.title) {
                translationIssues.push(`${lang}/lofts.json: Clé 'title' manquante`);
            }
            
            if (!translations.status || !translations.status.available) {
                translationIssues.push(`${lang}/lofts.json: Structure 'status' incorrecte`);
            }
            
            console.log(`✅ ${lang}/lofts.json: ${Object.keys(translations).length} clés`);
            
        } catch (error) {
            translationIssues.push(`${lang}/lofts.json: Erreur JSON - ${error.message}`);
        }
    } else {
        translationIssues.push(`${lang}/lofts.json: Fichier manquant`);
    }
});

// 5. Vérifier next.config.mjs
console.log('\n📋 5. Vérification de next.config.mjs:');

const nextConfigPath = path.join(__dirname, 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    console.log('✅ next.config.mjs existe');
    
    if (!content.includes('i18n')) {
        console.log('⚠️  Aucune configuration i18n dans next.config.mjs');
    }
} else {
    console.log('❌ next.config.mjs manquant');
}

// 6. Résumé des problèmes
console.log('\n🚨 RÉSUMÉ DES PROBLÈMES DÉTECTÉS:');

if (configIssues.length > 0) {
    console.log('\n📋 Problèmes de configuration:');
    configIssues.forEach(issue => console.log(`❌ ${issue}`));
}

if (hookIssues.length > 0) {
    console.log('\n🪝 Problèmes de hooks:');
    hookIssues.forEach(issue => console.log(`❌ ${issue}`));
}

if (importIssues.length > 0) {
    console.log('\n📦 Problèmes d\'imports:');
    importIssues.forEach(issue => console.log(`❌ ${issue}`));
}

if (translationIssues.length > 0) {
    console.log('\n🌐 Problèmes de traductions:');
    translationIssues.forEach(issue => console.log(`❌ ${issue}`));
}

const totalIssues = configIssues.length + hookIssues.length + importIssues.length + translationIssues.length;

console.log(`\n🎯 TOTAL: ${totalIssues} problème(s) détecté(s)`);

if (totalIssues === 0) {
    console.log('✅ Aucun problème évident détecté. Le problème pourrait être:');
    console.log('   - Configuration Vercel (variables d\'environnement)');
    console.log('   - Cache du navigateur');
    console.log('   - Problème de build/déploiement');
} else {
    console.log('\n🔧 ACTIONS RECOMMANDÉES:');
    
    if (configIssues.some(issue => issue.includes('useSuspense'))) {
        console.log('1. Définir useSuspense: false dans toutes les configurations i18n');
    }
    
    if (configIssues.some(issue => issue.includes('process.cwd'))) {
        console.log('2. Remplacer process.cwd() par des chemins relatifs');
    }
    
    if (importIssues.length > 0) {
        console.log('3. Unifier les imports de useTranslation');
    }
    
    if (translationIssues.length > 0) {
        console.log('4. Corriger les fichiers de traduction');
    }
    
    console.log('\n💡 Utilisez les scripts de réparation:');
    console.log('   node fix-i18n-config.cjs');
    console.log('   node unify-translation-imports.cjs');
}

process.exit(totalIssues > 0 ? 1 : 0);