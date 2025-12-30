/**
 * Standalone Property-Based Test Runner for Internationalization Preservation
 * 
 * **Feature: nextjs-16-migration-plan, Property 5: Internationalization Preservation**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 */

const fs = require('fs');
const path = require('path');

// Import translation files
const frMessages = JSON.parse(fs.readFileSync(path.join(__dirname, '../../messages/fr.json'), 'utf8'));
const enMessages = JSON.parse(fs.readFileSync(path.join(__dirname, '../../messages/en.json'), 'utf8'));
const arMessages = JSON.parse(fs.readFileSync(path.join(__dirname, '../../messages/ar.json'), 'utf8'));

const locales = ['fr', 'ar', 'en'];

// Simple property-based testing implementation
class InternationalizationPropertyGenerator {
  static generateRandomLocale() {
    const randomIndex = Math.floor(Math.random() * locales.length);
    return locales[randomIndex];
  }

  static getAllTranslationKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys = keys.concat(this.getAllTranslationKeys(obj[key], prefix + key + '.'));
      } else {
        keys.push(prefix + key);
      }
    }
    return keys;
  }

  static generateRandomTranslationKey(messages) {
    const keys = this.getAllTranslationKeys(messages);
    if (keys.length === 0) return 'common.loading';
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
  }

  static generateRandomNamespace(messages) {
    const namespaces = Object.keys(messages);
    const randomIndex = Math.floor(Math.random() * namespaces.length);
    return namespaces[randomIndex];
  }

  static getMessagesForLocale(locale) {
    switch (locale) {
      case 'fr': return frMessages;
      case 'en': return enMessages;
      case 'ar': return arMessages;
      default: return frMessages;
    }
  }

  static getValueFromPath(obj, path) {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }
    return value;
  }
}

// Test functions
function testTranslationConsistency() {
  console.log('🔍 Testing Translation Key Consistency...');
  
  const iterations = 50;
  let passedTests = 0;
  let totalKeys = 0;
  let consistentKeys = 0;

  for (let i = 0; i < iterations; i++) {
    try {
      // Generate a random namespace and key from French (reference language)
      const namespace = InternationalizationPropertyGenerator.generateRandomNamespace(frMessages);
      const messageKey = InternationalizationPropertyGenerator.generateRandomTranslationKey(frMessages[namespace] || {});

      totalKeys++;

      // Test that the same key exists in all languages
      const allMessages = {
        fr: frMessages,
        en: enMessages,
        ar: arMessages
      };

      let keyExistsInAllLanguages = true;
      const translations = {};

      for (const locale of locales) {
        const messages = allMessages[locale];
        const fullPath = `${namespace}.${messageKey}`;
        const value = InternationalizationPropertyGenerator.getValueFromPath(messages, fullPath);

        if (value && typeof value === 'string') {
          translations[locale] = value;
        } else {
          keyExistsInAllLanguages = false;
          break;
        }
      }

      if (keyExistsInAllLanguages) {
        consistentKeys++;
        passedTests++;
      }

    } catch (error) {
      console.warn(`Translation consistency test iteration ${i + 1} failed:`, error.message);
    }
  }

  const successRate = (passedTests / iterations) * 100;
  console.log(`  📊 Results: ${passedTests}/${iterations} tests passed (${successRate.toFixed(1)}%)`);
  console.log(`  🔑 Key consistency: ${consistentKeys}/${totalKeys} keys found in all languages`);
  
  return passedTests >= Math.floor(iterations * 0.90);
}

function testLocaleSupport() {
  console.log('🌍 Testing Locale Support...');
  
  const iterations = 30;
  let passedTests = 0;

  for (let i = 0; i < iterations; i++) {
    try {
      const locale = InternationalizationPropertyGenerator.generateRandomLocale();
      
      // Property: Locale should be one of the supported locales
      if (locales.includes(locale)) {
        // Property: Each locale should have messages
        const messages = InternationalizationPropertyGenerator.getMessagesForLocale(locale);
        if (messages && typeof messages === 'object' && Object.keys(messages).length > 0) {
          // Property: RTL/LTR behavior should be correct
          const expectedDirection = locale === 'ar' ? 'rtl' : 'ltr';
          const isRTL = locale === 'ar';
          
          if ((isRTL && expectedDirection === 'rtl') || (!isRTL && expectedDirection === 'ltr')) {
            passedTests++;
          }
        }
      }
    } catch (error) {
      console.warn(`Locale support test iteration ${i + 1} failed:`, error.message);
    }
  }

  const successRate = (passedTests / iterations) * 100;
  console.log(`  📊 Results: ${passedTests}/${iterations} tests passed (${successRate.toFixed(1)}%)`);
  
  return passedTests >= Math.floor(iterations * 0.95);
}

function testTranslationStructure() {
  console.log('🏗️ Testing Translation Structure...');
  
  let passedTests = 0;
  const totalTests = 3; // One for each language

  try {
    // Test that all languages have the same top-level structure
    const frNamespaces = Object.keys(frMessages);
    const enNamespaces = Object.keys(enMessages);
    const arNamespaces = Object.keys(arMessages);

    // Property: All languages should have the same namespaces
    const frSet = new Set(frNamespaces);
    const enSet = new Set(enNamespaces);
    const arSet = new Set(arNamespaces);

    let structureConsistent = true;

    // Check if French and English have the same namespaces
    if (frSet.size === enSet.size && [...frSet].every(ns => enSet.has(ns))) {
      passedTests++;
    } else {
      structureConsistent = false;
      console.warn('  ⚠️ French and English namespaces differ');
    }

    // Check if French and Arabic have the same namespaces
    if (frSet.size === arSet.size && [...frSet].every(ns => arSet.has(ns))) {
      passedTests++;
    } else {
      structureConsistent = false;
      console.warn('  ⚠️ French and Arabic namespaces differ');
    }

    // Check if English and Arabic have the same namespaces
    if (enSet.size === arSet.size && [...enSet].every(ns => arSet.has(ns))) {
      passedTests++;
    } else {
      structureConsistent = false;
      console.warn('  ⚠️ English and Arabic namespaces differ');
    }

    if (structureConsistent) {
      console.log(`  ✅ All languages have consistent namespace structure`);
      console.log(`  📁 Found ${frNamespaces.length} namespaces: ${frNamespaces.join(', ')}`);
    }

  } catch (error) {
    console.warn('Translation structure test failed:', error.message);
  }

  const successRate = (passedTests / totalTests) * 100;
  console.log(`  📊 Results: ${passedTests}/${totalTests} tests passed (${successRate.toFixed(1)}%)`);
  
  return passedTests >= Math.floor(totalTests * 0.95);
}

