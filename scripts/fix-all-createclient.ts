#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync } from 'fs';

const problematicFiles = [
  'app/[locale]/reservations/page.tsx',
  'app/api/service-inquiry/route.ts',
  'app/api/reservations/route.ts',
  'app/api/property-inquiry/route.ts',
  'app/api/notifications/route.ts',
  'app/api/emergency-contact/route.ts',
  'app/api/contact/route.ts',
  'app/api/callback-request/route.ts',
  'app/api/reservations/send-confirmation/route.ts',
  'app/api/reservations/[id]/route.ts',
  'app/api/availability/check/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/admin/settings/route.ts',
  'app/api/admin/disputes/route.ts',
  'app/api/admin/bookings/route.ts',
  'app/api/notifications/[id]/read/route.ts',
  'app/api/partner/properties/[id]/route.ts',
  'app/api/admin/users/[id]/route.ts',
  'app/api/admin/system/stats/route.ts',
  'app/api/admin/system/actions/route.ts',
  'app/api/admin/dashboard/stats/route.ts',
  'app/api/admin/dashboard/activity/route.ts',
  'app/api/admin/bookings/[id]/route.ts',
  'app/api/partner/properties/[id]/pricing-rules/route.ts',
  'app/api/partner/properties/[id]/photos/route.ts',
  'app/api/partner/properties/[id]/bookings/route.ts',
  'app/api/partner/properties/[id]/availability/route.ts',
  'app/api/admin/partners/[id]/verify/route.ts',
  'app/api/partner/properties/[id]/pricing-rules/[ruleId]/route.ts',
  'app/api/partner/properties/[id]/availability/bulk/route.ts'
];

function fixCreateClientUsage() {
  console.log('🔧 Correction de l\'utilisation de createClient...');

  problematicFiles.forEach(filePath => {
    if (!existsSync(filePath)) {
      console.log(`⚠️  Fichier non trouvé: ${filePath}`);
      return;
    }

    try {
      let content = readFileSync(filePath, 'utf-8');
      let modified = false;

      // For client components (pages with 'use client')
      if (content.includes("'use client'")) {
        // Import client createClient
        if (content.includes("import { createClient } from '@/utils/supabase/server'")) {
          content = content.replace(
            "import { createClient } from '@/utils/supabase/server'",
            "import { createClient } from '@/utils/supabase/client'"
          );
          modified = true;
        }
      } else {
        // For server components/API routes
        // Replace createClient() with await createClient()
        if (content.includes('const supabase = createClient()')) {
          content = content.replace(
            /const supabase = createClient\(\)/g,
            'const supabase = await createClient()'
          );
          modified = true;
        }
        
        // Also handle other patterns
        content = content.replace(
          /= createClient\(\)/g,
          '= await createClient()'
        );
        
        // Handle inline usage
        content = content.replace(
          /createClient\(\)\./g,
          '(await createClient()).'
        );
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

  console.log('✅ Correction de createClient terminée');
}

fixCreateClientUsage();