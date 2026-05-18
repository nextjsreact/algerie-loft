# Phase 5: Playwright Automation - COMPLÉTÉE ✅

**Date de complétion:** 2026-05-14  
**Durée totale:** ~8h  
**Status:** ✅ Toutes les tâches complétées

---

## 📋 Résumé

La Phase 5 implémente l'automatisation complète de l'export CSV depuis Airbnb via Playwright et GitHub Actions. Le système se connecte automatiquement à Airbnb, télécharge le CSV, et le traite pour enrichir les réservations.

### Architecture

```
GitHub Actions (3h UTC quotidien)
    ↓
Vérifier toggle Playwright (API)
    ↓ (si activé)
Lancer Playwright Script
    ↓
Connexion Airbnb (email + password)
    ↓
Navigation vers page export
    ↓
Téléchargement CSV
    ↓
Parsing + Matching + Processing
    ↓
Enrichissement réservations Supabase
    ↓
Logging dans airbnb_sync_logs
```

---

## ✅ Tâches Complétées

### Task 5.1: Playwright Export Script ✅

**Fichiers:**
- `scripts/airbnbExport.ts` (400+ lignes)
- `scripts/utils/playwrightHelpers.ts` (150+ lignes)

**Fonctionnalités principales:**

#### Script Principal (`airbnbExport.ts`)
- ✅ Vérification du toggle Playwright via API
- ✅ Connexion automatique à Airbnb (email + password)
- ✅ Navigation vers page d'export des réservations
- ✅ Téléchargement du fichier CSV
- ✅ Parsing avec `parseAirbnbCSV()`
- ✅ Matching avec `matchCSVEntries()`
- ✅ Processing avec `processMatchingReport()`
- ✅ Logging dans `airbnb_sync_logs`
- ✅ Retry automatique (3 tentatives)
- ✅ Délais aléatoires 2-5s entre actions
- ✅ User agent aléatoire
- ✅ Détection CAPTCHA
- ✅ Gestion des erreurs complète
- ✅ Nettoyage des fichiers temporaires

#### Helpers Playwright (`playwrightHelpers.ts`)
- ✅ `randomDelay()` - Délais aléatoires pour simuler humain
- ✅ `randomUserAgent()` - 5 user agents différents
- ✅ `detectCaptcha()` - Détection de CAPTCHA
- ✅ `waitForDownload()` - Attente téléchargement
- ✅ `humanScroll()` - Scroll progressif
- ✅ `humanType()` - Frappe progressive
- ✅ `detectError()` - Détection d'erreurs
- ✅ `takeDebugScreenshot()` - Captures d'écran debug

**Configuration:**
```typescript
const CONFIG = {
  AIRBNB_LOGIN_URL: 'https://www.airbnb.com/login',
  AIRBNB_RESERVATIONS_URL: 'https://www.airbnb.com/hosting/reservations',
  DOWNLOAD_DIR: 'temp/airbnb-exports',
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
  HEADLESS: true (en production),
};
```

**Variables d'environnement requises:**
- `AIRBNB_EMAIL` - Email du compte Airbnb
- `AIRBNB_PASSWORD` - Mot de passe du compte Airbnb
- `NEXT_PUBLIC_SUPABASE_URL` - URL Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clé service role
- `API_SECRET` - Secret pour vérifier le toggle

**Métriques retournées:**
```typescript
interface ExportResult {
  success: boolean;
  metrics?: {
    csv_file: string;
    total_lines: number;
    parsed_lines: number;
    exact_matches: number;
    fuzzy_matches: number;
    no_matches: number;
    enriched: number;
    created: number;
    errors: number;
    duration_ms: number;
  };
  error?: string;
}
```

---

### Task 5.2: GitHub Actions Workflow ✅

**Fichiers:**
- `.github/workflows/airbnb-csv-export.yml`

**Fonctionnalités:**

#### Déclencheurs
- ✅ **Schedule:** Quotidien à 3h UTC (`0 3 * * *`)
- ✅ **Manual:** Déclenchement manuel via `workflow_dispatch`
- ✅ **Force run:** Option pour forcer même si toggle désactivé

