# Design Document

## Overview

Ce document décrit l'architecture technique pour migrer progressivement de i18next/react-i18next vers next-intl, composant par composant. L'approche garantit une migration sûre, testable et réversible à chaque étape.

## Architecture

### Configuration Hybride Temporaire

Pendant la migration, nous aurons deux systèmes d'internationalisation qui coexistent :

1. **Système existant (i18next)** - Continuera à fonctionner pour les composants non migrés
2. **Nouveau système (next-intl)** - Sera utilisé pour les nouveaux composants migrés

### Structure des Fichiers

```
├── i18n.ts                          # Configuration next-intl (existante)
├── lib/i18n/
│   ├── context.tsx                  # Contexte i18next existant (à conserver temporairement)
│   └── index.ts                     # Configuration i18next existante
├── messages/                        # Fichiers de traduction next-intl (existants)
│   ├── fr.json
│   ├── en.json
│   └── ar.json
├── middleware.ts                    # Middleware next-intl (à améliorer)
├── next.config.mjs                  # Configuration Next.js (à mettre à jour)
└── components/
    ├── providers/
    │   └── next-intl-provider.tsx   # Nouveau provider next-intl
    └── [composants migrés]/
```

## Components and Interfaces

### 1. Configuration next-intl

#### Mise à jour de `next.config.mjs`
```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // Configuration existante...
};

export default withNextIntl(nextConfig);
```

#### Amélioration de `middleware.ts`
```typescript
import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['fr', 'ar', 'en'],
  defaultLocale: 'fr'
});

export default function middleware(request: NextRequest) {
  // Logique Supabase existante...
  
  // Puis logique next-intl
  return intlMiddleware(request);
}
```

### 2. Provider Hybride

#### Nouveau Provider next-intl
```typescript
// components/providers/next-intl-provider.tsx
import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  locale: string;
  messages: any;
}

export function NextIntlProvider({ children, locale, messages }: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

### 3. Hooks de Migration

#### Hook de Transition
```typescript
// lib/hooks/use-migration-translation.ts
import { useTranslations } from 'next-intl';
import { useTranslation as useI18nextTranslation } from '@/lib/i18n/context';

export function useMigrationTranslation(namespace?: string) {
  // Utilise next-intl par défaut, fallback vers i18next si nécessaire
  const t = useTranslations(namespace);
  const { t: tFallback } = useI18nextTranslation(namespace ? [namespace] : undefined);
  
  return {
    t: (key: string, params?: any) => {
      try {
        return t(key, params);
      } catch {
        return tFallback(key, params);
      }
    }
  };
}
```

## Data Models

### Structure des Messages

Les fichiers de traduction restent identiques, mais nous optimisons leur structure :

```json
{
  "auth": {
    "signIn": "Se connecter",
    "signUp": "S'inscrire",
    "welcomeBack": "Bon retour"
  },
  "dashboard": {
    "title": "Tableau de Bord",
    "subtitle": "Bienvenue sur votre tableau de bord",
    "stats": {
      "totalLofts": "Total des Lofts",
      "occupiedLofts": "Lofts Occupés"
    }
  }
}
```

### Mapping des Clés

Pour faciliter la migration, nous créons un mapping des clés existantes :

```typescript
// lib/migration/key-mapping.ts
export const keyMapping = {
  // Anciennes clés i18next -> Nouvelles clés next-intl
  'dashboard:title': 'dashboard.title',
  'dashboard:subtitle': 'dashboard.subtitle',
  'auth:signIn': 'auth.signIn'
};
```

## Error Handling

### Stratégie de Fallback

1. **Traduction manquante** : Afficher la clé en développement, fallback vers i18next en production
2. **Erreur de configuration** : Continuer avec i18next
3. **Erreur de chargement** : Afficher un message d'erreur utilisateur-friendly

```typescript
// lib/utils/translation-fallback.ts
export function safeTranslate(key: string, params?: any) {
  try {
    // Essayer next-intl d'abord
    return t(key, params);
  } catch (error) {
    console.warn(`Translation failed for key: ${key}`, error);
    // Fallback vers i18next
    return tFallback(key, params) || key;
  }
}
```

## Testing Strategy

### Tests de Migration par Composant

Pour chaque composant migré, nous testons :

1. **Rendu correct** dans les 3 langues (fr, ar, en)
2. **Changement de langue** en temps réel
3. **Persistance** de la langue sélectionnée
4. **Fallback** en cas d'erreur

```typescript
// __tests__/migration/login-component.test.tsx
describe('Login Component Migration', () => {
  test('renders correctly in French', () => {
    render(<LoginComponent />, { locale: 'fr' });
    expect(screen.getByText('Se connecter')).toBeInTheDocument();
  });

  test('renders correctly in Arabic', () => {
    render(<LoginComponent />, { locale: 'ar' });
    expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument();
  });

  test('renders correctly in English', () => {
    render(<LoginComponent />, { locale: 'en' });
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });
});
```

### Validation des Traductions

```typescript
// scripts/validate-translations.ts
export function validateTranslations() {
  const locales = ['fr', 'ar', 'en'];
  const errors: string[] = [];
  
  locales.forEach(locale => {
    const messages = require(`../messages/${locale}.json`);
    // Vérifier que toutes les clés requises existent
    validateKeys(messages, requiredKeys, errors);
  });
  
  return errors;
}
```

## Migration Plan par Composant

### Phase 1: Configuration de Base
1. Installer next-intl si pas déjà fait
2. Configurer le middleware hybride
3. Créer le provider next-intl
4. Créer les hooks de transition

### Phase 2: Migration du Composant Login
1. Créer `components/auth/login-page-client-nextintl.tsx`
2. Migrer les traductions vers next-intl
3. Tester dans les 3 langues
4. Valider le changement de langue
5. Remplacer l'ancien composant

### Phase 3: Migration du Composant Dashboard
1. Créer `components/dashboard/modern-dashboard-nextintl.tsx`
2. Migrer toutes les traductions complexes
3. Tester les interpolations et pluriels
4. Valider les performances
5. Remplacer l'ancien composant

### Phase 4: Migration Progressive des Autres Composants
- Suivre le même processus pour chaque composant
- Prioriser par ordre de complexité croissante
- Maintenir la compatibilité à chaque étape

### Phase 5: Nettoyage Final
1. Supprimer i18next et react-i18next
2. Nettoyer les fichiers de configuration
3. Supprimer les hooks de transition
4. Optimiser la configuration next-intl

## Performance Considerations

### Optimisations

1. **Lazy Loading** : Charger seulement les traductions nécessaires
2. **Tree Shaking** : Éliminer le code i18next non utilisé progressivement
3. **Bundle Splitting** : Séparer les traductions par route
4. **Caching** : Mettre en cache les traductions côté client

### Métriques à Surveiller

- Taille du bundle JavaScript
- Temps de chargement initial
- Temps de changement de langue
- Utilisation mémoire

## Rollback Strategy

À chaque étape, nous pouvons revenir en arrière :

1. **Composant individuel** : Restaurer l'ancien fichier
2. **Configuration** : Revenir au commit précédent
3. **Urgence** : Feature flag pour désactiver next-intl

```typescript
// lib/feature-flags.ts
export const useNextIntl = process.env.NEXT_PUBLIC_USE_NEXT_INTL === 'true';
```

Cette approche garantit une migration sûre, progressive et réversible à tout moment.