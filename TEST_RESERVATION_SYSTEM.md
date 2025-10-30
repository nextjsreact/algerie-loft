# Reservation Data Consistency - Test Suite

Ce document décrit comment exécuter et valider les tests pour l'implémentation du système de cohérence des données de réservation.

## 🎯 Objectif

Valider que toutes les fonctionnalités implémentées dans les tâches 1-6 fonctionnent correctement :

1. **Optimisation de la base de données** - Index de performance
2. **Service de cache** - Cache intelligent pour les données de loft
3. **Monitoring de santé** - Surveillance système en temps réel
4. **Monitoring de performance** - Suivi des performances des opérations
5. **API de monitoring** - Points d'accès REST pour les métriques
6. **Tests d'intégration** - Validation du système complet

## 🚀 Exécution Rapide

### Windows (Batch)
```bash
test-reservation-system.bat
```

### Windows (PowerShell)
```powershell
.\test-reservation-system.ps1
```

### Manuel (Node.js/npm)
```bash
npx tsx scripts/run-reservation-tests.ts
```

## 📋 Tests Inclus

### 1. Tests des Services de Cache
**Fichier:** `__tests__/services/loft-cache-service.test.ts`

**Valide:**
- ✅ Cache des recherches de loft
- ✅ Cache des détails de loft
- ✅ Cache de disponibilité
- ✅ Cache des calculs de prix
- ✅ Métriques de performance du cache
- ✅ Invalidation du cache
- ✅ Réchauffement du cache

### 2. Tests du Monitoring de Santé
**Fichier:** `__tests__/services/system-health-monitor.test.ts`

**Valide:**
- ✅ Vérifications de santé des composants
- ✅ Surveillance de la base de données
- ✅ Surveillance du cache
- ✅ Surveillance du système de réservation
- ✅ Vérification de cohérence des données
- ✅ Génération d'alertes
- ✅ Recommandations automatiques

### 3. Tests du Monitoring de Performance
**Fichier:** `__tests__/services/reservation-performance-monitor.test.ts`

**Valide:**
- ✅ Chronométrage des opérations
- ✅ Mesure des recherches de loft
- ✅ Mesure des vérifications de disponibilité
- ✅ Mesure des calculs de prix
- ✅ Mesure de création de réservation
- ✅ Rapports de performance
- ✅ Statistiques en temps réel

### 4. Tests des API de Monitoring
**Fichier:** `__tests__/api/monitoring/performance.test.ts`

**Valide:**
- ✅ Endpoint GET /api/monitoring/performance
- ✅ Paramètres de type (overview, health, cache, etc.)
- ✅ Endpoint POST pour actions (clearCache, warmUpCache, etc.)
- ✅ Gestion des erreurs
- ✅ Format des réponses JSON
- ✅ Validation des paramètres

### 5. Tests d'Intégration
**Fichier:** `__tests__/integration/reservation-data-consistency.test.ts`

**Valide:**
- ✅ Cohérence cache-base de données
- ✅ Flux complet de réservation
- ✅ Gestion des conflits de réservation
- ✅ Surveillance système intégrée
- ✅ Optimisation des requêtes
- ✅ Récupération d'erreurs

### 6. Tests de Validation Système
**Fichier:** `__tests__/reservation-system-validation.test.ts`

**Valide:**
- ✅ Structure des fichiers
- ✅ Chargement des services
- ✅ Configuration des composants
- ✅ Gestion des erreurs
- ✅ Gestion de la mémoire
- ✅ Cycle de vie des services

## 📊 Rapport de Tests

Après exécution, les rapports sont générés dans le dossier `test-reports/` :

### Rapport Markdown
**Fichier:** `test-reports/reservation-system-test-report.md`

Contient :
- 📈 Résumé des résultats
- 📋 Statut par composant
- 🔍 Résultats détaillés
- 💡 Recommandations
- 📝 Étapes suivantes

### Rapport JSON
**Fichier:** `test-reports/reservation-system-test-report.json`

Contient :
- 📊 Données structurées
- ⏱️ Métriques de performance
- 📈 Statistiques détaillées
- 🔧 Données pour intégration CI/CD

## 🛠️ Prérequis

### Logiciels Requis
- **Node.js** (v16 ou supérieur)
- **npm** ou **yarn**
- **TypeScript** (installé via npm)

