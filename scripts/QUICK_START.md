# 🚀 Quick Start - Synchronisation Airbnb

Guide de démarrage rapide pour synchroniser les réservations Airbnb avec l'application.

---

## ⚡ Option 1: Automatisation Complète (Recommandé)

**Une seule commande pour tout faire:**

```powershell
cd c:\Users\SERVICE-INFO\IA\algerie-loft\scripts
.\airbnb-full-sync.ps1
```

Ce script va:
1. ✅ Vérifier Docker
2. ✅ Lancer le scraper (45-60 min)
3. ✅ Copier les données
4. ✅ Vérifier le serveur Next.js
5. ✅ Envoyer les données à l'API
6. ✅ Proposer la vérification Supabase

**Durée totale:** ~50-65 minutes

---

## ⚡ Option 2: Utiliser des Données Existantes

**Si vous avez déjà des données scrapées:**

```powershell
cd c:\Users\SERVICE-INFO\IA\algerie-loft\scripts
.\airbnb-full-sync.ps1 -SkipScraping
```

**Durée totale:** ~5 minutes

---

## ⚡ Option 3: Workflow Manuel

### Étape 1: Scraping (45-60 min)

```powershell
cd d:\Airbnb_transfer_v2\docker
docker-compose --profile manual up airbnb-scraper-full
```

### Étape 2: Copie des données (< 1 min)

```powershell
cd c:\Users\SERVICE-INFO\IA\algerie-loft\scripts
.\copy-airbnb-data-from-docker.ps1
```

### Étape 3: Démarrage Next.js

```powershell
cd c:\Users\SERVICE-INFO\IA\algerie-loft
npm run dev
```

### Étape 4: Envoi à l'API (3-5 min)

```powershell
cd c:\Users\SERVICE-INFO\IA\algerie-loft\scripts
python send-airbnb-data-to-api.py d:\Airbnb_transfer_v2\output\reservations_airbnb_latest.json
```

---

## 📊 Résultats Attendus

Après la synchronisation, vous devriez avoir:

- ✅ **~5278 réservations** dans Supabase
  - 125 à venir (upcoming)
  - 5153 complétées (completed)
- ✅ **102 annonces** détectées
- ✅ **100% coordonnées voyageur** (email, téléphone, nationalité)
- ✅ **0 conflit** (première synchronisation)

---

## 🔍 Vérification Rapide

### Dans Supabase SQL Editor

```sql
-- Compter les réservations Airbnb
SELECT COUNT(*) FROM reservations WHERE source = 'airbnb';

-- Voir les dernières réservations
SELECT 
  airbnb_confirmation_code,
  guest_name,
  check_in_date,
  check_out_date,
  status
FROM reservations
WHERE source = 'airbnb'
ORDER BY synced_at DESC
LIMIT 10;
```

---

## 🐛 Problèmes Courants

### "Docker n'est pas démarré"
**Solution:** Ouvrir Docker Desktop et attendre qu'il démarre

### "Connection refused" (API)
**Solution:** Démarrer le serveur Next.js avec `npm run dev`

### "Invalid API key"
**Solution:** Vérifier que `AIRBNB_API_SECRET` est dans `.env`

### "Fichier JSON introuvable"
**Solution:** Vérifier que le scraper a terminé avec succès

---

## 📚 Documentation Complète

Pour plus de détails, consultez:

- **Guide complet:** [`README.md`](./README.md)
- **Guide de transfert:** [`AIRBNB_DATA_TRANSFER_GUIDE.md`](./AIRBNB_DATA_TRANSFER_GUIDE.md)
- **Guide Docker:** [`docker/README.md`](./docker/README.md)
- **Guide mapping:** [`MAPPING_GUIDE.md`](./MAPPING_GUIDE.md)

---

## 🎯 Prochaines Étapes

Après la première synchronisation:

1. **Mapper les lofts** avec les annonces Airbnb
   ```sql
   UPDATE lofts
   SET airbnb_listing_id = '12345678'
   WHERE name = 'Loft Alger Centre';
   ```

2. **Configurer l'automatisation** (optionnel)
   - Cron job quotidien
   - Mode iCal Watcher

3. **Créer l'interface admin** (optionnel)
   - Visualisation des réservations
   - Bouton "Sync Airbnb"
   - Gestion des conflits

---

**Besoin d'aide?** Consultez la documentation complète ou les logs d'erreur.

**Dernière mise à jour:** 19 mai 2026  
**Version:** 2.0.0
