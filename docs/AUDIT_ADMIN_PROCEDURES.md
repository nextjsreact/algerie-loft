# Procédures d'Administration - Système d'Audit

## Vue d'ensemble

Ce document détaille les procédures d'administration pour le système d'audit de Loft Algérie. Il s'adresse aux administrateurs système et aux managers responsables de la surveillance et de la maintenance du système d'audit.

## Table des matières

1. [Accès et configuration initiale](#accès-et-configuration-initiale)
2. [Surveillance quotidienne](#surveillance-quotidienne)
3. [Maintenance hebdomadaire](#maintenance-hebdomadaire)
4. [Gestion des incidents](#gestion-des-incidents)
5. [Archivage et rétention](#archivage-et-rétention)
6. [Sécurité et conformité](#sécurité-et-conformité)
7. [Procédures d'urgence](#procédures-durgence)

## Accès et configuration initiale

### Prérequis d'accès

#### Permissions requises
- **Rôle minimum** : Manager ou Administrateur
- **Accès base de données** : Lecture sur les tables d'audit
- **Accès application** : Menu Administration

#### Première connexion au dashboard d'audit

1. **Navigation** : Menu principal → Administration → Audit
2. **URL directe** : `https://votre-domaine.com/admin/audit`
3. **Vérification d'accès** : Le dashboard doit s'afficher avec les filtres et le tableau

### Configuration initiale

#### Vérification de l'installation

```sql
-- Vérifier la présence de la table audit_logs
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'audit_logs';

-- Vérifier les triggers d'audit
SELECT schemaname, tablename, triggername 
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
JOIN pg_namespace n ON c.relnamespace = n.oid 
WHERE triggername LIKE '%audit%';

-- Vérifier les index de performance
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'audit_logs';
```

#### Configuration des alertes

Configurez les alertes pour :
- Volume anormal de logs (> 1000/heure)
- Échecs d'enregistrement d'audit
- Accès suspects aux données d'audit
- Espace disque insuffisant

## Surveillance quotidienne

### Checklist quotidienne (15 minutes)

#### 1. Vérification du volume d'activité

```sql
-- Logs des dernières 24 heures
SELECT 
    table_name,
    action,
    COUNT(*) as count,
    MIN(timestamp) as first_log,
    MAX(timestamp) as last_log
FROM audit_logs 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY table_name, action
ORDER BY count DESC;
```

**Seuils d'alerte** :
- ⚠️ Plus de 500 modifications sur une même entité
- 🚨 Plus de 100 suppressions par jour
- ⚠️ Aucune activité pendant plus de 4 heures ouvrables

#### 2. Contrôle des activités suspectes

```sql
-- Activités hors horaires de bureau (18h-8h, weekends)
SELECT 
    user_email,
    table_name,
    action,
    COUNT(*) as count,
    MIN(timestamp) as first_action,
    MAX(timestamp) as last_action
FROM audit_logs 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND (
    EXTRACT(hour FROM timestamp) NOT BETWEEN 8 AND 18
    OR EXTRACT(dow FROM timestamp) IN (0, 6)
  )
GROUP BY user_email, table_name, action
HAVING COUNT(*) > 10
ORDER BY count DESC;
```

#### 3. Vérification des suppressions

```sql
-- Toutes les suppressions des dernières 24h
SELECT 
    user_email,
    table_name,
    record_id,
    timestamp,
    old_values->>'description' as description
FROM audit_logs 
WHERE action = 'DELETE' 
  AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

**Actions à prendre** :
- Vérifier la légitimité des suppressions importantes
- Contacter les utilisateurs pour les suppressions en masse
- Documenter les suppressions de données critiques

#### 4. Contrôle des échecs système

```sql
-- Vérifier les gaps dans les logs (possibles échecs)
WITH log_gaps AS (
  SELECT 
    table_name,
    LAG(timestamp) OVER (PARTITION BY table_name ORDER BY timestamp) as prev_time,
    timestamp,
    timestamp - LAG(timestamp) OVER (PARTITION BY table_name ORDER BY timestamp) as gap
  FROM audit_logs 
  WHERE timestamp >= NOW() - INTERVAL '24 hours'
)
SELECT * FROM log_gaps 
WHERE gap > INTERVAL '2 hours'
ORDER BY gap DESC;
```

### Rapport quotidien automatisé

#### Template de rapport

```
📊 RAPPORT QUOTIDIEN D'AUDIT - [DATE]

🔢 STATISTIQUES GÉNÉRALES
• Total des logs : [NOMBRE]
• Créations : [NOMBRE] | Modifications : [NOMBRE] | Suppressions : [NOMBRE]
• Utilisateurs actifs : [NOMBRE]
• Entités affectées : [LISTE]

⚠️ ALERTES ET ANOMALIES
• Activités hors horaires : [NOMBRE]
• Suppressions importantes : [NOMBRE]
• Échecs potentiels : [NOMBRE]

🎯 ACTIONS REQUISES
• [ ] Vérifier les suppressions de [ENTITÉ]
• [ ] Contacter [UTILISATEUR] pour activité suspecte
• [ ] Investiguer les gaps de [HEURE] à [HEURE]

📈 TENDANCES
• Évolution vs hier : [+/-X%]
• Entité la plus active : [ENTITÉ]
• Utilisateur le plus actif : [UTILISATEUR]
```

## Maintenance hebdomadaire

### Checklist hebdomadaire (30 minutes)

#### 1. Analyse des performances

```sql
-- Requêtes lentes sur les tables d'audit
SELECT 
    query,
    mean_time,
    calls,
    total_time
FROM pg_stat_statements 
WHERE query LIKE '%audit_logs%'
  AND mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;
```

#### 2. Vérification de l'espace disque

```sql
-- Taille de la table audit_logs
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE tablename = 'audit_logs';
```

#### 3. Analyse des patterns d'utilisation

```sql
-- Top 10 des utilisateurs les plus actifs (7 derniers jours)
SELECT 
    user_email,
    COUNT(*) as total_actions,
    COUNT(CASE WHEN action = 'INSERT' THEN 1 END) as creations,
    COUNT(CASE WHEN action = 'UPDATE' THEN 1 END) as modifications,
    COUNT(CASE WHEN action = 'DELETE' THEN 1 END) as suppressions
FROM audit_logs 
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY user_email
ORDER BY total_actions DESC
LIMIT 10;
```

#### 4. Vérification de l'intégrité des données

```sql
-- Vérifier la cohérence des logs d'audit
SELECT 
    table_name,
    COUNT(*) as total_logs,
    COUNT(CASE WHEN old_values IS NULL AND action != 'INSERT' THEN 1 END) as missing_old_values,
    COUNT(CASE WHEN new_values IS NULL AND action != 'DELETE' THEN 1 END) as missing_new_values,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as missing_user_id
FROM audit_logs 
GROUP BY table_name;
```

### Optimisation des performances

#### Maintenance des index

```sql
-- Réindexer les tables d'audit (à faire hors heures de pointe)
REINDEX TABLE audit_logs;

-- Analyser les statistiques
ANALYZE audit_logs;

-- Vérifier l'utilisation des index
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'audit_logs'
ORDER BY idx_scan DESC;
```

#### Nettoyage automatique

```sql
-- Configurer l'autovacuum pour la table audit_logs
ALTER TABLE audit_logs SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);
```

## Gestion des incidents

### Classification des incidents

#### Niveau 1 : Incidents mineurs
- Requêtes lentes occasionnelles
- Alertes de volume dépassées
- Problèmes d'affichage UI

**Temps de résolution** : 2-4 heures

#### Niveau 2 : Incidents majeurs
- Échec d'enregistrement des logs
- Corruption de données d'audit
- Problèmes de permissions

**Temps de résolution** : 1-2 heures

#### Niveau 3 : Incidents critiques
- Perte de données d'audit
- Compromission de sécurité
- Panne complète du système d'audit

**Temps de résolution** : 15-30 minutes

### Procédures d'investigation

#### 1. Collecte d'informations

```bash
# Informations système
echo "=== INFORMATIONS SYSTÈME ==="
date
whoami
df -h
free -m

# État de la base de données
echo "=== ÉTAT BASE DE DONNÉES ==="
psql -c "SELECT version();"
psql -c "SELECT COUNT(*) FROM audit_logs;"
psql -c "SELECT MAX(timestamp) FROM audit_logs;"
```

#### 2. Analyse des logs système

```bash
# Logs PostgreSQL
tail -n 100 /var/log/postgresql/postgresql-*.log | grep -i audit

# Logs application
tail -n 100 /var/log/app/audit.log

# Logs système
journalctl -u postgresql -n 100 --no-pager
```

#### 3. Tests de fonctionnement

```sql
-- Test d'enregistrement d'audit
BEGIN;
INSERT INTO transactions (id, amount, description) 
VALUES (gen_random_uuid(), 999.99, 'Test audit incident');
SELECT COUNT(*) FROM audit_logs WHERE table_name = 'transactions' AND timestamp > NOW() - INTERVAL '1 minute';
ROLLBACK;
```

### Escalade et communication

#### Matrice d'escalade

| Niveau | Délai | Contact | Action |
|--------|-------|---------|--------|
| **L1** | Immédiat | Équipe technique | Investigation |
| **L2** | 15 min | Manager IT | Coordination |
| **L3** | 30 min | Direction | Décision business |
| **L4** | 1 heure | Équipe sécurité | Analyse forensique |

#### Template de communication d'incident

```
🚨 INCIDENT SYSTÈME D'AUDIT

📋 INFORMATIONS GÉNÉRALES
• ID Incident : [NUMÉRO]
• Niveau : [L1/L2/L3/L4]
• Détecté le : [DATE/HEURE]
• Détecté par : [NOM]
• Statut : [OUVERT/EN COURS/RÉSOLU]

🔍 DESCRIPTION
• Symptômes : [DESCRIPTION]
• Impact : [UTILISATEURS/FONCTIONS AFFECTÉES]
• Cause probable : [HYPOTHÈSE]

⚡ ACTIONS IMMÉDIATES
• [ACTION 1]
• [ACTION 2]
• [ACTION 3]

📞 CONTACTS
• Responsable incident : [NOM/TÉLÉPHONE]
• Équipe technique : [CONTACTS]
• Prochaine mise à jour : [HEURE]
```

## Archivage et rétention

### Politiques de rétention

#### Configuration par défaut

| Entité | Rétention active | Archivage | Suppression définitive |
|--------|------------------|-----------|----------------------|
| **Transactions** | 2 ans | 7 ans | 10 ans |
| **Réservations** | 1 an | 3 ans | 5 ans |
| **Tâches** | 6 mois | 2 ans | 3 ans |
| **Lofts** | 2 ans | 5 ans | 7 ans |

#### Procédure d'archivage mensuelle

```sql
-- 1. Identifier les logs à archiver
SELECT 
    table_name,
    COUNT(*) as logs_to_archive,
    MIN(timestamp) as oldest_log,
    MAX(timestamp) as newest_log
FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '2 years'
GROUP BY table_name;

-- 2. Archiver les anciens logs (exemple pour transactions)
INSERT INTO audit_logs_archive 
SELECT * FROM audit_logs 
WHERE table_name = 'transactions' 
  AND timestamp < NOW() - INTERVAL '2 years';

-- 3. Supprimer les logs archivés
DELETE FROM audit_logs 
WHERE table_name = 'transactions' 
  AND timestamp < NOW() - INTERVAL '2 years';

-- 4. Vérifier l'archivage
SELECT COUNT(*) FROM audit_logs_archive 
WHERE archived_date = CURRENT_DATE;
```

### Sauvegarde des données d'audit

#### Sauvegarde quotidienne

```bash
#!/bin/bash
# Script de sauvegarde quotidienne des logs d'audit

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/audit"
DB_NAME="loft_algerie"

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarder la table audit_logs
pg_dump -t audit_logs $DB_NAME | gzip > $BACKUP_DIR/audit_logs_$DATE.sql.gz

# Sauvegarder la table audit_logs_archive
pg_dump -t audit_logs_archive $DB_NAME | gzip > $BACKUP_DIR/audit_archive_$DATE.sql.gz

# Nettoyer les sauvegardes anciennes (> 30 jours)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Sauvegarde audit terminée : $DATE"
```

#### Vérification de l'intégrité des sauvegardes

```bash
#!/bin/bash
# Vérifier l'intégrité des sauvegardes d'audit

BACKUP_DIR="/backup/audit"
DATE=$(date +%Y%m%d)

# Vérifier la présence des fichiers
if [ -f "$BACKUP_DIR/audit_logs_$DATE.sql.gz" ]; then
    echo "✅ Sauvegarde audit_logs présente"
    # Tester l'intégrité du fichier
    gunzip -t "$BACKUP_DIR/audit_logs_$DATE.sql.gz"
    if [ $? -eq 0 ]; then
        echo "✅ Intégrité audit_logs OK"
    else
        echo "❌ Corruption détectée dans audit_logs"
    fi
else
    echo "❌ Sauvegarde audit_logs manquante"
fi
```

## Sécurité et conformité

### Contrôles de sécurité hebdomadaires

#### 1. Audit des accès

```sql
-- Vérifier les accès aux données d'audit (si audit_access_logs existe)
SELECT 
    user_email,
    access_type,
    COUNT(*) as access_count,
    MIN(access_time) as first_access,
    MAX(access_time) as last_access
FROM audit_access_logs 
WHERE access_time >= NOW() - INTERVAL '7 days'
GROUP BY user_email, access_type
ORDER BY access_count DESC;
```

#### 2. Détection d'activités suspectes

```sql
-- Activités en masse par un seul utilisateur
SELECT 
    user_email,
    table_name,
    action,
    COUNT(*) as action_count,
    MIN(timestamp) as start_time,
    MAX(timestamp) as end_time,
    (MAX(timestamp) - MIN(timestamp)) as duration
FROM audit_logs 
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY user_email, table_name, action
HAVING COUNT(*) > 100 
   AND (MAX(timestamp) - MIN(timestamp)) < INTERVAL '1 hour'
ORDER BY action_count DESC;
```

#### 3. Vérification de l'intégrité

```sql
-- Vérifier la cohérence chronologique
WITH chronology_check AS (
  SELECT 
    id,
    timestamp,
    LAG(timestamp) OVER (ORDER BY timestamp) as prev_timestamp
  FROM audit_logs 
  WHERE timestamp >= NOW() - INTERVAL '7 days'
)
SELECT COUNT(*) as chronology_violations
FROM chronology_check 
WHERE timestamp < prev_timestamp;
```

### Rapports de conformité

#### Rapport mensuel de conformité

```sql
-- Statistiques de conformité pour le mois
SELECT 
    'Logs générés' as metric,
    COUNT(*) as value,
    'logs' as unit
FROM audit_logs 
WHERE timestamp >= date_trunc('month', NOW())

UNION ALL

SELECT 
    'Utilisateurs actifs' as metric,
    COUNT(DISTINCT user_id) as value,
    'utilisateurs' as unit
FROM audit_logs 
WHERE timestamp >= date_trunc('month', NOW())

UNION ALL

SELECT 
    'Entités auditées' as metric,
    COUNT(DISTINCT table_name) as value,
    'types' as unit
FROM audit_logs 
WHERE timestamp >= date_trunc('month', NOW());
```

## Procédures d'urgence

### Panne complète du système d'audit

#### 1. Évaluation immédiate (0-5 minutes)

```bash
# Vérifier l'état de la base de données
psql -c "SELECT 1;" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Base de données inaccessible"
else
    echo "✅ Base de données accessible"
fi

# Vérifier la table audit_logs
psql -c "SELECT COUNT(*) FROM audit_logs LIMIT 1;" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Table audit_logs inaccessible"
else
    echo "✅ Table audit_logs accessible"
fi
```

#### 2. Actions correctives (5-15 minutes)

```sql
-- Vérifier les triggers d'audit
SELECT 
    schemaname,
    tablename,
    triggername,
    tgenabled
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
JOIN pg_namespace n ON c.relnamespace = n.oid 
WHERE triggername LIKE '%audit%';

-- Réactiver les triggers si nécessaire
ALTER TABLE transactions ENABLE TRIGGER audit_trigger;
ALTER TABLE tasks ENABLE TRIGGER audit_trigger;
ALTER TABLE reservations ENABLE TRIGGER audit_trigger;
ALTER TABLE lofts ENABLE TRIGGER audit_trigger;
```

#### 3. Restauration d'urgence (15-30 minutes)

```bash
# Restaurer depuis la dernière sauvegarde
LATEST_BACKUP=$(ls -t /backup/audit/audit_logs_*.sql.gz | head -1)
echo "Restauration depuis : $LATEST_BACKUP"

# Créer une table temporaire
psql -c "CREATE TABLE audit_logs_temp (LIKE audit_logs INCLUDING ALL);"

# Restaurer les données
gunzip -c $LATEST_BACKUP | psql

# Vérifier la restauration
psql -c "SELECT COUNT(*) FROM audit_logs_temp;"
```

### Corruption de données d'audit

#### Procédure de récupération

```sql
-- 1. Identifier l'étendue de la corruption
SELECT 
    table_name,
    COUNT(*) as total_logs,
    COUNT(CASE WHEN old_values IS NULL AND new_values IS NULL THEN 1 END) as corrupted_logs,
    MIN(timestamp) as first_corrupted,
    MAX(timestamp) as last_corrupted
FROM audit_logs 
WHERE (old_values IS NULL AND new_values IS NULL)
   OR (old_values = '{}' AND new_values = '{}')
GROUP BY table_name;

-- 2. Sauvegarder les données corrompues
CREATE TABLE audit_logs_corrupted AS 
SELECT * FROM audit_logs 
WHERE (old_values IS NULL AND new_values IS NULL)
   OR (old_values = '{}' AND new_values = '{}');

-- 3. Supprimer les entrées corrompues
DELETE FROM audit_logs 
WHERE id IN (SELECT id FROM audit_logs_corrupted);
```

### Communication de crise

#### Template d'alerte critique

```
🚨 ALERTE CRITIQUE - SYSTÈME D'AUDIT

⏰ HEURE : [TIMESTAMP]
🎯 IMPACT : Perte de traçabilité des opérations
📊 ÉTENDUE : [DESCRIPTION]

🔧 ACTIONS EN COURS :
• Investigation de la cause racine
• Isolation du problème
• Préparation de la restauration

📞 CONTACTS D'URGENCE :
• Responsable technique : [NOM/TÉLÉPHONE]
• Manager IT : [NOM/TÉLÉPHONE]
• Direction : [NOM/TÉLÉPHONE]

⏱️ PROCHAINE MISE À JOUR : Dans 15 minutes
```

---

## Annexes

### Scripts d'automatisation

#### Script de monitoring quotidien

```bash
#!/bin/bash
# /opt/scripts/audit_daily_check.sh

LOG_FILE="/var/log/audit_monitoring.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Début du contrôle quotidien d'audit" >> $LOG_FILE

# Vérifier le volume de logs
DAILY_LOGS=$(psql -t -c "SELECT COUNT(*) FROM audit_logs WHERE timestamp >= NOW() - INTERVAL '24 hours';")
echo "[$DATE] Logs générés (24h) : $DAILY_LOGS" >> $LOG_FILE

if [ $DAILY_LOGS -gt 5000 ]; then
    echo "[$DATE] ALERTE : Volume de logs élevé ($DAILY_LOGS)" >> $LOG_FILE
    # Envoyer une alerte
fi

# Vérifier les suppressions
DELETIONS=$(psql -t -c "SELECT COUNT(*) FROM audit_logs WHERE action = 'DELETE' AND timestamp >= NOW() - INTERVAL '24 hours';")
echo "[$DATE] Suppressions (24h) : $DELETIONS" >> $LOG_FILE

if [ $DELETIONS -gt 50 ]; then
    echo "[$DATE] ALERTE : Nombre de suppressions élevé ($DELETIONS)" >> $LOG_FILE
fi

echo "[$DATE] Fin du contrôle quotidien d'audit" >> $LOG_FILE
```

### Contacts et escalade

#### Équipe d'administration d'audit

| Rôle | Nom | Email | Téléphone | Disponibilité |
|------|-----|-------|-----------|---------------|
| **Admin Principal** | [NOM] | [EMAIL] | [TÉLÉPHONE] | 24/7 |
| **Admin Backup** | [NOM] | [EMAIL] | [TÉLÉPHONE] | Heures ouvrables |
| **Manager IT** | [NOM] | [EMAIL] | [TÉLÉPHONE] | 24/7 |
| **Équipe Sécurité** | [NOM] | [EMAIL] | [TÉLÉPHONE] | Sur appel |

---

*Ce document fait partie de la documentation officielle d'administration de Loft Algérie. Mise à jour requise tous les 6 mois.*