### Dépendances de Test
```json
{
  "vitest": "^1.0.0",
  "tsx": "^4.0.0",
  "@types/node": "^20.0.0"
}
```

### Installation
```bash
npm install --save-dev vitest tsx @types/node
```

## 🔧 Configuration

### Variables d'Environnement
```bash
# Optionnel - pour tests avec vraie base de données
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Mode de test
NODE_ENV=test
```

### Configuration Vitest
Le projet utilise la configuration Vitest existante dans `vitest.config.ts`.

## 📈 Métriques de Succès

### Critères de Validation
- ✅ **100% des tests passent** - Tous les composants fonctionnent
- ✅ **Temps d'exécution < 30s** - Performance acceptable
- ✅ **Couverture > 80%** - Code bien testé
- ✅ **0 erreurs critiques** - Système stable

### Seuils de Performance
- **Cache Hit Rate:** > 80%
- **Temps de réponse API:** < 500ms
- **Temps de vérification santé:** < 2s
- **Temps de réchauffement cache:** < 5s

## 🚨 Dépannage

### Problèmes Courants

#### 1. Erreur "vitest not found"
```bash
npm install --save-dev vitest
```

#### 2. Erreur "tsx not found"
```bash
npm install --save-dev tsx
```

#### 3. Erreurs de TypeScript
```bash
npm install --save-dev @types/node typescript
```

#### 4. Erreurs de mémoire
```bash
# Augmenter la limite de mémoire Node.js
node --max-old-space-size=4096 scripts/run-reservation-tests.ts
```

#### 5. Tests lents
- Vérifier les mocks sont bien configurés
- Éviter les vraies connexions base de données
- Utiliser des timeouts appropriés

### Logs de Debug

Pour plus de détails sur l'exécution :

```bash
# Mode verbose
.\test-reservation-system.ps1 -Verbose

# Avec rapport détaillé
.\test-reservation-system.ps1 -GenerateReport
```

## 📝 Interprétation des Résultats

### ✅ Tous les Tests Passent
**Signification :** Le système est prêt pour le déploiement

**Actions suivantes :**
1. Déployer les index de base de données
2. Initialiser les services de monitoring
3. Configurer les alertes de santé
4. Mettre en place le réchauffement du cache

### ⚠️ Quelques Tests Échouent
**Signification :** Des composants ont des problèmes

**Actions suivantes :**
1. Examiner le rapport détaillé
2. Corriger les problèmes identifiés
3. Re-exécuter les tests
4. Vérifier les logs d'erreur

### ❌ Beaucoup de Tests Échouent
**Signification :** Problèmes systémiques

**Actions suivantes :**
1. Vérifier l'environnement de test
2. Valider les dépendances
3. Examiner la configuration
4. Réviser l'implémentation

## 🔄 Intégration CI/CD

### GitHub Actions
```yaml
name: Reservation System Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx tsx scripts/run-reservation-tests.ts
      - uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: test-reports/
```

### Scripts Package.json
```json
{
  "scripts": {
    "test:reservation": "tsx scripts/run-reservation-tests.ts",
    "test:reservation:verbose": "vitest run __tests__/reservation-system-validation.test.ts",
    "test:cache": "vitest run __tests__/services/loft-cache-service.test.ts",
    "test:health": "vitest run __tests__/services/system-health-monitor.test.ts",
    "test:performance": "vitest run __tests__/services/reservation-performance-monitor.test.ts",
    "test:api": "vitest run __tests__/api/monitoring/performance.test.ts",
    "test:integration": "vitest run __tests__/integration/reservation-data-consistency.test.ts"
  }
}
```

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les prérequis** - Node.js, npm, dépendances
2. **Consultez les logs** - Messages d'erreur détaillés
3. **Examinez le rapport** - Recommandations spécifiques
4. **Testez individuellement** - Isoler les composants problématiques

## 🎉 Validation Finale

Une fois tous les tests passés :

1. ✅ **Base de données optimisée** - Index de performance déployés
2. ✅ **Cache fonctionnel** - Système de cache intelligent actif
3. ✅ **Monitoring actif** - Surveillance santé et performance
4. ✅ **API testées** - Points d'accès monitoring validés
5. ✅ **Intégration validée** - Système complet fonctionnel
6. ✅ **Prêt pour production** - Déploiement sécurisé possible

Le système de cohérence des données de réservation est maintenant **validé et prêt** ! 🚀