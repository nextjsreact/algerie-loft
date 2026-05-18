# Tasks: Intégration du Système de Scraping Airbnb Python v2.0.0

**Spec:** airbnb-python-scraper-integration  
**Status:** Draft  
**Created:** 2026-05-17

---

## Phase 1: MVP (P0 - Critique)

### Task 1: Étendre le Schéma DB pour les Réservations Airbnb
**Status:** not_started  
**Priority:** P0  
**Estimated:** 2h  
**Dependencies:** None

**Description:**
Créer une migration SQL pour ajouter les champs manquants dans la table des réservations (ou créer une nouvelle table `airbnb_reservations`).

**Subtasks:**
- Analyser le schéma actuel de la table `reservations`
- Décider: étendre `reservations` ou créer `airbnb_reservations`
- Créer la migration SQL avec les nouveaux champs:
  - `airbnb_confirmation_code` (VARCHAR)
  - `base_price` (DECIMAL)
  - `cleaning_fee` (DECIMAL)
  - `service_fee` (DECIMAL)
  - `taxes` (DECIMAL)
  - `guest_email` (VARCHAR)
  - `guest_nationality` (VARCHAR)
  - `special_requests` (TEXT)
  - `source` (VARCHAR, default 'airbnb_scraper')
- Ajouter les indexes nécessaires
- Tester la migration sur une DB de test
- Documenter les changements

**Acceptance Criteria:**
- [ ] Migration SQL créée dans `supabase/migrations/`
- [ ] Migration testée sans erreur
- [ ] Indexes créés pour les champs fréquemment requêtés
- [ ] Documentation mise à jour

---

### Task 2: Ajouter le Mapping Airbnb Listing ID dans la Table Lofts
**Status:** not_started  
**Priority:** P0  
**Estimated:** 1h  
**Dependencies:** None

**Description:**
Ajouter une colonne `airbnb_listing_id` dans la table `lofts` pour mapper les listing IDs Airbnb aux lofts.

**Subtasks:**
- Créer la migration SQL:
  ```sql
  ALTER TABLE lofts ADD COLUMN airbnb_listing_id VARCHAR(50) UNIQUE;
  CREATE INDEX idx_lofts_airbnb_listing_id ON lofts(airbnb_listing_id);
  ```
- Tester la migration
- Documenter le mapping

**Acceptance Criteria:**
- [ ] Colonne `airbnb_listing_id` ajoutée
- [ ] Contrainte UNIQUE appliquée
- [ ] Index créé
- [ ] Migration testée

---

### Task 3: Créer l'API Endpoint POST /api/airbnb/sync
**Status:** not_started  
**Priority:** P0  
**Estimated:** 4h  
**Dependencies:** Task 1, Task 2

**Description:**
Créer un API endpoint sécurisé pour recevoir les données du script Python et les insérer dans Supabase.

**Subtasks:**
- Créer le fichier `app/api/airbnb/sync/route.ts`
- Implémenter l'authentification par API Key
- Valider le payload JSON (schéma Zod)
- Implémenter le mapping `listing_id` → `loft_id`
- Implémenter la logique de création/mise à jour des réservations
- Gérer les erreurs (listing_id inconnu, données invalides, etc.)
- Implémenter le rate limiting (100 req/min)
- Ajouter les logs détaillés
- Créer les tests unitaires
- Documenter l'API

**Acceptance Criteria:**
- [ ] Endpoint créé et fonctionnel
- [ ] Authentification par API Key
- [ ] Validation du payload avec Zod
- [ ] Mapping listing_id → loft_id fonctionnel
- [ ] Création/mise à jour des réservations
- [ ] Gestion des erreurs complète
- [ ] Rate limiting configuré
- [ ] Tests unitaires passent
- [ ] Documentation API créée

---

### Task 4: Implémenter la Traduction des Statuts FR → EN
**Status:** not_started  
**Priority:** P0  
**Estimated:** 1h  
**Dependencies:** Task 3

**Description:**
Créer une fonction utilitaire pour traduire les statuts français du script Python en statuts anglais pour la DB.

**Subtasks:**
- Créer `lib/utils/airbnb-status-translator.ts`
- Implémenter le mapping:
  - "Confirmée" → "confirmed"
  - "En attente" → "pending"
  - "Annulée" → "cancelled"
  - "Terminée" → "completed"
- Gérer les statuts inconnus (log + valeur par défaut)
- Créer les tests unitaires
- Intégrer dans l'API endpoint

