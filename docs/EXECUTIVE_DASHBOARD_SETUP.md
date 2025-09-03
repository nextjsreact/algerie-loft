# 🎯 Guide de Déploiement - Tableau de Bord Exécutif

## Vue d'ensemble

Ce guide vous accompagne dans la mise en place d'un tableau de bord exécutif de haut niveau avec des métriques sensibles et des alertes critiques, exclusivement accessible aux dirigeants de l'entreprise.

## 🔐 Fonctionnalités Clés

### **Niveau de Sécurité Executive**
- ✅ Rôle `executive` avec permissions spéciales
- ✅ Accès exclusif aux données financières sensibles
- ✅ Métriques stratégiques et KPIs critiques
- ✅ Alertes automatiques pour situations critiques

### **Métriques Disponibles**
- 📊 **Financières**: Revenus, profits, cash flow, marges
- 🏢 **Opérationnelles**: Taux d'occupation, prix moyens, maintenance
- 📈 **Performance**: Croissance, tendances, comparaisons YoY
- ⚠️ **Alertes**: Situations critiques nécessitant une action immédiate

## 🚀 Instructions de Déploiement

### **Étape 1: Configuration de la Base de Données**

1. **Exécutez le script SQL** dans votre Supabase SQL Editor :

```bash
# Copier le contenu du fichier
cat scripts/add-executive-role.sql
```

2. **Copiez et exécutez** tout le contenu dans l'éditeur SQL de Supabase

Ce script va :
- ✅ Ajouter le rôle `executive` au système
- ✅ Créer les tables pour les métriques sensibles
- ✅ Configurer les politiques de sécurité RLS
- ✅ Créer un compte executive de démonstration
- ✅ Configurer les permissions appropriées

### **Étape 2: Vérification des Permissions**

Après l'exécution du script, vérifiez que :

```sql
-- Vérifier que le rôle executive existe
SELECT unnest(enum_range(NULL::user_role));

-- Vérifier le compte executive
SELECT * FROM profiles WHERE role = 'executive';

-- Vérifier les permissions
SELECT * FROM executive_permissions;
```

### **Étape 3: Test Automatisé**

1. **Exécutez le script de test** :

```bash
node scripts/test-executive-dashboard.js
```

2. **Vérification manuelle** :
   - Email: `executive@loftmanager.com`
   - Mot de passe: `executive123`
   - Accédez à `/executive`
   - Vérifiez que le menu "🎯 Executive" est visible

### **Étape 4: Démarrage Rapide (Optionnel)**

**Pour Windows (PowerShell)** :
```powershell
.\scripts\quick-start-executive.ps1
```

**Pour Windows (CMD)** :
```cmd
scripts\quick-start-executive.bat
```

**Pour Linux/Mac** :
```bash
chmod +x scripts/quick-start-executive.sh
./scripts/quick-start-executive.sh
```

### **Étape 5: Configuration des Alertes (Optionnel)**

Pour activer le système d'alertes automatiques :

**Windows (Planificateur de tâches)** :
```cmd
# Créer une tâche planifiée qui exécute toutes les heures :
schtasks /create /tn "Executive Alerts" /tr "node scripts\run-executive-alerts.js" /sc hourly
```

**Linux/Mac (Cron)** :
```bash
# Ajouter au crontab (toutes les heures)
0 * * * * cd /path/to/your/project && node scripts/run-executive-alerts.js
```

## 📋 Comptes de Démonstration

| Rôle | Email | Mot de passe | Accès Executive |
|------|-------|--------------|-----------------|
| Executive | executive@loftmanager.com | executive123 | ✅ Complet |
| Admin | admin@loftmanager.com | password123 | ❌ Limité |
| Manager | manager@loftmanager.com | password123 | ❌ Aucun |

## 🎨 Personnalisation

### **Métriques Personnalisées**

Modifiez `lib/services/executive-dashboard.ts` pour ajouter vos propres métriques :

```typescript
// Exemple: Ajouter une métrique personnalisée
export interface CustomMetric {
  name: string
  value: number
  trend: number
  target: number
}
```

### **Seuils d'Alerte**

Configurez les seuils dans `lib/services/executive-alerts.ts` :

```typescript
const ALERT_THRESHOLDS: AlertThreshold[] = [
  {
    metric: 'occupancy_rate',
    threshold: 70, // Personnalisez selon vos besoins
    comparison: 'less_than',
    severity: 'high'
  }
]
```

## 🔒 Sécurité et Bonnes Pratiques

### **Contrôle d'Accès**
- ✅ RLS (Row Level Security) activé sur toutes les tables sensibles
- ✅ Vérification des rôles à chaque requête
- ✅ Logs d'accès aux données sensibles

### **Confidentialité**
- 🔐 Données financières chiffrées en transit
- 🔐 Accès limité aux métriques critiques
- 🔐 Audit trail des consultations

### **Recommandations**
1. **Changez les mots de passe** des comptes de démonstration
2. **Configurez l'authentification 2FA** pour les comptes executives
3. **Surveillez les logs d'accès** régulièrement
4. **Sauvegardez les données** sensibles séparément

## 📊 Métriques Disponibles

### **Tableau de Bord Principal**
- 💰 Revenus totaux et tendances
- 📈 Profit net et marges
- 🏢 Taux d'occupation et performance
- 💸 Cash flow et liquidités

### **Analyses Avancées**
- 📊 Comparaisons année sur année
- 📈 Tendances mensuelles (12 mois)
- 🎯 Répartition des revenus par source
- ⚠️ Alertes critiques en temps réel

### **Rapports Exécutifs**
- 📋 Performance par propriété
- 💼 Analyse de rentabilité
- 🔍 Détection d'anomalies
- 📈 Projections et forecasts

## 🚨 Alertes Automatiques

Le système surveille automatiquement :

| Métrique | Seuil | Gravité | Action |
|----------|-------|---------|--------|
| Taux d'occupation | < 70% | Élevée | Alerte immédiate |
| Chute revenus | > -15% | Critique | Investigation urgente |
| Hausse dépenses | > +25% | Élevée | Révision budgétaire |
| Cash flow négatif | < 0 | Critique | Action corrective |

## 📞 Support

Pour toute question ou problème :

1. **Vérifiez les logs** dans la console développeur
2. **Consultez la documentation** Supabase pour les problèmes RLS
3. **Testez les permissions** avec différents comptes utilisateur

## 🔄 Maintenance

### **Mise à Jour des Métriques**
Les métriques sont calculées en temps réel à chaque chargement de page. Pour des performances optimales avec de gros volumes de données, considérez :

1. **Cache Redis** pour les calculs complexes
2. **Vues matérialisées** pour les agrégations
3. **Tâches en arrière-plan** pour les rapports lourds

### **Monitoring**
Surveillez régulièrement :
- Performance des requêtes
- Utilisation des ressources
- Logs d'erreur
- Temps de réponse du dashboard

---

**🎯 Votre tableau de bord exécutif est maintenant prêt !**

Accédez à `/executive` avec le compte executive pour découvrir toutes les fonctionnalités.