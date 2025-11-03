#!/usr/bin/env tsx

/**
 * Script pour corriger les erreurs de syntaxe dans les fichiers API
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const filesToFix = [
  'app/api/admin/property-assignments/bulk/route.ts',
  'app/api/admin/property-assignments/transfer/route.ts',
  'app/api/bookings/[id]/cancel/route.ts',
  'app/api/bookings/[id]/payment/route.ts',
  'app/api/partner/properties/route.ts'
];

function fixSyntaxErrors() {
  console.log('🔧 Correction des erreurs de syntaxe...');

  filesToFix.forEach(filePath => {
    try {
      let content = readFileSync(filePath, 'utf-8');
      let modified = false;

      // Fix: }/ -> }\n\n//
      if (content.includes('}/')) {
        content = content.replace(/}\//g, '}\n\n//');
        modified = true;
      }

      // Fix: }// -> }\n\n//
      if (content.includes('}//')) {
        content = content.replace(/}\/\//g, '}\n\n//');
        modified = true;
      }

      // Fix: broken comments like "// H\nandle"
      content = content.replace(/\/\/ H\nandle/g, '// Handle');
      content = content.replace(/\/\/\n /g, '// ');
      content = content.replace(/\/\/ \n/g, '// ');

      // Fix missing closing parenthesis
      if (content.includes('{ status: 401 }\n    }\n\n    const { id } = await params;\n      )')) {
        content = content.replace(
          '{ status: 401 }\n    }\n\n    const { id } = await params;\n      )',
          '{ status: 401 }\n      );\n    }\n\n    const { id } = await params;'
        );
        modified = true;
      }

      if (modified) {
        writeFileSync(filePath, content);
        console.log(`✅ Corrigé: ${filePath}`);
      } else {
        console.log(`⚪ Aucune correction nécessaire: ${filePath}`);
      }

    } catch (error) {
      console.error(`❌ Erreur avec ${filePath}:`, error);
    }
  });

  console.log('✅ Correction terminée');
}

fixSyntaxErrors();