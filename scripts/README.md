# Scripts Airbnb - Guide Complet

Ce dossier contient tous les scripts nécessaires pour l'intégration du système de scraping Airbnb avec l'application Next.js.

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Scripts disponibles](#scripts-disponibles)
3. [Workflow complet](#workflow-complet)
4. [Guides détaillés](#guides-détaillés)
5. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Le système de scraping Airbnb v2.0.0 permet de:
- ✅ Récupérer automatiquement les réservations Airbnb via scraping web
- ✅ Extraire les coordonnées voyageur (email, téléphone, nationalité)
- ✅ Synchroniser les données avec Supabase via l'API Next.js
- ✅ Détecter et gérer les conflits de réservations
- ✅ Mapper les annonces Airbnb avec les lofts de l'application

---

## 📦 Scripts Disponibles

### 🐍 Scripts Python

#### `send-airbnb-data-to-api.py`
**Description:** Envoie les données Airbnb récupérées par le scraper vers l'API Next.js

**Usage:**
```powershell
python send-airbnb-data-to-api.py <path_to_json_file>
```

**Exemple:**
```powershell
python send-airbnb-data-to-api.py d:\Airbnb_transfer_v2\output\reservations_airbnb.json
```

**Fonctionnalités:**
- ✅ Validation des réservations avant envoi
- ✅ Envoi par batches de 100 réservations
- ✅ Retry automatique en cas d'échec (3 tentatives)
- ✅ Gestion du rate limiting
- ✅ Rapport détaillé avec statistiques

**Prérequis:**
```powershell
pip install requests python-dotenv
```

---

#### `test-with-sample-data.py`
**Description:** Script de test pour valider l'API avec des données fictives

**Usage:**
```powershell
python test-with-sample-data.py
```

**Fonctionnalités:**
- ✅ Génère 3 réservations fictives
- ✅ Teste l'API endpoint `/api/airbnb/sync`
- ✅ Valide le schéma de données
- ✅ Affiche les résultats détaillés

---

### 💻 Scripts PowerShell

#### `copy-airbnb-data-from-docker.ps1`
**Description:** Copie les données Airbnb depuis le conteneur Docker vers le système hôte

**Usage:**
```powershell
.\copy-airbnb-data-from-docker.ps1
```

**Fonctionnalités:**
- ✅ Vérifie que Docker est démarré
- ✅ Vérifie que le conteneur existe
- ✅ Liste les fichiers disponibles dans le conteneur
- ✅ Copie les fichiers JSON/CSV avec timestamp
- ✅ Crée un lien vers la dernière version
- ✅ Affiche les prochaines étapes

**Fichiers copiés:**
- `reservations_airbnb.json` (requis)
- `reservations_airbnb.csv` (optionnel)
- `listings.json` (optionnel)

---

### 🗄️ Scripts SQL

#### `verify_airbnb_import.sql`
**Description:** Vérifie que les données Airbnb ont été correctement importées dans Supabase

**Usage:** Exécuter dans Supabase SQL Editor

**Sections du rapport:**
1. 📊 Statistiques globales
2. 📋 Répartition par statut
3. 📅 Réservations par mois
4. 📧 Coordonnées voyageur (complétude)
5. 🏠 Mapping lofts
6. 📝 Logs de synchronisation
7. ⚠️ Conflits détectés
8. 🏆 Top 10 lofts
9. 🕐 Dernières réservations
10. 💰 Montants totaux
11. 📅 Réservations à venir
12. 📊 Statistiques de séjour
13. ⚠️ Réservations sans loft mappé

---

## 🔄 Workflow Complet

### Étape 1: Scraping des Données Airbnb

```powershell
# Démarrer Docker Desktop
# Puis lancer le scraper

cd d:\Airbnb_transfer_v2\docker
docker-compose --profile manual up airbnb-scraper-full
```

**Durée estimée:** 45-60 minutes pour ~5000 réservations

**Résultat attendu:**
- ✅ Connexion Airbnb réussie
- ✅ Réservations récupérées (upcoming + completed)
- ✅ Fichiers JSON/CSV générés dans `/app/output/`

---

### Étape 2: Copie des Données depuis Docker

```powershell
cd c:\Users\SERVICE-INFO\IA\algerie-loft\scripts
.\copy-airbnb-data-from-docker.ps1
```

**Durée estimée:** < 1 minute

**Résultat attendu:**
- ✅ Fichiers copiés dans `d:\Airbnb_transfer_v2\output\`
- ✅ Lien `reservations_airbnb_latest.json` créé

---

### Étape 3: Démarrage du Serveur Next.js

```powershell
cd c:\Users\SERVICE-INFO\IA\algerie-loft
npm run dev
```

**Vérifier:** Le serveur démarre sur `http://localhost:3000`

---

### Étape 4: Envoi des Données à l'API

```powershell
cd c:\Users\SERVICE-INFO\IA\algerie-loft\scripts
python send-airbnb-data-to-api.py d:\Airbnb_transfer_v2\output\reservations_airbnb_latest.json
```

**Durée estimée:** 3-5 minutes pour ~5000 réservations

**Résultat attendu:**
- ✅ Réservations validées
- ✅ Batches envoyés avec succès
- ✅ Rapport final avec statistiques

---

### Étape 5: Vérification dans Supabase

1. **Ouvrir Supabase SQL Editor:**
   - URL: https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk/sql

2. **Exécuter le script de vérification:**
   - Copier le contenu de `verify_airbnb_import.sql`
   - Coller dans SQL Editor
   - Cliquer sur "Run"

3. **Analyser les résultats:**
   - Vérifier le nombre de réservations importées
   - Vérifier la complétude des coordonnées voyageur
   - Identifier les lofts sans mapping

---

### Étape 6: Mapping des Lofts

Voir le guide détaillé: [`MAPPING_GUIDE.md`](./MAPPING_GUIDE.md)

**Exemple:**
```sql
UPDATE lofts
SET airbnb_listing_id = '12345678'
WHERE name = 'Loft Alger Centre';
```

---

## 📚 Guides Détaillés

### 📖 AIRBNB_DATA_TRANSFER_GUIDE.md
Guide complet étape par étape pour transférer les données Airbnb vers l'API Next.js.

**Contenu:**
- ✅ Récupération des données du conteneur Docker
- ✅ Envoi des données à l'API Next.js
- ✅ Vérification dans Supabase
- ✅ Mapping des lofts
- ✅ Dépannage

**Lire le guide:**
```powershell
code c:\Users\SERVICE-INFO\IA\algerie-loft\scripts\AIRBNB_DATA_TRANSFER_GUIDE.md
```

---

### 📖 MAPPING_GUIDE.md
Guide pour mapper les annonces Airbnb avec les lofts de l'application.

**Contenu:**
- ✅ Identification des annonces Airbnb
- ✅ Mapping manuel via SQL
- ✅ Mapping via interface admin (à venir)
- ✅ Vérification du mapping

---

### 📖 docker/README.md
Guide complet pour utiliser le scraper Docker.

**Contenu:**
- ✅ Installation et configuration
- ✅ Modes de scraping (full, ical-watcher, targeted)
- ✅ Variables d'environnement
- ✅ Dépannage Docker

**Lire le guide:**
```powershell
code d:\Airbnb_transfer_v2\docker\README.md
```

---

## 🐛 Dépannage

### Problème: "Connection refused" lors de l'envoi API

**Cause:** Le serveur Next.js n'est pas démarré

**Solution:**
```powershell
cd c:\Users\SERVICE-INFO\IA\algerie-loft
npm run dev
```

---

### Problème: "Invalid API key"

**Cause:** `AIRBNB_API_SECRET` non configuré ou incorrect

**Solution:** Vérifier `.env`:
```env
AIRBNB_API_SECRET=NXxmDRrHzvb4I+SuGdZv9kGvd574bnhVctjKcz0rR1s=
```

---

### Problème: "Rate limit exceeded"

**Cause:** Trop de requêtes en peu de temps

**Solution:** Le script attend automatiquement. Si le problème persiste:
1. Augmenter `RETRY_DELAY` dans le script
2. Réduire `BATCH_SIZE` (ex: 50 au lieu de 100)

---

### Problème: Réservations invalides

**Cause:** Champs requis manquants dans les données scrapées

**Solution:** 
1. Vérifier les logs du script pour identifier les champs manquants
2. Les réservations invalides sont automatiquement ignorées
3. Relancer le scraper si nécessaire

---

### Problème: Fichier JSON introuvable dans le conteneur

**Cause:** Le scraper n'a pas terminé ou a échoué

**Solution:**
```powershell
# Vérifier les logs du conteneur
docker logs airbnb_scraper_full

# Lister les fichiers dans le conteneur
docker exec airbnb_scraper_full ls -la /app/output/
```

---

### Problème: Docker ne démarre pas

**Cause:** Docker Desktop n'est pas démarré

**Solution:**
1. Ouvrir Docker Desktop
2. Attendre que Docker soit complètement démarré
3. Relancer le script

---

### Problème: Lofts non mappés

**Cause:** Les `airbnb_listing_id` ne sont pas configurés dans la table `lofts`

**Solution:** Voir le guide [`MAPPING_GUIDE.md`](./MAPPING_GUIDE.md)

---

## 📊 Statistiques Attendues

D'après les tests effectués:

| Métrique | Valeur |
|----------|--------|
| **Total réservations** | ~5278 |
| **Upcoming** | ~125 |
| **Completed** | ~5153 |
| **Annonces détectées** | ~102 |
| **Durée scraping** | ~48 minutes |
| **Durée envoi API** | ~3-5 minutes |
| **Coordonnées complètes** | ~100% (dépend du statut) |

---

## 🔐 Sécurité

### Variables d'environnement sensibles

**Ne jamais commiter:**
- `AIRBNB_API_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- Identifiants Airbnb (email, password, TOTP)

**Fichiers à protéger:**
- `.env`
- `.env.local`
- `d:\Airbnb_transfer_v2\docker\.env`

---

## 📝 Logs et Monitoring

### Logs serveur Next.js
```powershell
# Voir les logs en temps réel
cd c:\Users\SERVICE-INFO\IA\algerie-loft
npm run dev
```

### Logs Docker
```powershell
# Voir les logs du scraper
docker logs airbnb_scraper_full

# Suivre les logs en temps réel
docker logs -f airbnb_scraper_full
```

### Logs Supabase
- **URL:** https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk/logs
- **Table:** `airbnb_sync_logs`

```sql
SELECT * FROM airbnb_sync_logs
ORDER BY started_at DESC
LIMIT 10;
```

---

## 🔄 Synchronisations Futures

### Mode Full (manuel)
```powershell
cd d:\Airbnb_transfer_v2\docker
docker-compose --profile manual up airbnb-scraper-full
```

### Mode iCal Watcher (automatique)
```powershell
cd d:\Airbnb_transfer_v2\docker
docker-compose up -d airbnb-ical-watcher
```

### Mode Targeted (réservations spécifiques)
```powershell
cd d:\Airbnb_transfer_v2\docker
docker-compose --profile manual up airbnb-scraper-targeted
```

---

## 📞 Support

Pour toute question ou problème:

1. **Consulter les guides:**
   - `AIRBNB_DATA_TRANSFER_GUIDE.md`
   - `MAPPING_GUIDE.md`
   - `docker/README.md`

2. **Vérifier les logs:**
   - Logs Docker: `docker logs airbnb_scraper_full`
   - Logs Next.js: Console du terminal
   - Logs Supabase: Table `airbnb_sync_logs`

3. **Exécuter le script de vérification:**
   - `verify_airbnb_import.sql` dans Supabase SQL Editor

---

## 📚 Ressources

### Documentation
- **API Endpoint:** `app/api/airbnb/sync/route.ts`
- **Service de Sync:** `lib/services/airbnb-sync-service.ts`
- **Traducteur de Statuts:** `lib/utils/airbnb-status-translator.ts`
- **Types TypeScript:** `lib/types/airbnb.ts`

### Migrations SQL
- `005_extend_reservations_for_airbnb.sql`
- `006_create_airbnb_staging.sql`
- `007_add_airbnb_listing_id_to_lofts.sql`
- `008_create_airbnb_sync_logs.sql`
- `009_create_airbnb_conflicts.sql`

### Scripts Docker
- `scripts/docker/Dockerfile`
- `scripts/docker/docker-compose.yml`
- `scripts/docker/requirements.txt`
- `scripts/docker/.env.example`

---

**Dernière mise à jour:** 19 mai 2026  
**Version:** 2.0.0  
**Auteur:** Équipe Algérie Loft