#### Étapes du Workflow

1. **Checkout code**
   - Clone le repository

2. **Setup Node.js**
   - Node.js 20
   - Cache npm pour performance

3. **Install dependencies**
   - `npm ci` pour installation propre

4. **Install Playwright browsers**
   - Chromium uniquement (léger)
   - Avec dépendances système

5. **Check Playwright toggle**
   - Appel API vers `/api/settings/playwright-toggle`
   - Vérification avec `API_SECRET`
   - Skip si `force_run=true`

6. **Run Airbnb export**
   - Exécution de `scripts/airbnbExport.ts`
   - Mode headless
   - Timeout 15 minutes

7. **Upload screenshots on failure**
   - Sauvegarde des captures d'écran
   - Rétention 7 jours
   - Aide au debugging

8. **Summary**
   - Résumé dans GitHub Actions UI
   - Date, status, toggle state

**Secrets GitHub requis:**
```yaml
secrets:
  AIRBNB_EMAIL: "votre-email@example.com"
  AIRBNB_PASSWORD: "votre-mot-de-passe"
  SUPABASE_URL: "https://xxx.supabase.co"
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGc..."
  API_SECRET: "votre-api-secret"
```

---

## 🛡️ Mesures Anti-Détection

### 1. User Agent Aléatoire
- 5 user agents différents (Chrome, Safari, Linux)
- Rotation à chaque exécution

### 2. Délais Aléatoires
- 2-5s entre les actions principales
- 1-2s pour les petites actions
- 100-300ms pour le scroll

### 3. Comportement Humain
- Scroll progressif
- Frappe progressive (50-150ms/caractère)
- Pas de clics instantanés

### 4. Fréquence Limitée
- 1 seule exécution par jour (3h UTC)
- Pas de burst requests
- IP différente (GitHub Actions)

### 5. Détection CAPTCHA
- Vérification avant chaque action critique
- Arrêt immédiat si CAPTCHA détecté
- Log pour investigation

### 6. Toggle Désactivable
- Possibilité de désactiver à distance
- Vérification avant chaque exécution
- Pas de retry si désactivé

---

## 🧪 Tests à Effectuer

### Test Local (Mode Visible)
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

### Test Local (Mode Headless)
```bash
export PLAYWRIGHT_HEADLESS="true"
npx tsx scripts/airbnbExport.ts
```

### Test GitHub Actions (Manuel)
1. Aller sur GitHub → Actions
2. Sélectionner "Airbnb CSV Export Automation"
3. Cliquer "Run workflow"
4. Choisir la branche
5. (Optionnel) Cocher "force_run"
6. Cliquer "Run workflow"

### Vérifications Post-Exécution
```sql
-- Vérifier les logs
SELECT * FROM airbnb_sync_logs 
WHERE sync_type = 'csv_auto' 
ORDER BY created_at DESC 
LIMIT 5;

-- Vérifier les réservations enrichies
SELECT COUNT(*) FROM airbnb_bookings 
WHERE source = 'airbnb_csv' 
AND updated_at > NOW() - INTERVAL '1 day';

-- Vérifier les réservations CSV-only
SELECT COUNT(*) FROM airbnb_bookings 
WHERE csv_only_flag = true 
AND created_at > NOW() - INTERVAL '1 day';
```

---

## 📊 Métriques de Succès

### Code
- ✅ 550+ lignes de code production
- ✅ 2 fichiers principaux créés
- ✅ 1 workflow GitHub Actions créé

### Fonctionnalités
- ✅ Automatisation complète Airbnb
- ✅ Retry automatique (3 tentatives)
- ✅ Anti-détection (user agent, délais)
- ✅ Détection CAPTCHA
- ✅ Toggle désactivable
- ✅ Logging complet
- ✅ Screenshots debug

