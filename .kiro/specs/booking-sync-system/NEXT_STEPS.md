# Prochaines Étapes - Système de Synchronisation Airbnb

**Date:** 2026-05-14  
**Progression:** 25/27 tâches (93%)  
**Status:** Phase 7 complétée ✅

---

## 🎯 Résumé de l'Avancement

### ✅ Phases Complétées (7/9)

1. ✅ **Phase 1:** Database & Infrastructure (3 tâches)
2. ✅ **Phase 2:** Core Sync Components (4 tâches)
3. ✅ **Phase 3:** API Routes (3 tâches)
4. ✅ **Phase 4:** CSV Processing (3 tâches)
5. ✅ **Phase 5:** Playwright Automation (2 tâches)
6. ✅ **Phase 6:** UI Components (5 tâches)
7. ✅ **Phase 7:** Alerts & Monitoring (3 tâches) ← **VIENT D'ÊTRE COMPLÉTÉE**

### ⏳ Phases Restantes (2/9)

8. ⏳ **Phase 8:** Testing & Validation (2 tâches - 10h estimées)
9. ⏳ **Phase 9:** Documentation & Deployment (2 tâches - 4h estimées)

---

## 🚀 Actions Immédiates Recommandées

### 1. Configuration des Variables d'Environnement

Avant de tester le système, configurez les variables suivantes:

#### Vercel Dashboard

```bash
# Alertes (Phase 7 - NOUVEAU)
RESEND_API_KEY=re_xxxxxxxxxxxxx          # À obtenir sur resend.com
ADMIN_EMAIL=admin@votredomaine.com       # Votre email
ALERT_FROM_EMAIL=alerts@votredomaine.com # Email expéditeur (optionnel)
NEXT_PUBLIC_APP_URL=https://votredomaine.com # URL de votre app

# Sync (Phases précédentes)
CRON_SECRET=votre-secret-cron
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

#### GitHub Secrets (pour Playwright)

```bash
AIRBNB_EMAIL=votre-email@airbnb.com
AIRBNB_PASSWORD=votre-mot-de-passe
API_SECRET=votre-api-secret
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### 2. Obtenir une Clé Resend API

