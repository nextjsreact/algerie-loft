#!/usr/bin/env tsx

import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';

async function identifyCookieIssues() {
  console.log('🔍 Identification des problèmes de cookies...');

  // Find all page files
  const pageFiles = await glob('app/**/page.tsx', { ignore: ['node_modules/**'] });
  const layoutFiles = await glob('app/**/layout.tsx', { ignore: ['node_modules/**'] });
  const apiFiles = await glob('app/api/**/route.ts', { ignore: ['node_modules/**'] });

  const problematicFiles: string[] = [];

  const allFiles = [...pageFiles, ...layoutFiles, ...apiFiles];

  for (const file of allFiles) {
    if (!existsSync(file)) continue;

    try {
      const content = readFileSync(file, 'utf-8');
      
      // Check for problematic patterns
      const hasCreateClient = content.includes('createClient()') && !content.includes('await createClient()');
      const hasCookiesImport = content.includes("import { cookies } from 'next/headers'");
      const hasCookiesCall = content.includes('cookies()') && !content.includes('await cookies()');
      const hasRequireAuth = content.includes('requireAuth') || content.includes('requireRole');
      
      if (hasCreateClient || hasCookiesCall || (hasCookiesImport && hasRequireAuth)) {
        problematicFiles.push(file);
        console.log(`⚠️  ${file}:`);
        if (hasCreateClient) console.log(`   - Uses createClient() without await`);
        if (hasCookiesCall) console.log(`   - Uses cookies() without await`);
        if (hasCookiesImport && hasRequireAuth) console.log(`   - Uses auth functions that may call cookies`);
      }
    } catch (error) {
      console.error(`❌ Error reading ${file}:`, error);
    }
  }

  console.log(`\n📊 Found ${problematicFiles.length} potentially problematic files`);
  
  if (problematicFiles.length > 0) {
    console.log('\n🔧 Suggestions:');
    console.log('1. Add "use client" directive to client-side pages');
    console.log('2. Use await createClient() in server components');
    console.log('3. Use createClient from client utils in client components');
    console.log('4. Wrap auth calls in try-catch blocks');
  }
}

identifyCookieIssues().catch(console.error);