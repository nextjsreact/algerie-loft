#!/usr/bin/env node

import fs from 'fs';

/**
 * Restaurer la version originale du fichier loft page
 */
console.log('🔄 Restauration de la version originale...\n');

const originalPath = 'app/[locale]/lofts/[id]/page.tsx';
const backupPath = 'app/[locale]/lofts/[id]/page.tsx.backup';

try {
  if (fs.existsSync(backupPath)) {
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    fs.writeFileSync(originalPath, backupContent, 'utf8');
    console.log('✅ Version originale restaurée');
    
    // Supprimer la sauvegarde
    fs.unlinkSync(backupPath);
    console.log('✅ Fichier de sauvegarde supprimé');
  } else {
    console.log('❌ Aucun fichier de sauvegarde trouvé');
  }
} catch (error) {
  console.error('❌ Erreur lors de la restauration:', error.message);
}

console.log('\n✨ Restauration terminée !');