**Étapes:**
1. Aller sur [resend.com](https://resend.com)
2. Créer un compte (gratuit: 100 emails/jour, 3000/mois)
3. Dashboard → API Keys → Create API Key
4. Copier la clé (commence par `re_`)
5. Dashboard → Domains → Add Domain (ou utiliser le domaine de test)
6. Ajouter `RESEND_API_KEY` dans Vercel

### 3. Tester le Système d'Alertes

```bash
# Test local
export RESEND_API_KEY=re_xxxxxxxxxxxxx
export ADMIN_EMAIL=admin@votredomaine.com
export NEXT_PUBLIC_APP_URL=http://localhost:3000

npm run dev

# Test alerte de conflit
curl -X POST http://localhost:3000/api/alerts/test \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"type":"conflict"}'

# Test alerte Playwright
curl -X POST http://localhost:3000/api/alerts/test \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"type":"playwright"}'
```

### 4. Configurer les 85 URLs iCal

Les 85 lofts existent déjà dans la table `lofts`, mais leurs URLs iCal doivent être configurées dans `property_sync_config`:

```sql
-- Exemple d'insertion pour un loft
INSERT INTO property_sync_config (loft_id, ical_url, is_active)
VALUES (
  'uuid-du-loft',
  'https://www.airbnb.com/calendar/ical/xxxxx.ics',
  true
);
```

**Options:**
- Manuellement via Supabase Dashboard
- Via l'UI admin (page `/admin/properties/sync-config`)
- Via un script d'import CSV

---

## 📋 Phase 8: Testing & Validation (Prochaine Phase)

### Task 8.1: Create Integration Tests (6h)

**Objectif:** Créer des tests end-to-end pour valider le pipeline complet.

**Tests à créer:**
- ✅ Test: iCal fetch → parse → store → detect conflicts
- ✅ Test: CSV parse → match → enrich → detect conflicts
- ✅ Test: Manual CSV import → match → store
- ✅ Test: Batch processing avec 85 properties
- ✅ Test: Conflict detection avec overlapping reservations
- ✅ Test: Fuzzy matching avec ±1 jour
- ✅ Test: Alert sending (mock Resend API)

**Fichiers à créer:**
```
__tests__/integration/
├── syncPipeline.test.ts
├── csvImport.test.ts
├── conflictDetection.test.ts
└── alertSystem.test.ts
```

**Setup requis:**
```bash
# Installer les dépendances de test
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @supabase/supabase-js

# Configurer Jest
npx ts-jest config:init
```

### Task 8.2: Create Property-Based Tests (4h)

**Objectif:** Créer des tests property-based pour vérifier les invariants.

**Tests à créer:**
- ✅ Test: iCal parse → pretty-print → parse (round-trip)
- ✅ Test: CSV parse → pretty-print → parse (round-trip)
- ✅ Test: Batch processing invariant (sum of batches = total items)
- ✅ Test: Conflict detection avec non-overlapping (always false)
- ✅ Test: Unique constraint invariant

**Fichiers à créer:**
```
__tests__/property-based/
├── icalRoundTrip.test.ts
├── csvRoundTrip.test.ts
├── batchInvariant.test.ts
└── conflictInvariant.test.ts
```

**Setup requis:**
```bash
# Installer fast-check
npm install --save-dev fast-check
```

---

## 📋 Phase 9: Documentation & Deployment (Dernière Phase)

### Task 9.1: Create README (2h)

**Objectif:** Créer une documentation complète du système.

**Sections à inclure:**
- ✅ Overview de l'architecture à 3 niveaux
- ✅ Setup instructions (environment variables, migrations)
- ✅ How to configure iCal URLs
- ✅ How to use manual CSV import
- ✅ How to disable Playwright toggle
- ✅ Troubleshooting guide
- ✅ Architecture diagrams

**Fichier à créer:**
```
docs/BOOKING_SYNC_README.md
```

### Task 9.2: Deploy to Production (2h)

**Objectif:** Déployer le système en production et monitorer.

**Checklist de déploiement:**
- [ ] Exécuter les migrations sur Supabase production
- [ ] Configurer toutes les variables d'environnement dans Vercel
- [ ] Configurer tous les GitHub Secrets pour Playwright
- [ ] Configurer les 85 URLs iCal dans `property_sync_config`
- [ ] Tester le cron job (déclencher manuellement)
- [ ] Tester le bouton "Sync Now"
- [ ] Tester l'import CSV manuel
- [ ] Tester l'envoi d'alertes
- [ ] Monitorer les premières 24h de syncs automatiques
- [ ] Vérifier les alertes sont reçues correctement

---

## 🔍 Problèmes Connus à Résoudre

### 1. Package `csv-parse` Non Installé

**Problème:** Erreur Sentry CLI lors de `npm install csv-parse`

**Solution temporaire:**
```bash
npm install csv-parse --ignore-scripts
```

**Impact:** Le parsing CSV ne fonctionnera pas sans ce package.

### 2. 85 URLs iCal à Configurer

**Problème:** Les URLs iCal des 85 lofts ne sont pas encore configurées.

**Solutions possibles:**
1. **Manuelle:** Via Supabase Dashboard (long)
2. **UI Admin:** Via la page `/admin/properties/sync-config` (recommandé)
3. **Script:** Créer un script d'import CSV avec les URLs

**Recommandation:** Créer un CSV avec `loft_id,ical_url` et importer via script.

### 3. Secrets Vercel et GitHub à Configurer

**Problème:** Les secrets ne sont pas encore configurés en production.

**Action requise:**
- Configurer `RESEND_API_KEY`, `ADMIN_EMAIL`, etc. dans Vercel
- Configurer `AIRBNB_EMAIL`, `AIRBNB_PASSWORD`, etc. dans GitHub Secrets

---

## 📊 Estimation du Temps Restant

| Phase | Tâches | Temps Estimé | Priorité |
|-------|--------|--------------|----------|
| Phase 8 | 2 | 10h | HIGH |
| Phase 9 | 2 | 4h | MEDIUM |
| **TOTAL** | **4** | **14h** | - |

**Estimation:** 2-3 jours de travail pour un développeur à temps plein.

---

## 🎯 Objectifs de Succès

### Court Terme (Cette Semaine)

- [ ] Configurer les variables d'environnement Vercel
- [ ] Obtenir et configurer la clé Resend API
- [ ] Tester le système d'alertes localement
- [ ] Configurer au moins 10 URLs iCal pour tester

### Moyen Terme (Semaine Prochaine)

- [ ] Compléter Phase 8 (Tests)
- [ ] Compléter Phase 9 (Documentation & Deployment)
- [ ] Configurer les 85 URLs iCal
- [ ] Déployer en production
- [ ] Monitorer les premières 24h

### Long Terme (Mois Prochain)

- [ ] Valider l'économie de €3,060-5,100/an
- [ ] Optimiser les performances si nécessaire
- [ ] Ajouter des métriques de monitoring
- [ ] Former l'équipe à l'utilisation du système

---

## 📞 Support et Ressources

### Documentation

- **Requirements:** `.kiro/specs/booking-sync-system/requirements.md`
- **Design:** `.kiro/specs/booking-sync-system/design.md`
- **Tasks:** `.kiro/specs/booking-sync-system/tasks.md`
- **Progress:** `.kiro/specs/booking-sync-system/PROGRESS.md`
- **Phase 7 Complete:** `.kiro/specs/booking-sync-system/PHASE7_COMPLETE.md`

### Guides de Setup

- **Supabase:** `supabase/SETUP.md`
- **Vercel Cron:** `vercel.json`
- **GitHub Actions:** `.github/workflows/airbnb-csv-export.yml`

### APIs Externes

- **Resend:** [resend.com/docs](https://resend.com/docs)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Playwright:** [playwright.dev](https://playwright.dev)

---

## ✅ Checklist Avant de Continuer

Avant de passer à la Phase 8, assurez-vous que:

- [x] Phase 7 est complétée (3/3 tâches)
- [x] Package `resend` est installé
- [x] Fichiers `alertService.ts`, `conflictDetector.ts`, `airbnbExport.ts` sont modifiés
- [x] Route `/api/alerts/test` est créée
- [ ] Variables d'environnement sont configurées (Vercel)
- [ ] Clé Resend API est obtenue
- [ ] Système d'alertes est testé localement
- [ ] Documentation Phase 7 est complète

---

**Félicitations pour avoir complété la Phase 7 ! 🎉**

**Progression:** 93% (25/27 tâches)

**Prochaine étape:** Phase 8 - Testing & Validation

---

**Questions ou problèmes ?** Consultez les fichiers de documentation ou demandez de l'aide.
