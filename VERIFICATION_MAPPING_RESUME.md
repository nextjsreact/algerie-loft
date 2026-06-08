# ✅ RÉSUMÉ : Comment vérifier le mapping Airbnb

## 🚀 Vérification en 30 secondes

### Option 1 : Script Python (Recommandé)
```bash
cd c:\Users\SERVICE-INFO\IA\algerie-loft
python scripts\verify-airbnb-mapping-results.py
```

**Résultat attendu :**
```
✅ 3,786 réservations Airbnb mappées aux lofts
✅ 58 lofts avec mapping Airbnb
✅ Taux de mapping: 100.0%
```

---

### Option 2 : SQL Rapide
1. Aller sur https://supabase.com
2. Ouvrir **SQL Editor**
3. Copier-coller ce code :

```sql
-- Vérification rapide
SELECT 
  (SELECT COUNT(*) FROM lofts WHERE airbnb_listing_id IS NOT NULL) as lofts_mappes,
  (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper' AND loft_id IS NOT NULL) as reservations_mappees,
  (SELECT COUNT(*) FROM reservations WHERE source = 'airbnb_scraper' AND loft_id IS NULL) as reservations_sans_loft;
```

**Résultat attendu :**
- `lofts_mappes = 58`
- `reservations_mappees = 3786`
- `reservations_sans_loft = 0`

---

### Option 3 : Interface Supabase
1. Aller sur https://supabase.com
2. Ouvrir **Table Editor**
3. Sélectionner table **"reservations"**
4. Filtrer : `source = 'airbnb_scraper'`
5. Vérifier que toutes ont un `loft_id` (pas NULL)

---

## 📊 Vérification complète (5 minutes)

### Script SQL complet
Exécuter dans Supabase SQL Editor :
```
supabase/migrations/VERIFICATION_COMPLETE_MAPPING.sql
```

Ce script vérifie :
- ✅ Mapping des lofts
- ✅ Mapping des réservations
- ✅ Doublons
- ✅ Conflits de dates
- ✅ Top 20 lofts
- ✅ Réservations à venir
- ✅ Taux d'occupation
- ✅ Revenus

---

### Script Python interactif
```bash
python scripts\interactive-verification.py
```

Affiche un rapport détaillé avec :
- Statistiques complètes
- Top 10 lofts
- Réservations à venir
- Revenus
- Dernière synchronisation

---

## 🎯 Que vérifier ?

### ✅ Checklist minimale
- [ ] Tous les lofts ont un `airbnb_listing_id`
- [ ] Toutes les réservations Airbnb ont un `loft_id`
- [ ] Pas de réservations sans loft

### ✅ Checklist complète
- [ ] Tous les lofts ont un `airbnb_listing_id`
- [ ] Toutes les réservations Airbnb ont un `loft_id`
- [ ] Pas de doublons de réservations
- [ ] Pas de conflits de dates
- [ ] Les réservations apparaissent dans l'application
- [ ] Le calendrier affiche les réservations Airbnb
- [ ] Les statistiques sont correctes

---

## 📁 Fichiers de vérification disponibles

### Scripts SQL
1. **VERIFICATION_RAPIDE.sql** - Vérification en 1 minute
2. **VERIFICATION_COMPLETE_MAPPING.sql** - Vérification complète

### Scripts Python
1. **verify-airbnb-mapping-results.py** - Vérification rapide
2. **interactive-verification.py** - Vérification interactive

### Documentation
1. **GUIDE_VERIFICATION_MAPPING.md** - Guide complet
2. **VERIFICATION_MAPPING_RESUME.md** - Ce fichier (résumé)

---

## 🎉 Résultats actuels

D'après la dernière vérification :

### ✅ MAPPING PARFAIT - 100% DE RÉUSSITE

- **58 lofts** avec mapping Airbnb
- **3,786 réservations** mappées
- **0 réservation** sans loft
- **0 doublon** détecté
- **6,685,504.86 DZD** de revenus Airbnb

### 🏆 Top 5 lofts
1. Star loft - 162 réservations
2. Golden loft - 91 réservations
3. Luna Loft - 64 réservations
4. Dary loft - 55 réservations
5. Maya loft - 49 réservations

---

## ❓ Questions fréquentes

### Q: Comment savoir si le mapping fonctionne ?
**R:** Exécutez `python scripts\verify-airbnb-mapping-results.py`. Si vous voyez "Taux de mapping: 100.0%", c'est parfait !

### Q: Où voir les réservations Airbnb dans l'application ?
**R:** 
1. Ouvrir http://localhost:3000
2. Aller sur "Réservations"
3. Filtrer par source "Airbnb"

### Q: Comment vérifier un loft spécifique ?
**R:** Dans Supabase :
```sql
SELECT 
  l.name,
  l.airbnb_listing_id,
  COUNT(r.id) as nb_reservations
FROM lofts l
LEFT JOIN reservations r ON r.loft_id = l.id AND r.source = 'airbnb_scraper'
WHERE l.name = 'NOM_DU_LOFT'
GROUP BY l.id, l.name, l.airbnb_listing_id;
```

### Q: Que faire si je vois des réservations sans loft ?
**R:** Exécutez :
```bash
python scripts\resync-airbnb-after-mapping.py
```

---

## 🆘 Problèmes courants

### Problème : "Réservations sans loft"
```bash
# Solution
python scripts\resync-airbnb-after-mapping.py
```

### Problème : "Lofts sans mapping"
```bash
# Solution
python scripts\auto-map-airbnb-listings.py
```

### Problème : "Doublons détectés"
```sql
-- Solution SQL
DELETE FROM reservations r1
WHERE r1.source = 'airbnb_scraper'
  AND EXISTS (
    SELECT 1 FROM reservations r2
    WHERE r2.airbnb_confirmation_code = r1.airbnb_confirmation_code
      AND r2.source = 'airbnb_scraper'
      AND r2.created_at > r1.created_at
  );
```

---

## 📞 Support

Si vous avez besoin d'aide :

1. Exécutez le diagnostic complet :
   ```bash
   python scripts\interactive-verification.py
   ```

2. Consultez le guide complet :
   ```
   GUIDE_VERIFICATION_MAPPING.md
   ```

3. Vérifiez les logs de synchronisation :
   ```sql
   SELECT * FROM airbnb_sync_logs ORDER BY started_at DESC LIMIT 5;
   ```

---

**Dernière mise à jour :** 2026-05-29  
**Statut :** ✅ Mapping parfait - 100% de réussite
