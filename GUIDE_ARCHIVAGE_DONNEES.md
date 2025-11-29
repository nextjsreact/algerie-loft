# 📦 Guide du Système d'Archivage Automatique

## 🎯 Vue d'ensemble

Le système d'archivage automatique permet de gérer efficacement les données volumineuses en archivant automatiquement les anciennes données selon des règles configurables.

## ✨ Fonctionnalités

### 1. **Configuration des Politiques d'Archivage**
- ✅ Sélection des tables à archiver
- ✅ Définition de la période de rétention (en jours)
- ✅ Configuration de la fréquence (Quotidien, Hebdomadaire, Mensuel)
- ✅ Activation/Désactivation des politiques

### 2. **Tables Supportées**

| Table | Description | Critères d'Archivage |
|-------|-------------|---------------------|
| `audit_logs` | Logs d'audit | Ancienneté > rétention |
| `visitor_tracking` | Tracking visiteurs | Ancienneté > rétention |
| `notifications` | Notifications | Lues + Ancienneté > rétention |
| `sessions` | Sessions | Expirées + Ancienneté > rétention |
| `reservations` | Réservations | Complétées/Annulées + Ancienneté > rétention |
| `transactions` | Transactions | Ancienneté > rétention |
| `messages` | Messages | Archivés + Ancienneté > rétention |
| `activity_logs` | Logs d'activité | Ancienneté > rétention |

### 3. **Fréquences d'Archivage**

- **Quotidien** : Tous les jours à minuit
- **Hebdomadaire** : Tous les dimanches à minuit
- **Mensuel** : Le 1er de chaque mois à minuit

## 🚀 Utilisation

### Accès à la Page d'Archivage

```
http://localhost:3000/[locale]/admin/superuser/archives
```

Langues supportées : `fr`, `en`, `ar`

### Créer une Nouvelle Politique

1. Cliquez sur **"Nouvelle Politique"**
2. Sélectionnez la **table à archiver**
3. Définissez la **période de rétention** (ex: 90 jours)
4. Choisissez la **fréquence** (Quotidien, Hebdomadaire, Mensuel)
5. Activez ou désactivez immédiatement
6. Cliquez sur **"Créer"**

### Modifier une Politique Existante

1. Cliquez sur l'icône **⚙️ Settings** à côté de la politique
2. Modifiez les paramètres souhaités
3. Cliquez sur **"Enregistrer"**

### Exécuter l'Archivage Manuellement

1. Assurez-vous que la politique est **activée**
2. Cliquez sur l'icône **📦 Archive** à côté de la politique
3. L'archivage s'exécute immédiatement
4. Un message de succès affiche le nombre d'entrées archivées

### Activer/Désactiver une Politique

- Utilisez le **switch** à côté de chaque politique
- Les politiques désactivées ne s'exécutent pas automatiquement

### Supprimer une Politique

1. Cliquez sur l'icône **🗑️ Trash** à côté de la politique
2. Confirmez la suppression
3. La politique est supprimée définitivement

## 📊 Statistiques

Le tableau de bord affiche :

- **Total Archivé** : Nombre total d'entrées archivées
- **Espace Total** : Taille totale des archives (MB/GB)
- **Politiques Actives** : Nombre de politiques actives
- **Archive la Plus Ancienne** : Date de la plus ancienne archive

## 🔧 Configuration de la Base de Données

### Exécuter la Migration

```sql
-- Exécuter le fichier de migration
psql -U postgres -d votre_base -f database/migrations/create-archive-policies-table.sql
```

### Tables Créées

1. **`archive_policies`** : Configuration des politiques
2. **`[table]_archive`** : Tables d'archives pour chaque table source

Exemples :
- `audit_logs_archive`
- `visitor_tracking_archive`
- `notifications_archive`
- etc.

## 🔐 Sécurité

### Row Level Security (RLS)

- ✅ Toutes les tables d'archives ont RLS activé
- ✅ Seuls les **superusers** peuvent accéder aux archives
- ✅ Toutes les actions sont loggées dans `audit_logs`

### Permissions

```sql
-- Seuls les superusers peuvent gérer les archives
CREATE POLICY "Superusers can manage archive policies"
  ON archive_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superuser'
    )
  );
```

## 📝 API Endpoints

### GET `/api/superuser/archives/policies`
Récupère toutes les politiques d'archivage

### POST `/api/superuser/archives/policies`
Crée une nouvelle politique

