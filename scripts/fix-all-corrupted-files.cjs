const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to recursively find all TypeScript/TSX files
function findAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findAllTsFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Fix the corrupted patterns
    content = content.replace(/const t'use client'/g, '');
    content = content.replace(/const t"use client"/g, '');
    
    // Fix imports that are in the wrong place (after function body)
    // Look for patterns where imports appear after code
    const lines = content.split('\n');
    const importLines = [];
    const codeLines = [];
    let inImportSection = true;
    let foundUseClient = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for 'use client' directive
      if (line.trim() === "'use client'" || line.trim() === '"use client"') {
        foundUseClient = true;
        codeLines.push(line);
        continue;
      }
      
      // Check if this is an import line
      if (line.trim().startsWith('import ') && line.includes(' from ')) {
        if (inImportSection || i < 20) { // Keep imports at the top
          importLines.push(line);
        } else {
          // This is a misplaced import, move it to the top
          importLines.push(line);
        }
      } else if (line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*')) {
        // This is code, no more imports should be at the top
        inImportSection = false;
        codeLines.push(line);
      } else {
        // Empty line or comment
        if (inImportSection) {
          importLines.push(line);
        } else {
          codeLines.push(line);
        }
      }
    }
    
    // Reconstruct the file with proper structure
    let newContent = '';
    
    // Add 'use client' if it was found
    if (foundUseClient) {
      newContent += "'use client'\n\n";
    }
    
    // Add all imports
    const uniqueImports = [...new Set(importLines.filter(line => line.trim()))];
    newContent += uniqueImports.join('\n');
    
    if (uniqueImports.length > 0) {
      newContent += '\n\n';
    }
    
    // Add the rest of the code (excluding 'use client' since we already added it)
    const filteredCodeLines = codeLines.filter(line => 
      line.trim() !== "'use client'" && line.trim() !== '"use client"'
    );
    newContent += filteredCodeLines.join('\n');
    
    // Remove excessive empty lines
    newContent = newContent.replace(/\n\n\n+/g, '\n\n');
    
    // Only write if content changed
    if (newContent !== originalContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

console.log('Finding and fixing all corrupted TypeScript files...');

// Find all TS/TSX files
const allFiles = findAllTsFiles('.');

// Filter files that might have the corruption
const corruptedFiles = allFiles.filter(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes("const t'use client'") || 
           content.includes('const t"use client"') ||
           content.match(/}\s*import\s+.*from/);
  } catch (error) {
    return false;
  }
});

console.log(`Found ${corruptedFiles.length} potentially corrupted files`);

corruptedFiles.forEach(fixFile);

console.log('Done!');