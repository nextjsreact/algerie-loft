# 💰 Système de Montants de Référence pour les Transactions

Ce guide explique comment configurer et utiliser le système de montants de référence pour les transactions, qui permet de surveiller et d'alerter sur les coûts anormaux des transactions financières.

## 🎯 Fonctionnalités

### ✅ **Montants de Référence par Catégorie et Type**
- **Catégories de Dépenses** : Maintenance, Nettoyage, Réparations, Plomberie, Électricité, Peinture, Sécurité, Inspections, Factures, Assurances, Taxes, Fournitures
- **Catégories de Revenus** : Loyers, Cautions, Frais de Retard, Parking, Services
- **Montants configurables** : Définissez un montant de référence pour chaque catégorie
- **Gestion flexible** : Ajoutez de nouvelles catégories selon vos besoins

### ✅ **Alertes Automatiques Intelligentes**
- **Seuil d'alerte** : +20% au-dessus du montant de référence
- **Notifications ciblées** : Alertes envoyées aux administrateurs et managers
- **Détection automatique** : Le système détecte la catégorie basée sur la description de la transaction

### ✅ **Interface de Gestion Complète**
- **Page dédiée** : `/transactions/reference-amounts` pour gérer les montants
- **Onglets séparés** : Dépenses et Revenus organisés séparément
- **Modification facile** : Interface intuitive pour mettre à jour les références
- **Visualisation claire** : Aperçu de tous les montants de référence avec icônes

### ✅ **Suivi et Rapports**
- **Transactions dépassant les références** : Vue d'ensemble des dépassements
- **Filtres temporels** : 7 jours, 30 jours, 90 jours, 1 an
- **Pourcentages de dépassement** : Visualisation claire des écarts

## 🚀 Installation

### Étape 1 : Appliquer le Schéma de Base de Données
Exécutez le script SQL dans votre éditeur SQL Supabase :

```sql
-- Copiez et collez le contenu de : database/transaction-reference-amounts-schema.sql
```

### Étape 2 : Vérifier l'Installation
Après avoir exécuté le script, vous devriez voir :
```
Transaction reference amounts schema created successfully!
```

### Étape 3 : Accéder à la Gestion
- Connectez-vous en tant qu'administrateur ou manager
- Allez à `/transactions/reference-amounts`
- Configurez vos montants de référence

## 📊 Utilisation

### Configuration des Montants de Référence

1. **Accédez à la page de gestion** : `/transactions/reference-amounts`
2. **Naviguez entre les onglets** : "Dépenses" et "Revenus"
3. **Modifiez les montants existants** : Cliquez sur l'icône d'édition
4. **Ajoutez de nouvelles catégories** : Utilisez le bouton "Ajouter"

### **Catégories de Dépenses par défaut :**
- 🔧 **Maintenance** : 5,000 DZD
- 🧹 **Nettoyage** : 2,000 DZD  
- 🛠️ **Réparations** : 8,000 DZD
- 🚰 **Plomberie** : 6,000 DZD
- ⚡ **Électricité** : 7,000 DZD
- 🎨 **Peinture** : 4,000 DZD
- 🔒 **Sécurité** : 3,000 DZD
- 🔍 **Inspections** : 1,500 DZD
- 💡 **Factures Utilitaires** : 4,000 DZD
- 🛡️ **Assurances** : 10,000 DZD
- 📋 **Taxes et Impôts** : 15,000 DZD
- 📦 **Fournitures** : 2,500 DZD

### **Catégories de Revenus par défaut :**
- 🏠 **Loyers** : 50,000 DZD
- 💰 **Cautions** : 100,000 DZD
- ⏰ **Frais de Retard** : 5,000 DZD
- 🚗 **Parking** : 5,000 DZD
- 🔧 **Services** : 10,000 DZD

### Création de Transactions avec Surveillance

1. **Créez ou modifiez une transaction**
2. **Saisissez le montant** et la description
3. **Le système détecte automatiquement** la catégorie
4. **Si montant > référence + 20%** → Alerte automatique

### Détection Automatique des Catégories

Le système détecte automatiquement la catégorie basée sur les mots-clés dans la description :

**Dépenses :**
- **"maintenance"** → Catégorie Maintenance
- **"nettoyage", "cleaning"** → Catégorie Nettoyage
- **"réparation", "repair"** → Catégorie Réparations
- **"plomberie", "plumbing"** → Catégorie Plomberie
- **"électricité", "electrical"** → Catégorie Électricité
- **"peinture", "painting"** → Catégorie Peinture
- **"sécurité", "security"** → Catégorie Sécurité
- **"inspection"** → Catégorie Inspections
- **"facture", "utilities"** → Catégorie Factures Utilitaires
- **"assurance", "insurance"** → Catégorie Assurances
- **"impôt", "tax"** → Catégorie Taxes
- **"fourniture", "supplies"** → Catégorie Fournitures

