# 🚀 Démarrage Rapide - Intégration Airbnb

**Date:** 2026-05-19  
**Temps total:** 30 minutes

---

## ✅ Prérequis (Déjà fait)

- ✅ Migrations SQL appliquées
- ✅ API endpoint opérationnel
- ✅ Configuration terminée
- ✅ Scripts de test créés

---

## 📊 ÉTAPE 1 : Analyse Rapide (5 min)

### Exécuter le Script d'Analyse

1. Ouvrir : https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk
2. Aller dans **SQL Editor**
3. Copier le contenu de `supabase/migrations/quick_analysis.sql`
4. Cliquer sur **Run** (ou F5)

### Résultats Attendus

Vous verrez 7 sections :

#### **Section 1 : Loft avec Mapping**
```
id | name | airbnb_listing_id | address | status
---+------+-------------------+---------+--------
... | ... | 12345678 | ... | available
```
→ Le(s) loft(s) déjà configuré(s)

#### **Section 2 : Statistiques**
```
Total Lofts: 53
Lofts avec Mapping: 1
Total Réservations: 708
Réservations Airbnb: 2
Réservations en Staging: 12
Syncs Réussis: 3
Conflits Ouverts: 1
```

#### **Section 7 : Listing IDs en Attente**
```
listing_id | reservations_count | earliest_checkin | latest_checkout
-----------+-------------------+------------------+----------------
87654321 | 5 | 2026-05-20 | 2026-06-30
12345678 | 3 | 2026-06-01 | 2026-07-15
```
→ **IMPORTANT !** Ces listing IDs ont des réservations en attente de mapping.

---

## 🔧 ÉTAPE 2 : Configurer le Mapping (10 min)

### A. Identifier vos Listing IDs Airbnb

Pour chaque loft Airbnb :
1. Allez sur votre compte Airbnb
2. Ouvrez l'annonce
3. URL : `https://www.airbnb.com/rooms/12345678`
4. Listing ID = `12345678`

### B. Voir vos Lofts

```sql
-- Dans Supabase SQL Editor
SELECT 
  id,
  name,
  address,
  airbnb_listing_id,
  CASE 
    WHEN airbnb_listing_id IS NOT NULL THEN '✓ Mappé'
    ELSE '✗ Non mappé'
  END as status
FROM lofts
ORDER BY name;
```

### C. Configurer le Mapping

#### **Option 1 : Mapper 1 loft**

```sql
UPDATE lofts 
SET airbnb_listing_id = '12345678' 
WHERE name = 'Nom Exact du Loft';
```

#### **Option 2 : Mapper plusieurs lofts**

```sql
UPDATE lofts 
SET airbnb_listing_id = CASE 
  WHEN name = 'Loft Alger Centre' THEN '11111111'
  WHEN name = 'Loft Oran Plage' THEN '22222222'
  WHEN name = 'Loft Constantine' THEN '33333333'
END
WHERE name IN ('Loft Alger Centre', 'Loft Oran Plage', 'Loft Constantine');
```

