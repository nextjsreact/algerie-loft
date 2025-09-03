const fs = require('fs');
const path = require('path');

// Get all files with the corrupted pattern
const corruptedFiles = [
  'components/ui/date-range-picker.tsx',
  'app/test-sound/page.tsx',
  'components/transactions/transaction-reference-amounts.tsx',
  'components/conversations/conversation-header.tsx',
  'components/conversations/conversation-welcome.tsx',
  'components/conversations/conversations-list.tsx',
  'components/conversations/conversations-sidebar.tsx',
  'components/conversations/conversations-page-client.tsx',
  'components/conversations/modern-chat-view.tsx',
  'components/conversations/conversation-page-client.tsx',
  'components/conversations/modern-new-conversation.tsx',
  'components/conversations/new-conversation-dialog.tsx',
  'components/conversations/simple-conversation-page-client.tsx'
];

function fixFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix the corrupted pattern: const t'use client' -> remove the line
    content = content.replace(/const t'use client'/g, '');
    content = content.replace(/const t"use client"/g, '');
    
    // Remove duplicate empty lines
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

console.log('Fixing corrupted use client directives...');
corruptedFiles.forEach(fixFile);
console.log('Done!');