**Revenus :**
- **"loyer", "rent"** → Catégorie Loyers
- **"caution", "deposit"** → Catégorie Cautions
- **"retard", "late"** → Catégorie Frais de Retard
- **"parking"** → Catégorie Parking
- **"service"** → Catégorie Services

## 🔔 Système d'Alertes Intelligent

### Quand les Alertes sont Déclenchées

- **Seuil** : Montant > (Référence + 20%)
- **Exemple** : Si référence = 5,000 DZD, alerte si montant > 6,000 DZD

### Qui Reçoit les Alertes

1. **Les administrateurs** : Notification complète avec détails
2. **Les managers** : Notification de supervision

### Types de Notifications

**Exemple de notification :**
```
💰 Montant de Transaction Élevé
Transaction "Réparation plomberie urgente" (Dépense) - 
Montant: 7,500 DZD (25.0% au-dessus de la référence 6,000 DZD) - 
Loft: La redoute 5
```

## 📈 Suivi et Rapports

### Vue des Transactions Dépassant les Références

La page `/transactions/reference-amounts` inclut un composant pour visualiser :
- **Transactions récentes** qui ont dépassé les références
- **Pourcentage de dépassement** pour chaque transaction
- **Filtres temporels** : 7, 30, 90 jours, 1 an
- **Détails complets** : Montant, référence, catégorie, loft

### Requêtes Utiles pour Analyse

**Voir toutes les transactions avec dépassements :**
```sql
SELECT * FROM get_transactions_over_reference(30); -- Derniers 30 jours
```

**Statistiques par catégorie :**
```sql
SELECT 
  category,
  transaction_type,
  COUNT(*) as transaction_count,
  AVG(percentage_over) as avg_percentage_over
FROM get_transactions_over_reference(90)
GROUP BY category, transaction_type
ORDER BY avg_percentage_over DESC;
```

## 🛠️ Personnalisation

### Modifier le Seuil d'Alerte

Par défaut, le seuil est de 20%. Pour le modifier, éditez dans le fichier SQL :

```sql
-- Dans la fonction check_transaction_amount_vs_reference()
alert_threshold DECIMAL(5,2) := 30.00; -- Changez à 30% par exemple
```

### Ajouter de Nouvelles Catégories

1. **Via l'interface** : Utilisez le bouton "Ajouter" sur `/transactions/reference-amounts`
2. **Via SQL** :
```sql
INSERT INTO transaction_category_references (category, transaction_type, reference_amount, description) 
VALUES ('renovation', 'expense', 15000.00, 'Travaux de rénovation');
```

### Personnaliser la Détection de Catégories

Modifiez la fonction `check_transaction_amount_vs_reference()` pour ajouter de nouveaux mots-clés :

```sql
WHEN LOWER(NEW.description) LIKE '%renovation%' THEN 'renovation'
```

## 🔧 Maintenance

### Mise à Jour des Montants de Référence

Il est recommandé de réviser les montants de référence :
- **Trimestriellement** : Pour s'adapter à l'inflation
- **Après analyse** : Basé sur les coûts réels observés
- **Selon le marché** : Quand les prix du marché changent

### Surveillance des Alertes

Surveillez régulièrement :
- **Fréquence des alertes** : Trop d'alertes = références trop basses
- **Pas d'alertes** : Références peut-être trop élevées
- **Tendances par catégorie** : Identifiez les catégories problématiques

## 🎉 Avantages

### ✅ **Contrôle Financier Automatisé**
- Surveillance continue des dépenses et revenus
- Alertes préventives avant dépassements importants
- Visibilité sur les coûts par catégorie et type

### ✅ **Amélioration de la Gestion**
- Standardisation des coûts par catégorie
- Détection rapide des anomalies financières
- Optimisation des budgets et prévisions

### ✅ **Transparence et Traçabilité**
- Notifications en temps réel aux gestionnaires
- Historique complet des dépassements
- Rapports automatisés pour analyse

### ✅ **Flexibilité et Évolutivité**
- Ajout facile de nouvelles catégories
- Modification simple des seuils d'alerte
- Adaptation aux besoins spécifiques

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que le schéma SQL a été appliqué correctement
2. Confirmez que la table `transaction_category_references` existe
3. Testez avec une transaction simple pour vérifier les alertes
4. Vérifiez les logs de notifications dans la table `notifications`

---

## 🏁 Résultat Final

Votre système de gestion des montants de référence des transactions est maintenant opérationnel ! Il vous permettra de :

🔍 **Surveiller automatiquement** tous les montants de transactions  
⚠️ **Recevoir des alertes** quand les montants dépassent les références  
📊 **Analyser les tendances** de dépenses et revenus  
🎯 **Optimiser la gestion financière** de vos lofts  
📈 **Améliorer la rentabilité** par un meilleur contrôle des coûts  

Le système fonctionne de manière autonome et vous alertera dès qu'une transaction dépasse les montants de référence configurés ! 🚀