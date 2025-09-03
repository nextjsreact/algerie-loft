# 📊 GUIDE COMPLET DES RAPPORTS PDF
## Système de Génération de Rapports Financiers - Loft Algérie

Ce guide vous explique comment utiliser le système de génération de rapports PDF pour analyser vos mouvements financiers et générer des états détaillés.

## 🎯 Fonctionnalités Principales

### ✅ Types de Rapports Disponibles
- **Rapport par Loft** - Analyse détaillée d'un loft spécifique
- **Rapport par Propriétaire** - Vue d'ensemble de tous les lofts d'un propriétaire
- **Rapport Global** - Analyse complète de tous les lofts

### ✅ Contenu des Rapports
- **Résumé financier** avec revenus, dépenses et résultat net
- **Détails des transactions** avec filtrage et groupement
- **Synthèses par catégorie** et analyses temporelles
- **Graphiques et statistiques** visuelles
- **Informations contextuelles** (loft, propriétaire, période)

## 🚀 Démarrage Rapide

### 1. Installation des Dépendances
```bash
# Installer les dépendances PDF
npm run reports:install

# Ou manuellement
npm install jspdf jspdf-autotable html2canvas react-to-print @types/jspdf
```

### 2. Test du Système
```bash
# Tester la génération PDF avec des données d'exemple
npm run reports:test
```

### 3. Accès à l'Interface
- Naviguez vers `/reports` dans votre application
- Ou utilisez le menu de navigation principal

## 📋 Utilisation de l'Interface

### Étape 1: Configuration des Filtres

#### Période du Rapport
- **Périodes rapides** : Aujourd'hui, 7 jours, Ce mois, Trimestre, Année
- **Dates personnalisées** : Sélectionnez une période spécifique
- **Validation automatique** : Les dates invalides sont corrigées

#### Filtres Avancés
- **Type de transaction** : Toutes, Revenus uniquement, Dépenses uniquement
- **Catégorie** : Filtrer par catégorie spécifique (optionnel)
- **Loft/Propriétaire** : Selon le type de rapport choisi

#### Options du Rapport
- **Inclure les détails** : Affiche toutes les transactions individuelles
- **Inclure la synthèse** : Ajoute les analyses par catégorie et temporelles
- **Grouper par** : Catégorie, Loft, ou Mois

### Étape 2: Sélection du Type de Rapport

#### 📊 Rapport par Loft
```
Contenu:
• Informations détaillées du loft
• Toutes les transactions du loft
• Résumé financier spécifique
• Analyse par catégorie
• Performance sur la période
```

**Utilisation:**
1. Sélectionnez l'onglet "Par Loft"
2. Choisissez un loft dans la liste déroulante
3. Configurez les filtres et options
4. Cliquez sur "Générer le rapport du loft"

#### 👤 Rapport par Propriétaire
```
Contenu:
• Informations du propriétaire
• Liste de tous ses lofts
• Performance par loft
• Synthèse globale du portefeuille
• Comparaison entre lofts
```

**Utilisation:**
1. Sélectionnez l'onglet "Par Propriétaire"
2. Choisissez un propriétaire dans la liste
3. Configurez les options de rapport
4. Cliquez sur "Générer le rapport du propriétaire"

#### 🌍 Rapport Global
```
Contenu:
• Vue d'ensemble complète
• Performance de tous les lofts
• Statistiques générales
• Analyses comparatives
• Tendances temporelles
```

**Utilisation:**
1. Sélectionnez l'onglet "Rapport Global"
2. Configurez la période et les filtres
3. Choisissez les options d'analyse
4. Cliquez sur "Générer le rapport global"

### Étape 3: Aperçu et Génération

#### Aperçu en Temps Réel
- **Statistiques instantanées** : Revenus, dépenses, résultat net
- **Compteur de transactions** : Nombre d'opérations incluses
- **Validation des données** : Vérification avant génération

#### Génération PDF
- **Téléchargement automatique** : Le fichier se télécharge immédiatement
- **Nommage intelligent** : Fichiers nommés avec date et contexte
- **Format professionnel** : Mise en page optimisée pour l'impression

## 📊 Structure des Rapports PDF

### En-tête Standard
```
• Logo et nom de l'entreprise (Loft Algérie)
• Titre du rapport avec contexte
• Date de génération
• Période couverte par le rapport
```

### Section Informations
```
Rapport par Loft:
• Nom, adresse, propriétaire
• Loyer mensuel théorique
• Informations de contact

Rapport par Propriétaire:
• Nom, email, téléphone
• Nombre de lofts possédés
• Liste détaillée des propriétés

Rapport Global:
• Statistiques générales
• Nombre total de lofts
• Revenus théoriques totaux
```

### Résumé Financier
```
• Total des revenus (en vert)
• Total des dépenses (en rouge)
• Résultat net (vert si positif, rouge si négatif)
• Nombre de transactions
• Ratios et pourcentages
```

### Détails des Transactions
```
Tableau avec colonnes:
• Date de la transaction
• Description détaillée
• Catégorie (avec code couleur)
• Type (Revenus/Dépenses)
• Montant en DZD
```

### Synthèses et Analyses
```
• Synthèse par catégorie
• Évolution mensuelle
• Comparaison entre lofts (si applicable)
• Graphiques et tendances
• Recommandations automatiques
```

### Pied de Page
```
• Informations de l'entreprise
• Numéro de page
• Date et heure de génération
• Mentions légales
```

## 🎨 Personnalisation

