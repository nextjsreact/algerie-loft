# Booking Sync System - Setup Guide

## 📋 Overview

Ce guide explique comment configurer le système de synchronisation Airbnb dans votre environnement.

## 🗄️ Database Setup

### 1. Exécuter les Migrations

Les migrations doivent être exécutées dans l'ordre:

```bash
# Migration 1: Tables et indexes
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/migrations/001_booking_sync_tables.sql

# Migration 2: RLS Policies
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/migrations/002_rls_policies.sql
```

**Ou via Supabase Dashboard:**
1. Aller dans `Database` → `Migrations`
2. Créer une nouvelle migration
3. Copier le contenu de `001_booking_sync_tables.sql`
4. Exécuter
5. Répéter pour `002_rls_policies.sql`

### 2. Vérifier l'Installation

```sql
-- Vérifier que toutes les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('property_sync_config', 'bookings', 'conflicts', 'sync_logs', 'system_settings');

-- Devrait retourner 5 lignes

-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('property_sync_config', 'bookings', 'conflicts', 'sync_logs', 'system_settings');

-- rowsecurity devrait être TRUE pour toutes les tables

-- Vérifier le Playwright Toggle
SELECT * FROM system_settings WHERE key = 'playwright_toggle';
-- Devrait retourner: key='playwright_toggle', value='true'
```

## 🔐 Environment Variables

### Vercel Environment Variables

Configurer dans Vercel Dashboard → Settings → Environment Variables:

```bash
# Cron Secret (générer un token aléatoire sécurisé)
CRON_SECRET=your-secure-random-token-here

# Resend API (pour les alertes email)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email admin (pour recevoir les alertes)
ADMIN_EMAIL=admin@loftalgerie.com

# Supabase (déjà configuré normalement)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### GitHub Secrets

Configurer dans GitHub → Settings → Secrets and variables → Actions:

```bash
# Credentials Airbnb
AIRBNB_EMAIL=your-airbnb-email@example.com
AIRBNB_PASSWORD=your-airbnb-password

# API Secret (pour vérifier le Playwright Toggle)
API_SECRET=your-api-secret-token

# Supabase (pour push des données CSV)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Générer des Tokens Sécurisés

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## 📝 Configuration des Propriétés

### 1. Obtenir les URLs iCal Airbnb

Pour chaque propriété Airbnb:

1. Aller sur Airbnb → Calendrier
2. Cliquer sur "Disponibilité" → "Synchroniser le calendrier"
3. Copier l'URL iCal (commence par `https://www.airbnb.com/calendar/ical/...`)

### 2. Configurer dans la Base de Données

```sql
-- Insérer la configuration iCal pour une propriété
INSERT INTO property_sync_config (property_id, ical_url_airbnb, is_active)
VALUES (
  'uuid-de-la-propriete',
  'https://www.airbnb.com/calendar/ical/xxxxx.ics?s=xxxxx',
  true
);

-- Ou mettre à jour une configuration existante
UPDATE property_sync_config
SET ical_url_airbnb = 'https://www.airbnb.com/calendar/ical/xxxxx.ics?s=xxxxx',
    is_active = true
WHERE property_id = 'uuid-de-la-propriete';
```

### 3. Configuration en Masse (Script)

```sql
-- Activer toutes les propriétés avec iCal URL
UPDATE property_sync_config
SET is_active = true
WHERE ical_url_airbnb IS NOT NULL;

-- Désactiver les propriétés sans iCal URL
UPDATE property_sync_config
SET is_active = false
WHERE ical_url_airbnb IS NULL;
```

## 🚀 Déploiement

### 1. Déployer sur Vercel

```bash
# Commit et push
git add .
git commit -m "feat: Add booking sync system"
git push origin main

# Vercel déploiera automatiquement
```

### 2. Vérifier le Cron Job

1. Aller dans Vercel Dashboard → Project → Cron Jobs
2. Vérifier que `/api/cron/sync-ical` apparaît avec schedule `*/30 * * * *`
3. Tester manuellement: cliquer sur "Run Now"

### 3. Configurer GitHub Actions

Le workflow `.github/workflows/airbnb-csv-export.yml` sera automatiquement détecté.

