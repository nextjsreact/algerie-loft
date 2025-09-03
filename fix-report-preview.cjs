const fs = require('fs');

// Read the file
let content = fs.readFileSync('components/reports/report-preview.tsx', 'utf8');

// Replace all t('reports: patterns with t('
content = content.replace(/t\('reports:/g, "t('");

// Replace t('common: patterns with tCommon('
content = content.replace(/t\('common:/g, "tCommon('");

// Write back to file
fs.writeFileSync('components/reports/report-preview.tsx', content);

console.log('Fixed report-preview translation keys');