**Acceptance Criteria:**
- [ ] Fonction de traduction créée
- [ ] Tous les statuts mappés
- [ ] Gestion des statuts inconnus
- [ ] Tests unitaires passent
- [ ] Intégré dans l'API

---

### Task 5: Configurer les Variables d'Environnement
**Status:** not_started  
**Priority:** P0  
**Estimated:** 30min  
**Dependencies:** Task 3

**Description:**
Ajouter les variables d'environnement nécessaires pour l'intégration Airbnb.

**Subtasks:**
- Ajouter dans `.env.example`:
  - `AIRBNB_API_SECRET` (API Key pour authentification)
  - `AIRBNB_SYNC_ENABLED` (toggle on/off)
- Ajouter dans Vercel Dashboard
- Documenter dans le README

**Acceptance Criteria:**
- [ ] Variables ajoutées dans `.env.example`
- [ ] Variables configurées dans Vercel
- [ ] Documentation mise à jour

---

### Task 6: Modifier le Script Python pour Appeler l'API Next.js
**Status:** not_started  
**Priority:** P0  
**Estimated:** 2h  
**Dependencies:** Task 3, Task 5

**Description:**
Modifier le script Python pour envoyer les données à l'API Next.js au lieu de les insérer directement dans Supabase.

**Subtasks:**
- Ajouter la fonction `send_to_nextjs_api()` dans le script Python
- Configurer l'URL de l'API (variable d'environnement)
- Configurer l'API Key (variable d'environnement)
- Implémenter le retry en cas d'échec (3 tentatives)
- Gérer les erreurs HTTP
- Ajouter les logs
- Tester avec l'API Next.js

**Acceptance Criteria:**
- [ ] Fonction `send_to_nextjs_api()` créée
- [ ] Configuration via variables d'environnement
- [ ] Retry automatique (3 tentatives)
- [ ] Gestion des erreurs HTTP
- [ ] Logs détaillés
- [ ] Tests end-to-end réussis

---

### Task 7: Créer le Docker Compose pour les Services
**Status:** not_started  
**Priority:** P0  
**Estimated:** 2h  
**Dependencies:** Task 6

**Description:**
Créer un fichier `docker-compose.yml` pour orchestrer les 3 services (iCal Watcher, Targeted Scraper, Full Scraper).

**Subtasks:**
- Créer `docker-compose.yml`
- Configurer les 3 services avec leurs schedules
- Configurer les variables d'environnement
- Configurer les volumes pour les logs
- Configurer les healthchecks
- Configurer le restart automatique
- Tester localement
- Documenter le déploiement

**Acceptance Criteria:**
- [ ] `docker-compose.yml` créé
- [ ] 3 services configurés
- [ ] Variables d'environnement configurées
- [ ] Healthchecks fonctionnels
- [ ] Restart automatique configuré
- [ ] Tests locaux réussis
- [ ] Documentation créée

---

### Task 8: Déployer les Services Docker sur VPS
**Status:** not_started  
**Priority:** P0  
**Estimated:** 3h  
**Dependencies:** Task 7

**Description:**
Provisionner un VPS et déployer les services Docker en production.

**Subtasks:**
- Provisionner un VPS (Hetzner CX11 ou équivalent)
- Installer Docker et Docker Compose
- Configurer le firewall (SSH, HTTP/HTTPS)
- Copier les fichiers sur le VPS
- Configurer les variables d'environnement
- Démarrer les services
- Vérifier les logs
- Configurer le monitoring de l'uptime
- Documenter l'accès et la maintenance

**Acceptance Criteria:**
- [ ] VPS provisionné et accessible
- [ ] Docker et Docker Compose installés
- [ ] Firewall configuré
- [ ] Services déployés et en cours d'exécution
- [ ] Logs accessibles
- [ ] Monitoring configuré
- [ ] Documentation créée

---

### Task 9: Tests End-to-End du Flux Complet
**Status:** not_started  
**Priority:** P0  
**Estimated:** 2h  
**Dependencies:** Task 8

**Description:**
Tester le flux complet de synchronisation depuis Airbnb jusqu'à Supabase.

**Subtasks:**
- Créer une réservation de test sur Airbnb
- Vérifier que l'iCal Watcher détecte le changement
- Vérifier que le Targeted Scraper récupère les détails
- Vérifier que l'API Next.js reçoit les données
- Vérifier que la réservation est créée dans Supabase
- Vérifier les logs à chaque étape
- Tester la modification d'une réservation
- Tester l'annulation d'une réservation
- Documenter les résultats

**Acceptance Criteria:**
- [ ] Réservation de test créée
- [ ] Synchronisation complète réussie
- [ ] Données correctes dans Supabase
- [ ] Logs cohérents
- [ ] Modification testée
- [ ] Annulation testée
- [ ] Documentation des tests