### Sécurité
- ✅ Credentials dans secrets GitHub
- ✅ Pas de credentials en dur
- ✅ Toggle pour désactivation rapide
- ✅ Timeout 15 minutes
- ✅ Gestion d'erreurs robuste

---

## ⚠️ Points d'Attention

### 1. Risque de Ban Airbnb
- **Mitigation:** 1x/jour uniquement, délais aléatoires, user agent rotation
- **Action si ban:** Désactiver le toggle, attendre 48h, réessayer
- **Monitoring:** Vérifier les logs quotidiennement

### 2. Changements UI Airbnb
- **Risque:** Airbnb peut changer son interface
- **Mitigation:** Sélecteurs multiples (FR/EN), retry automatique
- **Action:** Mettre à jour les sélecteurs dans `airbnbExport.ts`

### 3. CAPTCHA
- **Détection:** Automatique avant chaque action
- **Action:** Arrêt immédiat, log, notification
- **Solution:** Désactiver temporairement, attendre, réessayer

### 4. Credentials Expirés
- **Symptôme:** Échec de connexion répété
- **Action:** Vérifier les secrets GitHub, mettre à jour si nécessaire

### 5. Timeout GitHub Actions
- **Limite:** 15 minutes
- **Mitigation:** Retry rapide, pas de sleep inutiles
- **Monitoring:** Vérifier la durée dans les logs

---

## 🔧 Configuration GitHub Secrets

### Étapes pour Configurer

1. **Aller sur GitHub Repository**
   - Settings → Secrets and variables → Actions

2. **Ajouter les Secrets**
   ```
   AIRBNB_EMAIL = votre-email@example.com
   AIRBNB_PASSWORD = votre-mot-de-passe-airbnb
   SUPABASE_URL = https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   API_SECRET = votre-api-secret-unique
   ```

3. **Vérifier les Permissions**
   - Actions → General → Workflow permissions
   - Cocher "Read and write permissions"

4. **Tester le Workflow**
   - Actions → Airbnb CSV Export Automation
   - Run workflow (manuel)

---

## 📝 Logs et Monitoring

### Logs GitHub Actions
```
Actions → Airbnb CSV Export Automation → Latest run
```

### Logs Supabase
```sql
SELECT 
  id,
  sync_type,
  status,
  bookings_created,
  bookings_updated,
  errors_count,
  duration_ms,
  metadata,
  created_at
FROM airbnb_sync_logs
WHERE sync_type = 'csv_auto'
ORDER BY created_at DESC
LIMIT 10;
```

### Métriques Clés
- **Success rate:** % d'exécutions réussies
- **Duration:** Temps moyen d'exécution
- **Enriched:** Nombre de réservations enrichies
- **Created:** Nombre de nouvelles réservations
- **Errors:** Nombre d'erreurs

---

## 🚀 Prochaines Étapes

### Phase 6: UI Components
- Task 6.1: Unified Calendar Component
- Task 6.2: Property Sync Config Page
- Task 6.3: Sync Logs Dashboard
- Task 6.4: Manual CSV Import Page
- Task 6.5: Settings Page (Playwright Toggle)

### Intégration
- Connecter l'UI avec les API routes existantes
- Afficher les métriques en temps réel
- Permettre la gestion du toggle depuis l'UI

---

## ✅ Checklist de Complétion

- [x] Task 5.1: Playwright Export Script implémenté
- [x] Task 5.2: GitHub Actions Workflow créé
- [x] Helpers Playwright créés
- [x] Anti-détection implémentée
- [x] Retry automatique (3 tentatives)
- [x] Détection CAPTCHA
- [x] Toggle désactivable
- [x] Logging complet
- [x] Screenshots debug
- [x] Documentation complète
- [ ] Secrets GitHub configurés (à faire par l'utilisateur)
- [ ] Test manuel exécuté
- [ ] Test automatique quotidien vérifié
- [ ] Monitoring mis en place

---

**Phase 5 complétée avec succès ! 🎉**

**Progression globale:** 17/27 tâches (63%)

**Prochaine phase:** Phase 6 - UI Components
