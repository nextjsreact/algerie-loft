#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Script pour nettoyer et redémarrer l'application proprement
 */
console.log('🧹 Nettoyage et redémarrage de l\'application...\n');

// Fonction pour supprimer un dossier de manière sécurisée
function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      console.log(`🗑️  Suppression de ${dirPath}...`);
      
      // Essayer avec rmdir récursif d'abord
      try {
        execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'pipe' });
        console.log(`✅ ${dirPath} supprimé avec rmdir`);
      } catch (error) {
        // Si rmdir échoue, essayer avec PowerShell
        try {
          execSync(`powershell -Command "Remove-Item -Recurse -Force '${dirPath}' -ErrorAction SilentlyContinue"`, { stdio: 'pipe' });
          console.log(`✅ ${dirPath} supprimé avec PowerShell`);
        } catch (psError) {
          console.log(`⚠️  Impossible de supprimer ${dirPath} automatiquement`);
          console.log(`💡 Supprimez manuellement le dossier ${dirPath} et relancez`);
        }
      }
    } else {
      console.log(`ℹ️  ${dirPath} n'existe pas`);
    }
  } catch (error) {
    console.log(`⚠️  Erreur lors de la suppression de ${dirPath}:`, error.message);
  }
}

// Nettoyer les dossiers de cache
console.log('🧹 Nettoyage des caches...');
removeDirectory('.next');
removeDirectory('node_modules/.cache');

// Vérifier la syntaxe du fichier problématique
console.log('\n🔍 Vérification de la syntaxe...');
try {
  // Vérifier que le fichier loft page n'a pas d'erreurs de syntaxe
  const loftPagePath = 'app/[locale]/lofts/[id]/page.tsx';
  if (fs.existsSync(loftPagePath)) {
    const content = fs.readFileSync(loftPagePath, 'utf8');
    
    // Vérifications basiques
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      console.log(`⚠️  Déséquilibre des accolades dans ${loftPagePath}: ${openBraces} ouvertes, ${closeBraces} fermées`);
    } else {
      console.log(`✅ Accolades équilibrées dans ${loftPagePath}`);
    }
    
    // Vérifier s'il y a du texte orphelin
    if (content.includes('صورة متاحة') || content.includes('case \'water\': return')) {
      console.log(`⚠️  Texte orphelin détecté dans ${loftPagePath}`);
    } else {
      console.log(`✅ Pas de texte orphelin dans ${loftPagePath}`);
    }
  }
} catch (error) {
  console.log('⚠️  Erreur lors de la vérification:', error.message);
}

console.log('\n💡 Instructions pour redémarrer:');
console.log('1. Fermez tous les processus Node.js en cours');
console.log('2. Supprimez manuellement le dossier .next si nécessaire');
console.log('3. Redémarrez avec: npm run dev');
console.log('4. Si le problème persiste, redémarrez votre éditeur/IDE');

console.log('\n✨ Nettoyage terminé !');