# 🎯 GUIDE COMPLET : MAPPING AUTOMATIQUE AIRBNB → LOFTS

## 📋 Résumé de la situation

Vous avez **33 listing IDs Airbnb** qui doivent être mappés à vos lofts pour que les réservations soient correctement associées.

### Les 33 Listing IDs identifiés :
```
24697659, 26335420962, 21165327782, 177390886573, 3763922161, 
13675343457, 7134090902845, 5439745527, 12125861612, 29518975142,
11481184571, 20540592139, 7107012065983, 07407491343, 9835346151,
2935121974479, 2176230638, 89512196750, 52931464236, 79161753263,
4313236890, 59611883639, 92671283826, 47612986998, 06782151086,
46674774805, 4738557546, 43112883848, 79156213022, 40655871700,
1317750518, 40014512497, 00922264778
```

### Vos lofts (28 lofts disponibles) :
- Aida Loft - Forest Vue
- Nada Loft - Forest Vue
- Heaven Loft
- Kifan Loft
- Duplex Bab Ezzouar (3 instances)
- Loft Moderne Centre-ville
- Studio Cosy Hydra
- Appartement Familial Bab Ezzouar (2 instances)
- Loft Moderne Centre-ville Alger
- Studio Élégant Hydra
- Penthouse Vue Mer Sidi Fredj
- Loft Artistique Casbah
- Appartement Centre Ville (3 instances)
- Studio Hydra
- Modern Downtown Loft
- Cozy Studio Near Beach
- Luxury Family Apartment
- Loft Artistique Hydra
- Loft Moderne Centre-Ville
- Studio Haut de Gamme Hydra
- Loft Étudiant Bab Ezzouar
- Penthouse Vue Mer Oran
- Loft Familial Constantine

---

## 🚀 SOLUTION 1 : Script Python Automatique (RECOMMANDÉ)

### Étape 1 : Exécuter le script de mapping automatique

```bash
cd c:\Users\SERVICE-INFO\IA\algerie-loft
python scripts\auto-map-airbnb-listings.py
```

Ce script va :
1. ✅ Récupérer les 33 listing IDs depuis `airbnb_reservations_staging`
2. ✅ Récupérer tous vos lofts
3. ✅ Mapper automatiquement les listing IDs aux lofts (basé sur les noms connus)
4. ✅ Mapper les listing IDs restants aux lofts disponibles
5. ✅ Afficher un rapport complet

### Étape 2 : Relancer la synchronisation

```bash
python scripts\sync-airbnb-reservations.py
```

### Étape 3 : Vérifier les résultats

Exécuter dans Supabase SQL Editor :
```sql
-- Voir le fichier: supabase/migrations/analyze_sync_results.sql
```

---

## 🔧 SOLUTION 2 : Mapping SQL Manuel

Si vous préférez le contrôle manuel, exécutez le fichier SQL :

```sql
-- Voir le fichier: supabase/migrations/AUTO_MAPPING_AIRBNB_LOFTS.sql
```

Ce fichier contient toutes les requêtes UPDATE pour mapper les 33 listing IDs.

---

## 📊 VÉRIFICATION DU MAPPING

### Vérifier les lofts mappés :

```sql
SELECT 
  name,
  airbnb_listing_id,
  CASE 
    WHEN airbnb_listing_id IS NOT NULL THEN '✅ Mappé'
    ELSE '❌ Non mappé'
  END as statut
FROM lofts
ORDER BY name;
```

### Compter les réservations par loft :

```sql
SELECT 
  l.name,
  l.airbnb_listing_id,
  COUNT(s.id) as nb_reservations_en_attente
FROM lofts l
LEFT JOIN airbnb_reservations_staging s 
  ON s.listing_id = l.airbnb_listing_id 
  AND s.mapping_status = 'failed'
WHERE l.airbnb_listing_id IS NOT NULL
GROUP BY l.id, l.name, l.airbnb_listing_id
ORDER BY COUNT(s.id) DESC;
```

---

## 🎯 PROCHAINES ÉTAPES APRÈS LE MAPPING

### 1. Relancer la synchronisation Airbnb

```bash
python scripts\sync-airbnb-reservations.py
```

### 2. Vérifier que les réservations sont bien mappées

```sql
-- Réservations avec loft_id
SELECT 
  COUNT(*) as nb_reservations_mappees
FROM reservations
WHERE source = 'airbnb_scraper'
  AND loft_id IS NOT NULL;

-- Réservations SANS loft_id
SELECT 
  COUNT(*) as nb_reservations_non_mappees
FROM reservations
WHERE source = 'airbnb_scraper'
  AND loft_id IS NULL;
```

### 3. Analyser les résultats complets

```bash
# Exécuter dans Supabase SQL Editor
supabase/migrations/analyze_sync_results.sql
```

---

## ❓ FAQ

### Q: Pourquoi 33 listing IDs pour 28 lofts ?

**R:** Certains lofts peuvent avoir plusieurs annonces Airbnb (ex: "Duplex Bab Ezzouar" a 3 instances). Ou certaines annonces sont des doublons/anciennes annonces.

### Q: Comment identifier les listing IDs manuellement ?

**R:** 
1. Aller sur https://www.airbnb.com
2. Se connecter avec loft.algerie.scl@gmail.com
3. Aller dans "Annonces" → "Gérer les annonces"
4. Cliquer sur une annonce
5. L'URL contient le listing_id: `https://www.airbnb.com/rooms/24697659`

### Q: Que faire si le mapping automatique ne fonctionne pas ?

**R:** Utilisez le mapping SQL manuel dans `AUTO_MAPPING_AIRBNB_LOFTS.sql` et ajustez les noms de lofts selon vos besoins.

---

## 📝 NOTES IMPORTANTES

1. **Backup avant mapping** : Le mapping modifie la colonne `airbnb_listing_id` dans la table `lofts`
2. **Un listing_id par loft** : Chaque loft ne peut avoir qu'un seul `airbnb_listing_id`
3. **Réversible** : Vous pouvez toujours modifier le mapping avec :
   ```sql
   UPDATE lofts SET airbnb_listing_id = NULL WHERE name = 'Nom du Loft';
   ```

---

## 🆘 BESOIN D'AIDE ?

Si vous rencontrez des problèmes :

1. Vérifier les logs de synchronisation :
   ```sql
   SELECT * FROM airbnb_sync_logs ORDER BY started_at DESC LIMIT 5;
   ```

2. Vérifier les erreurs de validation :
   ```sql
   SELECT * FROM airbnb_reservations_staging 
   WHERE validation_status = 'invalid' 
   LIMIT 10;
   ```

3. Exécuter le diagnostic rapide :
   ```bash
   supabase/migrations/diagnostic_rapide.sql
   ```

---

## ✅ CHECKLIST COMPLÈTE

- [ ] Exécuter `auto-map-airbnb-listings.py`
- [ ] Vérifier que les 33 listing IDs sont mappés
- [ ] Relancer `sync-airbnb-reservations.py`
- [ ] Vérifier que les réservations ont un `loft_id`
- [ ] Exécuter `analyze_sync_results.sql`
- [ ] Confirmer que `mapping_status = 'success'` dans staging

---

**Dernière mise à jour** : 2026-05-29
**Auteur** : Kiro AI Assistant
