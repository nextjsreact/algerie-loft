# Loft Algérie - Site Web Public

Site web vitrine pour présenter les services de gestion de lofts et hébergements de Loft Algérie.

## Technologies

- **Framework**: Next.js 15 avec App Router
- **Styling**: Tailwind CSS
- **TypeScript**: Configuration stricte
- **Internationalisation**: next-intl (FR, EN, AR)
- **Qualité de code**: ESLint, Prettier, Husky

## Structure du projet

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── globals.css        # Styles globaux
│   ├── layout.tsx         # Layout racine
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React
│   ├── ui/               # Composants UI réutilisables
│   ├── layout/           # Composants de mise en page
│   └── forms/            # Composants de formulaires
├── lib/                  # Utilitaires et configuration
│   ├── utils.ts          # Fonctions utilitaires
│   └── constants.ts      # Constantes de l'application
├── types/                # Définitions TypeScript
│   └── index.ts          # Types globaux
└── styles/               # Styles additionnels
    └── globals.css       # Styles globaux supplémentaires
```

## Scripts disponibles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Démarrage en production
npm run start

# Linting et formatage
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Vérification des types
npm run type-check
```

## Configuration

### Tailwind CSS
- Design system personnalisé avec couleurs de marque
- Composants utilitaires prédéfinis
- Animations et transitions

### ESLint & Prettier
- Configuration stricte pour la qualité du code
- Formatage automatique avec Prettier
- Hooks Git avec Husky et lint-staged

### TypeScript
- Configuration stricte
- Alias de chemins configurés (@/*)
- Types globaux définis

## Développement

1. Installer les dépendances:
```bash
npm install
```

2. Démarrer le serveur de développement:
```bash
npm run dev
```

3. Ouvrir [http://localhost:3001](http://localhost:3001)

## Déploiement

Le projet est configuré pour être déployé sur Vercel avec optimisations automatiques.

## Prochaines étapes

Voir le fichier `tasks.md` dans `.kiro/specs/public-website/` pour la liste complète des tâches d'implémentation.