---

## Phase 2: Stabilisation (P1 - Important)

### Task 10: Implémenter la Gestion des Erreurs et Retry
**Status:** not_started  
**Priority:** P1  
**Estimated:** 3h  
**Dependencies:** Task 9

**Description:**
Améliorer la gestion des erreurs avec retry automatique et backoff exponentiel.

**Subtasks:**
- Implémenter le retry avec backoff exponentiel dans l'API
- Créer une table `airbnb_sync_errors` pour logger les erreurs
- Implémenter la logique de retry dans le script Python
- Ajouter les alertes email pour erreurs critiques
- Créer les tests unitaires
- Documenter les scénarios d'erreur

**Acceptance Criteria:**
- [ ] Retry automatique (max 3 tentatives)
- [ ] Backoff exponentiel (1s, 2s, 4s)
- [ ] Table `airbnb_sync_errors` créée
- [ ] Alertes email configurées
- [ ] Tests unitaires passent
- [ ] Documentation créée

---

### Task 11: Créer l'Interface Admin de Mapping
**Status:** not_started  
**Priority:** P1  
**Estimated:** 4h  
**Dependencies:** Task 2

**Description:**
Créer une page admin pour configurer le mapping `listing_id` → `loft_id`.

**Subtasks:**
- Créer la page `app/[locale]/admin/airbnb/mapping/page.tsx`
- Afficher la liste des 85 lofts
- Ajouter un champ éditable pour `airbnb_listing_id`
- Implémenter la validation (unicité)
- Implémenter la sauvegarde automatique
- Ajouter un indicateur visuel (mappé / non mappé)
- Ajouter une recherche par nom ou listing_id
- Créer l'action serveur pour la sauvegarde
- Ajouter les tests
- Documenter l'utilisation

**Acceptance Criteria:**
- [ ] Page admin créée
- [ ] Liste des lofts affichée
- [ ] Champ `airbnb_listing_id` éditable
- [ ] Validation en temps réel
- [ ] Sauvegarde automatique
- [ ] Indicateur visuel
- [ ] Recherche fonctionnelle
- [ ] Tests passent
- [ ] Documentation créée

---

### Task 12: Créer le Dashboard de Monitoring
**Status:** not_started  
**Priority:** P1  
**Estimated:** 5h  
**Dependencies:** Task 10

**Description:**
Créer un dashboard pour monitorer les synchronisations et les erreurs.

**Subtasks:**
- Créer la page `app/[locale]/admin/airbnb/monitoring/page.tsx`
- Créer une table `airbnb_sync_logs` pour les logs
- Afficher les métriques (dernières 24h, 7 jours):
  - Nombre de syncs réussis/échoués
  - Délai moyen de synchronisation
  - Nombre de listing_ids non mappés
  - Nombre de conflits détectés
- Afficher la liste des derniers syncs avec statut
- Ajouter des graphiques (Chart.js ou Recharts)
- Implémenter les filtres (date, type, statut)
- Créer les actions serveur pour récupérer les données
- Documenter l'utilisation

**Acceptance Criteria:**
- [ ] Page monitoring créée
- [ ] Table `airbnb_sync_logs` créée
- [ ] Métriques affichées
- [ ] Graphiques fonctionnels
- [ ] Filtres fonctionnels
- [ ] Liste des syncs affichée
- [ ] Documentation créée

---

### Task 13: Implémenter la Détection des Conflits
**Status:** not_started  
**Priority:** P1  
**Estimated:** 3h  
**Dependencies:** Task 3

**Description:**
Implémenter la détection automatique des conflits de réservation.

**Subtasks:**
- Créer la fonction `detectConflicts()` dans l'API
- Implémenter la logique de détection (chevauchement de dates)
- Créer une table `airbnb_conflicts` pour logger les conflits
- Implémenter les alertes email pour conflits critiques
- Afficher les conflits dans le calendrier (rouge)
- Créer les tests unitaires
- Documenter la logique

**Acceptance Criteria:**
- [ ] Fonction `detectConflicts()` créée
- [ ] Détection automatique lors de la création/mise à jour
- [ ] Table `airbnb_conflicts` créée
- [ ] Alertes email configurées
- [ ] Affichage dans le calendrier
- [ ] Tests unitaires passent
- [ ] Documentation créée

---

### Task 14: Configurer les Alertes Email
**Status:** not_started  
**Priority:** P1  
**Estimated:** 2h  
**Dependencies:** Task 10, Task 13

