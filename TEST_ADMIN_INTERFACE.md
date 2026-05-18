# 🧪 Guide de Test - Interface Admin Import Airbnb

## 📋 Prérequis

Avant de tester l'interface admin, assurez-vous que :

1. ✅ Les migrations SQL sont appliquées (005 à 009)
2. ✅ L'API endpoint est déployée (`/api/airbnb/sync`)
3. ✅ Les variables d'environnement sont configurées :
   - `AIRBNB_SYNC_ENABLED=true`
   - `AIRBNB_API_SECRET=votre-api-key`
4. ✅ Le serveur Next.js est démarré (`npm run dev`)

---

## 🚀 Étapes de Test

### Test 1: Accéder à l'Interface Admin

**Action:**
1. Démarrer le serveur local :
   ```bash
   npm run dev
   ```

2. Ouvrir le navigateur :
   ```
   http://localhost:3000/fr/admin/airbnb/import
   ```
   ou
   ```
   http://localhost:3000/en/admin/airbnb/import
   ```

**Résultat Attendu:**
- ✅ Page affichée avec le titre "Import Réservations Airbnb"
- ✅ Zone de drop pour uploader un fichier JSON
- ✅ Message "Cliquez pour sélectionner un fichier"

**Capture d'écran:**
```
┌─────────────────────────────────────────────────────────┐
│ Import Réservations Airbnb                              │
│ Importez des réservations depuis un fichier JSON       │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │                    📤                            │   │
│ │     Cliquez pour sélectionner un fichier        │   │
│ │     ou glissez-déposez un fichier JSON          │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### Test 2: Upload du Fichier JSON

**Action:**
1. Cliquer sur la zone de drop
2. Sélectionner le fichier : `test-data/reservations_test.json`

**Résultat Attendu:**
- ✅ Fichier chargé avec succès
- ✅ Prévisualisation du JSON affichée
- ✅ Message "3 réservation(s) détectée(s)"
- ✅ Bouton "Importer les réservations" visible
- ✅ Bouton "Annuler" visible

**Capture d'écran:**
```
┌─────────────────────────────────────────────────────────┐
│ 📄 reservations_test.json                               │
│ 3 réservation(s) détectée(s)                           │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ {                                                │   │
│ │   "reservations": [                              │   │
│ │     {                                            │   │
│ │       "id": "HMTEST001",                         │   │
│ │       "listing_id": "12345678",                  │   │
│ │       ...                                        │   │
│ │     }                                            │   │
│ │   ]                                              │   │
│ │ }                                                │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ [✓ Importer les réservations]  [Annuler]              │
└─────────────────────────────────────────────────────────┘
```

---

### Test 3: Importer les Réservations (Sans Mapping)

**Action:**
1. Cliquer sur "Importer les réservations"
2. Attendre la fin du traitement

**Résultat Attendu:**
- ✅ Loader affiché pendant le traitement
- ✅ Message "Import en cours..."
- ✅ Après quelques secondes, résultat affiché
- ✅ Métriques affichées :
  - Traitées: 3
  - Créées: 0
  - Mises à jour: 0
  - Ignorées: 3 (car listing_ids non mappés)
  - Échouées: 0
  - Conflits: 0
- ✅ Avertissements affichés :
  - "Listing ID 12345678 not mapped to any loft"
  - "Listing ID 99999999 not mapped to any loft"

**Capture d'écran:**
```
┌─────────────────────────────────────────────────────────┐
│ ✓ Import réussi                                         │
│ Batch ID: 550e8400-e29b-41d4-a716-446655440000         │
│                                                         │
│ ┌──────────┬──────────┬──────────┐                     │
│ │ Traitées │ Créées   │ Mises à  │                     │
│ │    3     │    0     │ jour: 0  │                     │
│ └──────────┴──────────┴──────────┘                     │
│ ┌──────────┬──────────┬──────────┐                     │
│ │ Ignorées │ Échouées │ Conflits │                     │
│ │    3     │    0     │    0     │                     │
│ └──────────┴──────────┴──────────┘                     │
│                                                         │
│ ⚠️ 3 avertissement(s)                                   │
│ • HMTEST001: Listing ID 12345678 not mapped            │
│ • HMTEST002: Listing ID 12345678 not mapped            │
│ • HMTEST003: Listing ID 99999999 not mapped            │
│                                                         │
│ [Importer un autre fichier]  [Voir les logs]          │
└─────────────────────────────────────────────────────────┘
```

---

### Test 4: Vérifier les Logs dans Supabase

**Action:**
1. Ouvrir Supabase Dashboard
2. Aller dans SQL Editor
3. Exécuter la requête :

```sql
SELECT 
  sync_batch_id,
  sync_type,
  status,
  reservations_received,
  reservations_created,
  reservations_updated,
  reservations_skipped,
  reservations_failed,
  conflicts_detected,
  started_at,
  completed_at
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 1;
```

**Résultat Attendu:**
```
sync_batch_id: 550e8400-e29b-41d4-a716-446655440000
sync_type: manual
status: success
reservations_received: 3
reservations_created: 0
reservations_updated: 0
reservations_skipped: 3
reservations_failed: 0
conflicts_detected: 0
started_at: 2026-05-18 12:00:00
completed_at: 2026-05-18 12:00:02
```

---

### Test 5: Vérifier la Table Staging

**Action:**
Exécuter la requête :

```sql
SELECT 
  airbnb_id,
  listing_id,
  guest_name,
  check_in_date,
  check_out_date,
  mapping_status,
  validation_status,
  reconciliation_status,
  created_at
