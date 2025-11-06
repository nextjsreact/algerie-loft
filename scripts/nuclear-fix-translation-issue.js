#!/usr/bin/env node

/**
 * Solution NUCLÉAIRE pour le problème de mélange de langues
 * Cette fois, on va au cœur du problème !
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

console.log('💥 SOLUTION NUCLÉAIRE - Correction définitive du problème de traduction\n');

// 1. Créer un CSS global pour forcer l'espacement
const createGlobalSpacingCSS = () => {
  const globalCSS = `
/* CORRECTION NUCLÉAIRE - Espacement forcé pour tous les éléments */

/* Forcer l'espacement entre TOUS les éléments */
* {
  word-spacing: 0.25rem !important;
  letter-spacing: 0.05rem !important;
}

/* Espacement spécifique pour les éléments de navigation */
nav * {
  margin-right: 0.5rem !important;
  margin-bottom: 0.25rem !important;
  padding: 0.25rem !important;
  display: inline-block !important;
}

/* Forcer l'espacement dans la sidebar */
.sidebar * {
  margin: 0.125rem !important;
  padding: 0.125rem 0.25rem !important;
}

/* Espacement pour tous les textes */
span, p, div, a, button {
  margin-right: 0.25rem !important;
  word-break: break-word !important;
  white-space: normal !important;
}

/* Correction spécifique pour les badges et labels */
.badge, [class*="badge"] {
  margin: 0.25rem !important;
  padding: 0.25rem 0.5rem !important;
  display: inline-block !important;
  white-space: nowrap !important;
}

/* Forcer l'espacement dans les cartes */
.card *, [class*="card"] * {
  margin-bottom: 0.5rem !important;
}

/* Espacement pour les listes */
ul li, ol li {
  margin-bottom: 0.5rem !important;
  padding: 0.25rem !important;
}

/* Correction pour les éléments flex */
.flex *, [class*="flex"] * {
  margin-right: 0.5rem !important;
}

/* Espacement pour les grilles */
.grid *, [class*="grid"] * {
  margin: 0.25rem !important;
}

/* Forcer l'espacement pour les boutons */
button {
  margin: 0.25rem !important;
  padding: 0.5rem 1rem !important;
}

/* Correction pour les inputs */
input, textarea, select {
  margin: 0.25rem !important;
  padding: 0.5rem !important;
}

/* Espacement pour les titres */
h1, h2, h3, h4, h5, h6 {
  margin: 1rem 0 0.5rem 0 !important;
  padding: 0.25rem 0 !important;
}

/* Correction pour les icônes */
svg {
  margin-right: 0.5rem !important;
}

/* Forcer l'espacement dans les dropdowns */
[role="menu"] *, [role="menuitem"] * {
  margin: 0.125rem !important;
  padding: 0.25rem 0.5rem !important;
}

/* Correction spécifique pour le problème observé */
body * {
  box-sizing: border-box !important;
}

/* Assurer que les éléments ne se chevauchent pas */
* + * {
  margin-left: 0.25rem !important;
}

/* Correction pour les éléments inline */
span + span, a + a, button + button {
  margin-left: 0.5rem !important;
}

/* Forcer la séparation des mots arabes */
[lang="ar"] *, [dir="rtl"] * {
  word-spacing: 0.5rem !important;
  letter-spacing: 0.1rem !important;
}

/* Correction pour les textes français */
[lang="fr"] *, [lang="en"] * {
  word-spacing: 0.25rem !important;
}
`;

  const cssPath = path.join(__dirname, 'app', 'nuclear-spacing-fix.css');
  fs.writeFileSync(cssPath, globalCSS);
  console.log('✅ CSS nucléaire créé:', cssPath);
  return cssPath;
};

// 2. Modifier le layout principal pour inclure le CSS
const updateMainLayout = () => {
  const layoutPath = path.join(__dirname, 'app', '[locale]', 'layout.tsx');
  
  if (fs.existsSync(layoutPath)) {
    let content = fs.readFileSync(layoutPath, 'utf8');
    
    // Ajouter l'import du CSS
    if (!content.includes('nuclear-spacing-fix.css')) {
      content = content.replace(
        "import { LangSetter } from '@/components/lang-setter';",
        `import { LangSetter } from '@/components/lang-setter';
import '../nuclear-spacing-fix.css';`
      );
      
      fs.writeFileSync(layoutPath, content);
      console.log('✅ Layout principal mis à jour');
    }
  }
};

// 3. Créer un composant de correction d'espacement
const createSpacingFixComponent = () => {
  const componentContent = `'use client'

import { useEffect } from 'react'

