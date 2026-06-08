# Guide de Transfert des Données Airbnb vers l'API Next.js

## 📋 Contexte

Le scraper Docker a récupéré avec succès **~5278 réservations** Airbnb (125 upcoming + 5153 completed).
Les données sont stockées dans le conteneur Docker sous format JSON/CSV.

## 🎯 Objectif

Transférer ces données vers la base de données Supabase via l'API Next.js.

---

## 📦 Étape 1: Récupérer les Données du Conteneur Docker

### 1.1 Vérifier que le conteneur a terminé

```powershell
docker ps -a | Select-String "airbnb_scraper_full"
```

### 1.2 Copier les fichiers JSON/CSV depuis le conteneur

```powershell
# Créer le dossier de destination
New-Item -ItemType Directory -Force -Path "d:\Airbnb_transfer_v2\output"

# Copier le fichier JSON (recommandé)
docker cp airbnb_scraper_full:/app/output/reservations_airbnb.json d:\Airbnb_transfer_v2\output\

# Copier le fichier CSV (optionnel, pour analyse)
docker cp airbnb_scraper_full:/app/output/reservations_airbnb.csv d:\Airbnb_transfer_v2\output\

# Copier les logs (optionnel)
docker cp airbnb_scraper_full:/app/output/listings.json d:\Airbnb_transfer_v2\output\
```

### 1.3 Vérifier que les fichiers ont été copiés

```powershell
Get-ChildItem d:\Airbnb_transfer_v2\output\
```

Vous devriez voir:
- `reservations_airbnb.json` (~5278 réservations)
- `reservations_airbnb.csv` (optionnel)
- `listings.json` (~102 annonces)

---

## 🚀 Étape 2: Envoyer les Données à l'API Next.js

### 2.1 S'assurer que le serveur Next.js est démarré

```powershell
cd c:\Users\SERVICE-INFO\IA\algerie-loft
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:3000`

### 2.2 Vérifier la configuration .env

Ouvrir `c:\Users\SERVICE-INFO\IA\algerie-loft\.env` et vérifier:

```env
AIRBNB_SYNC_ENABLED=true
AIRBNB_API_SECRET=NXxmDRrHzvb4I+SuGdZv9kGvd574bnhVctjKcz0rR1s=
NEXT_PUBLIC_SUPABASE_URL=https://zlpzuyctjhajdwlxzdzk.supabase.co
```

### 2.3 Exécuter le script d'envoi

```powershell
cd c:\Users\SERVICE-INFO\IA\algerie-loft\scripts
python send-airbnb-data-to-api.py d:\Airbnb_transfer_v2\output\reservations_airbnb.json
```

### 2.4 Suivre la progression

Le script va:
1. ✅ Charger le fichier JSON (~5278 réservations)
2. 🔍 Valider chaque réservation
3. 📦 Diviser en batches de 100 réservations
4. 📤 Envoyer chaque batch à l'API avec retry automatique
5. 📊 Afficher un résumé final

**Exemple de sortie:**

```
======================================================================
   Envoi des données Airbnb vers l'API Next.js
======================================================================

📁 Fichier: d:\Airbnb_transfer_v2\output\reservations_airbnb.json
🌐 API URL: http://localhost:3000/api/airbnb/sync
📦 Taille batch: 100 réservations

📖 Chargement du fichier JSON...
✅ 5278 réservations chargées

🔍 Validation des réservations...
✅ 5278 réservations valides

📦 Division en 53 batches de 100 réservations max

   📤 Envoi batch 1/53 (100 réservations) - Tentative 1/3
      ✅ Succès: 95 créées, 3 mises à jour, 2 ignorées
   📤 Envoi batch 2/53 (100 réservations) - Tentative 1/3
      ✅ Succès: 98 créées, 1 mises à jour, 1 ignorées
   ...

======================================================================
   RÉSUMÉ FINAL
======================================================================
⏱️  Durée totale: 180.5 secondes
✅ Créées:       5100
🔄 Mises à jour: 150
⏭️  Ignorées:     28
❌ Échouées:     0
⚠️  Conflits:     0
======================================================================
```

---

## 🔍 Étape 3: Vérifier les Données dans Supabase

### 3.1 Vérifier les réservations importées

```sql
-- Compter les réservations Airbnb
SELECT COUNT(*) as total_airbnb
FROM reservations
WHERE source = 'airbnb';

-- Voir les dernières réservations importées
SELECT 
  id,
  airbnb_confirmation_code,
  guest_name,
  check_in_date,
  check_out_date,
  status,
  synced_at
FROM reservations
WHERE source = 'airbnb'
ORDER BY synced_at DESC
LIMIT 10;
```

