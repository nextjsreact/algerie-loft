/**
 * ESLint Configuration for Translation Rules
 * Add these rules to your main .eslintrc.js to enforce translation usage
 */

module.exports = {
  rules: {
    // Warn about hardcoded strings in JSX
    'react/jsx-no-literals': [
      'warn',
      {
        noStrings: true,
        allowedStrings: [
          '', ' ', '/', ':', '-', '+', '=', '(', ')', '[', ']', '{', '}',
          '•', '→', '←', '↑', '↓', '✓', '✗', '⚠', '⚡', '🔍', '📊', '🎯'
        ],
        ignoreProps: false,
        noAttributeStrings: true
      }
    ],

    // Custom rule to enforce SafeTranslation usage
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['next-intl'],
            importNames: ['useTranslations'],
            message: 'Use useSafeTranslation from @/components/common/safe-translation instead of useTranslations to prevent MISSING_MESSAGE errors.'
          }
        ]
      }
    ],

    // Warn about console.log (should use proper logging)
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Enforce consistent string quotes
    'quotes': ['error', 'single', { avoidEscape: true }],

    // Warn about unused variables (often translation functions)
    'no-unused-vars': ['warn', { 
      varsIgnorePattern: '^t[A-Z]?', // Allow unused translation functions like t, tCommon
      argsIgnorePattern: '^_'
    }]
  },

  overrides: [
    {
      // More strict rules for components
      files: ['components/**/*.tsx', 'app/**/*.tsx'],
      rules: {
        'react/jsx-no-literals': [
          'error',
          {
            noStrings: true,
            allowedStrings: [
              '', ' ', '/', ':', '-', '+', '=', '(', ')', '[', ']', '{', '}',
              '•', '→', '←', '↑', '↓', '✓', '✗', '⚠', '⚡', '🔍', '📊', '🎯',
              '...', '–', '—'
            ],
            ignoreProps: false,
            noAttributeStrings: true
          }
        ],

        // Enforce translation key naming convention
        'prefer-const': 'error',
        
        // Custom rule for translation key patterns
        'no-restricted-syntax': [
          'error',
          {
            selector: 'CallExpression[callee.name="t"] > Literal[value=/^[a-z]+[A-Z]/]',
            message: 'Translation keys should use camelCase format'
          },
          {
            selector: 'CallExpression[callee.name="t"] > Literal[value=/\\s/]',
            message: 'Translation keys should not contain spaces'
          }
        ]
      }
    },

    {
      // Less strict for test files
      files: ['**/*.test.tsx', '**/*.test.ts', '**/__tests__/**', '**/*.spec.tsx', '**/*.spec.ts'],
      rules: {
        'react/jsx-no-literals': 'off',
        'no-restricted-imports': 'off',
        'no-console': 'off'
      }
    },

    {
      // Allow hardcoded text in documentation and config files
      files: ['**/*.md', '**/*.json', '**/docs/**', '**/scripts/**'],
      rules: {
        'react/jsx-no-literals': 'off',
        'no-restricted-imports': 'off'
      }
    },

    {
      // Special rules for translation files and utilities
      files: ['**/messages/**', '**/i18n/**', '**/translations/**'],
      rules: {
        'react/jsx-no-literals': 'off',
        'no-restricted-imports': 'off',
        'quotes': ['error', 'double'] // Use double quotes in JSON-like files
      }
    }
  ],

  // Custom rules for translation validation
  plugins: ['react'],
  
  settings: {
    react: {
      version: 'detect'
    }
  },

  // Environment-specific overrides
  env: {
    browser: true,
    es2021: true,
    node: true
  },

  // Parser options for TypeScript
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
}

// Additional custom rules that can be added to your main ESLint config
const customTranslationRules = {
  // Rule to detect potential hardcoded text patterns
  'translation/no-hardcoded-text': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Detect potential hardcoded text that should be translated',
        category: 'Internationalization'
      },
      schema: []
    },
    create(context) {
      return {
        JSXText(node) {
          const text = node.value.trim()
          if (text.length > 3 && /^[A-Z]/.test(text)) {
            context.report({
              node,
              message: `Potential hardcoded text: "${text}". Consider using translation.`
            })
          }
        },
        
        JSXAttribute(node) {
          if (node.value && node.value.type === 'Literal') {
            const attrName = node.name.name
            const value = node.value.value
            
            if (['placeholder', 'title', 'alt', 'aria-label'].includes(attrName) &&
                typeof value === 'string' && 
                value.length > 3 && 
                /^[A-Z]/.test(value)) {
              context.report({
                node,
                message: `Hardcoded ${attrName}: "${value}". Use translation instead.`
              })
            }
          }
        }
      }
    }
  },

  // Rule to enforce SafeTranslation usage patterns
  'translation/safe-translation-usage': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Enforce SafeTranslation usage patterns',
        category: 'Internationalization'
      },
      schema: []
    },
    create(context) {
      return {
        CallExpression(node) {
          if (node.callee.name === 't' && node.arguments.length === 1) {
            context.report({
              node,
              message: 'Consider providing a fallback for translation key. Use t(key, {}, fallback) pattern.'
            })
          }
        }
      }
    }
  }
}

module.exports.customRules = customTranslationRules