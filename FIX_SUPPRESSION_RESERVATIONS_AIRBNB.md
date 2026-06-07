# Correction : Erreur de suppression des réservations Airbnb

## 🔴 Problème

Lors de la suppression d'une réservation Airbnb, vous obtenez une erreur de violation de contrainte de clé étrangère (foreign key constraint).

### Erreur typique
```
ERROR: update or delete on table "reservations" violates foreign key constraint
DETAIL: Key (id)=(...) is still referenced from table "airbnb_conflicts" (or "airbnb_reservations_staging")
```

## 🔍 Cause

Les tables liées à Airbnb ont des foreign keys vers `reservations` mais **sans `ON DELETE CASCADE`** :

| Table | Contrainte | Problème |
|-------|-----------|----------|
| `airbnb_notifications` | ✅ ON DELETE CASCADE | Pas de problème |
| `airbnb_conflicts` | ❌ Pas de CASCADE | **Bloque la suppression** |
| `airbnb_reservations_staging` | ❌ Pas de CASCADE | **Bloque la suppression** |
| `airbnb_sync_log_reservations` | ✅ ON DELETE CASCADE | Pas de problème |

## ✅ Solutions appliquées

### 1. Migration SQL (à appliquer)

**Fichier :** `supabase/migrations/20260607000000_fix_airbnb_foreign_keys_cascade.sql`

Cette migration :
- ✅ Ajoute `ON DELETE CASCADE` à `airbnb_conflicts` (les conflits sans réservation n'ont pas de sens)
- ✅ Ajoute `ON DELETE SET NULL` à `airbnb_reservations_staging` (garde l'historique de staging)
- ✅ Vérifie et corrige `airbnb_notifications` (normalement déjà correct)

**Comportement après migration :**
- Supprimer une réservation → supprime automatiquement les conflits associés
- Supprimer une réservation → met à NULL la référence dans staging (garde l'historique)
- Supprimer une réservation → supprime automatiquement les notifications

### 2. API de suppression améliorée

**Fichier :** `app/api/reservations/[id]/delete/route.ts`

L'API nettoie maintenant manuellement les données liées **avant** la suppression, au cas où les contraintes CASCADE ne seraient pas encore appliquées :

```typescript
// Nettoyage manuel pour les réservations Airbnb
if (reservation.source === 'airbnb_scraper') {
  // Supprimer notifications, conflits, mettre staging à NULL
}

// Puis supprimer la réservation
await supabase.from('reservations').delete().eq('id', id)
```

## 🚀 Comment appliquer la correction

### Étape 1 : Appliquer la migration SQL

**Option A : Via Supabase Dashboard**
1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez le contenu de `supabase/migrations/20260607000000_fix_airbnb_foreign_keys_cascade.sql`
4. Exécutez le script
5. Vérifiez qu'il n'y a pas d'erreurs

**Option B : Via CLI Supabase**
```bash
supabase db push
```

**Option C : Via psql direct**
```bash
psql "postgresql://..." -f supabase/migrations/20260607000000_fix_airbnb_foreign_keys_cascade.sql
```

### Étape 2 : Déployer le code

Le code mis à jour a déjà été pushé sur GitHub et sera déployé automatiquement.

### Étape 3 : Tester

1. Allez dans `/fr/reservations`
2. Sélectionnez une réservation Airbnb
3. Cliquez sur "Supprimer"
4. Confirmez la suppression
5. ✅ La suppression devrait maintenant fonctionner sans erreur

## 🔧 Vérification

Pour vérifier que les contraintes sont correctement configurées :

```sql
-- Vérifier les contraintes ON DELETE
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'reservations'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

**Résultat attendu :**
```
table_name                      | constraint_name                              | delete_rule
--------------------------------|---------------------------------------------|-------------
airbnb_notifications            | airbnb_notifications_reservation_id_fkey    | CASCADE
airbnb_conflicts                | airbnb_conflicts_reservation_1_id_fkey      | CASCADE
airbnb_conflicts                | airbnb_conflicts_reservation_2_id_fkey      | CASCADE
airbnb_reservations_staging     | airbnb_reservations_staging_reservation_id  | SET NULL
airbnb_sync_log_reservations    | airbnb_sync_log_reservations_reservation_id | CASCADE
```

## 📊 Impact

### Avant la correction
- ❌ Impossible de supprimer une réservation Airbnb
- ❌ Erreur de violation de contrainte
- ❌ Données orphelines possibles

### Après la correction
- ✅ Suppression de réservations Airbnb fonctionne
- ✅ Nettoyage automatique des données liées
- ✅ Historique de staging préservé
- ✅ Pas de données orphelines

## 🛡️ Sécurité

La suppression de réservations est **réservée aux rôles** :
- ✅ Admin
- ✅ Manager
- ✅ Employee

Les clients ne peuvent pas supprimer définitivement une réservation, seulement l'annuler.

## 📝 Notes importantes

1. **Staging conservé** : Les données dans `airbnb_reservations_staging` sont conservées même après suppression (pour l'audit)
2. **Conflits supprimés** : Les conflits liés à une réservation supprimée sont automatiquement effacés
3. **Notifications supprimées** : Les notifications liées sont automatiquement effacées
4. **Audit trail** : La suppression est enregistrée dans `audit_logs` avant d'être effectuée

## 🔗 Fichiers modifiés

1. `supabase/migrations/20260607000000_fix_airbnb_foreign_keys_cascade.sql` - Migration
2. `app/api/reservations/[id]/delete/route.ts` - API améliorée
3. `FIX_SUPPRESSION_RESERVATIONS_AIRBNB.md` - Documentation
