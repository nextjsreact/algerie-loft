# 🐛 BUG CRITIQUE : 3 réservations valides non synchronisées

## 🔴 Problème identifié

**3 réservations Airbnb** sont dans `airbnb_reservations_staging` avec :
- ✅ `validation_status = 'valid'`
- ✅ `mapping_status = 'mapped'`
- ✅ Lofts correctement mappés
- ❌ **MAIS absentes de la table `reservations`**

## 📊 Détails des réservations manquantes

```
┌──────────────┬──────────────────────┬────────────┬──────────────────┬──────────────────┐
│ Airbnb ID    │ Guest Name           │ Date créa  │ Loft             │ Validation       │
├──────────────┼──────────────────────┼────────────┼──────────────────┼──────────────────┤
│ HM485Y9PET   │ Jiakun Zheng         │ 2026-06-06 │ Purple's loft    │ valid + mapped ✅│
│ HMPQKER8J5   │ Abdel Djoumad        │ 2026-06-06 │ Amel loft        │ valid + mapped ✅│
│ HMK58SP4JB   │ Ouardia Yahiaoui     │ 2026-06-06 │ La redoute N5    │ valid + mapped ✅│
└──────────────┴──────────────────────┴────────────┴──────────────────┴──────────────────┘
```

**Toutes créées le 6 juin 2026** (même jour) 🤔

## 🔍 Analyse : Correspondance avec les échecs du 6 juin

### Rappel des logs de sync du 6 juin

D'après `airbnb_sync_logs`, le **6 juin 2026** :
```
22:14:40 → 11 reservations_failed
22:10:03 → 1  reservation_failed
22:09:20 → 2  reservations_failed
22:08:29 → 2  reservations_failed
22:05:42 → 3  reservations_failed  ← HM485Y9PET créée à 22:05:42 !
```

**Total : 19 réservations échouées**

**Observation** : Les 3 réservations manquantes ont été créées dans staging aux moments où des échecs de sync étaient enregistrés :
- `HMK58SP4JB` - 21:29:50
- `HMPQKER8J5` - 21:48:55
- `HM485Y9PET` - 22:05:42 ← Exactement pendant la sync qui a échoué !

## 🎯 Cause probable : Échec silencieux

### Hypothèse

Le service de synchronisation a **échoué** à insérer ces 3 réservations dans `reservations` mais :
1. ✅ Les a validées (validation_status = 'valid')
2. ✅ Les a mappées (mapping_status = 'mapped')
3. ✅ A incrémenté `reservations_failed`
4. ❌ **N'a PAS enregistré l'erreur** dans le champ `errors` (JSON vide)
5. ❌ **N'a PAS créé les enregistrements** dans `reservations`

### Code suspect

**Fichier** : `lib/services/airbnb-sync-service-optimized.ts`

**Ligne 299** : Préparation UPDATE/INSERT
```typescript
if (matchType === 'airbnb_id' && existing) {
  // UPDATE
  toUpdate.push({ payload: { ...payload, id: existing.id }, airbnbId: parsed.airbnb_id, matchType: 'airbnb_id' });
} else {
  // INSERT
  toCreate.push({ payload, airbnbId: parsed.airbnb_id });
}
```

**Lignes 377-406** : Insertion batch
```typescript
if (toCreate.length > 0) {
  const { data: createdReservations, error: createError } = await this.supabase
    .from('reservations')
    .insert(toCreate.map(t => t.payload))
    .select();

  if (createError) {
    console.error('[Airbnb Sync Optimized] Failed to create reservations:', createError);
    // ⚠️ PROBLÈME: Marque TOUTES comme failed mais n'enregistre pas les détails
    this.metrics.failed += toCreate.length;
    this.metrics.affected = this.metrics.affected.map(a =>
      a.action === 'created' ? { ...a, action: 'failed' as const, error: createError.message } : a
    );
  }
}
```

**Problème** : Si `createError` se produit, le code :
- ✅ Incrémente `this.metrics.failed`
- ❌ **NE REMPLIT PAS `this.errors`** avec les détails

## 💥 Impact

### Réservations perdues
- 3 réservations Airbnb **payées** mais non enregistrées
- Clients ont réservé et payé
- Dates occupées sur Airbnb mais disponibles dans votre système

### Risque de double réservation
- Ces dates apparaissent comme disponibles
- Risque de réserver manuellement sur des dates déjà prises