Vérifier:
1. GitHub → Actions → Workflows
2. "Airbnb CSV Export" devrait apparaître
3. Schedule: `0 3 * * *` (3h UTC tous les jours)

## 🧪 Tests

### Test 1: Sync iCal Manuel

```bash
# Appeler l'endpoint cron avec le secret
curl -X POST https://www.loftalgerie.com/api/cron/sync-ical \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Devrait retourner:
# {
#   "success": true,
#   "sync_log_id": "uuid",
#   "metrics": {
#     "properties_synced": 85,
#     "bookings_created": 12,
#     ...
#   }
# }
```

### Test 2: Vérifier les Données

```sql
-- Voir les réservations créées
SELECT 
  b.id,
  p.name as property_name,
  b.source,
  b.check_in_date,
  b.check_out_date,
  b.is_complete,
  b.created_at
FROM bookings b
JOIN properties p ON p.id = b.property_id
ORDER BY b.created_at DESC
LIMIT 10;

-- Voir les logs de sync
SELECT 
  sync_type,
  status,
  properties_synced,
  bookings_created,
  bookings_updated,
  conflicts_detected,
  created_at
FROM sync_logs
ORDER BY created_at DESC
LIMIT 5;
```

### Test 3: Playwright Toggle

```bash
# Vérifier le toggle
curl https://www.loftalgerie.com/api/settings/playwright-toggle \
  -H "Authorization: Bearer YOUR_API_SECRET"

# Devrait retourner:
# {"enabled": true}
```

## 📊 Monitoring

### Dashboard Sync Logs

Accéder à: `https://www.loftalgerie.com/fr/admin/sync-logs`

Affiche:
- Historique des synchronisations (30 derniers jours)
- Métriques par type de sync
- Taux de succès
- Erreurs détaillées

### Alertes Email

Les alertes sont envoyées automatiquement pour:
- ✉️ Conflits critiques (double réservation)
- ✉️ Échec Playwright 3 jours consécutifs
- ✉️ Erreurs d'authentification

## 🔧 Troubleshooting

### Problème: Cron ne se déclenche pas

**Solution:**
1. Vérifier que `CRON_SECRET` est configuré dans Vercel
2. Vérifier les logs Vercel: Dashboard → Logs → Filter by `/api/cron/sync-ical`
3. Tester manuellement avec curl

### Problème: Aucune réservation créée

**Solution:**
1. Vérifier que les propriétés ont `is_active = true`
2. Vérifier que les URLs iCal sont valides (tester dans le navigateur)
3. Vérifier les logs: `SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 1;`

### Problème: Playwright échoue

**Solution:**
1. Vérifier les credentials Airbnb dans GitHub Secrets
2. Vérifier les logs GitHub Actions
3. Désactiver temporairement: `UPDATE system_settings SET value = 'false' WHERE key = 'playwright_toggle';`

### Problème: RLS bloque les opérations

**Solution:**
1. Vérifier que le service role key est utilisé pour les opérations sync
2. Vérifier les policies: `SELECT * FROM pg_policies WHERE tablename = 'bookings';`
3. Tester avec un utilisateur admin

## 📚 Ressources

- **Spec Requirements:** `.kiro/specs/booking-sync-system/requirements.md`
- **Spec Design:** `.kiro/specs/booking-sync-system/design.md`
- **Spec Tasks:** `.kiro/specs/booking-sync-system/tasks.md`
- **Migrations:** `supabase/migrations/`

## ✅ Checklist de Déploiement

- [ ] Migrations exécutées (001, 002)
- [ ] Variables d'environnement Vercel configurées
- [ ] GitHub Secrets configurés
- [ ] URLs iCal configurées pour les 85 propriétés
- [ ] Cron job vérifié dans Vercel Dashboard
- [ ] GitHub Actions workflow vérifié
- [ ] Test manuel du sync iCal réussi
- [ ] Première synchronisation automatique réussie (attendre 30 min)
- [ ] Alertes email testées
- [ ] Dashboard sync logs accessible

---

**Date de création:** 2026-05-14  
**Version:** 1.0.0  
**Auteur:** Kiro AI
