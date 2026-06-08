# 📚 Index de la Documentation - Intégration Airbnb v2.0.0

Guide complet pour naviguer dans toute la documentation du système de scraping Airbnb.

---

## 🚀 Démarrage Rapide

**Nouveau sur le projet ? Commencez ici :**

1. **[QUICK_START.md](./QUICK_START.md)** ⭐
   - Guide de démarrage en 5 minutes
   - 3 options de synchronisation
   - Commandes essentielles

2. **[README.md](./README.md)**
   - Vue d'ensemble complète
   - Tous les scripts disponibles
   - Workflow détaillé

---

## 📖 Guides Utilisateur

### Pour Synchroniser les Données

- **[AIRBNB_DATA_TRANSFER_GUIDE.md](./AIRBNB_DATA_TRANSFER_GUIDE.md)**
  - Guide étape par étape complet
  - Récupération des données Docker
  - Envoi à l'API Next.js
  - Vérification Supabase
  - Dépannage

### Pour Mapper les Lofts

- **[MAPPING_GUIDE.md](./MAPPING_GUIDE.md)**
  - Identification des annonces Airbnb
  - Mapping manuel via SQL
  - Mapping via interface admin (à venir)
  - Vérification du mapping

### Pour Utiliser Docker

- **[docker/README.md](./docker/README.md)**
  - Installation et configuration
  - 3 modes de scraping (full, ical-watcher, targeted)
  - Variables d'environnement
  - Dépannage Docker

---

## 🛠️ Scripts Disponibles

### Scripts Python

| Script | Description | Usage |
|--------|-------------|-------|
| **send-airbnb-data-to-api.py** | Envoie les données à l'API Next.js | `python send-airbnb-data-to-api.py <json_file>` |
| **test-with-sample-data.py** | Test de l'API avec données fictives | `python test-with-sample-data.py` |

### Scripts PowerShell

| Script | Description | Usage |
|--------|-------------|-------|
| **airbnb-full-sync.ps1** | Automatisation complète | `.\airbnb-full-sync.ps1` |
| **copy-airbnb-data-from-docker.ps1** | Copie depuis Docker | `.\copy-airbnb-data-from-docker.ps1` |

### Scripts SQL

| Script | Description | Usage |
|--------|-------------|-------|
| **verify_airbnb_import.sql** | Vérification complète | Exécuter dans Supabase SQL Editor |

---

## 🏗️ Documentation Technique

### Architecture

- **[.kiro/specs/airbnb-python-scraper-integration/design.md](../.kiro/specs/airbnb-python-scraper-integration/design.md)**
  - Architecture globale (86 KB)
  - Schéma de base de données
  - Flux de données détaillé
  - API endpoints
  - Configuration Docker
  - Déploiement

### Implémentation

- **[.kiro/specs/airbnb-python-scraper-integration/IMPLEMENTATION_COMPLETE.md](../.kiro/specs/airbnb-python-scraper-integration/IMPLEMENTATION_COMPLETE.md)**
  - Rapport final d'implémentation
  - Résultats des tests
  - Architecture technique
  - Structure des fichiers
  - Métriques de performance

### Code Source

| Fichier | Description |
|---------|-------------|
| `app/api/airbnb/sync/route.ts` | API endpoint principal |
| `lib/services/airbnb-sync-service.ts` | Service de synchronisation |
| `lib/utils/airbnb-status-translator.ts` | Traducteur de statuts FR→EN |
| `lib/types/airbnb.ts` | Types TypeScript |

### Migrations SQL

| Migration | Description |
|-----------|-------------|
| `005_extend_reservations_for_airbnb.sql` | Extension table reservations |
| `006_create_airbnb_staging.sql` | Table de staging |
| `007_add_airbnb_listing_id_to_lofts.sql` | Colonne airbnb_listing_id |
| `008_create_airbnb_sync_logs.sql` | Logs de synchronisation |
| `009_create_airbnb_conflicts.sql` | Gestion des conflits |

---

## 🎯 Par Cas d'Usage

### Je veux synchroniser les réservations Airbnb

1. **Première fois ?**
   - Lire [QUICK_START.md](./QUICK_START.md)
   - Exécuter `.\airbnb-full-sync.ps1`

2. **Déjà configuré ?**
   - Lancer le scraper Docker
   - Exécuter `.\copy-airbnb-data-from-docker.ps1`
   - Exécuter `python send-airbnb-data-to-api.py <json_file>`

3. **Automatisation ?**
   - Voir [docker/README.md](./docker/README.md) section "Mode iCal Watcher"

### Je veux mapper les lofts avec Airbnb

1. Lire [MAPPING_GUIDE.md](./MAPPING_GUIDE.md)
2. Identifier les annonces dans `listings.json`
3. Exécuter les requêtes SQL de mapping
4. Vérifier avec `verify_airbnb_import.sql`

### Je veux vérifier les données importées

1. Ouvrir Supabase SQL Editor
2. Exécuter `verify_airbnb_import.sql`
3. Analyser les 13 sections du rapport

### Je veux comprendre l'architecture

