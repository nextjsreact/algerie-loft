# Guide de Configuration - Système de Synchronisation Airbnb

**Version:** 1.0  
**Date:** 2026-05-14  
**Status:** Phases 1-5 complétées (63%)

---

## 📋 Vue d'Ensemble

Ce guide vous accompagne dans la configuration complète du système de synchronisation Airbnb qui remplace Beds24 et économise €3,060-5,100/an.

### Système à 3 Niveaux

1. **iCal automatique** (30 min) - Dates uniquement
2. **Playwright CSV** (1x/jour à 3h) - Détails complets
3. **CSV manuel** (on-demand) - Backup admin

---

## ✅ Prérequis

### Comptes et Accès
- [x] Compte Airbnb avec accès aux 85 lofts
- [x] Compte Supabase (déjà configuré)
- [x] Compte Vercel (déjà configuré)
- [x] Repository GitHub

### Packages npm
```bash
npm install csv-parse  # ⚠️ Actuellement bloqué par erreur Sentry
```

---

## 🔧 Configuration Étape par Étape

### Étape 1: Configuration Supabase ✅

**Status:** ✅ Déjà complété

Les migrations ont été exécutées :
- `001_booking_sync_tables.sql` - 5 tables créées
- `002_rls_policies.sql` - 22 policies créées

**Vérification:**
```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'property_sync_config',
  'airbnb_bookings',
  'airbnb_conflicts',
  'airbnb_sync_logs',
  'system_settings'
);

-- Vérifier le toggle Playwright
SELECT * FROM system_settings WHERE key = 'playwright_toggle';
```

---

### Étape 2: Configuration Vercel

#### 2.1 Variables d'Environnement

Aller sur **Vercel Dashboard → Votre Projet → Settings → Environment Variables**

Ajouter les variables suivantes :

```env
# Supabase (déjà configurées normalement)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cron Secret (générer un UUID)
CRON_SECRET=votre-cron-secret-unique

# Email Alerts (Phase 7)
RESEND_API_KEY=re_xxx
ADMIN_EMAIL=admin@votredomaine.com

# API Secret pour Playwright
API_SECRET=votre-api-secret-unique
```

**Générer des secrets sécurisés:**
```bash
# Linux/Mac
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### 2.2 Vérifier le Cron

Le fichier `vercel.json` contient déjà la configuration :
```json
{
  "crons": [{
    "path": "/api/cron/sync-ical",
    "schedule": "*/30 * * * *"
  }]
}
```

**Après déploiement:**
1. Aller sur Vercel Dashboard → Votre Projet → Cron Jobs
2. Vérifier que le cron apparaît
3. Vérifier les exécutions dans les logs

---

### Étape 3: Configuration GitHub Secrets

#### 3.1 Ajouter les Secrets

Aller sur **GitHub → Votre Repository → Settings → Secrets and variables → Actions**

Cliquer sur **"New repository secret"** et ajouter :

| Nom | Valeur | Description |
|-----|--------|-------------|
| `AIRBNB_EMAIL` | votre-email@example.com | Email du compte Airbnb |
| `AIRBNB_PASSWORD` | votre-mot-de-passe | Mot de passe Airbnb |
| `SUPABASE_URL` | https://xxx.supabase.co | URL Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGc... | Clé service role |
| `API_SECRET` | votre-api-secret | Même que Vercel |

#### 3.2 Vérifier les Permissions

1. Aller sur **Settings → Actions → General**
2. Sous "Workflow permissions"
3. Cocher **"Read and write permissions"**
4. Sauvegarder

---

### Étape 4: Configuration des URLs iCal

#### 4.1 Récupérer les URLs iCal Airbnb

Pour chaque loft :
1. Aller sur Airbnb → Hosting → Calendar
2. Cliquer sur "Availability settings"
3. Cliquer sur "Export calendar"
4. Copier l'URL iCal (format: `https://www.airbnb.com/calendar/ical/...`)

#### 4.2 Insérer dans Supabase

