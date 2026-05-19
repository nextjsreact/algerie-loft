# 🧪 Guide de Test de l'API Airbnb

**Date:** 2026-05-19  
**Prérequis:** Nettoyage effectué avec `cleanup_and_fix.sql`

---

## 🎯 Objectif

Tester l'endpoint `/api/airbnb/sync` pour vérifier que :
1. L'API accepte les requêtes
2. Les réservations sont créées/mises à jour
3. Les logs sont enregistrés
4. Les conflits sont détectés

---

## 📋 Étape 1 : Démarrer le Serveur (2 min)

### Terminal 1 : Démarrer Next.js

```powershell
npm run dev
```

**Attendez ce message :**
```
✓ Ready in 3.2s
○ Local: http://localhost:3000
```

**⚠️ Ne fermez pas ce terminal !**

---

## 🧪 Étape 2 : Exécuter le Test (2 min)

### Terminal 2 : Lancer le Script de Test

```powershell
# Ouvrir un NOUVEAU terminal
.\test-airbnb-sync.ps1
```

---

## 📊 Étape 3 : Interpréter les Résultats

### ✅ **Résultat Attendu : Succès avec Mise à Jour**

```powershell
============================================
Test de l'endpoint Airbnb Sync API
============================================

Payload:
{
  "reservations": [
    {
      "id": "HMTEST1234",
      "listing_id": "12345678",
      "statut": "Confirmée",
      "voyageur": "John Doe (TEST)",
      ...
    }
  ],
  ...
}

Envoi de la requête à http://localhost:3000/api/airbnb/sync...

✓ Succès!

Réponse:
{
  "success": true,
  "sync_batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "metrics": {
    "processed": 1,
    "created": 0,
    "updated": 1,  ← Mise à jour d'une réservation existante
    "skipped": 0,
    "failed": 0,
    "conflicts": 0
  },
  "errors": [],
  "warnings": []
}

Métriques:
  - Processed: 1
  - Created: 0
  - Updated: 1
  - Skipped: 0
  - Failed: 0
  - Conflicts: 0

Sync Batch ID: 550e8400-e29b-41d4-a716-446655440000

============================================
Test terminé
============================================
```

**✓ Parfait !** L'API fonctionne correctement.

---

### ⚠️ **Résultat Possible : Succès avec Création**

```powershell
Métriques:
  - Processed: 1
  - Created: 1  ← Nouvelle réservation créée
  - Updated: 0
  - Skipped: 0
  - Failed: 0
  - Conflicts: 0
```

**✓ Parfait !** Une nouvelle réservation a été créée.

---

### ⚠️ **Résultat Possible : Avertissement**

```powershell
Avertissements:
  - [HMTEST1234] Listing ID 12345678 not mapped to any loft
```

**→ Action :** Le listing_id du test n'est pas mappé. C'est normal si vous testez avec un listing_id différent.

---

### ❌ **Résultat Possible : Erreur 401**

```powershell
✗ Erreur!

Message: 401 Unauthorized
```

**→ Solution :**
1. Vérifier que le serveur Next.js est démarré
2. Vérifier que `AIRBNB_API_SECRET` dans `.env` est correct :
   ```
   AIRBNB_API_SECRET=NXxmDRrHzvb4I+SuGdZv9kGvd574bnhVctjKcz0rR1s=
   ```

---

### ❌ **Résultat Possible : Erreur de Connexion**

```powershell
✗ Erreur!

Message: Unable to connect to the remote server
```

**→ Solution :**
1. Vérifier que le serveur Next.js est démarré (Terminal 1)
2. Vérifier l'URL dans le script : `http://localhost:3000/api/airbnb/sync`

---

## 🔍 Étape 4 : Vérifier dans la Base de Données (5 min)

### A. Voir la Dernière Réservation

```sql
-- Dans Supabase SQL Editor
SELECT 
  id,
  loft_id,
  guest_name,
  check_in_date,
  check_out_date,
  total_amount,
  currency_code,
  status,
  airbnb_confirmation_code,
  source,
  synced_at,
  created_at,
  updated_at
FROM reservations
WHERE source = 'airbnb_scraper'
ORDER BY updated_at DESC
LIMIT 1;
```

**Résultat attendu :**
```
guest_name: John Doe (TEST)
check_in_date: 2026-06-01
check_out_date: 2026-06-05
total_amount: 40000.00
airbnb_confirmation_code: HMTEST1234
source: airbnb_scraper
synced_at: 2026-05-19 XX:XX:XX  ← Date/heure du test
updated_at: 2026-05-19 XX:XX:XX  ← Date/heure du test
```

