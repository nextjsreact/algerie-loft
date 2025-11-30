# Superuser Tables Setup Guide

## 🔍 Situation Actuelle

Vous avez deux erreurs dans la console:
1. ✅ **`audit.audit_logs` existe déjà** - Pas besoin de la recréer!
2. ❌ **`public.security_alerts` n'existe pas** - À créer

## 📋 Ce qui a été corrigé

### 1. API Audit Logs - CORRIGÉ ✅
L'API essayait d'accéder à `public.audit_logs` au lieu de `audit.audit_logs`.

**Fichier modifié:** `app/api/superuser/audit/route.ts`
- Changé: `.from('audit_logs')` 
- En: `.from('audit.audit_logs')`

Maintenant l'API utilise correctement la table existante dans le schéma `audit`.

### 2. Security Alerts Table - À CRÉER ⚠️
Cette table n'existe pas encore et doit être créée dans le schéma `public`.

## 🚀 Installation Rapide

### Étape 1: Créer la table security_alerts

1. Ouvrez votre **Supabase Dashboard** → **SQL Editor**
2. Copiez le contenu de `database/migrations/create-security-alerts-table.sql`
3. Collez et exécutez (`Ctrl+Enter`)

### Étape 2: Redémarrez votre serveur

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez
npm run dev
```

## 📊 Structure de la Table security_alerts

La table `security_alerts` surveille les événements de sécurité:

**Colonnes principales:**
- `alert_type` - Type d'alerte (failed_login, suspicious_activity, etc.)
- `severity` - Gravité (low, medium, high, critical)
- `status` - Statut (active, investigating, resolved, dismissed)
- `resolved` - Boolean pour filtrage rapide
- `description` - Description lisible
- `details` - JSON avec informations détaillées
- `ip_address`, `user_agent` - Informations de contexte

**Fonctionnalités:**
- ✅ RLS activé (seulement les superusers)
- ✅ Index optimisés pour les requêtes
- ✅ Trigger pour `updated_at` automatique
- ✅ Données de test incluses

## 🔐 Pourquoi Deux Schémas Différents?

C'est une bonne question! Voici l'explication:

### `audit.audit_logs` (Schéma audit)
- **But:** Audit système général
- **Utilisation:** Tracking automatique des changements sur toutes les tables
- **Créé par:** Système d'audit existant avec triggers
- **Accès:** Via triggers automatiques

### `public.security_alerts` (Schéma public)
- **But:** Alertes de sécurité spécifiques au superuser
- **Utilisation:** Monitoring manuel des menaces
- **Créé par:** Dashboard superuser
- **Accès:** Via API REST

**Recommandation:** C'est normal d'avoir les deux! Ils servent des objectifs différents.

## ✅ Vérification

Après l'installation, vérifiez:

```sql
-- Vérifier que audit_logs existe dans le schéma audit
SELECT COUNT(*) FROM audit.audit_logs;

-- Vérifier que security_alerts existe dans le schéma public
SELECT COUNT(*) FROM public.security_alerts;

-- Voir les alertes de test
SELECT * FROM public.security_alerts ORDER BY created_at DESC;
```

## 🎯 Résultat Final

Après ces changements:
- ✅ `/api/superuser/audit` fonctionnera (utilise `audit.audit_logs`)
- ✅ `/api/superuser/dashboard` fonctionnera (utilise `public.security_alerts`)
- ✅ Pas de duplication de données
- ✅ Chaque table dans son schéma approprié

## 🔧 Dépannage

### Erreur: "permission denied"
```sql
-- Vérifier votre rôle
SELECT role FROM profiles WHERE id = auth.uid();

-- Si nécessaire, mettre à jour
UPDATE profiles SET role = 'superuser' WHERE id = auth.uid();
```

### Erreur: "table already exists"
C'est normal si vous réexécutez le script. Le `IF NOT EXISTS` empêche les erreurs.

### Les alertes ne s'affichent pas
1. Vérifiez que la table existe: `SELECT * FROM public.security_alerts;`
2. Vérifiez les RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'security_alerts';`
3. Redémarrez le serveur Next.js

## 📝 Nettoyage (si nécessaire)

Pour supprimer uniquement security_alerts:
```sql
DROP TABLE IF EXISTS public.security_alerts CASCADE;
DROP FUNCTION IF EXISTS update_security_alerts_updated_at() CASCADE;
```

**Note:** Ne supprimez PAS `audit.audit_logs` - elle est utilisée par tout le système!
