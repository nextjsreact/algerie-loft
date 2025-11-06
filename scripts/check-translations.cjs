const fs = require('fs');
const path = require('path');

// Charger les messages de traduction
const loadMessages = (locale) => {
  try {
    const messagesPath = path.join(__dirname, '..', 'messages', `${locale}.json`);
    return JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
  } catch (error) {
    console.error(`Error loading ${locale} messages:`, error.message);
    return {};
  }
};

// Fonction pour vérifier si une clé existe dans les messages
const checkTranslationKey = (messages, key) => {
  const keys = key.split('.');
  let current = messages;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return false;
    }
  }
  
  return typeof current === 'string';
};

// Extraire les clés de traduction des fichiers
const extractTranslationKeys = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Patterns pour trouver les clés de traduction
    const patterns = [
      /t\(['"`]([^'"`]+)['"`]\)/g,  // t('key')
      /t\(['"`]([^'"`]+)['"`],/g,   // t('key', {...})
    ];
    
    const keys = new Set();
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        keys.add(match[1]);
      }
    });
    
    return Array.from(keys);
  } catch (error) {
    return [];
  }
};

// Parcourir récursivement les fichiers
const findFiles = (dir, extension = '.tsx') => {
  const files = [];
  
  const traverse = (currentDir) => {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        files.push(fullPath);
      }
    });
  };
  
  traverse(dir);
  return files;
};

// Main function
const checkTranslations = () => {
  console.log('🔍 Checking translation keys...\n');
  
  // Charger les messages pour toutes les langues
  const messages = {
    fr: loadMessages('fr'),
    ar: loadMessages('ar'),
    en: loadMessages('en')
  };
  
  // Trouver tous les fichiers de composants
  const componentFiles = findFiles(path.join(__dirname, '..', 'components'));
  
  const missingKeys = new Set();
  const fileIssues = {};
  
  componentFiles.forEach(filePath => {
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    const keys = extractTranslationKeys(filePath);
    
    if (keys.length > 0) {
      const fileProblems = [];
      
      keys.forEach(key => {
        // Vérifier si la clé existe dans toutes les langues
        const missing = [];
        
        Object.keys(messages).forEach(locale => {
          if (!checkTranslationKey(messages[locale], key)) {
            missing.push(locale);
          }
        });
        
        if (missing.length > 0) {
          missingKeys.add(key);
          fileProblems.push({
            key,
            missingIn: missing
          });
        }
      });
      
      if (fileProblems.length > 0) {
        fileIssues[relativePath] = fileProblems;
      }
    }
  });
  
  // Afficher les résultats
  if (Object.keys(fileIssues).length === 0) {
    console.log('✅ All translation keys are valid!');
  } else {
    console.log('❌ Found translation issues:\n');
    
    Object.entries(fileIssues).forEach(([file, problems]) => {
      console.log(`📄 ${file}:`);
      problems.forEach(({ key, missingIn }) => {
        console.log(`   ❌ "${key}" missing in: ${missingIn.join(', ')}`);
      });
      console.log('');
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Files with issues: ${Object.keys(fileIssues).length}`);
    console.log(`   Unique missing keys: ${missingKeys.size}`);
    console.log(`\n🔑 Missing keys:`);
    Array.from(missingKeys).sort().forEach(key => {
      console.log(`   - ${key}`);
    });
  }
};

checkTranslations();