**Description:**
Configurer les alertes email pour les événements critiques.

**Subtasks:**
- Créer les templates email:
  - Listing ID non mappé
  - 3 échecs consécutifs de sync
  - Conflit de réservation détecté
  - Rapport quotidien
- Configurer Resend API
- Implémenter l'envoi d'alertes dans l'API
- Implémenter le batching (plusieurs alertes en un email)
- Tester l'envoi d'alertes
- Documenter la configuration

**Acceptance Criteria:**
- [ ] Templates email créés
- [ ] Resend API configuré
- [ ] Envoi d'alertes fonctionnel
- [ ] Batching implémenté
- [ ] Tests réussis
- [ ] Documentation créée

---

### Task 15: Documentation Complète du Système
**Status:** not_started  
**Priority:** P1  
**Estimated:** 2h  
**Dependencies:** Task 14

**Description:**
Créer une documentation complète pour l'utilisation et la maintenance du système.

**Subtasks:**
- Créer `docs/AIRBNB_SCRAPER_INTEGRATION.md`
- Documenter l'architecture
- Documenter le déploiement
- Documenter la configuration du mapping
- Documenter le monitoring
- Documenter le troubleshooting
- Créer un guide de démarrage rapide
- Créer une FAQ

**Acceptance Criteria:**
- [ ] Documentation créée
- [ ] Architecture documentée
- [ ] Déploiement documenté
- [ ] Configuration documentée
- [ ] Monitoring documenté
- [ ] Troubleshooting documenté
- [ ] Guide de démarrage créé
- [ ] FAQ créée

---

## Phase 3: Optimisation (P2 - Nice to have)

### Task 16: Import CSV en Masse du Mapping
**Status:** not_started  
**Priority:** P2  
**Estimated:** 2h  
**Dependencies:** Task 11

**Description:**
Permettre l'import en masse du mapping via un fichier CSV.

**Subtasks:**
- Ajouter un bouton "Import CSV" dans la page de mapping
- Implémenter le parsing du CSV
- Valider les données (unicité, format)
- Implémenter l'import en batch
- Afficher un rapport d'import (succès/erreurs)
- Créer les tests
- Documenter l'utilisation

**Acceptance Criteria:**
- [ ] Bouton "Import CSV" ajouté
- [ ] Parsing CSV fonctionnel
- [ ] Validation des données
- [ ] Import en batch fonctionnel
- [ ] Rapport d'import affiché
- [ ] Tests passent
- [ ] Documentation créée

---

### Task 17: Export des Données pour Analyse
**Status:** not_started  
**Priority:** P2  
**Estimated:** 2h  
**Dependencies:** Task 12

**Description:**
Permettre l'export des données de synchronisation pour analyse.

**Subtasks:**
- Ajouter un bouton "Export CSV" dans le dashboard
- Implémenter l'export des logs de sync
- Implémenter l'export des erreurs
- Implémenter l'export des conflits
- Créer les tests
- Documenter l'utilisation

**Acceptance Criteria:**
- [ ] Bouton "Export CSV" ajouté
- [ ] Export des logs fonctionnel
- [ ] Export des erreurs fonctionnel
- [ ] Export des conflits fonctionnel
- [ ] Tests passent
- [ ] Documentation créée

---

### Task 18: Statistiques Avancées
**Status:** not_started  
**Priority:** P2  
**Estimated:** 3h  
**Dependencies:** Task 12

**Description:**
Ajouter des statistiques avancées dans le dashboard de monitoring.

**Subtasks:**
- Ajouter des graphiques de tendance (7 jours, 30 jours)
- Ajouter des métriques par loft
- Ajouter des métriques par type de sync
- Ajouter des alertes de performance (délai > 15 min)
- Créer les tests
- Documenter les métriques

**Acceptance Criteria:**
- [ ] Graphiques de tendance ajoutés
- [ ] Métriques par loft affichées
- [ ] Métriques par type affichées
- [ ] Alertes de performance configurées
- [ ] Tests passent
- [ ] Documentation créée

---

## Résumé

**Total Tasks:** 18  
**Phase 1 (MVP):** 9 tasks (P0)  
**Phase 2 (Stabilisation):** 6 tasks (P1)  
**Phase 3 (Optimisation):** 3 tasks (P2)

**Estimation Totale:**
- Phase 1: ~17.5 heures (~3 jours)
- Phase 2: ~19 heures (~3 jours)
- Phase 3: ~7 heures (~1 jour)

**Total:** ~43.5 heures (~7 jours de travail)

---

**Prochaine étape:** Design (Architecture technique détaillée)
