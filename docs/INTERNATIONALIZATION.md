# Multi-Language Support (i18n) Implementation

This document describes the internationalization (i18n) implementation for the Loft Management System.

## Features

- **3 Languages Supported**: English (en), French (fr), Arabic (ar)
- **RTL Support**: Automatic right-to-left layout for Arabic
- **Language Persistence**: User's language choice is saved in localStorage
- **Dynamic Language Switching**: Users can change language without page reload
- **Comprehensive Coverage**: All UI text, forms, messages, and navigation are translated

## Supported Languages

| Language | Code | Direction | Flag |
|----------|------|-----------|------|
| English  | en   | LTR       | 🇺🇸   |
| French   | fr   | LTR       | 🇫🇷   |
| Arabic   | ar   | RTL       | 🇸🇦   |

## Usage

### Language Selector
- **Landing Page**: Language selector in the top-right corner
- **Login Page**: Language selector in the login form
- **App Header**: Language selector for mobile users
- **App Sidebar**: Language selector for desktop users

### For Developers

#### Using Translations in Components

```tsx
import { useTranslation } from '@/lib/i18n/context'

function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('tasks.title')}</h1>
      <p>{t('tasks.subtitle')}</p>
    </div>
  )
}
```

#### Using Translations with Parameters

```tsx
const { t } = useTranslation()

// Translation with parameters
const message = t('tasks.dueDateFormat', { date: '2024-01-15' })
// Result: "Due by 2024-01-15" (English) or "Échéance le 2024-01-15" (French)
```

#### Adding New Translations

1. Add the translation key to all languages in `lib/i18n/translations.ts`:

```typescript
export const translations = {
  en: {
    mySection: {
      newKey: "English text"
    }
  },
  fr: {
    mySection: {
      newKey: "Texte français"
    }
  },
  ar: {
    mySection: {
      newKey: "النص العربي"
    }
  }
}
```

2. Use the translation in your component:

```tsx
const { t } = useTranslation()
return <span>{t('mySection.newKey')}</span>
```

## Implementation Details

### Context Provider
- `LanguageProvider` wraps the entire app in `app/layout.tsx`
- Manages language state and provides translation functions
- Automatically sets document direction for RTL languages

### Translation Files
- All translations are stored in `lib/i18n/translations.ts`
- Organized by sections (auth, tasks, nav, common, etc.)
- Type-safe with TypeScript interfaces

### Components Updated
- **Landing Page**: Full translation support with language selector
- **Authentication**: Login and registration forms
- **Tasks**: Complete task management interface
- **Navigation**: Sidebar and header navigation
- **Dashboard**: Dashboard titles and descriptions
- **Forms**: All form labels, buttons, and validation messages

### RTL Support
- Automatic detection for Arabic language
- Document direction changes to RTL
- CSS layouts adapt automatically using Tailwind CSS

## Translation Coverage

### Core Sections
- ✅ Landing Page
- ✅ Authentication (Login/Register)
- ✅ Navigation Menu
- ✅ Tasks Management
- ✅ Dashboard
- ✅ Common UI Elements
- ✅ Form Validation Messages

### Role-Based Features
- ✅ Member task status updates
- ✅ Admin/Manager full task management
- ✅ Role-specific navigation items
- ✅ Permission-based UI text

## Browser Support
- Modern browsers with localStorage support
- Automatic fallback to English if translation missing
- Graceful handling of missing translation keys

## Future Enhancements
- Additional languages can be easily added
- Server-side language detection
- Translation management interface
- Pluralization support
- Date/time localization
- Number formatting localization

## Testing
The implementation has been tested with:
- Language switching functionality
- RTL layout for Arabic
- Translation key fallbacks
- localStorage persistence
- Role-based content translation