**💡 Astuce :** Commencez par les listing IDs qui ont le plus de réservations en attente (voir Section 7 de l'analyse).

### D. Vérifier le Mapping

```sql
SELECT 
  name,
  airbnb_listing_id,
  '✓ Configuré' as status
FROM lofts
WHERE airbnb_listing_id IS NOT NULL
ORDER BY name;
```

---

## 🧪 ÉTAPE 3 : Tester l'API (10 min)

### A. Démarrer le Serveur

```powershell
# Terminal 1
npm run dev
```

Attendez :
```
✓ Ready in 3.2s
○ Local: http://localhost:3000
```

### B. Modifier le Script de Test (Optionnel)

Si vous voulez tester avec un listing_id spécifique :

1. Ouvrir `test-airbnb-sync.ps1`
2. Ligne 13, modifier :
```powershell
listing_id = "12345678"  # ← Votre listing_id
```

### C. Exécuter le Test

```powershell
# Terminal 2 (nouveau terminal)
.\test-airbnb-sync.ps1
```

### D. Interpréter les Résultats

#### **✅ Succès avec Création**
```
✓ Succès!
Métriques:
  - Processed: 1
  - Created: 1
  - Skipped: 0
```
→ **Parfait !** La réservation a été créée.

#### **⚠️ Succès avec Avertissement**
```
✓ Succès!
Métriques:
  - Processed: 1
  - Skipped: 1
Avertissements:
  - Listing ID 12345678 not mapped to any loft
```
→ **Normal !** Retournez à l'ÉTAPE 2 pour mapper ce listing_id.

#### **❌ Erreur 401**
```
✗ Erreur!
Message: 401 Unauthorized
```
→ Vérifiez que `AIRBNB_API_SECRET` dans `.env` est correct.

### E. Vérifier dans la Base de Données

```sql
-- Dernière réservation créée
SELECT 
  id,
  loft_id,
  guest_name,
  check_in_date,
  check_out_date,
  total_amount,
  airbnb_confirmation_code,
  created_at
FROM reservations
WHERE source = 'airbnb_scraper'
ORDER BY created_at DESC
LIMIT 1;

-- Dernier log de sync
SELECT 
  sync_batch_id,
  status,
  reservations_created,
  reservations_updated,
  started_at
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 1;
```

---

## 🔄 ÉTAPE 4 : Traiter les Réservations en Staging (5 min)

Vous avez **12 réservations en attente** dans la table staging.

### A. Voir les Listing IDs en Attente

```sql
SELECT DISTINCT
  listing_id,
  COUNT(*) as reservations_count
FROM airbnb_reservations_staging
WHERE mapping_status IN ('pending', 'failed')
GROUP BY listing_id
ORDER BY reservations_count DESC;
```

### B. Mapper les Listing IDs Manquants

Pour chaque listing_id trouvé :

```sql
UPDATE lofts 
SET airbnb_listing_id = 'LISTING_ID_TROUVE' 
WHERE name = 'Nom du Loft Correspondant';
```

### C. Relancer la Synchronisation

Une fois le mapping configuré, les réservations en staging seront automatiquement traitées lors de la prochaine synchronisation.

**OU** vous pouvez forcer le traitement :

```sql
-- Voir les réservations qui peuvent maintenant être traitées
SELECT 
  s.airbnb_id,
  s.listing_id,
  l.name as loft_name,
  s.guest_name,
  s.check_in_date
FROM airbnb_reservations_staging s
JOIN lofts l ON l.airbnb_listing_id = s.listing_id
WHERE s.reconciliation_status = 'pending';
```

---

## ✅ Checklist de Démarrage

- [ ] **ÉTAPE 1 :** Analyse rapide exécutée
  - [ ] Vu le loft avec mapping
  - [ ] Vu les statistiques
  - [ ] Identifié les listing IDs en attente

- [ ] **ÉTAPE 2 :** Mapping configuré
  - [ ] Listing IDs Airbnb identifiés
  - [ ] Au moins 5 lofts mappés
  - [ ] Mapping vérifié

- [ ] **ÉTAPE 3 :** API testée
  - [ ] Serveur démarré
  - [ ] Test exécuté avec succès
  - [ ] Réservation créée dans la DB

- [ ] **ÉTAPE 4 :** Staging traité
  - [ ] Listing IDs en attente mappés
  - [ ] Réservations en staging traitées

---

## 🎯 Après le Démarrage

Une fois ces 4 étapes terminées, vous êtes prêt pour :

### **Prochaine Étape : Modifier le Script Python**

Voir : `AIRBNB_INTEGRATION_NEXT_STEPS.md` (ÉTAPE 5)

**Objectif :** Modifier `d:\Airbnb_transfer_v2\airbnb_scraper.py` pour envoyer automatiquement les données à l'API Next.js.

**Temps estimé :** 1-2 heures

---

## 📚 Documentation

| Fichier | Utilisation |
|---------|-------------|
| `quick_analysis.sql` | Analyse rapide (sans erreurs) |
| `analyze_airbnb_data.sql` | Analyse complète (7 sections) |
| `configure_airbnb_mapping.sql` | Templates de configuration |
| `test-airbnb-sync.ps1` | Test de l'API |

---

## 🔑 Informations Clés

```
API Key: NXxmDRrHzvb4I+SuGdZv9kGvd574bnhVctjKcz0rR1s=
API URL: http://localhost:3000/api/airbnb/sync
Supabase: https://zlpzuyctjhajdwlxzdzk.supabase.co
```

---

## 🆘 Aide Rapide

### Erreur "column does not exist"
→ Utilisez `quick_analysis.sql` au lieu de `analyze_airbnb_data.sql`

### Erreur "Listing ID not mapped"
→ Retournez à l'ÉTAPE 2 pour configurer le mapping

### Erreur "401 Unauthorized"
→ Vérifiez `AIRBNB_API_SECRET` dans `.env`

---

**Prochaine action :** Exécuter `quick_analysis.sql` dans Supabase SQL Editor 🚀
