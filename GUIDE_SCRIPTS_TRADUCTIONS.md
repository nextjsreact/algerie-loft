# 🌐 Guide des Scripts de Traductions

## 📋 Scripts disponibles

### 🔍 `npm run translations:analyze`
**Rôle** : Analyse complète et détection avancée des traductions manquantes
**Utilise** : `scripts/analyze-translations-advanced.js`
**Quand l'utiliser** :
- ✅ Après avoir ajouté de nouvelles fonctionnalités
- ✅ Pour détecter les namespaces complexes (useTranslations('admin.users'))
- ✅ Analyse complète du projet

**Ce qu'il fait** :
- Détecte les namespaces dans les composants
- Trouve les traductions manquantes avec contexte
- Génère des traductions automatiques intelligentes
- Crée un rapport détaillé

### 👀 `npm run translations:watch`
**Rôle** : Surveillance en temps réel pendant le développement
**Utilise** : `scripts/watch-translations.js`
**Quand l'utiliser** :
- ✅ Pendant le développement actif
- ✅ Pour détecter immédiatement les nouvelles traductions manquantes
- ✅ Surveillance continue (toutes les 10 secondes)

**Ce qu'il fait** :
- Surveille les changements dans le code
- Alerte sur les nouvelles traductions manquantes
- Rapport en temps réel

### 🔧 `npm run translations:fix`
**Rôle** : Correction ciblée des problèmes d'interface
**Utilise** : `scripts/fix-interface-translations.js` + `scripts/fix-loft-page-translations.js`
**Quand l'utiliser** :
- ✅ Pour corriger le mélange de langues dans l'interface
- ✅ Après avoir identifié des textes en dur
- ✅ Correction rapide des traductions d'interface critiques

**Ce qu'il fait** :
- Ajoute les traductions d'interface manquantes
- Corrige les fonctions de traduction en dur
- Résout les problèmes de mélange de langues

### 📊 `npm run translations:report`
**Rôle** : Génération de rapport simple
**Utilise** : `scripts/analyze-translations.js`
**Quand l'utiliser** :
- ✅ Pour un aperçu rapide de l'état des traductions
- ✅ Rapport basique sans corrections automatiques

## 🎯 Workflow recommandé

### 🚀 **Développement quotidien**
```bash
# Démarrer la surveillance pendant le développement
npm run translations:watch
```

### 🔍 **Après ajout de nouvelles fonctionnalités**
```bash
# Analyse complète avec détection avancée
npm run translations:analyze
```

### 🔧 **En cas de mélange de langues dans l'interface**
```bash
# Correction ciblée des problèmes d'interface
npm run translations:fix
```

### 📊 **Vérification périodique**
```bash
# Rapport rapide de l'état
npm run translations:report
```

## 🆕 Nouveaux outils complémentaires

### 🔍 **Détection des textes en dur**
```bash
node scripts/detect-hardcoded-text.js
```
- Génère `hardcoded-text-report.json`
- Identifie précisément les textes en dur dans le code

### 📋 **Utilisation du rapport**
```bash
node scripts/simple-report-usage.js
```
- Analyse le rapport de textes en dur
- Génère un guide de correction
- Priorise les corrections

### ✅ **Validation finale**
```bash
node scripts/final-validation.js
```
- Vérifie que toutes les corrections sont appliquées
- Valide l'état final des traductions

## 🔄 Workflow complet pour résoudre les problèmes de traductions

### **Étape 1 : Diagnostic**
```bash
npm run translations:analyze
node scripts/detect-hardcoded-text.js
```

### **Étape 2 : Correction automatique**
```bash
npm run translations:fix
```

### **Étape 3 : Analyse des textes en dur restants**
```bash
node scripts/simple-report-usage.js
```

### **Étape 4 : Correction manuelle ciblée**
- Utiliser le guide généré : `GUIDE_CORRECTION_TEXTES_EN_DUR.md`
- Corriger les fichiers prioritaires

### **Étape 5 : Validation**
```bash
node scripts/final-validation.js
```

### **Étape 6 : Test**
- Redémarrer l'application
- Tester l'interface dans toutes les langues

## 📈 Évolution des scripts

### **Ancienne approche** (toujours valide)
- Scripts basiques pour traductions courantes
- Détection simple des clés manquantes

### **Nouvelle approche** (recommandée)
- Détection avancée des namespaces
- Correction ciblée des problèmes d'interface
- Analyse des textes en dur dans le code
- Workflow complet de diagnostic et correction

## 🎯 Quand utiliser quoi ?

| Situation | Script recommandé |
|-----------|-------------------|
| 🆕 Nouvelle fonctionnalité ajoutée | `npm run translations:analyze` |
| 🔄 Développement en cours | `npm run translations:watch` |
| 🚨 Mélange de langues dans l'interface | `npm run translations:fix` |
| 📊 Vérification rapide | `npm run translations:report` |
| 🔍 Textes en dur détectés | `node scripts/detect-hardcoded-text.js` |
| 📋 Correction manuelle guidée | `node scripts/simple-report-usage.js` |
| ✅ Validation finale | `node scripts/final-validation.js` |

## 💡 Conseils d'utilisation

### **Pour le développement quotidien :**
1. Lancez `npm run translations:watch` en arrière-plan
2. Développez normalement
3. Le script vous alertera des nouvelles traductions manquantes

### **Pour résoudre des problèmes existants :**
1. `npm run translations:analyze` - Diagnostic complet
2. `npm run translations:fix` - Correction automatique
3. `node scripts/detect-hardcoded-text.js` - Détecter les textes en dur
4. Correction manuelle des cas restants
5. `node scripts/final-validation.js` - Validation

### **Pour maintenir la qualité :**
- Exécutez `npm run translations:analyze` avant chaque commit
- Utilisez `npm run translations:watch` pendant le développement
- Validez avec `node scripts/final-validation.js` avant les releases

## ✨ Résumé

Vos scripts `npm run translations:*` sont **complémentaires** et **toujours utiles** :
- Ils forment maintenant un **écosystème complet** de gestion des traductions
- Chaque script a son **rôle spécifique** dans le workflow
- L'approche est maintenant **plus sophistiquée** et **plus efficace**
- Vous avez des outils pour **chaque étape** du processus de traduction