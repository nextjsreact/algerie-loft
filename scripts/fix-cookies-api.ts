#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync } from 'fs';

const filesToFix = [
  'app/api/admin/lofts/route.ts',
  'app/api/admin/lofts/[id]/route.ts',
  'app/api/admin/lofts/[id]/reservations/route.ts',
  'app/api/admin/lofts/[id]/tasks/route.ts',
  'app/api/admin/lofts/[id]/financial-summary/route.ts',
  'app/api/admin/property-assignments/bulk/route.ts',
  'app/api/admin/property-assignments/transfer/route.ts',
  'app/api/admin/property-assignments/history/route.ts',
  'app/api/admin/partners/route.ts'
];

function fixCookiesUsage() {
  console.log('🔧 Correction de l\'utilisation de cookies dans les API routes...');

  filesToFix.forEach(filePath => {
    if (!existsSync(filePath)) {
      console.log(`⚠️  Fichier non trouvé: ${filePath}`);
      return;
    }

    try {
      let content = readFileSync(filePath, 'utf-8');
      let modified = false;
      const originalContent = content;

      // Remove cookies import
      if (content.includes("import { cookies } from 'next/headers'")) {
        content = content.replace(/import \{ cookies \} from 'next\/headers'\n?/g, '');
        modified = true;
      }

      // Replace cookies() usage with await createClient()
      if (content.includes('const cookieStore = cookies()')) {
        content = content.replace(
          /const cookieStore = cookies\(\)\s*\n\s*const supabase = createClient\(cookieStore\)/g,
          'const supabase = await createClient()'
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

  console.log('✅ Correction de l\'utilisation de cookies terminée');
}

fixCookiesUsage();