### 3.2 Vérifier les logs de synchronisation

```sql
-- Voir les derniers logs de sync
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
  duration_ms,
  started_at,
  completed_at
FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 5;
```

### 3.3 Vérifier les conflits (si présents)

```sql
-- Voir les conflits détectés
SELECT 
  airbnb_confirmation_code,
  conflict_type,
  conflict_details,
  detected_at,
  resolved
FROM airbnb_conflicts
WHERE resolved = false
ORDER BY detected_at DESC;
```

---

## 🏠 Étape 4: Mapper les Lofts avec les Annonces Airbnb

### 4.1 Voir les annonces détectées

```powershell
# Ouvrir le fichier listings.json
code d:\Airbnb_transfer_v2\output\listings.json
```

Vous devriez voir ~102 annonces avec leurs `listing_id`.

### 4.2 Mettre à jour la table `lofts`

```sql
-- Exemple: Mapper un loft avec son listing_id Airbnb
UPDATE lofts
SET airbnb_listing_id = '12345678'
WHERE name = 'Loft Alger Centre';

-- Vérifier les lofts sans mapping
SELECT id, name, airbnb_listing_id
FROM lofts
WHERE airbnb_listing_id IS NULL;
```

### 4.3 Utiliser le guide de mapping

Voir le fichier `scripts/MAPPING_GUIDE.md` pour un guide détaillé.

---

## 🐛 Dépannage

### Problème: "Connection refused" lors de l'envoi

**Solution:** Vérifier que le serveur Next.js est démarré:

```powershell
cd c:\Users\SERVICE-INFO\IA\algerie-loft
npm run dev
```

### Problème: "Invalid API key"

**Solution:** Vérifier que `AIRBNB_API_SECRET` est bien configuré dans `.env`:

```env
AIRBNB_API_SECRET=NXxmDRrHzvb4I+SuGdZv9kGvd574bnhVctjKcz0rR1s=
```

### Problème: "Rate limit exceeded"

**Solution:** Le script attend automatiquement. Si le problème persiste, augmenter `RETRY_DELAY` dans le script.

### Problème: Réservations invalides

**Solution:** Vérifier les logs du script pour voir quels champs sont manquants. Les réservations invalides sont automatiquement ignorées.

### Problème: Fichier JSON introuvable dans le conteneur

**Solution:** Vérifier que le scraper a bien terminé:

```powershell
# Voir les logs du conteneur
docker logs airbnb_scraper_full

# Lister les fichiers dans le conteneur
docker exec airbnb_scraper_full ls -la /app/output/
```

---

## 📊 Statistiques Attendues

D'après les logs du scraper:

- **Total réservations:** ~5278
  - Upcoming: 125
  - Completed: 5153
- **Total annonces:** ~102
- **Durée scraping:** ~48 minutes
- **Durée envoi API:** ~3-5 minutes (dépend du réseau)

---

## ✅ Checklist Finale

- [ ] Conteneur Docker a terminé avec succès
- [ ] Fichiers JSON/CSV copiés depuis le conteneur
- [ ] Serveur Next.js démarré (`npm run dev`)
- [ ] Variables `.env` configurées correctement
- [ ] Script `send-airbnb-data-to-api.py` exécuté avec succès
- [ ] Données vérifiées dans Supabase
- [ ] Lofts mappés avec `airbnb_listing_id`
- [ ] Conflits résolus (si présents)

---

## 🔄 Prochaines Synchronisations

Pour les synchronisations futures, vous pouvez:

1. **Relancer le scraper Docker:**
   ```powershell
   cd d:\Airbnb_transfer_v2\docker
   docker-compose --profile manual up airbnb-scraper-full
   ```

2. **Ou utiliser le mode iCal Watcher (automatique):**
   ```powershell
   docker-compose up -d airbnb-ical-watcher
   ```

3. **Ou utiliser le mode Targeted (réservations spécifiques):**
   ```powershell
   docker-compose --profile manual up airbnb-scraper-targeted
   ```

---

## 📚 Ressources

- **API Endpoint:** `app/api/airbnb/sync/route.ts`
- **Service de Sync:** `lib/services/airbnb-sync-service.ts`
- **Traducteur de Statuts:** `lib/utils/airbnb-status-translator.ts`
- **Migrations SQL:** `supabase/migrations/005_*.sql` à `009_*.sql`
- **Guide Docker:** `scripts/docker/README.md`
- **Guide Mapping:** `scripts/MAPPING_GUIDE.md`

---

**Dernière mise à jour:** 19 mai 2026
**Version:** 2.0.0