---

### B. Voir le Dernier Log de Sync

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
  completed_at,
  duration_ms,
  script_version
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 1;
```

**Résultat attendu :**
```
sync_type: manual
status: success
reservations_received: 1
reservations_created: 0 ou 1
reservations_updated: 1 ou 0
duration_ms: < 2000 (moins de 2 secondes)
script_version: 2.0.0-test
```

---

### C. Voir le Staging

```sql
SELECT 
  airbnb_id,
  listing_id,
  guest_name,
  mapping_status,
  validation_status,
  reconciliation_status,
  reconciliation_action,
  created_at,
  processed_at
FROM airbnb_reservations_staging
ORDER BY created_at DESC
LIMIT 1;
```

**Résultat attendu :**
```
airbnb_id: HMTEST1234
listing_id: 12345678
mapping_status: mapped
validation_status: valid
reconciliation_status: created ou updated
reconciliation_action: create ou update
processed_at: 2026-05-19 XX:XX:XX  ← Date/heure du test
```

---

## 🎯 Étape 5 : Tester avec Différents Scénarios (Optionnel)

### Scénario A : Tester avec un Listing ID Non Mappé

1. Modifier `test-airbnb-sync.ps1` :
```powershell
listing_id = "99999999"  # Listing ID non mappé
```

2. Relancer le test
3. **Résultat attendu :** Warning "Listing ID not mapped"

---

### Scénario B : Tester une Mise à Jour

1. Exécuter le test une première fois (crée la réservation)
2. Modifier le montant dans `test-airbnb-sync.ps1` :
```powershell
montant_total = 45000.00  # Au lieu de 40000.00
```

3. Relancer le test
4. **Résultat attendu :** `updated: 1`

---

### Scénario C : Tester la Détection de Conflit

1. Créer une réservation manuelle qui chevauche :
```sql
INSERT INTO reservations (
  loft_id,
  guest_name,
  guest_phone,
  guest_count,
  check_in_date,
  check_out_date,
  total_amount,
  currency_code,
  status,
  source
) VALUES (
  '5372ab62-3a1e-46f6-bed4-3dc025ebdbfd',  -- Star loft
  'Test Conflict',
  'N/A',
  2,
  '2026-06-03',  -- Chevauche avec le test
  '2026-06-07',
  30000.00,
  'DZD',
  'confirmed',
  'manual'
);
```

2. Relancer le test
3. **Résultat attendu :** `conflicts: 1`

4. Vérifier le conflit :
```sql
SELECT * FROM airbnb_conflicts ORDER BY created_at DESC LIMIT 1;
```

---

## ✅ Checklist de Test

- [ ] **Serveur démarré**
  - [ ] Terminal 1 : `npm run dev` en cours d'exécution
  - [ ] Message "Ready" affiché

- [ ] **Test exécuté**
  - [ ] Terminal 2 : `.\test-airbnb-sync.ps1` exécuté
  - [ ] Résultat : ✓ Succès

- [ ] **Vérifications DB**
  - [ ] Réservation créée/mise à jour dans `reservations`
  - [ ] Log créé dans `airbnb_sync_logs`
  - [ ] Entrée créée dans `airbnb_reservations_staging`

- [ ] **Métriques correctes**
  - [ ] `processed: 1`
  - [ ] `created: 0 ou 1`
  - [ ] `updated: 1 ou 0`
  - [ ] `failed: 0`

---

## 🎉 Succès !

Si tous les tests passent, votre API est **100% opérationnelle** !

### Prochaines Étapes

1. **Mapper plus de lofts** (voir `configure_airbnb_mapping.sql`)
2. **Modifier le script Python** (voir `AIRBNB_INTEGRATION_NEXT_STEPS.md`)
3. **Créer l'interface admin** (optionnel)

---

## 🆘 Problèmes Courants

| Problème | Solution |
|----------|----------|
| Erreur 401 | Vérifier `AIRBNB_API_SECRET` dans `.env` |
| Erreur de connexion | Vérifier que `npm run dev` est lancé |
| Listing ID not mapped | Normal si vous testez avec un listing_id différent |
| Conflit détecté | Vérifier les réservations existantes dans la DB |

---

**Prochaine action :** Exécuter `cleanup_and_fix.sql` puis lancer le test ! 🚀