FROM airbnb_reservations_staging
ORDER BY created_at DESC
LIMIT 3;
```

**Résultat Attendu:**
```
airbnb_id: HMTEST003
listing_id: 99999999
guest_name: John Doe
check_in_date: 2026-06-20
check_out_date: 2026-06-22
mapping_status: failed
validation_status: valid
reconciliation_status: skipped

airbnb_id: HMTEST002
listing_id: 12345678
guest_name: Sarah Martin
check_in_date: 2026-06-10
check_out_date: 2026-06-15
mapping_status: failed
validation_status: valid
reconciliation_status: skipped

airbnb_id: HMTEST001
listing_id: 12345678
guest_name: Ahmed Benali
check_in_date: 2026-06-01
check_out_date: 2026-06-05
mapping_status: failed
validation_status: valid
reconciliation_status: skipped
```

---

### Test 6: Configurer le Mapping et Re-tester

**Action:**
1. Mapper le listing_id à un loft existant :

```sql
-- Trouver un loft existant
SELECT id, name FROM lofts LIMIT 1;

-- Mapper le listing_id (remplacer {loft_id} par l'ID réel)
UPDATE lofts 
SET airbnb_listing_id = '12345678' 
WHERE id = '{loft_id}';

-- Vérifier
SELECT id, name, airbnb_listing_id 
FROM lofts 
WHERE airbnb_listing_id IS NOT NULL;
```

2. Re-uploader le fichier `reservations_test.json`
3. Cliquer sur "Importer les réservations"

**Résultat Attendu:**
- ✅ Métriques :
  - Traitées: 3
  - Créées: 2 (HMTEST001 et HMTEST002)
  - Mises à jour: 0
  - Ignorées: 1 (HMTEST003 - listing_id 99999999 non mappé)
  - Échouées: 0
  - Conflits: 0
- ✅ Avertissements :
  - "Listing ID 99999999 not mapped to any loft"

---

### Test 7: Vérifier les Réservations Créées

**Action:**
Exécuter la requête :

```sql
SELECT 
  id,
  loft_id,
  airbnb_confirmation_code,
  guest_name,
  check_in_date,
  check_out_date,
  total_amount,
  status,
  source,
  synced_at
FROM reservations
WHERE source = 'airbnb_scraper'
ORDER BY created_at DESC
LIMIT 2;
```

**Résultat Attendu:**
```
id: {uuid}
loft_id: {loft_id}
airbnb_confirmation_code: HMTEST002
guest_name: Sarah Martin
check_in_date: 2026-06-10
check_out_date: 2026-06-15
total_amount: 50000.00
status: pending
source: airbnb_scraper
synced_at: 2026-05-18 12:05:00

id: {uuid}
loft_id: {loft_id}
airbnb_confirmation_code: HMTEST001
guest_name: Ahmed Benali
check_in_date: 2026-06-01
check_out_date: 2026-06-05
total_amount: 40000.00
status: confirmed
source: airbnb_scraper
synced_at: 2026-05-18 12:05:00
```

---

### Test 8: Tester la Mise à Jour (UPDATE)

**Action:**
1. Modifier le fichier `reservations_test.json` :
   - Changer `montant_total` de HMTEST001 : `40000.00` → `42000.00`
   - Changer `nb_voyageurs` de HMTEST001 : `2` → `3`

2. Re-uploader le fichier
3. Cliquer sur "Importer les réservations"

**Résultat Attendu:**
- ✅ Métriques :
  - Traitées: 3
  - Créées: 0
  - Mises à jour: 2 (HMTEST001 et HMTEST002)
  - Ignorées: 1
  - Échouées: 0
  - Conflits: 0

---

### Test 9: Tester avec des Données Invalides

**Action:**
1. Créer un fichier `test-data/reservations_invalid.json` :

```json
{
  "reservations": [
    {
      "id": "HMINVALID001",
      "listing_id": "12345678",
      "statut": "Confirmée",
      "voyageur": "Test Invalid",
      "nb_voyageurs": -1,
      "date_arrivee": "2026-06-01",
      "date_depart": "2026-05-30",
      "nb_nuits": 4,
      "montant_total": -1000.00,
      "devise": "DZD"
    }
  ],
  "sync_metadata": {
    "sync_type": "manual",
    "timestamp": "2026-05-18T12:00:00Z",
    "script_version": "2.0.0"
  }
}
```

2. Uploader ce fichier
3. Cliquer sur "Importer les réservations"

**Résultat Attendu:**
- ✅ Métriques :
  - Traitées: 1
  - Créées: 0
  - Mises à jour: 0
  - Ignorées: 0
  - Échouées: 1
  - Conflits: 0
- ✅ Erreurs affichées :
  - "HMINVALID001: Validation failed"
  - Détails : "Guest count must be > 0", "Total amount must be >= 0", "Check-in date must be before check-out date"

---

### Test 10: Tester le Bouton "Annuler"

**Action:**
1. Uploader un fichier JSON
2. Cliquer sur "Annuler" avant d'importer

**Résultat Attendu:**
- ✅ Retour à l'écran initial
- ✅ Zone de drop réaffichée
- ✅ Fichier réinitialisé

---

### Test 11: Tester le Bouton "Voir les logs"

**Action:**
1. Après un import réussi
2. Cliquer sur "Voir les logs"

**Résultat Attendu:**
- ✅ Redirection vers `/admin/airbnb/monitoring`
- ⚠️ Page monitoring pas encore créée (Phase 2)
- ℹ️ Pour l'instant, vérifier les logs dans Supabase

---

## ✅ Checklist de Test

- [ ] Test 1: Accès à l'interface ✓
- [ ] Test 2: Upload fichier JSON ✓
- [ ] Test 3: Import sans mapping (warnings) ✓
- [ ] Test 4: Vérification logs Supabase ✓
- [ ] Test 5: Vérification table staging ✓
- [ ] Test 6: Import avec mapping (succès) ✓
- [ ] Test 7: Vérification réservations créées ✓
- [ ] Test 8: Mise à jour (UPDATE) ✓
- [ ] Test 9: Données invalides (erreurs) ✓
- [ ] Test 10: Bouton Annuler ✓
- [ ] Test 11: Bouton Voir les logs ✓

---

## 🐛 Problèmes Connus

### Problème: "Error: fetch failed"
**Cause:** Serveur Next.js non démarré  
**Solution:** `npm run dev`

### Problème: "Invalid JSON payload"
**Cause:** Fichier JSON mal formaté  
**Solution:** Vérifier la syntaxe JSON (virgules, guillemets, etc.)

### Problème: "Missing or invalid Authorization header"
**Cause:** API Key non configurée  
**Solution:** Ajouter `AIRBNB_API_SECRET` dans `.env.local`

### Problème: Page 404
**Cause:** Route incorrecte  
**Solution:** Utiliser `/fr/admin/airbnb/import` ou `/en/admin/airbnb/import`

---

## 📊 Résultats Attendus

### Scénario Nominal (avec mapping)
- ✅ 100% des réservations créées/mises à jour
- ✅ 0 erreur
- ✅ 0 avertissement
- ✅ Logs dans `airbnb_sync_logs`
- ✅ Données dans `reservations`

### Scénario avec Warnings (sans mapping)
- ✅ 0% des réservations créées
- ✅ 100% des réservations ignorées
- ✅ Warnings "Listing ID not mapped"
- ✅ Données dans `airbnb_reservations_staging`

### Scénario avec Erreurs (données invalides)
- ❌ Réservations échouées
- ❌ Erreurs de validation affichées
- ✅ Logs dans `airbnb_sync_logs`
- ✅ Données dans `airbnb_reservations_staging` (validation_status='invalid')

---

## 🎉 Conclusion

Si tous les tests passent, l'interface admin est **100% fonctionnelle** ! 🚀

**Prochaine étape:** Tester le script Python avec le mode automatique (API).

---

**Créé le:** 2026-05-18  
**Version:** 1.0.0