**Body:**
```json
{
  "table_name": "audit_logs",
  "retention_days": 90,
  "frequency": "WEEKLY",
  "enabled": true
}
```

### PUT `/api/superuser/archives/policies/[id]`
Met à jour une politique existante

### DELETE `/api/superuser/archives/policies/[id]`
Supprime une politique

### PATCH `/api/superuser/archives/policies/[id]/toggle`
Active/Désactive une politique

**Body:**
```json
{
  "enabled": true
}
```

### POST `/api/superuser/archives/run`
Exécute l'archivage manuellement

**Body:**
```json
{
  "policy_id": "uuid-de-la-politique"
}
```

### GET `/api/superuser/archives/stats`
Récupère les statistiques globales

## 🎨 Interface Utilisateur

### Composants

- **ArchiveManager** : Composant principal
  - Localisation : `components/admin/superuser/archive-manager.tsx`
  - Support i18n complet (FR, EN, AR)
  - Interface responsive

### Traductions

Les traductions sont disponibles dans :
- `messages/fr.json` : Français
- `messages/en.json` : Anglais
- `messages/ar.json` : Arabe (RTL)

Clé de traduction : `superuser.archives.*`

## ⚠️ Bonnes Pratiques

### Période de Rétention

- **Logs d'audit** : 90-180 jours (selon réglementation)
- **Tracking visiteurs** : 30-90 jours
- **Notifications** : 30-60 jours
- **Sessions** : 7-30 jours
- **Réservations** : 365 jours (1 an)
- **Transactions** : 2555 jours (7 ans - obligation légale)
- **Messages** : 90-180 jours
- **Activity logs** : 60-90 jours

### Fréquence Recommandée

- **Tables volumineuses** (audit_logs, visitor_tracking) : **Quotidien**
- **Tables moyennes** (notifications, sessions) : **Hebdomadaire**
- **Tables légères** (messages, activity_logs) : **Mensuel**

### Surveillance

1. Vérifiez régulièrement les statistiques
2. Surveillez l'espace disque utilisé
3. Vérifiez que les politiques s'exécutent correctement
4. Consultez les logs d'audit pour les erreurs

## 🔄 Automatisation Future

### Cron Job (À implémenter)

```sql
-- Fonction pour exécuter automatiquement les archives
CREATE OR REPLACE FUNCTION run_scheduled_archiving()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Logique d'exécution automatique
  -- Appelée par un cron job externe
END;
$$;
```

### Intégration avec pg_cron

```sql
-- Installer pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Planifier l'exécution quotidienne
SELECT cron.schedule(
  'archive-daily',
  '0 0 * * *',  -- Tous les jours à minuit
  'SELECT run_scheduled_archiving();'
);
```

## 📈 Monitoring

### Métriques à Surveiller

1. **Nombre d'entrées archivées** par politique
2. **Taille des archives** (croissance)
3. **Temps d'exécution** des archivages
4. **Erreurs** lors de l'archivage
5. **Espace disque** disponible

### Alertes Recommandées

- ⚠️ Espace disque < 20%
- ⚠️ Échec d'archivage > 3 fois
- ⚠️ Politique désactivée depuis > 7 jours
- ⚠️ Taille d'archive > seuil défini

## 🆘 Dépannage

### Problème : L'archivage ne s'exécute pas

**Solutions :**
1. Vérifier que la politique est **activée**
2. Vérifier les permissions de la base de données
3. Consulter les logs d'erreur dans `audit_logs`
4. Vérifier que la table source existe

### Problème : Erreur "Table not found"

**Solutions :**
1. Exécuter la migration SQL
2. Vérifier que toutes les tables d'archives existent
3. Créer manuellement la table d'archive si nécessaire

### Problème : Performances lentes

**Solutions :**
1. Réduire la fréquence d'archivage
2. Augmenter la période de rétention
3. Archiver par lots plus petits
4. Optimiser les index sur les tables

## 📚 Ressources

- **Migration SQL** : `database/migrations/create-archive-policies-table.sql`
- **Composant UI** : `components/admin/superuser/archive-manager.tsx`
- **API Routes** : `app/api/superuser/archives/`
- **Traductions** : `messages/{locale}.json`

## 🎉 Conclusion

Le système d'archivage automatique vous permet de :
- ✅ Gérer efficacement les données volumineuses
- ✅ Respecter les obligations légales de rétention
- ✅ Optimiser les performances de la base de données
- ✅ Libérer de l'espace disque
- ✅ Maintenir un historique accessible

**Prêt à archiver ! 🚀**
