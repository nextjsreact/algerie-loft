# Changelog - Requirements Analysis & Corrections

## Date: 2026-05-14

### ✅ Nouveaux Requirements Ajoutés

#### **Requirement 24: Ordre d'Exécution et Orchestration des Composants (CRITIQUE)**
- **Raison:** Garantir l'exécution déterministe et éviter les conditions de course
- **Acceptance Criteria:** 8 critères définissant l'ordre pipeline: iCal → Repository → CSV → Matcher → Conflict → Alert
- **Propriété testable:** Pipeline invariant (ordre d'exécution toujours respecté)

#### **Requirement 25: Gestion des Cas Limites et Erreurs**
- **Raison:** Maintenir la cohérence des données même en cas de problèmes
- **Cas couverts:**
  - CSV vide (0 réservations)
  - iCal 404 (URL invalide)
  - Erreurs réseau (retry avec backoff)
  - Doublons détectés
  - Réservations CSV sans match iCal

---

### 🔧 Corrections d'Incohérences Critiques

#### **1. Requirement 5 AC 4 - Contrainte d'unicité**
**AVANT:**
```sql
UNIQUE(property_id, check_in_date, check_out_date, source)
```

**APRÈS:**
```sql
UNIQUE(property_id, check_in_date, check_out_date)
```

**Raison:** La contrainte avec `source` empêchait le matching iCal ↔ CSV. Une même réservation peut avoir 2 sources (iCal puis CSV enrichi).

**Impact:** Permet maintenant au Reservation_Matcher de mettre à jour les réservations iCal avec les détails CSV.

---

#### **2. Requirement 5 AC 5 - Mise à jour de source**
**AVANT:**
```
WHEN a reservation is updated, THE Booking_Repository SHALL preserve 
the original creation timestamp and source
```

**APRÈS:**
```
WHEN a reservation is updated from Partial_Reservation to Complete_Reservation, 
THE Booking_Repository SHALL preserve the original creation timestamp and 
update the source to "airbnb_csv"
```

**Raison:** Clarifier que la source DOIT changer lors de l'enrichissement CSV.

**Impact:** Traçabilité claire de l'origine des données (iCal → CSV).

---

#### **3. Requirement 1 AC 2 - Timeout irréaliste**
**AVANT:**
```
WHEN a Sync_Cycle is triggered, THE iCal_Fetcher SHALL retrieve iCal feeds 
from all 85 active Airbnb properties within 30 seconds
```

**APRÈS:**
```
WHEN a Sync_Cycle is triggered, THE Batch_Processor SHALL divide the 85 
properties into batches of 20 properties, processing each batch within 25 seconds
```

**Raison:** 85 propriétés en 30 secondes = impossible (42.5s minimum). Vercel timeout = 30s.

**Impact:** Utilise le Batch_Processor (Requirement 16) pour respecter les contraintes Vercel.

---

### 📝 Clarifications d'Ambiguïtés

#### **4. Requirement 3 AC 3 - Matching "fuzzy"**
**AVANT:**
```
WHEN a match is found with dates within 1 day tolerance...
```

**APRÈS:**
```
WHEN a match is found where check_in differs by ≤1 day AND check_out 
differs by ≤1 day, THE Reservation_Matcher SHALL flag the match as 
"fuzzy" and log it for manual review
```

**Raison:** "1 day tolerance" était ambigu (check-in? check-out? durée?).

**Impact:** Définition précise du matching fuzzy.

---

#### **5. Requirement 3 AC 4 - Réservations CSV sans match**
**AVANT:**
```
WHEN no match is found, THE Reservation_Matcher SHALL create a new 
Complete_Reservation from the CSV data
```

**APRÈS:**
```
WHEN no match is found, THE Reservation_Matcher SHALL create a new 
Complete_Reservation from the CSV data with source "airbnb_csv" and 
flag "csv_only"
```

**Raison:** Permettre le matching futur si l'iCal arrive après le CSV.

**Impact:** Évite les doublons si l'ordre d'arrivée est inversé.

---

#### **6. Requirement 23 AC 7 - Format CSV Airbnb réel**
**AJOUTÉ:**
```
THE CSV_Parser SHALL map "Listing Name" from Airbnb CSV to property_id 
by matching against the properties table name field
```

**Raison:** Le CSV Airbnb réel n'a pas de colonne `property_id`, seulement `Listing Name`.

**Impact:** Mapping automatique nom → property_id.

---

#### **7. Requirement 18 AC 3 & 6 - Accès au Playwright_Toggle**
**AVANT:**
```
AC 3: WHEN the Playwright_Toggle is set to false, THE GitHub_Actions_Runner 
SHALL skip the Playwright_CSV_Exporter execution

AC 6: THE Playwright_Toggle SHALL be checked at the start of each GitHub 
Actions workflow execution
```

**APRÈS:**
```
AC 3: WHEN the Playwright_Toggle is set to false, THE GitHub_Actions_Runner 
SHALL call the API endpoint /api/settings/playwright-toggle to check the 
state and skip execution if disabled

AC 6: THE GitHub_Actions_Runner SHALL authenticate to the API endpoint 
using a secret token stored in GitHub Secrets
```

**Raison:** GitHub Actions ne peut pas accéder directement à Supabase. Besoin d'un endpoint API.

**Impact:** Architecture claire pour la vérification du toggle.

---

#### **8. Requirement 10 AC 6 - Délai Sync Now**
**AVANT:**
```
THE Sync_Now_Trigger SHALL enforce a minimum delay of 5 minutes between 
manual sync requests
```

**APRÈS:**
```
THE Sync_Now_Trigger SHALL enforce a minimum delay of 10 minutes between 
manual sync requests, OR allow immediate sync if the last sync was 
automatic (cron)
```

**Raison:** 5 minutes trop court (cron = 30 min). Permettre sync immédiat après cron automatique.

**Impact:** Meilleure UX pour l'admin.

---

### 📊 Résumé des Changements

| Type | Nombre | Priorité |
|------|--------|----------|
| **Nouveaux Requirements** | 2 | CRITIQUE |
| **Corrections Incohérences** | 3 | CRITIQUE |
| **Clarifications Ambiguïtés** | 5 | HAUTE |
| **Total Requirements** | 25 | - |

---

### 🎯 Impact sur l'Implémentation

#### **Priorités Mises à Jour:**

**CRITIQUE (à implémenter en premier):**
1. Synchronisation iCal (Req 1) - avec batch processing
2. Détection conflits (Req 6)
3. Matching iCal ↔ CSV (Req 3) - avec fuzzy matching
4. **Ordre d'exécution (Req 24)** - NOUVEAU

**HAUTE:**
5. Playwright CSV export (Req 2)
6. Import CSV manuel (Req 9)
7. Calendrier unifié (Req 8)
8. Bouton Sync Now (Req 10)
9. **Gestion cas limites (Req 25)** - NOUVEAU

---

### ✅ Propriétés de Correctness Testables

**Ajoutées:**
- **Pipeline invariant** (Req 24): Ordre d'exécution toujours respecté
- **Invariant contrainte unicité** (Req 5): (property_id, dates) unique

**Existantes:**
- Round-trip properties (Req 1, 9, 22, 23)
- Invariant properties (Req 3, 5, 6, 11, 16, 19, 24)
- Model-based testing (Req 6)

---

### 📋 Actions Suivantes

1. ✅ **Requirements finalisés** - 25 requirements cohérents
2. ⏭️ **Créer le Design** - Architecture technique détaillée
3. ⏭️ **Créer les Tasks** - Découpage en tâches d'implémentation
4. ⏭️ **Commencer l'implémentation** - Phase de développement

---

### 🔍 Validation

**Incohérences résolues:** ✅ 3/3
**Ambiguïtés clarifiées:** ✅ 5/5
**Nouveaux requirements:** ✅ 2/2
**Property-based testing:** ✅ Complet

**Status:** ✅ **PRÊT POUR LE DESIGN**
