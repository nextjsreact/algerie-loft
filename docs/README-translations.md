# Translation System Documentation

## 🌐 Overview

This project uses **next-intl** for internationalization with a comprehensive translation consistency system. This documentation covers everything you need to know about working with translations in this codebase.

## 🚀 Quick Start

### For Developers

1. **Use SafeTranslation for all text:**
   ```tsx
   import { useSafeTranslation } from '@/components/common/safe-translation'
   
   export function MyComponent() {
     const t = useSafeTranslation('common')
     return <button>{t('save', {}, 'Save')}</button>
   }
   ```

2. **Follow namespace conventions:**
   - `common` - Shared text (save, cancel, loading)
   - `forms` - Form-related text (labels, placeholders, validation)
   - `pages` - Page-specific content
   - `components` - Component-specific text

3. **Always provide fallbacks:**
   ```tsx
   t('keyName', {}, 'Fallback Text')
   ```

### For Translators

Translation files are located in `/messages/`:
- `en.json` - English translations
- `fr.json` - French translations  
- `ar.json` - Arabic translations

## 📁 File Structure

```
├── messages/                    # Translation files
│   ├── en.json                 # English translations
│   ├── fr.json                 # French translations
│   └── ar.json                 # Arabic translations
├── components/common/
│   └── safe-translation.tsx    # SafeTranslation component
├── scripts/
│   ├── validate-translations.js # Translation validation
│   └── find-hardcoded-text.js # Hardcoded text detection
├── docs/
│   ├── translation-development-guidelines.md
│   └── safe-translation-migration-guide.md
└── .husky/
    └── pre-commit              # Pre-commit hooks
```

## 🔧 Available Scripts

```bash
# Validate all translations
npm run validate-translations

# Find hardcoded text in code
npm run find-hardcoded-text

# Run both translation checks
npm run translation-check

# Generate translation coverage report
npm run translation-coverage
```

## 🏗️ Translation Structure

### Namespace Organization

```json
{
  "common": {
    "actions": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit"
    },
    "status": {
      "loading": "Loading...",
      "success": "Success",
      "error": "Error"
    }
  },
  "forms": {
    "labels": {
      "name": "Name",
      "email": "Email"
    },
    "placeholders": {
      "enterName": "Enter your name",
      "enterEmail": "Enter your email"
    },
    "validation": {
      "required": "This field is required",
      "emailInvalid": "Please enter a valid email"
    }
  }
}
```

## 🛠️ Development Workflow

### 1. Adding New Features

1. **Plan translations first:**
   ```tsx
   // Before coding, identify needed translations:
   // - common.actions.save
   // - forms.labels.userName
   // - forms.validation.required
   ```

2. **Use SafeTranslation:**
   ```tsx
   const t = useSafeTranslation('forms')
   return <input placeholder={t('placeholders.userName', {}, 'Username')} />
   ```

3. **Add keys to ALL language files:**
   ```json
   // messages/en.json
   "forms": { "placeholders": { "userName": "Username" } }
   
   // messages/fr.json  
   "forms": { "placeholders": { "userName": "Nom d'utilisateur" } }
   
   // messages/ar.json
   "forms": { "placeholders": { "userName": "اسم المستخدم" } }
   ```

4. **Test in all locales:**
   - Visit `/en/your-page`
   - Visit `/fr/your-page`
   - Visit `/ar/your-page`

### 2. Pre-commit Validation

The system automatically runs these checks before each commit:

- ✅ **Translation validation** - Ensures all keys exist in all languages
- ✅ **Hardcoded text detection** - Finds text that should be translated
- ✅ **ESLint checks** - Enforces translation usage patterns
- ✅ **TypeScript validation** - Ensures type safety

## 🧪 Testing Translations

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

const messages = {
  common: { actions: { save: 'Save' } }
}

test('displays translated text', () => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MyComponent />
    </NextIntlClientProvider>
  )
  
  expect(screen.getByText('Save')).toBeInTheDocument()
})
```

### Integration Tests

```tsx
describe('Full Page Translation', () => {
  it('renders without raw translation keys', () => {
    render(<DashboardPage />)
    
    // Should not contain any raw keys like "common.save"
    const rawKeys = screen.queryAllByText(/\w+\.\w+/)
    expect(rawKeys).toHaveLength(0)
  })
})
```

## 🚨 Common Issues & Solutions

### 1. MISSING_MESSAGE Errors

**Problem:** `MISSING_MESSAGE: Could not resolve 'key' in messages`

**Solutions:**
- ✅ Use SafeTranslation with fallbacks
- ✅ Add missing keys to translation files
- ✅ Check key spelling and namespace
- ✅ Run `npm run validate-translations`

### 2. Hardcoded Text

**Problem:** Text appears directly in components

**Solutions:**
- ✅ Run `npm run find-hardcoded-text`
- ✅ Replace with translation keys
- ✅ Use SafeTranslation component
- ✅ Add ESLint rules to prevent future issues

### 3. Inconsistent Translations

**Problem:** Same concept translated differently

**Solutions:**
- ✅ Use consistent terminology
- ✅ Create translation glossary
- ✅ Regular translation reviews
- ✅ Automated consistency checks

## 📊 Quality Metrics

Our translation system maintains:

- **Zero MISSING_MESSAGE errors** in production
- **100% translation coverage** for critical UI elements
- **Consistent terminology** across all locales
- **Automated validation** preventing translation issues
- **Fast development** with reusable patterns

## 🔗 Related Documentation

- [Translation Development Guidelines](./translation-development-guidelines.md)
- [SafeTranslation Migration Guide](./safe-translation-migration-guide.md)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)

## 🆘 Getting Help

### Development Issues

1. **Check the console** for missing translation warnings
2. **Run validation scripts** to identify issues
3. **Review the guidelines** for best practices
4. **Check existing translations** for similar patterns

### Translation Issues

1. **Verify key exists** in all language files
2. **Check namespace structure** matches usage
3. **Ensure proper nesting** in JSON files
4. **Test in all supported locales**

### Emergency Fixes

If you encounter translation issues in production:

1. **Add missing keys** to all language files
2. **Deploy translation updates** immediately
3. **Use SafeTranslation fallbacks** for temporary fixes
4. **Monitor error logs** for additional issues

---

**Remember:** Good translations create a professional, consistent user experience across all languages. Following these guidelines ensures maintainable, scalable internationalization.