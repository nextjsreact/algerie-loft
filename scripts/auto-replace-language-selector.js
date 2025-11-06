#!/usr/bin/env node

/**
 * Script pour remplacer automatiquement le sélecteur de langue
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Remplacement automatique du sélecteur de langue...');

// Remplacer dans sidebar-nextintl.tsx
const sidebarPath = path.join(__dirname, '..', 'components', 'layout', 'sidebar-nextintl.tsx');
if (fs.existsSync(sidebarPath)) {
  let content = fs.readFileSync(sidebarPath, 'utf8');
  
  // Remplacer l'import
  content = content.replace(
    /import.*LanguageSelector.*from.*language-selector.*/g,
    'import { UltraFastLanguageSelector } from "@/components/ui/ultra-fast-language-selector"'
  );
  
  // Remplacer l'utilisation
  content = content.replace(
    /<LanguageSelector.*?\/>/g,
    '<UltraFastLanguageSelector />'
  );
  
  fs.writeFileSync(sidebarPath, content);
  console.log('✅ Sidebar mis à jour');
}

console.log('🎉 Remplacement terminé !');
