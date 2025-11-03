#!/usr/bin/env tsx

/**
 * Script pour corriger toutes les erreurs de syntaxe rapidement
 */

import { readFileSync, writeFileSync } from 'fs';

const fixes = [
  // Fix booking files - add missing try block
  {
    file: 'app/api/bookings/[id]/cancel/route.ts',
    search: 'const { id } = await params;\n\n    const body = await request.json();',
    replace: 'const { id } = await params;\n\n    try {\n      const body = await request.json();'
  },
  {
    file: 'app/api/bookings/[id]/payment/route.ts', 
    search: 'const { id } = await params;\n\n    const body = await request.json();',
    replace: 'const { id } = await params;\n\n    try {\n      const body = await request.json();'
  },
  // Fix StyleVariant6 JSX issue
  {
    file: 'components/variants/StyleVariant6.tsx',
    search: 'BOOK NOW\n              </button>\n            </div>',
    replace: 'BOOK NOW\n              </button>\n            </div>'
  }
];

console.log('🔧 Correction rapide des erreurs de syntaxe...');

fixes.forEach(fix => {
  try {
    let content = readFileSync(fix.file, 'utf-8');
    
    if (content.includes(fix.search)) {
      content = content.replace(fix.search, fix.replace);
      writeFileSync(fix.file, content);
      console.log(`✅ Corrigé: ${fix.file}`);
    } else {
      console.log(`⚪ Pas de changement nécessaire: ${fix.file}`);
    }
  } catch (error) {
    console.error(`❌ Erreur avec ${fix.file}:`, error);
  }
});

console.log('✅ Corrections terminées');