### Modification des Couleurs
```typescript
// Dans lib/pdf-generator.ts
const colors = {
  primary: [41, 128, 185],    // Bleu principal
  success: [46, 204, 113],    // Vert (revenus)
  danger: [231, 76, 60],      // Rouge (dépenses)
  warning: [230, 126, 34],    // Orange (alertes)
  info: [52, 152, 219]        // Bleu info
}
```

### Ajout de Sections Personnalisées
```typescript
// Exemple d'ajout d'une nouvelle section
private addCustomSection(data: any): void {
  this.checkPageBreak(60)
  
  this.doc.setFontSize(14)
  this.doc.setFont('helvetica', 'bold')
  this.doc.text('Ma Section Personnalisée', this.margin, this.currentY)
  
  // Votre contenu personnalisé ici
}
```

### Modification du Logo
```typescript
// Dans la méthode addHeader()
// Remplacez le texte par une image
this.doc.addImage(logoBase64, 'PNG', this.margin, this.currentY, 50, 20)
```

## 🔧 Configuration Avancée

### Variables d'Environnement
```env
# Dans votre fichier .env
NEXT_PUBLIC_COMPANY_NAME="Loft Algérie"
NEXT_PUBLIC_COMPANY_ADDRESS="Votre adresse"
NEXT_PUBLIC_COMPANY_PHONE="Votre téléphone"
NEXT_PUBLIC_COMPANY_EMAIL="contact@loftalgerie.com"
NEXT_PUBLIC_DEFAULT_CURRENCY="DZD"
```

### Paramètres PDF
```typescript
// Configuration par défaut
const pdfConfig = {
  format: 'a4',
  orientation: 'portrait',
  unit: 'mm',
  margin: 20,
  fontSize: {
    title: 20,
    subtitle: 16,
    heading: 14,
    body: 10,
    small: 8
  }
}
```

## 📈 Cas d'Usage Pratiques

### 1. Rapport Mensuel pour Propriétaire
```
Objectif: Envoyer un rapport mensuel à chaque propriétaire
Période: 1er au 31 du mois précédent
Contenu: Rapport par propriétaire avec détails complets
Fréquence: Automatique le 1er de chaque mois
```

### 2. Analyse Trimestrielle Globale
```
Objectif: Analyser la performance globale du portefeuille
Période: Trimestre complet
Contenu: Rapport global avec synthèses avancées
Usage: Réunions de direction et planification
```

### 3. Rapport d'Incident par Loft
```
Objectif: Documenter les dépenses de maintenance
Période: Selon l'incident
Contenu: Rapport par loft, dépenses uniquement
Usage: Suivi des coûts de maintenance
```

### 4. Bilan Annuel Complet
```
Objectif: Bilan fiscal et comptable annuel
Période: Année fiscale complète
Contenu: Rapport global avec tous les détails
Usage: Déclarations fiscales et audit
```

## 🛠️ Dépannage

### Problèmes Courants

#### 1. Erreur "jsPDF not found"
```bash
# Solution: Réinstaller les dépendances
npm run reports:install
# Ou
npm install jspdf jspdf-autotable
```

#### 2. PDF vide ou incomplet
```bash
# Vérifiez les données
npm run reports:test

# Vérifiez les permissions de base de données
npm run test-env
```

#### 3. Erreur de mémoire sur gros rapports
```typescript
// Réduisez la taille des lots dans le générateur
const batchSize = 50 // Au lieu de 100
```

#### 4. Caractères spéciaux mal affichés
```typescript
// Utilisez l'encodage UTF-8
this.doc.setFont('helvetica', 'normal')
// Ou ajoutez une police personnalisée avec support Unicode
```

### Logs et Débogage
```bash
# Activer les logs détaillés
NEXT_PUBLIC_DEBUG_MODE=true npm run dev

# Tester avec données d'exemple
npm run reports:test

# Vérifier la base de données
npm run test-env
```

## 📊 Métriques et Performance

### Temps de Génération Typiques
- **Rapport par loft** (< 100 transactions) : 1-2 secondes
- **Rapport par propriétaire** (< 500 transactions) : 3-5 secondes
- **Rapport global** (< 1000 transactions) : 5-10 secondes

### Optimisations Recommandées
- Limitez les périodes pour les gros volumes
- Utilisez les filtres pour réduire les données
- Générez les rapports en arrière-plan pour > 1000 transactions

## 🔒 Sécurité et Confidentialité

### Protection des Données
- Les rapports ne contiennent que les données autorisées
- Pas de mots de passe ou informations sensibles
- Génération côté client pour la confidentialité

### Contrôle d'Accès
- Vérification des permissions utilisateur
- Filtrage automatique selon les droits
- Audit trail des générations de rapports

## 📞 Support et Maintenance

### Mise à Jour du Système
```bash
# Mettre à jour les dépendances PDF
npm update jspdf jspdf-autotable

# Tester après mise à jour
npm run reports:test
```

### Sauvegarde des Configurations
- Sauvegardez vos personnalisations dans `lib/pdf-generator.ts`
- Documentez vos modifications personnalisées
- Testez après chaque mise à jour

### Support Technique
- Consultez les logs en cas d'erreur
- Utilisez `npm run reports:test` pour diagnostiquer
- Vérifiez la documentation jsPDF pour les fonctionnalités avancées

---

**💡 Conseil** : Commencez par tester le système avec `npm run reports:test` pour vous familiariser avec les fonctionnalités avant de l'utiliser en production.