```sql
-- Pour chaque loft
INSERT INTO property_sync_config (loft_id, ical_url, is_active)
VALUES (
  'loft-id-uuid',
  'https://www.airbnb.com/calendar/ical/xxx.ics?s=yyy',
  true
);

-- Exemple pour plusieurs lofts
INSERT INTO property_sync_config (loft_id, ical_url, is_active)
SELECT 
  id,
  NULL, -- À remplir manuellement
  true
FROM lofts
WHERE id IN ('loft-1', 'loft-2', 'loft-3');
```

**Note:** Cette étape peut être automatisée via l'UI (Phase 6, Task 6.2)

---

### Étape 5: Premier Test

#### 5.1 Test du Sync iCal (Manuel)

```bash
# Appeler l'API de sync manuel
curl -X POST https://votre-domaine.vercel.app/api/sync/trigger \
  -H "Authorization: Bearer VOTRE_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Vérifier les résultats:**
```sql
SELECT * FROM airbnb_sync_logs 
ORDER BY created_at DESC 
LIMIT 1;

SELECT COUNT(*) FROM airbnb_bookings 
WHERE source = 'airbnb_ical';
```

#### 5.2 Test du CSV Import (Manuel)

```bash
# Uploader un CSV de test
curl -X POST https://votre-domaine.vercel.app/api/import/csv \
  -H "Authorization: Bearer VOTRE_JWT_TOKEN" \
  -F "file=@test-airbnb-export.csv"
```

#### 5.3 Test du Playwright (Local)

```bash
# Définir les variables d'environnement
export AIRBNB_EMAIL="votre-email@example.com"
export AIRBNB_PASSWORD="votre-mot-de-passe"
export NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
export API_SECRET="votre-api-secret"
export PLAYWRIGHT_HEADLESS="false"

# Exécuter le script
npx tsx scripts/airbnbExport.ts
```

#### 5.4 Test du Playwright (GitHub Actions)

1. Aller sur **GitHub → Actions**
2. Sélectionner **"Airbnb CSV Export Automation"**
3. Cliquer **"Run workflow"**
4. Sélectionner la branche
5. Cliquer **"Run workflow"**
6. Attendre 5-10 minutes
7. Vérifier les logs

---

## 📊 Monitoring et Vérification

### Dashboard Supabase

```sql
-- Vue d'ensemble des syncs
SELECT 
  sync_type,
  status,
  COUNT(*) as total,
  AVG(duration_ms) as avg_duration,
  SUM(bookings_created) as total_created,
  SUM(bookings_updated) as total_updated
FROM airbnb_sync_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY sync_type, status
ORDER BY sync_type, status;

-- Derniers syncs
SELECT 
  sync_type,
  status,
  properties_synced,
  bookings_created,
  bookings_updated,
  conflicts_detected,
  errors_count,
  duration_ms,
  created_at
FROM airbnb_sync_logs
ORDER BY created_at DESC
LIMIT 20;

-- Réservations par source
SELECT 
  source,
  is_complete,
  csv_only_flag,
  COUNT(*) as total
