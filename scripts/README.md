# Scripts de Migration i18next vers next-intl

Ce dossier contient tous les scripts nécessaires pour valider, tester et finaliser la migration de i18next vers next-intl.

## Scripts Disponibles

### 1. `validate-migration.js`
**Objectif**: Validation générale de l'état de la migration

**Utilisation**:
```bash
node scripts/validate-migration.js
```

**Fonctionnalités**:
- Vérifie l'absence de références à react-i18next
- Compte les utilisations de useTranslations
- Valide la présence des fichiers de messages
- Vérifie la configuration next-intl
- Contrôle la suppression des anciennes dépendances
- Valide la structure des routes localisées

### 2. `test-migration.js`
**Objectif**: Tests de cohérence des traductions

**Utilisation**:
```bash
node scripts/test-migration.js
```

**Fonctionnalités**:
- Test de cohérence des clés de traduction entre langues
- Vérification de la structure des traductions
- Analyse des interpolations
- Détection des incohérences

### 3. `performance-test.js`
**Objectif**: Tests de performance de la migration

**Utilisation**:
```bash
node scripts/performance-test.js
```

**Fonctionnalités**:
- Analyse de la taille des bundles
- Test de chargement des traductions
- Recommandations d'optimisation
- Mesure des performances

### 4. `generate-migration-report.js`
**Objectif**: Génération d'un rapport complet de migration

**Utilisation**:
```bash
node scripts/generate-migration-report.js
```

**Fonctionnalités**:
- Analyse complète de l'état de la migration
- Calcul du pourcentage de progression
- Génération de recommandations
- Sauvegarde du rapport en JSON

### 5. `auto-migrate-remaining.js`
**Objectif**: Migration automatique des composants restants

**Utilisation**:
```bash
node scripts/auto-migrate-remaining.js
```

**Fonctionnalités**:
- Identification automatique des composants à migrer
- Migration automatique des patterns courants
- Remplacement des imports et hooks
- Correction des appels de traduction

### 6. `final-validation.js`
**Objectif**: Validation finale complète de la migration

**Utilisation**:
```bash
node scripts/final-validation.js
```

**Fonctionnalités**:
- Tests complets de validation
- Vérification de la construction
- Génération d'un rapport de validation
- Statut global de la migration

## Workflow Recommandé

1. **Validation initiale**:
   ```bash
   node scripts/validate-migration.js
   ```

2. **Tests de cohérence**:
   ```bash
   node scripts/test-migration.js
   ```

3. **Migration automatique** (si nécessaire):
   ```bash
   node scripts/auto-migrate-remaining.js
   ```

4. **Génération du rapport**:
   ```bash
   node scripts/generate-migration-report.js
   ```

5. **Tests de performance**:
   ```bash
   node scripts/performance-test.js
   ```

6. **Validation finale**:
   ```bash
   node scripts/final-validation.js
   ```

## Fichiers Générés

- `migration-report.json`: Rapport détaillé de la migration
- `validation-report.json`: Rapport de validation finale

## Prérequis

- Node.js 18+
- PowerShell (pour les commandes Windows)
- Projet Next.js avec next-intl configuré

## Notes Importantes

- Les scripts sont optimisés pour Windows avec PowerShell
- Ils utilisent des modules ES (import/export)
- Certains scripts nécessitent que le projet soit buildable
- Les rapports sont sauvegardés au format JSON pour faciliter l'intégration

## Dépannage

### Erreur "require is not defined"
Le projet utilise des modules ES. Assurez-vous que les scripts utilisent `import` au lieu de `require`.

### Erreur PowerShell
Vérifiez que PowerShell est disponible et que les permissions d'exécution sont correctes.

### Erreur de construction
Assurez-vous que toutes les dépendances sont installées et que la configuration next-intl est correcte.