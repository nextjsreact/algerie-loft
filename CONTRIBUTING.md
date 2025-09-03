# Guide de Contribution - LoftAlgerie

Merci de votre intérêt pour contribuer à LoftAlgerie ! 🏠

## 🚀 Comment Contribuer

### 1. Fork et Clone
```bash
# Fork le repository sur GitHub
# Puis clonez votre fork
git clone https://github.com/votre-username/loft-algerie.git
cd loft-algerie
```

### 2. Configuration de l'Environnement
```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local

# Configurer vos variables Supabase
# Lancer le serveur de développement
npm run dev
```

### 3. Créer une Branche
```bash
git checkout -b feature/nom-de-votre-feature
# ou
git checkout -b fix/nom-du-bug
```

## 📋 Types de Contributions

### 🐛 Corrections de Bugs
- Décrivez le problème clairement
- Incluez les étapes pour reproduire
- Proposez une solution testée

### ✨ Nouvelles Fonctionnalités
- Discutez d'abord dans les Issues
- Suivez les conventions de code existantes
- Ajoutez des tests si nécessaire

### 📚 Documentation
- Améliorez le README
- Ajoutez des commentaires dans le code
- Créez des guides d'utilisation

### 🌐 Traductions
- Ajoutez de nouvelles langues
- Corrigez les traductions existantes
- Fichiers dans `public/locales/`

## 🎯 Standards de Code

### TypeScript
- Utilisez TypeScript pour tous les nouveaux fichiers
- Définissez des types appropriés
- Évitez `any` autant que possible

### React/Next.js
- Utilisez les composants fonctionnels
- Préférez les hooks aux classes
- Suivez les conventions Next.js 15

### Styling
- Utilisez Tailwind CSS
- Suivez les composants shadcn/ui
- Maintenez la cohérence visuelle

### Base de Données
- Utilisez Supabase pour toutes les opérations
- Gérez les erreurs appropriément
- Optimisez les requêtes

## 🧪 Tests

### Tests Unitaires
```bash
npm test
npm run test:watch
```

### Tests E2E
```bash
npm run test:e2e
npm run test:e2e:ui
```

### Tests Manuels
- Testez sur différents navigateurs
- Vérifiez la responsivité mobile
- Testez les fonctionnalités multilingues

## 📝 Convention de Commits

Utilisez des messages de commit clairs :

```bash
# Types de commits
feat: nouvelle fonctionnalité
fix: correction de bug
docs: documentation
style: formatage, pas de changement de code
refactor: refactoring du code
test: ajout de tests
chore: tâches de maintenance

# Exemples
feat: add loft filtering by price range
fix: resolve availability calendar display issue
docs: update API documentation
style: format availability components
```

## 🔍 Processus de Review

### Avant de Soumettre
- [ ] Le code compile sans erreurs
- [ ] Les tests passent
- [ ] La documentation est à jour
- [ ] Le code suit les conventions

### Pull Request
1. Créez une PR descriptive
2. Liez les Issues concernées
3. Ajoutez des captures d'écran si UI
4. Attendez la review

### Checklist PR
- [ ] Titre clair et descriptif
- [ ] Description détaillée des changements
- [ ] Tests ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] Pas de conflits de merge

## 🏗️ Architecture du Projet

```
loft-algerie/
├── app/                    # Pages Next.js 15 (App Router)
│   ├── api/               # API Routes
│   ├── [lang]/            # Pages multilingues
│   └── globals.css        # Styles globaux
├── components/            # Composants React
│   ├── ui/               # Composants shadcn/ui
│   └── [feature]/        # Composants par fonctionnalité
├── lib/                  # Utilitaires et configurations
├── hooks/                # Hooks React personnalisés
├── public/               # Assets statiques
│   └── locales/          # Fichiers de traduction
└── utils/                # Fonctions utilitaires
```

## 🌍 Internationalisation

### Ajouter une Nouvelle Langue
1. Créez les fichiers dans `public/locales/[lang]/`
2. Ajoutez la langue dans `lib/i18n/settings.ts`
3. Testez toutes les pages

### Conventions de Traduction
- Utilisez des clés descriptives
- Groupez par fonctionnalité
- Maintenez la cohérence

## 🚨 Signaler des Problèmes

### Issues GitHub
- Utilisez les templates fournis
- Soyez précis et détaillé
- Ajoutez des labels appropriés

### Sécurité
Pour les problèmes de sécurité, contactez directement :
- Email : security@loftalgerie.com

## 🎉 Reconnaissance

Tous les contributeurs seront ajoutés au fichier CONTRIBUTORS.md

## 📞 Aide

- **Discord** : [Lien vers le serveur Discord]
- **Email** : dev@loftalgerie.com
- **Issues** : GitHub Issues

---

Merci de contribuer à LoftAlgerie ! 🚀