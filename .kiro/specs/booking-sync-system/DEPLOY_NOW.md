# 🚀 Guide de Déploiement Rapide

**Date:** 2026-05-14  
**Durée estimée:** 2-3 heures  
**Prérequis:** Comptes Supabase, Vercel, GitHub, Resend

---

## 📋 Checklist Rapide

### ☐ Étape 1: Supabase (30 min)
- [ ] Exécuter les migrations
- [ ] Vérifier les tables
- [ ] Configurer les URLs iCal (au moins 5 pour tester)

### ☐ Étape 2: Resend (10 min)
- [ ] Créer un compte
- [ ] Obtenir la clé API
- [ ] Vérifier le domaine (ou utiliser le domaine de test)

### ☐ Étape 3: Vercel (20 min)
- [ ] Configurer les variables d'environnement
- [ ] Déployer le code
- [ ] Vérifier le cron job

### ☐ Étape 4: GitHub (15 min)
- [ ] Configurer les secrets
- [ ] Activer le workflow
- [ ] Tester manuellement

### ☐ Étape 5: Tests (30 min)
- [ ] Test sync iCal manuel
- [ ] Test import CSV manuel
- [ ] Test alertes email

---

## 🗄️ ÉTAPE 1: Supabase (30 min)

### 1.1 Connexion à Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Se connecter à votre projet
3. Aller dans **SQL Editor**

### 1.2 Exécuter les Migrations

**Migration 1: Tables**

```sql
-- Copier le contenu de: supabase/migrations/001_booking_sync_tables.sql
-- Coller dans SQL Editor
-- Cliquer sur "Run"
```

**Migration 2: RLS Policies**

```sql
-- Copier le contenu de: supabase/migrations/002_rls_policies.sql
-- Coller dans SQL Editor
-- Cliquer sur "Run"
```

### 1.3 Vérifier les Tables

```sql
-- Vérifier que les 5 tables sont créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'airbnb_%' OR table_name LIKE 'property_%' OR table_name = 'system_settings')
ORDER BY table_name;

-- Résultat attendu:
-- airbnb_bookings
-- airbnb_conflicts
-- airbnb_sync_logs
-- property_sync_config
-- system_settings
```

### 1.4 Configuration Initiale

```sql
-- Insérer le toggle Playwright
INSERT INTO system_settings (key, value) 
VALUES ('playwright_toggle', 'true')
ON CONFLICT (key) DO UPDATE SET value = 'true';

-- Vérifier
SELECT * FROM system_settings;
```

### 1.5 Configurer les URLs iCal (au moins 5 pour tester)

**Option A: Via SQL**

```sql
-- Remplacer les valeurs par vos vraies données
INSERT INTO property_sync_config (loft_id, ical_url, is_active)
VALUES 
  ('uuid-loft-1', 'https://www.airbnb.com/calendar/ical/XXXXX1.ics', true),
  ('uuid-loft-2', 'https://www.airbnb.com/calendar/ical/XXXXX2.ics', true),
  ('uuid-loft-3', 'https://www.airbnb.com/calendar/ical/XXXXX3.ics', true),
  ('uuid-loft-4', 'https://www.airbnb.com/calendar/ical/XXXXX4.ics', true),
  ('uuid-loft-5', 'https://www.airbnb.com/calendar/ical/XXXXX5.ics', true);
```

**Option B: Via UI Admin (après déploiement)**
- Aller sur `/admin/properties/sync-config`
- Configurer les URLs une par une

### 1.6 Récupérer les Credentials Supabase

1. Aller dans **Settings** → **API**
2. Copier:
   - **Project URL:** `https://xxx.supabase.co`
   - **anon public key:** Pour NEXT_PUBLIC_SUPABASE_ANON_KEY
   - **service_role key:** Pour SUPABASE_SERVICE_ROLE_KEY

**⚠️ IMPORTANT:** Gardez ces valeurs pour l'étape Vercel

---

## 📧 ÉTAPE 2: Resend (10 min)

### 2.1 Créer un Compte

