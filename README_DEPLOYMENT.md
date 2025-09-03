# 🚀 Guide de Déploiement - Loft Algérie

Ce guide vous explique comment configurer et déployer l'application Loft Algérie avec GitHub Actions, tests automatisés et déploiement continu.

## 📋 Table des Matières

- [🏗️ Architecture CI/CD](#architecture-cicd)
- [⚙️ Configuration Initiale](#configuration-initiale)
- [🧪 Tests](#tests)
- [🚀 Déploiement](#déploiement)
- [🔧 Maintenance](#maintenance)

## 🏗️ Architecture CI/CD

### Workflows GitHub Actions

1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
   - Tests unitaires et linting
   - Build de l'application
   - Scan de sécurité
   - Déploiement automatique

2. **Tests E2E** (`.github/workflows/test-e2e.yml`)
   - Tests Playwright
   - Tests mobile
   - Tests de régression

3. **Review IA** (`.github/workflows/gemini-pr-review.yml`)
   - Review automatique des PR
   - Suggestions d'amélioration

### Environnements

- **Development** : Déploiement automatique depuis `develop`
- **Production** : Déploiement automatique depuis `main`

## ⚙️ Configuration Initiale

### 1. Configuration GitHub

Exécutez le script de configuration automatique :

```bash
npm run setup:github
```

Ou manuellement :

```bash
chmod +x scripts/setup-github.sh
./scripts/setup-github.sh
```

### 2. Secrets GitHub Requis

#### Vercel (Obligatoire)
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

#### Supabase (Obligatoire)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Optionnels
```
CODECOV_TOKEN=your_codecov_token
SNYK_TOKEN=your_snyk_token
GEMINI_API_KEY=your_gemini_key
```

### 3. Configuration Vercel

1. Connectez votre repository à Vercel
2. Configurez les variables d'environnement dans Vercel Dashboard
3. Activez les déploiements automatiques

### 4. Configuration des Environnements

Créez les environnements dans GitHub :
- `Settings` → `Environments` → `New environment`
- Créez : `development` et `production`
- Configurez les règles de protection pour `production`

## 🧪 Tests

### Tests Unitaires

```bash
# Exécuter tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage
```

### Tests E2E avec Playwright

```bash
# Installation des navigateurs
npx playwright install

# Exécuter les tests E2E
npm run test:e2e

# Tests E2E avec interface
npm run test:e2e:ui

# Tests E2E en mode visible
npm run test:e2e:headed
```

### Structure des Tests

```
tests/
├── e2e/                    # Tests end-to-end
│   ├── auth.spec.ts       # Tests d'authentification
│   ├── navigation.spec.ts # Tests de navigation
│   └── dashboard.spec.ts  # Tests du dashboard
└── unit/                  # Tests unitaires
    ├── components/        # Tests des composants
    └── lib/              # Tests des utilitaires
```

## 🚀 Déploiement

### Déploiement Automatique

Le déploiement se fait automatiquement via GitHub Actions :

- **Push sur `develop`** → Déploiement sur l'environnement de développement
- **Push sur `main`** → Déploiement sur la production

### Déploiement Manuel

```bash
# Développement
npm run deploy:dev

# Staging
npm run deploy:staging

# Production
npm run deploy:prod
```

### Script de Déploiement

Le script `scripts/deploy.sh` effectue :

1. ✅ Vérification des prérequis
2. 🔍 Vérification de l'état Git
3. 📦 Installation des dépendances
4. 🧪 Exécution des tests
5. 🏗️ Build de l'application
6. 🚀 Déploiement sur Vercel
7. 🏥 Vérification post-déploiement
8. 📧 Notifications

### Rollback

En cas de problème :

```bash
# Via Vercel CLI
vercel rollback

# Ou redéployer une version précédente
git checkout <commit-hash>
npm run deploy:prod
```

## 🔧 Maintenance

### Monitoring

1. **Health Check** : `/api/health`
2. **Logs Vercel** : Dashboard Vercel
3. **GitHub Actions** : Onglet Actions

### Mise à Jour des Dépendances

```bash
# Vérifier les mises à jour
npm outdated

# Mettre à jour
npm update

# Audit de sécurité
npm audit
npm audit fix
```

### Gestion des Branches

```bash
# Créer une branche de fonctionnalité
git checkout -b feature/nouvelle-fonctionnalite

# Merger vers develop
git checkout develop
git merge feature/nouvelle-fonctionnalite

# Release vers main
git checkout main
git merge develop
```

### Debugging

#### Logs de Déploiement

```bash
# Logs GitHub Actions
# Aller dans l'onglet Actions du repository

# Logs Vercel
vercel logs <deployment-url>
```

#### Tests Locaux

```bash
# Simuler l'environnement de production
npm run build
npm start

# Tests de santé
curl http://localhost:3000/api/health
```

## 📊 Métriques et Qualité

### Couverture de Code

- Objectif : > 80%
- Rapports : Codecov
- Configuration : `jest.config.js`

### Performance

- Lighthouse CI intégré
- Core Web Vitals monitoring
- Bundle analyzer

### Sécurité

- Snyk pour les vulnérabilités
- Audit npm automatique
- Headers de sécurité configurés

## 🆘 Dépannage

### Problèmes Courants

#### Échec de Build

```bash
# Nettoyer le cache
rm -rf .next node_modules
npm install
npm run build
```

#### Tests E2E qui Échouent

```bash
# Mettre à jour les navigateurs
npx playwright install

# Exécuter en mode debug
npm run test:e2e:headed
```

#### Problèmes de Déploiement

```bash
# Vérifier les secrets GitHub
gh secret list

# Vérifier la configuration Vercel
vercel env ls
```

### Support

- 📧 Issues GitHub : [Repository Issues](https://github.com/your-repo/issues)
- 📚 Documentation : Ce README
- 🔧 Scripts d'aide : `scripts/` directory

## 🎯 Bonnes Pratiques

1. **Toujours tester localement** avant de pousser
2. **Utiliser des branches de fonctionnalité** pour le développement
3. **Écrire des tests** pour les nouvelles fonctionnalités
4. **Surveiller les métriques** après déploiement
5. **Documenter les changements** dans les PR

---

## 🚀 Commandes Rapides

```bash
# Configuration initiale
npm run setup:github

# Développement
npm run dev
npm run test:watch

# Tests complets
npm run test:coverage
npm run test:e2e

# Déploiement
npm run deploy:dev
npm run deploy:prod

# Maintenance
npm run health:check
npm audit
```

Votre application Loft Algérie est maintenant prête pour un déploiement professionnel ! 🎉