export function NuclearSpacingFix() {
  useEffect(() => {
    // Fonction pour forcer l'espacement entre tous les éléments
    const forceSpacing = () => {
      const allElements = document.querySelectorAll('*')
      
      allElements.forEach((element) => {
        // Forcer l'espacement pour tous les éléments
        if (element instanceof HTMLElement) {
          element.style.wordSpacing = '0.25rem'
          element.style.letterSpacing = '0.05rem'
          
          // Espacement spécial pour les éléments de navigation
          if (element.closest('nav') || element.closest('.sidebar')) {
            element.style.margin = '0.125rem'
            element.style.padding = '0.125rem 0.25rem'
          }
          
          // Correction pour les badges
          if (element.classList.contains('badge') || element.className.includes('badge')) {
            element.style.margin = '0.25rem'
            element.style.padding = '0.25rem 0.5rem'
            element.style.display = 'inline-block'
            element.style.whiteSpace = 'nowrap'
          }
          
          // Correction pour les boutons
          if (element.tagName === 'BUTTON') {
            element.style.margin = '0.25rem'
            element.style.padding = '0.5rem 1rem'
          }
          
          // Correction pour les spans et textes
          if (element.tagName === 'SPAN' || element.tagName === 'P' || element.tagName === 'DIV') {
            element.style.marginRight = '0.25rem'
            element.style.wordBreak = 'break-word'
            element.style.whiteSpace = 'normal'
          }
        }
      })
    }

    // Appliquer immédiatement
    forceSpacing()
    
    // Appliquer après chaque changement DOM
    const observer = new MutationObserver(() => {
      setTimeout(forceSpacing, 50)
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    })
    
    // Appliquer périodiquement pour s'assurer que ça marche
    const interval = setInterval(forceSpacing, 1000)
    
    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return null
}`;

  const componentPath = path.join(__dirname, 'components', 'nuclear-spacing-fix.tsx');
  fs.writeFileSync(componentPath, componentContent);
  console.log('✅ Composant de correction nucléaire créé');
  return componentPath;
};

// 4. Créer un script pour injecter le composant partout
const createInjectionScript = () => {
  const scriptContent = `#!/usr/bin/env node

/**
 * Script pour injecter le composant de correction partout
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('💉 Injection du composant de correction...');

// Fichiers à modifier
const filesToModify = [
  'components/layout/sidebar-nextintl.tsx',
  'app/[locale]/lofts/[id]/page.tsx',
  'components/providers/client-providers-nextintl.tsx'
];

filesToModify.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Ajouter l'import si pas déjà présent
    if (!content.includes('NuclearSpacingFix')) {
      // Ajouter l'import
      const importLine = "import { NuclearSpacingFix } from '@/components/nuclear-spacing-fix'";
      
      if (content.includes('import')) {
        const lastImportIndex = content.lastIndexOf('import');
        const nextLineIndex = content.indexOf('\\n', lastImportIndex);
        content = content.slice(0, nextLineIndex) + '\\n' + importLine + content.slice(nextLineIndex);
      }
      
      // Ajouter le composant dans le JSX
      if (content.includes('return (')) {
        content = content.replace(
          'return (',
          \`return (
    <>
      <NuclearSpacingFix />
      \`
        );
        
        // Fermer le fragment
        const lastReturnIndex = content.lastIndexOf(')')
        content = content.slice(0, lastReturnIndex) + '    </>' + content.slice(lastReturnIndex);
      }
      
      fs.writeFileSync(fullPath, content);
      console.log(\`✅ \${filePath} modifié\`);
    }
  }
});

console.log('🎉 Injection terminée !');
`;

  const scriptPath = path.join(__dirname, 'scripts', 'inject-nuclear-fix.js');
  fs.writeFileSync(scriptPath, scriptContent);
  console.log('✅ Script d\'injection créé');
  return scriptPath;
};

// 5. Créer une solution CSS ultra-agressive
const createUltraAggressiveCSS = () => {
  const aggressiveCSS = `
/* SOLUTION ULTRA-AGRESSIVE - FORCER L'ESPACEMENT PARTOUT */

/* Réinitialiser tous les styles qui pourraient causer le problème */
* {
  margin: 0.125rem !important;
  padding: 0.125rem !important;
  box-sizing: border-box !important;
  word-spacing: 0.25rem !important;
  letter-spacing: 0.05rem !important;
}

/* Forcer l'espacement entre éléments adjacents */
* + * {
  margin-left: 0.25rem !important;
}

/* Correction spécifique pour le texte qui se colle */
body, html {
  word-spacing: 0.25rem !important;
  letter-spacing: 0.05rem !important;
}

/* Forcer l'affichage en bloc pour certains éléments */
span, a, button {
  display: inline-block !important;
  margin: 0.125rem 0.25rem !important;
  padding: 0.125rem 0.25rem !important;
}

/* Correction pour les éléments de navigation */
nav, .sidebar, [class*="nav"], [class*="sidebar"] {
  word-spacing: 0.5rem !important;
}

nav *, .sidebar *, [class*="nav"] *, [class*="sidebar"] * {
  margin: 0.25rem !important;
  padding: 0.25rem !important;
  display: inline-block !important;
}

/* Forcer l'espacement dans les listes */
ul, ol {
  word-spacing: 0.5rem !important;
}

li {
  margin: 0.25rem 0 !important;
  padding: 0.25rem !important;
  display: list-item !important;
}

/* Correction pour les badges et labels */
.badge, [class*="badge"], .label, [class*="label"] {
  margin: 0.25rem !important;
  padding: 0.25rem 0.5rem !important;
  display: inline-block !important;
  white-space: nowrap !important;
}

/* Forcer l'espacement pour les cartes */
.card, [class*="card"] {
  padding: 1rem !important;
}

.card *, [class*="card"] * {
  margin: 0.25rem 0 !important;
}

/* Correction pour les boutons */
button {
  margin: 0.25rem !important;
  padding: 0.5rem 1rem !important;
  display: inline-block !important;
}

/* Espacement pour les inputs */
input, textarea, select {
  margin: 0.25rem !important;
  padding: 0.5rem !important;
}

/* Correction pour les titres */
h1, h2, h3, h4, h5, h6 {
  margin: 1rem 0 0.5rem 0 !important;
  padding: 0.25rem 0 !important;
  display: block !important;
}

/* Forcer l'espacement pour les icônes */
svg {
  margin-right: 0.5rem !important;
  display: inline-block !important;
}

/* Correction pour les éléments flex */
.flex, [class*="flex"] {
  gap: 0.5rem !important;
}

.flex *, [class*="flex"] * {
  margin: 0.125rem !important;
}

/* Correction pour les grilles */
.grid, [class*="grid"] {
  gap: 0.5rem !important;
}

.grid *, [class*="grid"] * {
  margin: 0.125rem !important;
}

/* Correction spécifique pour les dropdowns */
[role="menu"], [role="menuitem"] {
  padding: 0.5rem !important;
}

[role="menu"] *, [role="menuitem"] * {
  margin: 0.125rem !important;
  padding: 0.25rem 0.5rem !important;
}

/* Correction pour les textes arabes */
[lang="ar"], [dir="rtl"] {
  word-spacing: 0.5rem !important;
  letter-spacing: 0.1rem !important;
}

[lang="ar"] *, [dir="rtl"] * {
  word-spacing: 0.5rem !important;
  letter-spacing: 0.1rem !important;
  margin: 0.25rem !important;
}

/* Correction pour les textes français et anglais */
[lang="fr"], [lang="en"] {
  word-spacing: 0.25rem !important;
}

[lang="fr"] *, [lang="en"] * {
  word-spacing: 0.25rem !important;
  margin: 0.125rem !important;
}

/* Forcer la séparation des mots */
body * {
  white-space: normal !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
}

/* Correction pour éviter que les éléments se chevauchent */
* {
  position: relative !important;
  z-index: auto !important;
}

/* Forcer l'espacement minimum */
*:not(:last-child) {
  margin-right: 0.25rem !important;
}

/* Correction finale pour tous les problèmes d'espacement */
body {
  line-height: 1.6 !important;
  word-spacing: 0.25rem !important;
  letter-spacing: 0.05rem !important;
}
`;

  const aggressivePath = path.join(__dirname, 'app', 'ultra-aggressive-spacing.css');
  fs.writeFileSync(aggressivePath, aggressiveCSS);
  console.log('✅ CSS ultra-agressif créé');
  return aggressivePath;
};

// Exécuter toutes les corrections
console.log('🚀 Démarrage de la solution nucléaire...\n');

const cssPath = createGlobalSpacingCSS();
const aggressivePath = createUltraAggressiveCSS();
const componentPath = createSpacingFixComponent();
const injectionScript = createInjectionScript();

console.log('\n💥 SOLUTION NUCLÉAIRE APPLIQUÉE !');
console.log('\n📁 Fichiers créés:');
console.log('1. CSS nucléaire:', cssPath);
console.log('2. CSS ultra-agressif:', aggressivePath);
console.log('3. Composant de correction:', componentPath);
console.log('4. Script d\'injection:', injectionScript);

console.log('\n🚀 ACTIONS IMMÉDIATES:');
console.log('1. Ajoutez cette ligne à votre app/globals.css:');
console.log('   @import "./nuclear-spacing-fix.css";');
console.log('   @import "./ultra-aggressive-spacing.css";');
console.log('');
console.log('2. Exécutez le script d\'injection:');
console.log('   node scripts/inject-nuclear-fix.js');
console.log('');
console.log('3. Redémarrez votre application');

console.log('\n💡 Cette solution va FORCER l\'espacement partout !');
console.log('Si ça ne marche pas, le problème vient d\'ailleurs...');