1. Lire [design.md](../.kiro/specs/airbnb-python-scraper-integration/design.md)
2. Voir le diagramme de flux de données
3. Consulter les schémas de base de données

### Je rencontre un problème

1. Consulter la section "Dépannage" dans [AIRBNB_DATA_TRANSFER_GUIDE.md](./AIRBNB_DATA_TRANSFER_GUIDE.md)
2. Vérifier les logs:
   - Docker: `docker logs airbnb_scraper_full`
   - Next.js: Console du terminal
   - Supabase: Table `airbnb_sync_logs`
3. Consulter [README.md](./README.md) section "Dépannage"

---

## 📊 Statistiques du Projet

### Documentation
- **Total:** 161 KB de documentation
- **Fichiers:** 15+ fichiers de documentation
- **Guides:** 4 guides utilisateur complets
- **Scripts:** 5 scripts d'automatisation

### Code
- **API Endpoint:** 1 fichier (route.ts)
- **Services:** 2 fichiers (sync-service, status-translator)
- **Types:** 1 fichier (airbnb.ts)
- **Migrations SQL:** 5 fichiers
- **Scripts:** 5 fichiers (Python + PowerShell)

### Tests
- **Réservations testées:** 6156
- **Annonces détectées:** 102
- **Taux de succès:** 100%
- **Durée scraping:** 48 minutes
- **Durée envoi API:** 3-5 minutes

---

## 🔗 Liens Rapides

### Documentation
- [Quick Start](./QUICK_START.md) - Démarrage rapide
- [README](./README.md) - Guide complet
- [Guide Transfert](./AIRBNB_DATA_TRANSFER_GUIDE.md) - Transfert des données
- [Guide Mapping](./MAPPING_GUIDE.md) - Mapping des lofts
- [Guide Docker](./docker/README.md) - Configuration Docker

### Spec
- [START_HERE](../.kiro/specs/airbnb-python-scraper-integration/START_HERE.md) - Point d'entrée
- [Design](../.kiro/specs/airbnb-python-scraper-integration/design.md) - Architecture (86 KB)
- [Implementation Complete](../.kiro/specs/airbnb-python-scraper-integration/IMPLEMENTATION_COMPLETE.md) - Rapport final

### Code
- [API Endpoint](../app/api/airbnb/sync/route.ts) - API principale
- [Sync Service](../lib/services/airbnb-sync-service.ts) - Service de sync
- [Status Translator](../lib/utils/airbnb-status-translator.ts) - Traducteur

### Migrations
- [Migrations SQL](../supabase/migrations/) - Toutes les migrations
- [Verify Import](../supabase/migrations/verify_airbnb_import.sql) - Vérification

---

## 🆘 Support

### Problèmes Courants

| Problème | Solution | Documentation |
|----------|----------|---------------|
| Docker ne démarre pas | Ouvrir Docker Desktop | [Guide Docker](./docker/README.md) |
| Connection refused (API) | Démarrer `npm run dev` | [Quick Start](./QUICK_START.md) |
| Invalid API key | Vérifier `.env` | [Guide Transfert](./AIRBNB_DATA_TRANSFER_GUIDE.md) |
| Fichier JSON introuvable | Vérifier scraper terminé | [Guide Transfert](./AIRBNB_DATA_TRANSFER_GUIDE.md) |
| Lofts non mappés | Voir guide mapping | [Guide Mapping](./MAPPING_GUIDE.md) |

### Ressources

- **Logs Docker:** `docker logs airbnb_scraper_full`
- **Logs Next.js:** Console du terminal
- **Logs Supabase:** Table `airbnb_sync_logs`
- **Supabase SQL Editor:** https://supabase.com/dashboard/project/zlpzuyctjhajdwlxzdzk/sql

---

## 📅 Historique

| Date | Version | Changements |
|------|---------|-------------|
| 2026-05-17 | 1.0.0 | Création du spec |
| 2026-05-18 | 1.1.0 | Implémentation infrastructure |
| 2026-05-19 | 2.0.0 | ✅ Implémentation complète et tests réussis |

---

## ✅ Checklist Rapide

### Première Synchronisation
- [ ] Docker Desktop démarré
- [ ] Serveur Next.js démarré (`npm run dev`)
- [ ] Variables `.env` configurées
- [ ] Scraper Docker lancé
- [ ] Données copiées depuis Docker
- [ ] Données envoyées à l'API
- [ ] Vérification Supabase effectuée
- [ ] Lofts mappés

### Synchronisations Suivantes
- [ ] Docker Desktop démarré
- [ ] Serveur Next.js démarré
- [ ] Scraper Docker lancé
- [ ] Script d'automatisation exécuté

---

**Navigation rapide:**
- 🚀 [Démarrer maintenant](./QUICK_START.md)
- 📖 [Guide complet](./README.md)
- 🏗️ [Architecture](../.kiro/specs/airbnb-python-scraper-integration/design.md)
- 🎉 [Rapport final](../.kiro/specs/airbnb-python-scraper-integration/IMPLEMENTATION_COMPLETE.md)

---

**Dernière mise à jour:** 19 mai 2026  
**Version:** 2.0.0  
**Statut:** ✅ Documentation complète
