# 🎯 Guide Simple : Mapper les 33 Annonces Airbnb

**Temps estimé :** 15-20 minutes

---

## 📋 Ce que vous avez

D'après vos messages, vous avez mentionné ces noms de lofts :

1. **Aida Loft - Forest Vue**
2. **Amel loft**
3. **Amilis Loft**
4. **Ania loft**
5. **Anna loft**
6. ... et 28 autres lofts

---

## 🎯 Ce que vous devez faire

### Étape 1 : Obtenir la liste complète des noms de lofts

Vous avez 2 options :

#### Option A : Depuis Supabase (Recommandé)

1. Ouvrir https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk
2. Aller dans **SQL Editor**
3. Exécuter cette requête :

```sql
SELECT 
  ROW_NUMBER() OVER (ORDER BY name) as numero,
  name as nom_du_loft,
  airbnb_listing_id as listing_id_actuel
FROM lofts
ORDER BY name;
```

4. **Copier tous les noms de lofts** dans un fichier texte

---

#### Option B : Depuis Airbnb

1. Aller sur https://www.airbnb.com
2. Se connecter avec **loft.algerie.scl@gmail.com**
3. Aller dans **Annonces** → **Gérer les annonces**
4. Pour chaque annonce :
   - Noter le **nom de l'annonce**
   - Cliquer sur l'annonce
   - L'URL contient le **listing_id** : `https://www.airbnb.com/rooms/24697659`
   - Noter le listing_id

---

### Étape 2 : Compléter le fichier de mapping

J'ai créé le fichier `apply_airbnb_mapping.sql` avec les 5 premiers lofts déjà mappés.

**Vous devez compléter les 28 autres lignes** en remplaçant `NOM_DU_LOFT_X` par le nom exact du loft.

**Exemple :**

```sql
-- Avant (à compléter)
UPDATE lofts SET airbnb_listing_id = '134090902845543974552' WHERE name = 'NOM_DU_LOFT_6';

-- Après (complété)
UPDATE lofts SET airbnb_listing_id = '134090902845543974552' WHERE name = 'Bella Loft';
```

---

### Étape 3 : Exécuter le script

1. Ouvrir https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk
2. Aller dans **SQL Editor**
3. Copier le contenu de `supabase/migrations/apply_airbnb_mapping.sql`
4. **Modifier les lignes commentées** avec les vrais noms de lofts
5. Exécuter le script

---

### Étape 4 : Vérifier le mapping

Après avoir exécuté le script, vérifier avec :

```sql
SELECT 
  name as loft_name,
  airbnb_listing_id,
  (SELECT COUNT(*) 
   FROM airbnb_reservations_staging 
   WHERE listing_id = lofts.airbnb_listing_id) as nb_reservations_en_attente
FROM lofts
WHERE airbnb_listing_id IS NOT NULL
ORDER BY name;
```

**Résultat attendu :**
- Vous devriez voir **33 lofts** avec un `airbnb_listing_id`
- Chaque loft devrait avoir des réservations en attente

---

### Étape 5 : Relancer la synchronisation

Une fois le mapping terminé, relancer la synchronisation :

```powershell
# Terminal
.\test-airbnb-sync.ps1
```

**Résultat attendu :**
```
✓ Succès!
Métriques:
  - Processed: 33
  - Created: 33
  - Skipped: 0
```

---

## 🚀 Méthode Alternative : Mapping Automatique

Si vous avez un fichier JSON ou CSV avec les données Airbnb, je peux créer un script qui fait le mapping automatiquement.

**Dites-moi :**
1. Quel est le chemin du fichier ?
2. Quel est le format (JSON, CSV, Excel) ?
3. Quelles colonnes contient-il ?

Je créerai un script qui :
- Lit le fichier
- Extrait les listing_ids et noms
- Génère les requêtes UPDATE automatiquement
- Applique le mapping

---

## ❓ Questions Fréquentes

### Q1 : Comment trouver le nom exact d'un loft ?

**R :** Exécutez cette requête dans Supabase :

```sql
SELECT name FROM lofts WHERE name ILIKE '%mot_clé%';
```

Remplacez `mot_clé` par une partie du nom du loft.

---

### Q2 : Que faire si un loft n'existe pas dans la base ?

**R :** Vous devez d'abord créer le loft :

```sql
INSERT INTO lofts (name, airbnb_listing_id, address, city, price_per_night)
VALUES ('Nom du Loft', '24697659', 'Adresse', 'Alger', 5000);
```

---

### Q3 : Que faire si j'ai fait une erreur de mapping ?

**R :** Vous pouvez corriger avec :

```sql
-- Supprimer le mapping
UPDATE lofts SET airbnb_listing_id = NULL WHERE name = 'Nom du Loft';

-- Refaire le mapping
UPDATE lofts SET airbnb_listing_id = '24697659' WHERE name = 'Nom du Loft';
```

---

## 📊 Résultat Final Attendu

Après avoir terminé le mapping :

```
✅ 33 lofts mappés
✅ 33 listing_ids configurés
✅ Toutes les réservations en staging seront synchronisées
✅ Aucune réservation en échec de mapping
```

---

## 🆘 Besoin d'Aide ?

Si vous avez besoin d'aide pour :
- Obtenir la liste complète des noms de lofts
- Créer un script automatique de mapping
- Débugger un problème de mapping

**Dites-moi simplement :**
- "Montre-moi tous les noms de lofts"
- "Crée un script automatique"
- "J'ai une erreur : [message d'erreur]"

---

**Prochaine étape :** Complétez le fichier `apply_airbnb_mapping.sql` avec les 28 noms de lofts manquants.
