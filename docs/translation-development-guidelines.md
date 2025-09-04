# Translation Development Guidelines

## 🎯 Overview

This document provides comprehensive guidelines for maintaining translation consistency and preventing translation-related errors in our Next.js application with next-intl. These guidelines ensure all developers follow standardized practices when working with translations.

## 📋 Pre-Development Checklist

Before adding new features or components:

- [ ] **Plan translation keys** - Define all required translation keys before coding
- [ ] **Choose appropriate namespaces** - Use existing namespaces when possible
- [ ] **Prepare fallback text** - Always have fallback text ready for critical UI elements
- [ ] **Check existing translations** - Verify if similar keys already exist
- [ ] **Review namespace structure** - Ensure new keys fit the established hierarchy

## 🏗️ Standardized Namespace Conventions

### 1. Primary Namespace Structure

```json
{
  "common": {
    "actions": { "save": "Save", "cancel": "Cancel", "delete": "Delete" },
    "status": { "loading": "Loading...", "success": "Success", "error": "Error" },
    "navigation": { "home": "Home", "back": "Back", "next": "Next" }
  },
  "forms": {
    "labels": { "name": "Name", "email": "Email", "phone": "Phone" },
    "placeholders": { "enterName": "Enter your name", "enterEmail": "Enter email" },
    "validation": { "required": "This field is required", "emailInvalid": "Invalid email" },
    "buttons": { "submit": "Submit", "reset": "Reset", "save": "Save" }
  },
  "pages": {
    "dashboard": { "title": "Dashboard", "welcome": "Welcome back" },
    "settings": { "title": "Settings", "profile": "Profile Settings" },
    "auth": { "login": "Login", "logout": "Logout", "register": "Register" }
  },
  "components": {
    "modals": { "confirmDelete": "Confirm deletion", "close": "Close" },
    "tables": { "noData": "No data available", "loading": "Loading data..." },
    "cards": { "viewMore": "View more", "collapse": "Collapse" }
  }
}
```

### 2. Namespace Naming Rules

- Use **camelCase** for all keys
- Be **descriptive** but **concise**
- Group related keys in **logical namespaces**
- Use **consistent terminology** across the app
- Avoid abbreviations unless universally understood
- Maximum 3 levels of nesting (e.g., `forms.validation.required`)

### 3. Reserved Namespaces

| Namespace | Purpose | Examples |
|-----------|---------|----------|
| `common` | Shared across entire app | save, cancel, loading, error |
| `forms` | Form-related translations | labels, placeholders, validation |
| `pages` | Page-specific content | titles, descriptions, headers |
| `components` | Reusable component text | modals, tables, cards |
| `navigation` | Navigation elements | menu items, breadcrumbs |
| `errors` | Error messages | 404, 500, validation errors |

## 🔧 Implementation Standards

### 1. Component Translation Usage

#### ✅ Correct Implementation:
```tsx
import { useTranslations } from 'next-intl'

export function UserForm() {
  const t = useTranslations('forms')
  const tCommon = useTranslations('common')
  
  return (
    <form>
      <label>{t('labels.name')}</label>
      <input placeholder={t('placeholders.enterName')} />
      <button type="submit">{tCommon('actions.save')}</button>
    </form>
  )
}
```

#### ❌ Incorrect Implementation:
```tsx
// Don't do this
export function UserForm() {
  const t = useTranslations('forms')
  
  return (
    <form>
      <label>Name</label> {/* Hardcoded text */}
      <input placeholder={t('name_placeholder')} /> {/* Wrong naming */}
      <button type="submit">{t('common.save')}</button> {/* Wrong namespace */}
    </form>
  )
}
```

### 2. SafeTranslation Usage

For critical UI elements, always use SafeTranslation with fallbacks:

```tsx
import { useSafeTranslation } from '@/components/common/safe-translation'

export function CriticalComponent() {
  const t = useSafeTranslation('forms')
  
  return (
    <div>
      <h1>{t('title', {}, 'Default Title')}</h1>
      <button>{t('submit', {}, 'Submit')}</button>
    </div>
  )
}
```

## 📝 Translation Key Checklist

When adding new translation keys:

- [ ] **Key follows naming convention** (camelCase, descriptive)
- [ ] **Appropriate namespace selected** (common, forms, pages, etc.)
- [ ] **Key added to ALL language files** (en.json, fr.json, ar.json)
- [ ] **Fallback text provided** for SafeTranslation usage
- [ ] **No hardcoded text remains** in component
- [ ] **Consistent with existing similar keys**
- [ ] **Tested in all supported locales**

## 🔍 Validation Tools