### Revenus manquants
- Statistiques incomplètes
- Revenus non comptabilisés

## ✅ Solution immédiate : Resynchronisation

### Option 1 : Resync ciblée depuis staging

**Script SQL** :
```sql
-- Insérer manuellement les 3 réservations depuis staging
INSERT INTO reservations (
  loft_id,
  airbnb_confirmation_code,
  guest_name,
  check_in_date,
  check_out_date,
  guest_count,
  total_amount,
  currency_code,
  status,
  source,
  created_at,
  guest_email,
  guest_phone
)
SELECT 
  l.id as loft_id,
  s.airbnb_id,
  s.guest_name,
  s.check_in_date::date,
  s.check_out_date::date,
  (s.raw_data->>'nb_voyageurs')::integer,
  (s.raw_data->>'montant_total')::numeric,
  'DZD',
  CASE 
    WHEN s.raw_data->>'statut' = 'Laissez un commentaire sur le voyageur' THEN 'completed'
    WHEN s.raw_data->>'statut' = 'En attente de commentaire du voyageur' THEN 'completed'
    ELSE 'confirmed'
  END as status,
  'airbnb_scraper',
  NOW(),
  COALESCE(s.raw_data->>'guest_email', ''),
  COALESCE(s.raw_data->>'guest_phone', '')
FROM airbnb_reservations_staging s
INNER JOIN lofts l ON l.airbnb_listing_id = s.raw_data->>'listing_id'
WHERE s.airbnb_id IN ('HM485Y9PET', 'HMPQKER8J5', 'HMK58SP4JB')
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  )
RETURNING 
  id,
  airbnb_confirmation_code,
  guest_name,
  check_in_date,
  check_out_date,
  status;
```

### Option 2 : Relancer la synchronisation Airbnb

Déclencher une nouvelle sync ciblée qui retraitera les réservations de staging.

## 🔧 Correction du bug dans le code

### Fichier : `lib/services/airbnb-sync-service-optimized.ts`

**Problème** : Les erreurs d'insertion ne sont pas enregistrées dans `this.errors`

**Correction** :
```typescript
if (createError) {
  console.error('[Airbnb Sync Optimized] Failed to create reservations:', createError);
  
  // ✅ AJOUT: Enregistrer l'erreur pour chaque réservation échouée
  toCreate.forEach(t => {
    this.errors.push({
      reservation_id: t.airbnbId,
      error: `Failed to create reservation: ${createError.message}`,
      details: createError
    });
  });
  
  this.metrics.failed += toCreate.length;
  this.metrics.affected = this.metrics.affected.map(a =>
    a.action === 'created' ? { ...a, action: 'failed' as const, error: createError.message } : a
  );
}
```

**Faire la même chose pour les UPDATE** (ligne 418-431)

## 📋 Procédure de correction

### Étape 1 : Récupérer les 3 réservations manquantes ⏳

Exécuter le script SQL d'insertion ci-dessus

### Étape 2 : Corriger le code ⏳

Modifier `airbnb-sync-service-optimized.ts` pour enregistrer les erreurs

### Étape 3 : Vérifier s'il y a d'autres réservations manquantes ⏳

```sql
-- Compter toutes les réservations staging valides mais non synchronisées
SELECT 
  COUNT(*) as total_manquantes
FROM airbnb_reservations_staging s
WHERE s.validation_status = 'valid'
  AND s.mapping_status = 'mapped'
  AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.airbnb_confirmation_code = s.airbnb_id
  );
```

### Étape 4 : Déployer et tester ⏳

## 🎯 Résumé

| Aspect | État | Détails |
|--------|------|---------|
| **Réservations manquantes** | 🔴 3 identifiées | Valides mais non synchronisées |
| **Cause** | 🐛 Bug de sync | Échec d'insertion non loggé |
| **Impact** | ⚠️ Moyen | Revenus manquants, risque double réservation |
| **Solution immédiate** | ✅ Script SQL | Insérer manuellement |
| **Correction long terme** | ⏳ Code à modifier | Enregistrer toutes les erreurs |

---

**Date de détection** : 2026-06-08  
**Réservations affectées** : 3 (HM485Y9PET, HMPQKER8J5, HMK58SP4JB)  
**Dates concernées** : 5-6 juin et 29 mai-6 juin 2026  
**Priorité** : 🔴 HAUTE - Revenus manquants
