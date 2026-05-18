# Migration 005 - Changements Adaptés

**Date:** 2026-05-17  
**Raison:** Adaptation à la structure existante de la table `reservations`

---

## 🔍 Analyse de la Table Existante

Après vérification de votre schéma actuel, j'ai découvert que **7 champs sur 10** existent déjà dans la table `reservations`.

### ✅ Champs Déjà Présents (Pas besoin d'ajouter)

| Champ | Type Actuel | Contrainte | Status |
|-------|-------------|------------|--------|
| `guest_email` | VARCHAR(255) | NOT NULL | ✅ Existe |
| `guest_nationality` | VARCHAR(100) | NOT NULL | ✅ Existe |
| `base_price` | NUMERIC(10,2) | NOT NULL | ✅ Existe |
| `cleaning_fee` | NUMERIC(10,2) | DEFAULT 0 | ✅ Existe |
| `service_fee` | NUMERIC(10,2) | DEFAULT 0 | ✅ Existe |
| `taxes` | NUMERIC(10,2) | DEFAULT 0 | ✅ Existe |
| `special_requests` | TEXT | - | ✅ Existe |

### ➕ Champs Ajoutés par la Migration 005

| Champ | Type | Contrainte | Description |
|-------|------|------------|-------------|
| `source` | VARCHAR(50) | DEFAULT 'manual' | Source de la réservation |
| `airbnb_confirmation_code` | VARCHAR(50) | UNIQUE (si non NULL) | Code Airbnb (ex: HMABCD123) |
| `synced_at` | TIMESTAMP | - | Date de dernière sync |

---

## 📝 Changements Apportés

### Fichiers Modifiés

1. **`005_extend_reservations_for_airbnb.sql`**
   - ❌ Supprimé: 7 colonnes déjà existantes
   - ✅ Conservé: 3 colonnes manquantes
   - ✅ Ajouté: Commentaires explicatifs
   - ✅ Ajouté: UPDATE pour mettre à jour les anciennes lignes

2. **`verify_airbnb_migrations.sql`**
   - ✅ Adapté: Vérification de 3 colonnes au lieu de 10
   - ✅ Ajouté: Note sur les colonnes existantes

3. **`README_AIRBNB_MIGRATIONS.md`**
   - ✅ Mis à jour: Description de la migration 005
   - ✅ Ajouté: Note sur les champs existants

---

## 🎯 Impact

### Avant Adaptation

```sql
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS airbnb_confirmation_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2),           -- ❌ Existe déjà
  ADD COLUMN IF NOT EXISTS cleaning_fee DECIMAL(10,2),         -- ❌ Existe déjà
  ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10,2),          -- ❌ Existe déjà
  ADD COLUMN IF NOT EXISTS taxes DECIMAL(10,2),                -- ❌ Existe déjà
  ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255),           -- ❌ Existe déjà
  ADD COLUMN IF NOT EXISTS guest_nationality VARCHAR(10),      -- ❌ Existe déjà
  ADD COLUMN IF NOT EXISTS special_requests TEXT,              -- ❌ Existe déjà
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP;
```

**Problème:** Tentative d'ajouter 7 colonnes qui existent déjà (même si `IF NOT EXISTS` évite l'erreur, c'est inutile)

### Après Adaptation

```sql
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS airbnb_confirmation_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP;
```

**Résultat:** Ajoute seulement les 3 colonnes manquantes ✅

---

## ✅ Avantages de l'Adaptation

1. **Migration Plus Propre**
   - Seulement les colonnes nécessaires
   - Pas de tentatives inutiles
   - Code plus lisible

2. **Documentation Claire**
   - Commentaires expliquant les champs existants
   - Pas de confusion sur ce qui est ajouté

3. **Compatibilité Parfaite**
   - Respecte votre schéma existant
   - Pas de conflits de types
   - Pas de redondance

4. **Performance**
   - Migration plus rapide (3 colonnes vs 10)
   - Moins d'opérations DDL

---

## 🔄 Mapping des Champs

Votre script Python envoie des données avec ces noms français. Voici le mapping vers votre schéma DB:

| Champ Python (FR) | Champ DB (EN) | Status |
|-------------------|---------------|--------|
| `id` | `airbnb_confirmation_code` | ✅ Nouveau |
| `voyageur` | `guest_name` | ✅ Existe |
| `nb_voyageurs` | `guest_count` | ✅ Existe |
| `date_arrivee` | `check_in_date` | ✅ Existe |
| `date_depart` | `check_out_date` | ✅ Existe |
| `nb_nuits` | `nights` | ✅ Existe (GENERATED) |
| `montant_total` | `total_amount` | ✅ Existe |
| `devise` | `currency_code` | ⚠️ À vérifier |
| `base_price` | `base_price` | ✅ Existe |
| `cleaning_fee` | `cleaning_fee` | ✅ Existe |
| `service_fee` | `service_fee` | ✅ Existe |
| `taxes` | `taxes` | ✅ Existe |
| `guest_email` | `guest_email` | ✅ Existe |
| `guest_phone` | `guest_phone` | ✅ Existe |
| `guest_nationality` | `guest_nationality` | ✅ Existe |
| `special_requests` | `special_requests` | ✅ Existe |
| `statut` | `status` | ✅ Existe (traduction FR→EN) |

**Note:** Le champ `currency_code` n'existe pas dans votre table `reservations`. Il faudra peut-être l'ajouter ou utiliser une valeur par défaut (DZD).

---

## ⚠️ Point d'Attention: currency_code

Votre table `reservations` n'a pas de colonne `currency_code`. Options:

### Option A: Ajouter la Colonne (Recommandé)

```sql
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'DZD';
```

### Option B: Utiliser une Valeur Par Défaut

Dans l'API, toujours utiliser 'DZD' et ne pas stocker la devise.

### Option C: Table Séparée

Créer une table `reservation_currencies` avec une relation.

**Recommandation:** Option A (ajouter la colonne)

---

## 🚀 Prochaines Étapes

1. ✅ Migration 005 adaptée et prête
2. ➡️ Décider pour `currency_code` (Option A recommandée)
3. ➡️ Appliquer les migrations 005-009
4. ➡️ Créer l'API endpoint

---

**Créé par:** Kiro AI  
**Date:** 2026-05-17  
**Version:** 1.0.0