1. Aller sur [resend.com](https://resend.com)
2. Cliquer sur "Sign Up"
3. Créer un compte (gratuit: 100 emails/jour)

### 2.2 Obtenir la Clé API

1. Aller dans **API Keys**
2. Cliquer sur "Create API Key"
3. Nom: "Algerie Loft - Production"
4. Permissions: "Full Access"
5. Copier la clé (commence par `re_`)

**⚠️ IMPORTANT:** Gardez cette clé pour l'étape Vercel

### 2.3 Configurer le Domaine

**Option A: Domaine de Test (Recommandé pour commencer)**
- Utiliser `onboarding@resend.dev` comme expéditeur
- Pas de configuration nécessaire
- Limité à votre email uniquement

**Option B: Domaine Custom**
1. Aller dans **Domains**
2. Cliquer sur "Add Domain"
3. Entrer votre domaine (ex: `votredomaine.com`)
4. Ajouter les enregistrements DNS (SPF, DKIM, DMARC)
5. Attendre la vérification (quelques minutes)

---

## ☁️ ÉTAPE 3: Vercel (20 min)

### 3.1 Préparer les Variables d'Environnement

Créez un fichier temporaire avec vos valeurs:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Cron
CRON_SECRET=générer-avec-openssl-rand-base64-32

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
ADMIN_EMAIL=votre-email@example.com
ALERT_FROM_EMAIL=alerts@votredomaine.com
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

**Générer CRON_SECRET:**
```bash
# Sur Windows PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Ou utiliser un générateur en ligne
# https://generate-random.org/api-token-generator
```

### 3.2 Déployer sur Vercel

**Option A: Via Vercel CLI (Recommandé)**

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod

# Suivre les instructions
# - Link to existing project? No
# - Project name? algerie-loft
# - Directory? ./
# - Override settings? No
```

**Option B: Via GitHub (Auto-deploy)**

1. Pusher le code sur GitHub
2. Aller sur [vercel.com](https://vercel.com)
3. Cliquer sur "Import Project"
4. Sélectionner votre repo GitHub
5. Cliquer sur "Deploy"

### 3.3 Configurer les Variables d'Environnement

1. Aller dans **Vercel Dashboard**
2. Sélectionner votre projet
3. Aller dans **Settings** → **Environment Variables**
4. Ajouter chaque variable:

| Name | Value | Environment |
|------|-------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | https://xxx.supabase.co | Production |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJxxx... | Production |
| SUPABASE_SERVICE_ROLE_KEY | eyJxxx... | Production |
| CRON_SECRET | votre-secret-généré | Production |
| RESEND_API_KEY | re_xxxxxxxxxxxxx | Production |
| ADMIN_EMAIL | votre-email@example.com | Production |
| ALERT_FROM_EMAIL | alerts@votredomaine.com | Production |
| NEXT_PUBLIC_APP_URL | https://votre-app.vercel.app | Production |

5. Cliquer sur "Save" pour chaque variable

### 3.4 Re-déployer

Après avoir ajouté les variables:

```bash
# Via CLI
vercel --prod

# Ou via Dashboard
# Deployments → ... → Redeploy
```

### 3.5 Vérifier le Cron Job

1. Aller dans **Settings** → **Cron Jobs**
2. Vérifier que le cron est listé:
   - Path: `/api/cron/sync-ical`
   - Schedule: `*/30 * * * *` (toutes les 30 minutes)
3. Le cron sera actif automatiquement

---

## 🐙 ÉTAPE 4: GitHub (15 min)

### 4.1 Configurer les Secrets

1. Aller sur votre repo GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Cliquer sur "New repository secret"
4. Ajouter chaque secret:

| Name | Value |
|------|-------|
| AIRBNB_EMAIL | votre-email@airbnb.com |
| AIRBNB_PASSWORD | votre-mot-de-passe |
| API_SECRET | générer-avec-openssl-rand-base64-32 |
| SUPABASE_URL | https://xxx.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | eyJxxx... |

### 4.2 Vérifier le Workflow

1. Aller dans **Actions**
2. Vérifier que le workflow "Airbnb CSV Export" est listé
3. Il se déclenchera automatiquement à 3h UTC

### 4.3 Tester Manuellement

1. Aller dans **Actions**
2. Sélectionner "Airbnb CSV Export"
3. Cliquer sur "Run workflow"
4. Sélectionner la branche `main`
5. Cliquer sur "Run workflow"
6. Attendre 2-5 minutes
7. Vérifier les logs

**⚠️ ATTENTION:** Ce test va se connecter à Airbnb. Assurez-vous que:
- Les credentials sont corrects
- Playwright toggle est activé dans Supabase
- Vous n'avez pas de CAPTCHA actif

---

## 🧪 ÉTAPE 5: Tests Post-Déploiement (30 min)

### 5.1 Test Sync iCal Manuel

1. Aller sur `https://votre-app.vercel.app/admin/calendar`
2. Se connecter en tant qu'admin
3. Cliquer sur "Sync Now"
4. Attendre 30s-2min
5. Vérifier:
   - ✅ Message de succès
   - ✅ Réservations apparaissent dans le calendrier
   - ✅ Logs dans `/admin/sync-logs`

**Si ça échoue:**
- Vérifier les URLs iCal dans Supabase
- Vérifier les logs Vercel
- Vérifier les variables d'environnement

### 5.2 Test Import CSV Manuel

1. Télécharger un CSV depuis Airbnb:
   - Airbnb → Hosting → Reservations → Export
2. Aller sur `https://votre-app.vercel.app/admin/import-csv`
3. Glisser-déposer le fichier CSV
4. Attendre quelques secondes
5. Vérifier:
   - ✅ Métriques affichées (parsing, matching, processing)
   - ✅ Réservations enrichies dans le calendrier
   - ✅ Logs dans `/admin/sync-logs`

### 5.3 Test Alertes Email

1. Aller sur `https://votre-app.vercel.app/api/alerts/test`
2. Utiliser Postman ou cURL:

```bash
# Test alerte de conflit
curl -X POST https://votre-app.vercel.app/api/alerts/test \
  -H "Authorization: Bearer votre-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"type":"conflict"}'

# Test alerte Playwright
curl -X POST https://votre-app.vercel.app/api/alerts/test \
  -H "Authorization: Bearer votre-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"type":"playwright"}'
```

3. Vérifier:
   - ✅ Réponse `{"success": true}`
   - ✅ Email reçu dans votre boîte
   - ✅ Email pas dans les spams
   - ✅ Template HTML correct

### 5.4 Test Cron Job

1. Attendre le prochain cron (max 30 min)
2. Aller dans **Vercel Dashboard** → **Logs**
3. Filtrer par `/api/cron/sync-ical`
4. Vérifier:
   - ✅ Cron exécuté
   - ✅ Status 200
   - ✅ Logs de sync
   - ✅ Nouvelles réservations dans Supabase

### 5.5 Test GitHub Actions

1. Attendre le prochain run (3h UTC) ou déclencher manuellement
2. Aller dans **GitHub** → **Actions**
3. Vérifier:
   - ✅ Workflow exécuté
   - ✅ Status success
   - ✅ Logs de Playwright
   - ✅ CSV téléchargé et traité
   - ✅ Réservations enrichies dans Supabase

---

## 📊 Monitoring (Premières 24h)

### Métriques à Surveiller

**Dans Supabase:**

```sql
-- Taux de succès iCal (dernières 24h)
SELECT 
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate
FROM airbnb_sync_logs
WHERE sync_type = 'ical_auto'
AND created_at > NOW() - INTERVAL '24 hours';

-- Nombre de réservations créées (dernières 24h)
SELECT COUNT(*) 
FROM airbnb_bookings
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Nombre de conflits critiques (dernières 24h)
SELECT COUNT(*) 
FROM airbnb_conflicts
WHERE created_at > NOW() - INTERVAL '24 hours'
AND severity = 'critical';
```

**Dans Vercel Dashboard:**
- Logs → Filtrer par `/api/cron/sync-ical`
- Vérifier les erreurs
- Vérifier la durée d'exécution (< 30s)

**Dans Resend Dashboard:**
- Emails → Vérifier les emails envoyés
- Vérifier le taux de délivrabilité
- Vérifier qu'ils ne sont pas marqués comme spam

---

## ✅ Checklist Finale

### Supabase
- [x] Migrations exécutées
- [x] Tables créées (5)
- [x] RLS activé
- [x] Policies créées (22)
- [x] system_settings configuré
- [x] 5+ URLs iCal configurées

### Resend
- [x] Compte créé
- [x] Clé API obtenue
- [x] Domaine configuré (test ou custom)

### Vercel
- [x] Code déployé
- [x] Variables d'environnement configurées (8)
- [x] Cron job actif
- [x] URL de production obtenue

### GitHub
- [x] Secrets configurés (5)
- [x] Workflow actif
- [x] Test manuel réussi

### Tests
- [x] Sync iCal manuel réussi
- [x] Import CSV manuel réussi
- [x] Alertes email reçues
- [x] Cron job exécuté
- [x] GitHub Actions exécuté

---

## 🎉 Félicitations !

Votre système de synchronisation Airbnb est maintenant **EN PRODUCTION** ! 🚀

### Prochaines Actions

1. **Configurer les 85 URLs iCal** (via `/admin/properties/sync-config`)
2. **Monitorer pendant 1 semaine** en parallèle avec Beds24
3. **Former l'équipe** à l'utilisation du système
4. **Désactiver Beds24** après validation complète

### Support

- 📖 **Documentation:** `docs/BOOKING_SYNC_README.md`
- 📋 **Troubleshooting:** Section dans le README
- 📧 **Contact:** admin@votredomaine.com

---

**Économies annuelles:** €3,060-5,100  
**ROI:** Immédiat  
**Status:** ✅ EN PRODUCTION

---

*Guide créé le 2026-05-14*