### 1. Pre-commit Hook Setup

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run translation validation
npm run validate-translations

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### 2. Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "validate-translations": "node scripts/validate-translations.js",
    "translation-check": "npm run validate-translations",
    "translation-coverage": "node scripts/translation-coverage.js",
    "find-hardcoded-text": "node scripts/find-hardcoded-text.js"
  }
}
```

### 3. ESLint Rules

Add to `.eslintrc.js`:

```javascript
module.exports = {
  rules: {
    // Warn about hardcoded strings in JSX
    'react/jsx-no-literals': [
      'warn',
      {
        noStrings: true,
        allowedStrings: ['', ' ', '/', ':', '-', '+', '=', '(', ')', '[', ']'],
        ignoreProps: false,
        noAttributeStrings: true
      }
    ],
    // Enforce SafeTranslation usage
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['next-intl'],
            importNames: ['useTranslations'],
            message: 'Use useSafeTranslation from @/components/common/safe-translation instead.'
          }
        ]
      }
    ]
  }
}
```

## 🧪 Testing Guidelines

### 1. Translation Tests Template

```tsx
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MyComponent } from './my-component'

const messages = {
  forms: {
    labels: { name: 'Name' },
    buttons: { submit: 'Submit' }
  }
}

function renderWithTranslations(component: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  )
}

describe('MyComponent', () => {
  it('displays translated text correctly', () => {
    renderWithTranslations(<MyComponent />)
    
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Submit')).toBeInTheDocument()
  })
  
  it('handles missing translations gracefully', () => {
    // Test with incomplete translations
    const incompleteMessages = { forms: { labels: {} } }
    
    render(
      <NextIntlClientProvider locale="en" messages={incompleteMessages}>
        <MyComponent />
      </NextIntlClientProvider>
    )
    
    // Should show fallback text, not raw keys
    expect(screen.queryByText('forms.labels.name')).not.toBeInTheDocument()
  })
})
```

### 2. Integration Test Example

```tsx
describe('Full Page Translation Coverage', () => {
  it('renders dashboard page without raw translation keys', () => {
    render(<DashboardPage />)
    
    // Should not contain any raw translation keys
    const rawKeys = screen.queryAllByText(/\w+\.\w+/)
    expect(rawKeys).toHaveLength(0)
    
    // Should contain actual translated text
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
```

## 🚨 Common Pitfalls & Solutions

### 1. MISSING_MESSAGE Errors

**Problem:** `MISSING_MESSAGE: Could not resolve 'key' in messages`

**Solutions:**
- Use SafeTranslation with fallbacks
- Add missing keys to translation files
- Check key spelling and namespace
- Validate translation file structure

### 2. Inconsistent Translations

**Problem:** Same concept translated differently across the app

**Solutions:**
- Create a translation glossary
- Use consistent terminology
- Regular translation reviews
- Automated consistency checks

### 3. Hardcoded Text

**Problem:** Text directly in components instead of translations

**Solutions:**
- ESLint rules for hardcoded strings
- Code review checklist
- Regular audits with search scripts

### 4. Namespace Confusion

**Problem:** Using wrong namespace or mixing namespaces

**Solutions:**
- Clear namespace documentation
- Consistent naming patterns
- Validation scripts
- Developer training

## 📊 Quality Assurance Process

### 1. Development Workflow

1. **Plan translations** before coding
2. **Use SafeTranslation** for all text
3. **Add keys to all language files**
4. **Test in multiple locales**
5. **Run validation scripts**
6. **Code review** for translation usage

### 2. Review Checklist

- [ ] No hardcoded text in components
- [ ] All translation keys follow naming conventions
- [ ] Keys exist in all language files
- [ ] SafeTranslation used with appropriate fallbacks
- [ ] Consistent namespace usage
- [ ] No raw translation keys in UI

### 3. Automated Checks

- **Pre-commit:** Translation validation
- **CI/CD:** Translation coverage reports
- **Build:** Missing translation detection
- **Runtime:** Development warnings for missing keys

## 🔧 Maintenance Tools

### 1. Translation Audit Script

```bash
# Find all translation usage
npm run find-translations

# Check for missing keys
npm run validate-translations

# Generate coverage report
npm run translation-coverage

# Find hardcoded text
npm run find-hardcoded-text
```

### 2. Bulk Operations

```bash
# Add new namespace to all language files
node scripts/add-namespace.js --namespace="newFeature" --languages="en,fr,ar"

# Rename translation keys
node scripts/rename-keys.js --from="oldKey" --to="newKey" --namespace="forms"

# Sync translation structure across languages
node scripts/sync-translations.js
```

## 📚 Resources & References

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [SafeTranslation Component Guide](./safe-translation-migration-guide.md)
- [Translation Validation Scripts](../scripts/validate-translations.js)
- [ESLint Translation Rules](./.eslintrc.translation.js)

## 🎯 Success Metrics

- **Zero MISSING_MESSAGE errors** in production
- **100% translation coverage** for critical UI elements
- **Consistent terminology** across all locales
- **Fast development** with reusable translation patterns
- **Maintainable codebase** with clear translation organization
- **Automated validation** preventing translation issues

---

**Remember:** Good translations are not just about language accuracy, but also about creating a consistent, professional user experience across all locales. Following these guidelines ensures maintainable, scalable internationalization.