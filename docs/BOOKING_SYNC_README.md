# Système de Synchronisation Airbnb - Documentation Complète

**Version:** 1.0.0  
**Date:** 2026-05-14  
**Status:** Production Ready ✅

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Installation & Configuration](#installation--configuration)
4. [Utilisation](#utilisation)
5. [API Routes](#api-routes)
6. [Monitoring & Alertes](#monitoring--alertes)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## 🎯 Vue d'Ensemble

### Objectif

Remplacer **Beds24** par un système custom de synchronisation des réservations Airbnb pour **85 lofts**, permettant une économie annuelle de **€3,060-5,100**.

### Fonctionnalités Principales

- ✅ **Synchronisation automatique iCal** (toutes les 30 minutes)
- ✅ **Export CSV automatique via Playwright** (1x/jour à 3h UTC)
- ✅ **Import CSV manuel** (backup admin)
- ✅ **Détection automatique des conflits** de réservation
- ✅ **Alertes par email** (conflits + échecs système)
- ✅ **Calendrier unifié** pour tous les lofts
- ✅ **Dashboard de monitoring** avec logs détaillés

### Architecture à 3 Niveaux

```
┌─────────────────────────────────────────────────────────────┐
│                    NIVEAU 1: iCal Sync                      │
│  Vercel Cron (30 min) → Fetch iCal → Parse → Store         │
│  Données: Dates uniquement (check-in, check-out)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   NIVEAU 2: CSV Sync                        │
│  GitHub Actions (3h UTC) → Playwright → CSV → Match → Store│
│  Données: Détails complets (guest, amount, status, etc.)   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   NIVEAU 3: CSV Manuel                      │
│  Admin Upload → Parse → Match → Store                      │
│  Données: Backup manuel si Playwright échoue               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

### Stack Technique

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Server Actions
- **Database:** Supabase PostgreSQL
- **Hosting:** Vercel (frontend + cron), GitHub Actions (Playwright)
- **Emails:** Resend API
- **Automation:** Playwright (browser automation)

### Base de Données

#### Tables Principales

1. **`lofts`** (existante)
   - Contient les 85 lofts Airbnb
   - Colonnes: id, name, address, etc.

2. **`property_sync_config`**
   - Configuration des URLs iCal par loft
   - Colonnes: loft_id, ical_url, is_active, last_sync_at

3. **`airbnb_bookings`**
   - Réservations synchronisées
   - Contrainte unique: `(loft_id, check_in_date, check_out_date)`
   - Colonnes: id, loft_id, check_in_date, check_out_date, guest_name, status, source, etc.

4. **`airbnb_conflicts`**
   - Conflits détectés (chevauchements)
   - Colonnes: id, loft_id, booking_id_1, booking_id_2, severity, status, overlap_start, overlap_end

5. **`airbnb_sync_logs`**
   - Historique des synchronisations
   - Colonnes: id, sync_type, status, properties_synced, bookings_created, errors_count, duration_ms

6. **`system_settings`**
   - Configuration système (toggle Playwright)
   - Colonnes: key, value, updated_at

### Composants Principaux

```
lib/
├── sync/
│   ├── icalFetcher.ts          # Fetch et parse iCal
│   ├── batchProcessor.ts       # Traitement par batches
│   ├── conflictDetector.ts     # Détection de conflits
│   ├── csvParser.ts            # Parse CSV Airbnb
│   └── reservationMatcher.ts   # Matching iCal ↔ CSV
├── repositories/
│   └── bookingRepository.ts    # CRUD réservations
└── services/
    └── alertService.ts         # Envoi d'alertes email

scripts/
└── airbnbExport.ts             # Playwright automation

app/api/
├── cron/sync-ical/             # Cron iCal sync
├── sync/trigger/               # Sync manuel
├── import/csv/                 # Import CSV manuel
├── settings/playwright-toggle/ # Toggle Playwright
└── alerts/test/                # Test alertes
```

---

## ⚙️ Installation & Configuration

### 1. Prérequis

- Node.js 20+
- Compte Supabase (gratuit)
- Compte Vercel (gratuit)
- Compte GitHub (gratuit)
- Compte Resend (gratuit: 100 emails/jour)
- Compte Airbnb avec accès aux 85 lofts

### 2. Installation

```bash
# Cloner le repo
git clone https://github.com/votre-org/algerie-loft.git
cd algerie-loft

# Installer les dépendances
npm install

# Installer les packages spécifiques
npm install resend csv-parse playwright --ignore-scripts
```

### 3. Configuration Supabase

#### Exécuter les Migrations

```bash
# Via Supabase CLI
supabase db push

# Ou via Supabase Dashboard
# SQL Editor → Coller le contenu de:
# - supabase/migrations/001_booking_sync_tables.sql
# - supabase/migrations/002_rls_policies.sql
```

#### Configurer les URLs iCal

```sql
-- Exemple pour un loft
INSERT INTO property_sync_config (loft_id, ical_url, is_active)
VALUES (
  'uuid-du-loft',
  'https://www.airbnb.com/calendar/ical/xxxxx.ics',
  true
);

-- Répéter pour les 85 lofts
```

**Astuce:** Utilisez l'UI admin `/admin/properties/sync-config` pour configurer via interface graphique.

### 4. Configuration Vercel

#### Variables d'Environnement

Dans **Vercel Dashboard** → Settings → Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Cron
CRON_SECRET=votre-secret-cron-aleatoire

# Alertes
RESEND_API_KEY=re_xxxxxxxxxxxxx
ADMIN_EMAIL=admin@votredomaine.com
ALERT_FROM_EMAIL=alerts@votredomaine.com
NEXT_PUBLIC_APP_URL=https://votredomaine.com
```

#### Déploiement

```bash
# Via Vercel CLI
vercel --prod

# Ou via GitHub (auto-deploy)
git push origin main
```

### 5. Configuration GitHub Actions

#### GitHub Secrets

Dans **GitHub** → Settings → Secrets and variables → Actions:

```bash
AIRBNB_EMAIL=votre-email@airbnb.com
AIRBNB_PASSWORD=votre-mot-de-passe
API_SECRET=votre-api-secret
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

#### Activer le Workflow

Le workflow `.github/workflows/airbnb-csv-export.yml` se déclenche automatiquement:
- **Automatique:** Tous les jours à 3h UTC
- **Manuel:** Via GitHub Actions → Run workflow

### 6. Configuration Resend

1. Aller sur [resend.com](https://resend.com)
2. Créer un compte (gratuit)
3. Dashboard → API Keys → Create API Key
4. Copier la clé (commence par `re_`)
5. Dashboard → Domains → Add Domain (ou utiliser le domaine de test)
6. Ajouter `RESEND_API_KEY` dans Vercel

---

## 🚀 Utilisation

### Synchronisation Automatique

#### iCal Sync (Toutes les 30 minutes)

- **Déclenchement:** Vercel Cron automatique
- **Endpoint:** `POST /api/cron/sync-ical`
- **Authentification:** `CRON_SECRET` dans header
- **Données:** Dates uniquement (check-in, check-out)
- **Logs:** Consultables dans `/admin/sync-logs`

#### CSV Sync (1x/jour à 3h UTC)

- **Déclenchement:** GitHub Actions automatique
- **Script:** `scripts/airbnbExport.ts`
- **Données:** Détails complets (guest, amount, status, etc.)
- **Toggle:** Désactivable via `/admin/settings/airbnb-sync`
- **Logs:** Consultables dans GitHub Actions + `/admin/sync-logs`

### Synchronisation Manuelle

#### Bouton "Sync Now"

1. Aller sur `/admin/calendar`
2. Cliquer sur "Sync Now"
3. Attendre la fin de la synchronisation (30s-2min)
4. Vérifier les logs dans `/admin/sync-logs`

**Limite:** 10 minutes entre deux syncs manuels

#### Import CSV Manuel

1. Aller sur `/admin/import-csv`
2. Télécharger le CSV depuis Airbnb:
   - Airbnb → Hosting → Reservations → Export
3. Glisser-déposer le fichier CSV
4. Attendre le traitement (quelques secondes)
5. Vérifier les métriques affichées

**Limites:**
- Taille max: 5MB
- Réservations max: 1000 par fichier

### Gestion des Conflits

#### Détection Automatique

Les conflits sont détectés automatiquement lors de chaque sync:
- **Overlap:** `(new_checkin < existing_checkout) AND (new_checkout > existing_checkin)`
- **Sévérité:**
  - `critical`: Les deux réservations sont confirmées
  - `warning`: Une réservation est pending
  - `info`: Une réservation est cancelled

#### Visualisation

1. Aller sur `/admin/calendar`
2. Les conflits sont affichés en rouge sur le calendrier
3. Cliquer sur une date pour voir les détails
4. Résoudre manuellement (annuler une réservation, contacter le guest, etc.)

#### Alertes Email

Les conflits **critiques** déclenchent automatiquement un email à `ADMIN_EMAIL`:
- Sujet: `🚨 Conflit de réservation détecté - [Nom du Loft]`
- Contenu: Détails des 2 réservations, période de chevauchement
- Action: Lien vers le calendrier

### Configuration des Lofts

#### Ajouter/Modifier une URL iCal

1. Aller sur `/admin/properties/sync-config`
2. Trouver le loft dans la liste
3. Cliquer sur "Edit"
4. Coller l'URL iCal Airbnb
5. Activer le toggle "Active"
6. Sauvegarder

**Format URL iCal:**
```
https://www.airbnb.com/calendar/ical/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.ics
```

#### Désactiver un Loft

1. Aller sur `/admin/properties/sync-config`
2. Trouver le loft
3. Désactiver le toggle "Active"
4. Sauvegarder

Le loft ne sera plus synchronisé automatiquement.

### Désactiver Playwright

Si Playwright échoue trop souvent (CAPTCHA, ban, etc.):

1. Aller sur `/admin/settings/airbnb-sync`
2. Désactiver le toggle "Playwright CSV Export"
3. Sauvegarder

Le script GitHub Actions vérifiera le toggle avant de s'exécuter.

**Alternative:** Utiliser l'import CSV manuel.

---

## 🔌 API Routes

### `POST /api/cron/sync-ical`

Synchronisation iCal automatique (Vercel Cron).

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "sync_log_id": "uuid",
  "metrics": {
    "properties_synced": 85,
    "bookings_created": 12,
    "bookings_updated": 45,
    "conflicts_detected": 2,
    "duration_ms": 23456
  }
}
```

### `POST /api/sync/trigger`

Synchronisation manuelle (bouton "Sync Now").

**Headers:**
```
Authorization: Bearer {USER_JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "sync_log_id": "uuid",
  "message": "Synchronisation démarrée"
}
```

### `POST /api/import/csv`

Import CSV manuel.

**Headers:**
```
Authorization: Bearer {USER_JWT_TOKEN}
Content-Type: multipart/form-data
```

**Body:**
```
file: airbnb-export.csv
```

**Response:**
```json
{
  "success": true,
  "filename": "airbnb-export.csv",
  "duration_ms": 2500,
  "parsing": {
    "total_lines": 150,
    "parsed_lines": 148,
    "parse_errors": 2
  },
  "matching": {
    "total_entries": 148,
    "exact_matches": 120,
    "fuzzy_matches": 15,
    "no_matches": 13
  },
  "processing": {
    "enriched": 135,
    "created": 13,
    "errors": 0
  }
}
```

### `GET /api/settings/playwright-toggle`

Vérifier le statut du toggle Playwright.

**Headers:**
```
Authorization: Bearer {API_SECRET}
```

**Response:**
```json
{
  "enabled": true
}
```

### `PUT /api/settings/playwright-toggle`

Modifier le toggle Playwright (admin uniquement).

**Headers:**
```
Authorization: Bearer {USER_JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "enabled": false
}
```

### `POST /api/alerts/test`

Tester l'envoi d'alertes (admin uniquement).

**Headers:**
```
Authorization: Bearer {USER_JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "type": "conflict"  // ou "playwright"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Alerte envoyée avec succès",
  "messageId": "msg_xxxxxxxxxxxxx",
  "attempts": 1
}
```

---

## 📧 Monitoring & Alertes

### Types d'Alertes

#### 1. Alertes de Conflits

**Déclenchement:** Conflit critique détecté (2 réservations confirmées qui se chevauchent)

**Email:**
- **Sujet:** `🚨 Conflit de réservation détecté - [Nom du Loft]`
- **Contenu:**
  - Nom du loft
  - Période de chevauchement
  - Détails des 2 réservations (guest, ID)
  - Lien vers le calendrier

**Batching:** Plusieurs conflits en un seul email

#### 2. Alertes d'Échecs Playwright

**Déclenchement:** 3 échecs consécutifs du script Playwright

**Email:**
- **Sujet:** `🚨 Échecs Playwright consécutifs (3x)`
- **Contenu:**
  - Nombre d'échecs
  - Message d'erreur
  - Actions recommandées
  - Lien vers les logs
  - Bouton "Désactiver Playwright"

### Dashboard de Monitoring

#### `/admin/sync-logs`

- **Historique:** 30 derniers jours de syncs
- **Filtres:** Par type (ical_auto, csv_auto, manual)
- **Métriques:**
  - Taux de succès par type
  - Nombre de réservations créées/mises à jour
  - Nombre de conflits détectés
  - Durée moyenne
- **Détails:** Cliquer sur une ligne pour voir les erreurs

#### `/admin/calendar`

- **Vue mensuelle:** Toutes les réservations
- **Filtres:** Par loft
- **Indicateurs:**
  - Bleu foncé: Réservation complète (CSV)
  - Bleu clair: Réservation partielle (iCal uniquement)
  - Rouge: Conflit détecté
- **Actions:** Cliquer pour voir les détails

### Logs Supabase

Tous les syncs sont loggés dans `airbnb_sync_logs`:

```sql
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
LIMIT 100;
```

---

## 🔧 Troubleshooting

### Problème: Sync iCal échoue

**Symptômes:**
- Logs montrent `status: 'error'`
- Aucune réservation créée

**Causes possibles:**
1. URL iCal invalide ou expirée
2. Airbnb a changé le format iCal
3. Timeout Vercel (>30s)

**Solutions:**
1. Vérifier les URLs iCal dans `/admin/properties/sync-config`
2. Tester manuellement une URL iCal dans le navigateur
3. Vérifier les logs détaillés dans Supabase
4. Réduire le nombre de lofts par batch (actuellement 20)

### Problème: Playwright échoue (CAPTCHA)

**Symptômes:**
- GitHub Actions échoue
- Logs montrent "CAPTCHA detected"
- Alerte email reçue après 3 échecs

**Solutions:**
1. **Court terme:** Désactiver Playwright via `/admin/settings/airbnb-sync`
2. **Moyen terme:** Utiliser l'import CSV manuel
3. **Long terme:**
   - Changer l'heure d'exécution (moins de trafic)
   - Ajouter des délais aléatoires plus longs
   - Utiliser un proxy résidentiel
   - Contacter Airbnb pour whitelist l'IP GitHub Actions

### Problème: Conflits non détectés

**Symptômes:**
- Deux réservations se chevauchent mais pas de conflit dans la base

**Causes possibles:**
1. Les réservations ont des statuts différents (pending, cancelled)
2. Les dates ne se chevauchent pas réellement (check-out = check-in)
3. Bug dans la logique de détection

**Solutions:**
1. Vérifier les statuts des réservations
2. Vérifier les dates exactes (heure incluse)
3. Tester manuellement avec `detectConflicts()`
4. Consulter les logs de sync

### Problème: Alertes non reçues

**Symptômes:**
- Conflits détectés mais pas d'email reçu

**Causes possibles:**
1. `RESEND_API_KEY` invalide ou expirée
2. `ADMIN_EMAIL` incorrect
3. Email dans les spams
4. Limite Resend atteinte (100/jour)

**Solutions:**
1. Vérifier les variables d'environnement Vercel
2. Tester avec `/api/alerts/test`
3. Vérifier les spams
4. Consulter le dashboard Resend pour les logs
5. Upgrader le plan Resend si nécessaire

### Problème: Import CSV échoue

**Symptômes:**
- Upload CSV retourne une erreur
- Parsing errors dans la réponse

**Causes possibles:**
1. Format CSV incorrect (colonnes manquantes)
2. Encodage incorrect (pas UTF-8)
3. Fichier trop gros (>5MB)
4. Trop de réservations (>1000)

**Solutions:**
1. Vérifier le format CSV (voir exemple dans docs)
2. Convertir en UTF-8 avec BOM
3. Compresser ou diviser le fichier
4. Importer en plusieurs fois

### Problème: Timeout Vercel

**Symptômes:**
- Sync échoue après 30 secondes
- Logs montrent "Function execution timeout"

**Causes possibles:**
1. Trop de lofts à synchroniser en un batch
2. Airbnb répond lentement
3. Traitement trop long

**Solutions:**
1. Réduire `BATCH_SIZE` de 20 à 10
2. Augmenter le timeout par batch (actuellement 25s)
3. Optimiser les requêtes Supabase (indexes)
4. Upgrader le plan Vercel (timeout 60s)

---

## ❓ FAQ

### Q: Combien coûte le système ?

**R:** Le système est **gratuit** avec les plans gratuits:
- Vercel: Gratuit (hobby plan)
- Supabase: Gratuit (jusqu'à 500MB)
- GitHub Actions: Gratuit (2000 min/mois)
- Resend: Gratuit (100 emails/jour, 3000/mois)

**Total:** €0/mois vs €255-425/mois avec Beds24

### Q: Que se passe-t-il si Playwright est banni ?

**R:** Trois options:
1. Désactiver Playwright et utiliser l'import CSV manuel
2. Changer la stratégie (proxy, timing, etc.)
3. Continuer avec iCal uniquement (dates sans détails)

### Q: Les données sont-elles sécurisées ?

**R:** Oui:
- HTTPS partout
- RLS Supabase (Row Level Security)
- Secrets dans variables d'environnement
- Pas de secrets dans le code
- Authentification JWT pour les admins

### Q: Peut-on ajouter Booking.com ?

**R:** Oui, l'architecture le permet:
1. Ajouter une colonne `source: 'booking_ical'`
2. Configurer les URLs iCal Booking.com
3. Adapter le parser CSV si nécessaire
4. Même logique de matching et conflits

### Q: Combien de temps prend une synchronisation ?

**R:**
- **iCal (85 lofts):** ~2 minutes (batches de 20)
- **CSV (85 lofts):** ~5 minutes (Playwright + parsing)
- **Import CSV manuel:** ~10 secondes

### Q: Que faire en cas de double réservation ?

**R:**
1. Vous recevez une alerte email immédiatement
2. Consultez le calendrier pour voir les détails
3. Contactez les guests pour résoudre
4. Annulez une réservation dans Airbnb
5. Le conflit sera automatiquement résolu au prochain sync

### Q: Peut-on personnaliser les alertes ?

**R:** Oui, modifiez `lib/services/alertService.ts`:
- Templates HTML
- Destinataires (CC, BCC)
- Fréquence (batching)
- Sévérité (critical, warning, info)

### Q: Comment migrer depuis Beds24 ?

**R:**
1. Exporter toutes les réservations depuis Beds24 (CSV)
2. Importer via `/admin/import-csv`
3. Configurer les 85 URLs iCal
4. Tester pendant 1 semaine en parallèle
5. Désactiver Beds24

### Q: Que faire si un loft est vendu ?

**R:**
1. Aller sur `/admin/properties/sync-config`
2. Désactiver le toggle "Active" pour ce loft
3. Le loft ne sera plus synchronisé
4. Les anciennes réservations restent dans la base

---

## 📞 Support

### Documentation

- **Specs:** `.kiro/specs/booking-sync-system/`
- **Setup:** `supabase/SETUP.md`
- **Progress:** `.kiro/specs/booking-sync-system/PROGRESS.md`

### Ressources Externes

- **Resend:** [resend.com/docs](https://resend.com/docs)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Playwright:** [playwright.dev](https://playwright.dev)
- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)

### Contact

Pour toute question ou problème:
- **Email:** admin@votredomaine.com
- **GitHub Issues:** [github.com/votre-org/algerie-loft/issues](https://github.com/votre-org/algerie-loft/issues)

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2026-05-14  
**Auteur:** Équipe Algérie Loft

---

**Félicitations ! Vous avez maintenant un système de synchronisation Airbnb complet et opérationnel. 🎉**
