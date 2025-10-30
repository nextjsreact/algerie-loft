#!/usr/bin/env node

/**
 * Script to fix remaining Next.js API routes for params awaiting
 * Run this script to fix all remaining routes that need params to be awaited
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Routes that still need fixing (add more as needed)
const routesToFix = [
  'app/api/tasks/[id]/route.ts',
  'app/api/tasks/by-loft/[loftId]/route.ts',
  'app/api/notifications/[id]/route.ts',
  'app/api/notifications/[id]/read/route.ts',
  'app/api/partner/properties/[id]/pricing-rules/route.ts',
  'app/api/partner/properties/[id]/pricing-rules/[ruleId]/route.ts',
  'app/api/partner/properties/[id]/photos/route.ts',
  'app/api/partner/properties/[id]/bookings/route.ts',
  'app/api/partner/properties/[id]/availability/route.ts',
  'app/api/partner/properties/[id]/availability/bulk/route.ts',
  'app/api/lofts/[id]/reviews/route.ts',
  'app/api/bookings/[id]/payment/route.ts',
  'app/api/bookings/[id]/notifications/route.ts',
  'app/api/bookings/[id]/messages/route.ts',
  'app/api/bookings/[id]/cancel/route.ts',
  'app/api/audit/archive/history/[table]/[id]/route.ts',
  'app/api/admin/users/[id]/route.ts',
  'app/api/admin/email-templates/[id]/route.ts',
  'app/api/admin/partners/[id]/verify/route.ts',
  'app/api/admin/disputes/[id]/route.ts',
  'app/api/admin/bookings/[id]/route.ts'
];

function fixRoute(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern 1: { params }: { params: { id: string } }
  const pattern1 = /\{ params \}: \{ params: \{ ([^}]+) \} \}/g;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, '{ params }: { params: Promise<{ $1 }> }');
    modified = true;
  }

  // Pattern 2: const { id } = params;
  const pattern2 = /const \{ ([^}]+) \} = params;/g;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, 'const { $1 } = await params;');
    modified = true;
  }

  // Pattern 3: params.id direct access
  const pattern3 = /params\.(\w+)/g;
  const matches = content.match(pattern3);
  if (matches) {
    // This is more complex, we need to add await params at the beginning
    // and replace direct access with destructured access
    console.log(`⚠️  Manual fix needed for direct params access in: ${filePath}`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }

  console.log(`ℹ️  No changes needed: ${filePath}`);
  return false;
}

console.log('🔧 Fixing Next.js API routes for params awaiting...\n');

let fixedCount = 0;
routesToFix.forEach(route => {
  if (fixRoute(route)) {
    fixedCount++;
  }
});

console.log(`\n✨ Fixed ${fixedCount} routes`);
console.log('\n📝 Note: Some routes may need manual review for complex params usage');
console.log('🚀 You can now test your API routes - the main error should be resolved!');