FROM airbnb_bookings
GROUP BY source, is_complete, csv_only_flag
ORDER BY source;
```

### Vercel Logs

1. Aller sur **Vercel Dashboard → Votre Projet → Logs**
2. Filtrer par fonction : `/api/cron/sync-ical`
3. Vérifier les exécutions toutes les 30 minutes

### GitHub Actions Logs

1. Aller sur **GitHub → Actions**
2. Sélectionner **"Airbnb CSV Export Automation"**
3. Voir les exécutions quotidiennes à 3h UTC

---

## 🔧 Troubleshooting

### Problème 1: Cron ne s'exécute pas

**Symptômes:**
- Pas de logs dans Vercel
- Pas d'entrées dans `airbnb_sync_logs`

**Solutions:**
1. Vérifier que le cron est activé dans Vercel Dashboard
2. Vérifier la variable `CRON_SECRET`
3. Vérifier les logs Vercel pour les erreurs
4. Tester manuellement : `POST /api/cron/sync-ical` avec header `Authorization: Bearer CRON_SECRET`

### Problème 2: Playwright échoue

**Symptômes:**
- GitHub Actions échoue
- Erreur "Login failed" ou "CAPTCHA detected"

**Solutions:**
1. Vérifier les credentials Airbnb dans GitHub Secrets
2. Désactiver le toggle temporairement
3. Attendre 48h avant de réessayer
4. Tester en local avec `PLAYWRIGHT_HEADLESS=false`
5. Vérifier les screenshots dans les artifacts

### Problème 3: CSV parsing échoue

**Symptômes:**
- Erreur "Format CSV invalide"
- Beaucoup d'erreurs de parsing

**Solutions:**
1. Vérifier le format du CSV Airbnb (peut changer)
2. Vérifier les colonnes dans `csvParser.ts`
3. Tester avec un CSV de test
4. Vérifier l'encodage (UTF-8 avec BOM)

### Problème 4: Matching ne trouve pas les lofts

**Symptômes:**
- Beaucoup de "Loft non trouvé"
- `no_matches` élevé

**Solutions:**
1. Vérifier les noms dans la table `lofts`
2. Vérifier les noms dans le CSV Airbnb
3. Ajuster la normalisation dans `reservationMatcher.ts`
4. Créer un mapping manuel si nécessaire

### Problème 5: Package csv-parse non installé

**Symptômes:**
- Erreur "Cannot find module 'csv-parse'"

**Solutions:**
1. Résoudre le problème Sentry CLI
2. Essayer `npm install csv-parse --legacy-peer-deps`
3. Essayer `npm install csv-parse --force`
4. Vérifier `package.json` et `package-lock.json`

---

## 📈 Métriques de Succès

### Objectifs

| Métrique | Objectif | Actuel |
|----------|----------|--------|
| **Sync iCal** | Toutes les 30 min | ⏳ À vérifier |
| **Sync CSV** | 1x/jour à 3h | ⏳ À vérifier |
| **Success rate** | > 95% | ⏳ À mesurer |
| **Exact matches** | > 80% | ⏳ À mesurer |
| **Fuzzy matches** | < 15% | ⏳ À mesurer |
| **No matches** | < 5% | ⏳ À mesurer |
| **Conflicts** | 0 | ⏳ À mesurer |

### Calcul du ROI

**Coût Beds24:**
- 85 lofts × €3-5/mois = €255-425/mois
- €3,060-5,100/an

**Coût Système Custom:**
- Vercel: €0 (hobby) ou €20/mois (pro)
- Supabase: €0 (free tier) ou €25/mois (pro)
- GitHub Actions: €0 (2000 min/mois gratuit)
- **Total: €0-45/mois = €0-540/an**

**Économies: €2,520-4,560/an (83-89%)**

---

## 🚀 Prochaines Étapes

### Phase 6: UI Components (À venir)
- [ ] Unified Calendar Component
- [ ] Property Sync Config Page
- [ ] Sync Logs Dashboard
- [ ] Manual CSV Import Page
- [ ] Settings Page (Playwright Toggle)

### Phase 7: Alerts & Monitoring (À venir)
- [ ] Email alerts pour conflits
- [ ] Email alerts pour échecs Playwright
- [ ] Dashboard de monitoring

### Phase 8: Testing & Validation (À venir)
- [ ] Tests d'intégration
- [ ] Tests property-based
- [ ] Validation complète

### Phase 9: Documentation & Deployment (À venir)
- [ ] README complet
- [ ] Déploiement production
- [ ] Formation équipe

---

## 📞 Support

### Documentation
- **Requirements:** `.kiro/specs/booking-sync-system/requirements.md`
- **Design:** `.kiro/specs/booking-sync-system/design.md`
- **Tasks:** `.kiro/specs/booking-sync-system/tasks.md`
- **Progress:** `.kiro/specs/booking-sync-system/PROGRESS.md`

### Phases Complétées
- **Phase 1:** `.kiro/specs/booking-sync-system/PHASE1_COMPLETE.md`
- **Phase 2:** `.kiro/specs/booking-sync-system/PHASE2_COMPLETE.md`
- **Phase 3:** `.kiro/specs/booking-sync-system/PHASE3_COMPLETE.md`
- **Phase 4:** `.kiro/specs/booking-sync-system/PHASE4_COMPLETE.md`
- **Phase 5:** `.kiro/specs/booking-sync-system/PHASE5_COMPLETE.md`

---

**Bon courage avec la configuration ! 🚀**