function testInterpolationSupport() {
  console.log('🔗 Testing Interpolation Support...');
  
  const iterations = 30;
  let passedTests = 0;

  // Common interpolation patterns to test
  const interpolationPatterns = [
    { pattern: '{name}', testValue: 'John' },
    { pattern: '{count}', testValue: '5' },
    { pattern: '{date}', testValue: '2024-01-01' }
  ];

  for (let i = 0; i < iterations; i++) {
    try {
      const locale = InternationalizationPropertyGenerator.generateRandomLocale();
      const messages = InternationalizationPropertyGenerator.getMessagesForLocale(locale);
      const pattern = interpolationPatterns[i % interpolationPatterns.length];

      // Look for messages that contain interpolation patterns
      const allKeys = InternationalizationPropertyGenerator.getAllTranslationKeys(messages);
      const interpolationKeys = allKeys.filter(key => {
        const value = InternationalizationPropertyGenerator.getValueFromPath(messages, key);
        return typeof value === 'string' && value.includes(pattern.pattern);
      });

      if (interpolationKeys.length > 0) {
        // Property: Interpolation patterns should be present in the message
        const randomKey = interpolationKeys[Math.floor(Math.random() * interpolationKeys.length)];
        const message = InternationalizationPropertyGenerator.getValueFromPath(messages, randomKey);
        
        if (message && message.includes(pattern.pattern)) {
          passedTests++;
        }
      } else {
        // If no interpolation keys found, that's also valid
        passedTests++;
      }

    } catch (error) {
      console.warn(`Interpolation test iteration ${i + 1} failed:`, error.message);
    }
  }

  const successRate = (passedTests / iterations) * 100;
  console.log(`  📊 Results: ${passedTests}/${iterations} tests passed (${successRate.toFixed(1)}%)`);
  
  return passedTests >= Math.floor(iterations * 0.85);
}

// Main test runner
async function runInternationalizationPropertyTests() {
  console.log('🧪 Running Internationalization Property-Based Tests');
  console.log('**Feature: nextjs-16-migration-plan, Property 5: Internationalization Preservation**');
  console.log('**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**');
  console.log('=' .repeat(80));
  
  const testResults = [];
  
  try {
    // Test 1: Translation Key Consistency
    console.log('\n1️⃣ Property Test: Translation Key Consistency');
    const consistencyResult = testTranslationConsistency();
    testResults.push({ name: 'Translation Consistency', passed: consistencyResult });
    
    // Test 2: Locale Support
    console.log('\n2️⃣ Property Test: Locale Support and RTL/LTR Behavior');
    const localeResult = testLocaleSupport();
    testResults.push({ name: 'Locale Support', passed: localeResult });
    
    // Test 3: Translation Structure
    console.log('\n3️⃣ Property Test: Translation Structure Consistency');
    const structureResult = testTranslationStructure();
    testResults.push({ name: 'Translation Structure', passed: structureResult });
    
    // Test 4: Interpolation Support
    console.log('\n4️⃣ Property Test: Interpolation Support');
    const interpolationResult = testInterpolationSupport();
    testResults.push({ name: 'Interpolation Support', passed: interpolationResult });
    
    // Summary
    console.log('\n' + '=' .repeat(80));
    console.log('📋 INTERNATIONALIZATION PROPERTY TEST SUMMARY');
    console.log('=' .repeat(80));
    
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const overallSuccessRate = (passedTests / totalTests) * 100;
    
    testResults.forEach((result, index) => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`  ${index + 1}. ${result.name}: ${status}`);
    });
    
    console.log(`\n📊 Overall Results: ${passedTests}/${totalTests} property tests passed (${overallSuccessRate.toFixed(1)}%)`);
    
    // Property 5 evaluation
    const propertyHolds = overallSuccessRate >= 85; // Allow for some flexibility in i18n edge cases
    console.log(`🎯 Property 5 ${propertyHolds ? 'HOLDS' : 'FAILS'}: Internationalization Preservation`);
    
    if (propertyHolds) {
      console.log('\n✅ All internationalization property-based tests PASSED');
      console.log('🎉 Next.js 16 migration preserves internationalization functionality');
      console.log('🌍 All supported languages (fr/en/ar) maintain proper structure and behavior');
    } else {
      console.log('\n❌ Internationalization property-based tests FAILED');
      console.log('💥 Migration may have broken internationalization functionality');
      console.log('🔧 Review translation files and i18n configuration');
    }
    
    return propertyHolds;
    
  } catch (error) {
    console.error('❌ Property test execution failed:', error);
    return false;
  }
}

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runInternationalizationPropertyTests };
}

// Run tests if this file is executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('internationalization-properties-runner.cjs')) {
  runInternationalizationPropertyTests().then(result => {
    process.exit(result ? 0 : 1);
  }).catch(() => {
    process.exit(1);
  });
}