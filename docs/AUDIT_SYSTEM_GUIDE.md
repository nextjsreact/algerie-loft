# Guide du Système d'Audit

## Vue d'ensemble

Le système d'audit de Loft Algérie fournit une traçabilité complète de toutes les opérations de création, modification et suppression sur les entités critiques de l'application. Ce guide couvre l'architecture, l'utilisation et l'administration du système d'audit.

## Table des matières

1. [Architecture du système](#architecture-du-système)
2. [Entités auditées](#entités-auditées)
3. [Guide utilisateur](#guide-utilisateur)
4. [Guide administrateur](#guide-administrateur)
5. [Sécurité et permissions](#sécurité-et-permissions)
6. [Performance et optimisation](#performance-et-optimisation)
7. [Dépannage](#dépannage)

## Architecture du système

### Composants principaux

Le système d'audit est composé de quatre couches principales :

```
┌─────────────────────────────────────────────────────────────┐
│                    Interface Utilisateur                    │
├─────────────────────────────────────────────────────────────┤
│  • Onglets d'historique dans les pages de détail          │
│  • Dashboard d'administration d'audit                      │
│  • Composants de filtrage et recherche                     │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                      API et Services                        │
├─────────────────────────────────────────────────────────────┤
│  • AuditService : récupération et formatage des logs      │
│  • API Routes : endpoints pour l'accès aux données        │
│  • Système de permissions : contrôle d'accès              │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Base de données                          │
├─────────────────────────────────────────────────────────────┤
│  • Table audit_logs : stockage des logs d'audit           │
│  • Triggers automatiques : enregistrement en temps réel   │
│  • Index optimisés : performance des requêtes             │
└─────────────────────────────────────────────────────────────┘
```

### Flux de données

1. **Enregistrement automatique** : Les triggers de base de données capturent automatiquement toutes les opérations CRUD
2. **Stockage sécurisé** : Les logs sont stockés dans une table dédiée avec contrôle d'accès strict
3. **Récupération contrôlée** : L'API vérifie les permissions avant de retourner les données d'audit
4. **Affichage contextuel** : L'interface utilisateur présente les informations de manière lisible et organisée

## Entités auditées

Le système d'audit surveille les opérations sur quatre types d'entités :

### 1. Transactions financières
- **Création** : Enregistrement de toutes les valeurs initiales
- **Modification** : Capture des anciennes et nouvelles valeurs
- **Suppression** : Sauvegarde complète avant suppression
- **Champs surveillés** : montant, type, description, date, statut

### 2. Tâches de maintenance
- **Création** : Détails de la tâche et assignation
- **Modification** : Changements de statut, priorité, assignation
- **Suppression** : Archivage des informations de la tâche
- **Champs surveillés** : titre, description, statut, priorité, assigné_à

### 3. Réservations
- **Création** : Informations de réservation complètes
- **Modification** : Changements de dates, statut, client
- **Suppression** : Conservation des données de réservation
- **Champs surveillés** : dates, client, loft, statut, montant

### 4. Lofts (biens immobiliers)
- **Création** : Caractéristiques du bien
- **Modification** : Mises à jour des informations
- **Suppression** : Archivage des données du bien
- **Champs surveillés** : nom, adresse, prix, statut, caractéristiques

## Guide utilisateur

### Consultation de l'historique d'audit

#### Accès aux onglets d'historique

1. **Navigation vers une entité** : Accédez à la page de détail d'une transaction, tâche, réservation ou loft
2. **Onglet Historique d'audit** : Cliquez sur l'onglet "Historique d'audit" (visible selon vos permissions)
3. **Visualisation chronologique** : L'historique s'affiche par ordre chronologique inverse (plus récent en premier)

#### Lecture des informations d'audit

Chaque entrée d'audit contient :

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 15/03/2024 14:30:25 | 👤 Jean Dupont | ✏️ MODIFICATION  │
├─────────────────────────────────────────────────────────────┤
│ Champs modifiés : montant, statut                          │
│                                                             │
│ Anciennes valeurs :                                         │
│ • montant: 1500.00 €                                       │
│ • statut: "en_attente"                                     │
│                                                             │
│ Nouvelles valeurs :                                         │
│ • montant: 1750.00 €                                       │
│ • statut: "confirmé"                                       │
└─────────────────────────────────────────────────────────────┘
```

#### Types d'actions

- **🆕 CRÉATION** : Nouvelle entité créée
- **✏️ MODIFICATION** : Entité existante modifiée
- **🗑️ SUPPRESSION** : Entité supprimée

#### Informations disponibles

- **Horodatage** : Date et heure précises de l'opération
- **Utilisateur** : Nom et email de l'utilisateur qui a effectué l'action
- **Action** : Type d'opération (création, modification, suppression)
- **Champs modifiés** : Liste des champs qui ont été modifiés (pour les modifications)
- **Valeurs** : Anciennes et nouvelles valeurs pour chaque champ modifié

### Permissions et visibilité

#### Niveaux d'accès

| Rôle | Voir ses propres actions | Voir toutes les actions | Accès admin |
|------|-------------------------|-------------------------|-------------|
| **Invité** | ❌ | ❌ | ❌ |
| **Membre** | ✅ | ❌ | ❌ |
| **Exécutif** | ✅ | ❌ | ❌ |
| **Manager** | ✅ | ✅ | ❌ |
| **Admin** | ✅ | ✅ | ✅ |

#### Règles de visibilité

- **Onglets d'historique** : Visibles uniquement si vous avez les permissions d'audit
- **Données personnelles** : Vous voyez toujours vos propres actions
- **Données d'équipe** : Les managers et admins voient toutes les actions
- **Informations sensibles** : Certaines données peuvent être masquées selon le contexte

## Guide administrateur

### Dashboard d'administration d'audit

#### Accès au dashboard

1. **Navigation** : Menu Admin → Audit
2. **URL directe** : `/admin/audit`
3. **Permissions requises** : Rôle Admin ou Manager

#### Interface de recherche et filtrage

Le dashboard offre plusieurs options de filtrage :

##### Filtres disponibles

```
┌─────────────────────────────────────────────────────────────┐
│                    Filtres d'audit                         │
├─────────────────────────────────────────────────────────────┤
│ Type d'entité    : [Toutes ▼] [Transactions] [Tâches]     │
│ Action           : [Toutes ▼] [Création] [Modification]    │
│ Utilisateur      : [Tous ▼] [Jean Dupont] [Marie Martin]  │
│ Période          : [📅 Du] [01/03/2024] [Au] [31/03/2024] │
│ Recherche        : [🔍 Mots-clés dans les valeurs...]     │
│                                                             │
│ [🔄 Réinitialiser] [🔍 Appliquer les filtres]            │
└─────────────────────────────────────────────────────────────┘
```

##### Utilisation des filtres

1. **Type d'entité** : Filtrer par transactions, tâches, réservations ou lofts
2. **Action** : Afficher seulement les créations, modifications ou suppressions
3. **Utilisateur** : Voir les actions d'un utilisateur spécifique
4. **Période** : Définir une plage de dates
5. **Recherche textuelle** : Chercher dans les descriptions et valeurs

#### Tableau des résultats

Le tableau affiche les logs d'audit avec les colonnes suivantes :

| Colonne | Description | Tri |
|---------|-------------|-----|
| **Date/Heure** | Horodatage de l'action | ✅ |
| **Utilisateur** | Nom et email | ✅ |
| **Entité** | Type et ID de l'entité | ✅ |
| **Action** | Type d'opération | ✅ |
| **Détails** | Résumé des changements | ❌ |
| **Actions** | Boutons d'action | ❌ |

#### Fonctionnalités avancées

##### Export des données

1. **Sélection** : Cochez les logs à exporter ou utilisez "Tout sélectionner"
2. **Format** : Choisissez le format d'export (CSV recommandé)
3. **Export** : Cliquez sur "Exporter la sélection"
4. **Téléchargement** : Le fichier se télécharge automatiquement

##### Pagination et performance

- **Pagination automatique** : 50 résultats par page par défaut
- **Navigation** : Boutons Précédent/Suivant et saut de page
- **Compteur** : Affichage du nombre total de résultats
- **Performance** : Chargement optimisé pour de gros volumes

### Procédures d'administration

#### Surveillance quotidienne

##### Vérifications recommandées

1. **Volume d'activité** : Vérifier le nombre de logs générés
2. **Activités suspectes** : Identifier les patterns inhabituels
3. **Erreurs système** : Contrôler les échecs d'enregistrement
4. **Performance** : Surveiller les temps de réponse

##### Checklist quotidienne

```
□ Vérifier le dashboard d'audit pour les dernières 24h
□ Contrôler les activités de suppression (actions sensibles)
□ Vérifier les connexions hors horaires de bureau
□ Examiner les modifications en masse
□ Contrôler les échecs d'authentification dans les logs
```

#### Maintenance hebdomadaire

##### Archivage des données

1. **Évaluation du volume** : Vérifier la taille de la table audit_logs
2. **Politique de rétention** : Appliquer les règles de conservation
3. **Archivage automatique** : Vérifier le fonctionnement des scripts
4. **Nettoyage** : Supprimer les logs très anciens selon la politique

##### Performance et optimisation

1. **Index de base de données** : Vérifier l'efficacité des index
2. **Requêtes lentes** : Identifier et optimiser les requêtes problématiques
3. **Espace disque** : Surveiller l'utilisation de l'espace
4. **Sauvegarde** : Vérifier les sauvegardes des données d'audit

#### Gestion des incidents

##### Procédure d'investigation

1. **Identification** : Utiliser les filtres pour isoler l'incident
2. **Chronologie** : Reconstituer la séquence d'événements
3. **Utilisateurs impliqués** : Identifier tous les acteurs
4. **Impact** : Évaluer les conséquences des actions
5. **Documentation** : Consigner les findings et actions correctives

##### Réponse aux incidents de sécurité

```
🚨 INCIDENT DE SÉCURITÉ DÉTECTÉ

1. IMMÉDIAT (0-15 minutes)
   □ Isoler le compte utilisateur concerné
   □ Documenter l'heure et la nature de l'incident
   □ Notifier l'équipe de sécurité

2. COURT TERME (15 minutes - 1 heure)
   □ Analyser les logs d'audit pour l'étendue de l'incident
   □ Identifier toutes les données affectées
   □ Évaluer les risques et l'impact business

3. MOYEN TERME (1-24 heures)
   □ Implémenter les mesures correctives
   □ Restaurer les données si nécessaire
   □ Renforcer les contrôles de sécurité

4. LONG TERME (24+ heures)
   □ Réviser les procédures de sécurité
   □ Former les utilisateurs si nécessaire
   □ Mettre à jour la documentation
```

## Sécurité et permissions

### Contrôle d'accès

#### Principe de moindre privilège

Le système d'audit applique le principe de moindre privilège :

- **Accès par défaut** : Aucun accès aux logs d'audit
- **Accès personnel** : Voir ses propres actions uniquement
- **Accès étendu** : Accordé selon le rôle et les responsabilités
- **Accès administratif** : Réservé aux administrateurs système

#### Matrice des permissions

| Permission | Invité | Membre | Exécutif | Manager | Admin |
|------------|--------|--------|----------|---------|-------|
| Voir ses logs | ❌ | ✅ | ✅ | ✅ | ✅ |
| Voir tous les logs | ❌ | ❌ | ❌ | ✅ | ✅ |
| Exporter les logs | ❌ | ❌ | ✅ | ✅ | ✅ |
| Dashboard admin | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gestion rétention | ❌ | ❌ | ❌ | ❌ | ✅ |

### Protection des données

#### Intégrité des logs

- **Lecture seule** : Les logs d'audit ne peuvent pas être modifiés après création
- **Triggers protégés** : Les triggers de base de données sont sécurisés
- **Validation** : Contrôles d'intégrité automatiques
- **Audit de l'audit** : Traçabilité des accès aux logs d'audit

#### Confidentialité

- **Chiffrement** : Données sensibles chiffrées dans les logs
- **Anonymisation** : Option d'anonymiser les anciens logs
- **Accès contrôlé** : Logs visibles selon les permissions
- **Audit d'accès** : Enregistrement des consultations de logs

### Conformité et réglementation

#### Exigences légales

- **Rétention** : Conservation des logs selon les exigences légales
- **Traçabilité** : Audit trail complet pour les contrôles
- **Intégrité** : Garantie de non-altération des données
- **Accès** : Contrôle strict des accès aux données sensibles

#### Politiques de rétention

| Type d'entité | Période de rétention | Archivage | Suppression définitive |
|---------------|---------------------|-----------|----------------------|
| **Transactions** | 7 ans | Après 2 ans | Après 10 ans |
| **Réservations** | 3 ans | Après 1 an | Après 5 ans |
| **Tâches** | 2 ans | Après 6 mois | Après 3 ans |
| **Lofts** | 5 ans | Après 2 ans | Après 7 ans |

## Performance et optimisation

### Optimisations de base de données

#### Index optimisés

Le système utilise plusieurs index pour optimiser les performances :

```sql
-- Index principal pour les requêtes par entité
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Index pour les requêtes par utilisateur
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Index pour les requêtes temporelles
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Index pour les filtres par action
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Index composite pour les requêtes complexes
CREATE INDEX idx_audit_logs_composite ON audit_logs(table_name, timestamp, action);
```

#### Stratégies de partitioning

Pour les gros volumes, le système supporte le partitioning par date :

```sql
-- Partition par mois pour optimiser les performances
CREATE TABLE audit_logs_2024_03 PARTITION OF audit_logs
FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
```

### Monitoring des performances

#### Métriques clés

- **Temps de réponse** : < 200ms pour les requêtes d'historique
- **Throughput** : Capacité de traitement des logs
- **Utilisation mémoire** : Consommation des requêtes d'audit
- **Espace disque** : Croissance de la table audit_logs

#### Alertes recommandées

```
⚠️  ALERTES DE PERFORMANCE

• Temps de réponse > 500ms
• Plus de 1000 logs/minute
• Table audit_logs > 10GB
• Échec d'enregistrement > 1%
• Requêtes lentes > 5 secondes
```

## Dépannage

### Problèmes courants

#### Les logs d'audit ne s'enregistrent pas

**Symptômes** : Aucun log généré pour les opérations CRUD

**Causes possibles** :
1. Triggers de base de données désactivés
2. Problème de permissions sur la table audit_logs
3. Erreur dans la fonction audit_trigger_function()
4. Contexte utilisateur non défini

**Solutions** :
```sql
-- Vérifier les triggers
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%';

-- Vérifier les permissions
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'audit_logs';

-- Tester la fonction d'audit
SELECT audit_trigger_function();
```

#### L'historique d'audit ne s'affiche pas

**Symptômes** : Onglet d'historique vide ou invisible

**Causes possibles** :
1. Permissions utilisateur insuffisantes
2. Problème de récupération des données
3. Erreur dans l'API d'audit
4. Problème de rendu du composant

**Solutions** :
1. Vérifier les permissions utilisateur
2. Contrôler les logs de l'API
3. Tester l'endpoint d'audit directement
4. Vérifier la console du navigateur

#### Performance dégradée

**Symptômes** : Lenteur dans l'affichage des logs d'audit

**Causes possibles** :
1. Volume important de logs
2. Index manquants ou inefficaces
3. Requêtes non optimisées
4. Problème de pagination

**Solutions** :
```sql
-- Analyser les requêtes lentes
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%audit_logs%'
ORDER BY mean_time DESC;

-- Vérifier l'utilisation des index
EXPLAIN ANALYZE SELECT * FROM audit_logs 
WHERE table_name = 'transactions' 
ORDER BY timestamp DESC LIMIT 50;
```

### Procédures de diagnostic

#### Diagnostic complet du système d'audit

```bash
# 1. Vérifier l'état des triggers
psql -c "SELECT schemaname, tablename, triggername, tgenabled 
         FROM pg_trigger t 
         JOIN pg_class c ON t.tgrelid = c.oid 
         JOIN pg_namespace n ON c.relnamespace = n.oid 
         WHERE triggername LIKE '%audit%';"

# 2. Vérifier le volume de logs
psql -c "SELECT table_name, COUNT(*) as log_count, 
         MIN(timestamp) as oldest, MAX(timestamp) as newest 
         FROM audit_logs GROUP BY table_name;"

# 3. Vérifier les performances
psql -c "SELECT schemaname, tablename, attname, n_distinct, correlation 
         FROM pg_stats WHERE tablename = 'audit_logs';"
```

#### Tests de fonctionnement

```sql
-- Test d'enregistrement d'audit
BEGIN;
INSERT INTO transactions (id, amount, description) 
VALUES (gen_random_uuid(), 100.00, 'Test audit');
SELECT COUNT(*) FROM audit_logs WHERE table_name = 'transactions';
ROLLBACK;

-- Test de récupération d'historique
SELECT * FROM audit_logs 
WHERE table_name = 'transactions' 
ORDER BY timestamp DESC LIMIT 5;
```

### Support et escalade

#### Niveaux de support

1. **Niveau 1** : Problèmes d'utilisation et questions générales
2. **Niveau 2** : Problèmes techniques et de configuration
3. **Niveau 3** : Problèmes de base de données et de performance
4. **Niveau 4** : Incidents de sécurité et corruption de données

#### Informations à fournir

Lors d'une demande de support, incluez :

- **Description du problème** : Symptômes observés
- **Étapes de reproduction** : Comment reproduire le problème
- **Logs d'erreur** : Messages d'erreur complets
- **Contexte** : Utilisateur, rôle, heure, navigateur
- **Impact** : Utilisateurs affectés et criticité

---

## Annexes

### Glossaire

- **Audit Log** : Enregistrement d'une opération sur une entité
- **Trigger** : Fonction de base de données exécutée automatiquement
- **RLS** : Row Level Security, sécurité au niveau des lignes
- **CRUD** : Create, Read, Update, Delete (opérations de base)
- **Retention** : Politique de conservation des données

### Références

- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
- [Audit Security Implementation](./AUDIT_SECURITY_IMPLEMENTATION.md)

### Historique des versions

| Version | Date | Changements |
|---------|------|-------------|
| 1.0 | Mars 2024 | Version initiale |

---

*Ce document fait partie de la documentation officielle du système Loft Algérie. Pour toute question ou suggestion d'amélioration, contactez l'équipe de développement.*