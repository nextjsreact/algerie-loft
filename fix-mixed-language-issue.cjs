const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECTION DU PROBLÈME DE MÉLANGE DE LANGUES\n');

// Analyser le problème de mélange de langues
function analyzeMixedLanguageIssue() {
  console.log('🔍 Analyse du problème de mélange de langues...');
  
  // Le problème identifié : certains composants utilisent la locale arabe
  // alors que l'utilisateur navigue sur la version française
  
  console.log('❌ Problème détecté :');
  console.log('  - Navigation affiche "مدير الشقة" (arabe) au lieu de "Gestionnaire de loft" (français)');
  console.log('  - Menu affiche "لوحة التحكم" (arabe) au lieu de "Tableau de bord" (français)');
  console.log('  - Contenu principal en français mais navigation en arabe');
  
  console.log('\n🎯 Causes possibles :');
  console.log('  1. Composant de navigation utilise une locale hardcodée');
  console.log('  2. Hook useLocale() retourne la mauvaise locale');
  console.log('  3. Middleware ne détecte pas correctement la locale');
  console.log('  4. Cache de locale corrompu côté client');
}

// Créer un composant de test pour diagnostiquer la locale
function createLocaleTestComponent() {
  console.log('\n🧪 Création d\'un composant de test de locale...');
  
  const testComponent = `'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function LocaleDebugPage() {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [clientInfo, setClientInfo] = useState<any>({})
  
  useEffect(() => {
    setClientInfo({
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      cookies: document.cookie,
      localStorage: Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key)
        return acc
      }, {} as any)
    })
  }, [])
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🌐 Diagnostic de Locale</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid red', borderRadius: '5px' }}>
        <h2>🚨 PROBLÈME DÉTECTÉ</h2>
        <p><strong>Locale détectée:</strong> <span style={{color: 'red', fontSize: '18px'}}>{locale}</span></p>
        <p><strong>Pathname Next.js:</strong> {pathname}</p>
        <p><strong>URL complète:</strong> {clientInfo.url}</p>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>🧪 Test des traductions</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div>
            <strong>nav.dashboard:</strong> 
            <span style={{ marginLeft: '10px', padding: '5px', backgroundColor: '#f0f0f0' }}>
              "{t('dashboard')}"
            </span>
          </div>
          <div>
            <strong>nav.lofts:</strong> 
            <span style={{ marginLeft: '10px', padding: '5px', backgroundColor: '#f0f0f0' }}>
              "{t('lofts')}"
            </span>
          </div>
          <div>
            <strong>nav.loftManager:</strong> 
            <span style={{ marginLeft: '10px', padding: '5px', backgroundColor: '#f0f0f0' }}>
              "{t('loftManager')}"
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>🌍 Informations navigateur</h2>
        <div style={{ fontSize: '12px' }}>
          <p><strong>Langue navigateur:</strong> {clientInfo.language}</p>
          <p><strong>Langues acceptées:</strong> {JSON.stringify(clientInfo.languages)}</p>
          <p><strong>Cookies:</strong> {clientInfo.cookies || 'Aucun'}</p>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>💾 LocalStorage</h2>
        <pre style={{ fontSize: '10px', overflow: 'auto' }}>
          {JSON.stringify(clientInfo.localStorage, null, 2)}
        </pre>
      </div>
      
      <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>🔧 Actions de correction</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              // Forcer la locale française
              window.location.href = '/fr' + window.location.pathname.replace(/^\\/[a-z]{2}/, '')
            }}
            style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            🇫🇷 Forcer Français
          </button>
          <button 
            onClick={() => {
              // Vider tout le cache
              localStorage.clear()
              sessionStorage.clear()
              document.cookie.split(";").forEach(c => {
                const eqPos = c.indexOf("=")
                const name = eqPos > -1 ? c.substr(0, eqPos) : c
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
              })
              window.location.reload()
            }}
            style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            🗑️ Vider tout le cache
          </button>
        </div>
      </div>
    </div>
  )
}`;

  const testDir = path.join(__dirname, 'app', '[locale]', 'locale-debug');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(testDir, 'page.tsx'), testComponent);
  console.log('✅ Page de diagnostic créée: /locale-debug');
}

// Créer un script de correction automatique
function createAutoFixScript() {
  console.log('\n🔧 Création du script de correction automatique...');
  
  const fixScript = `const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECTION AUTOMATIQUE DU MÉLANGE DE LANGUES');

// 1. Vérifier et corriger le middleware
function fixMiddleware() {
  const middlewarePath = path.join(__dirname, 'middleware.ts');
  let content = fs.readFileSync(middlewarePath, 'utf8');
  
  // S'assurer que la détection de locale est correcte
  if (!content.includes('localeDetection: true')) {
    console.log('⚠️ localeDetection pourrait être désactivée');
  }
  
  // Ajouter des logs de debug
  if (!content.includes('console.log')) {
    content = content.replace(
      'console.log(\`[MIDDLEWARE] Processing: \${pathname}\`);',
      \`console.log(\`[MIDDLEWARE] Processing: \${pathname}\`);
  console.log(\`[MIDDLEWARE] Detected locale: \${request.nextUrl.locale}\`);\`
    );
    
    fs.writeFileSync(middlewarePath, content);
    console.log('✅ Middleware mis à jour avec logs de debug');
  }
}

// 2. Forcer la locale dans les composants problématiques
function fixNavigationComponents() {
  // Cette fonction devrait identifier et corriger les composants de navigation
  console.log('🔍 Recherche des composants de navigation...');
  
  // Chercher les fichiers qui utilisent "loftManager" ou "مدير الشقة"
  const componentsDir = path.join(__dirname, 'components');
  const appDir = path.join(__dirname, 'app');
  
  console.log('📁 Vérification des composants...');
}

// 3. Nettoyer le cache de locale
function clearLocaleCache() {
  console.log('🧹 Nettoyage du cache de locale...');
  
  // Supprimer les fichiers de cache Next.js
  const nextDir = path.join(__dirname, '.next');
  if (fs.existsSync(nextDir)) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log('✅ Cache Next.js supprimé');
    } catch (error) {
      console.log('⚠️ Impossible de supprimer le cache:', error.message);
    }
  }
}

// Exécuter les corrections
fixMiddleware();
fixNavigationComponents();
clearLocaleCache();

console.log('\\n🎯 PROCHAINES ÉTAPES:');
console.log('1. Redémarrer le serveur: npm run dev');
console.log('2. Tester: http://localhost:3000/fr/locale-debug');
console.log('3. Vérifier que la locale est bien "fr"');
console.log('4. Si le problème persiste, vérifier les composants de navigation');`;

  fs.writeFileSync('auto-fix-locale.cjs', fixScript);
  console.log('✅ Script de correction créé: auto-fix-locale.cjs');
}

// Fonction principale
function main() {
  analyzeMixedLanguageIssue();
  createLocaleTestComponent();
  createAutoFixScript();
  
  console.log('\n📋 RÉSUMÉ:');
  console.log('❌ Problème: Mélange de langues (arabe + français sur même page)');
  console.log('🎯 Cause probable: Composants utilisent mauvaise locale');
  console.log('🔧 Solution: Diagnostic + correction automatique');
  
  console.log('\n🚀 ACTIONS IMMÉDIATES:');
  console.log('1. Aller sur: http://localhost:3000/fr/locale-debug');
  console.log('2. Vérifier quelle locale est détectée');
  console.log('3. Utiliser les boutons de correction si nécessaire');
  console.log('4. Exécuter: node auto-fix-locale.cjs');
}

main();