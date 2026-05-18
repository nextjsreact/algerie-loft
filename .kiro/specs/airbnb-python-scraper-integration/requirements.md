# Requirements: Intégration du Système de Scraping Airbnb Python v2.0.0

**Date:** 2026-05-17  
**Status:** Draft  
**Priority:** High  
**Estimated Effort:** 3-5 jours

---

## 🎯 Objectif

Intégrer le système de scraping Airbnb Python v2.0.0 (déjà testé et fonctionnel) avec l'application Next.js existante pour automatiser la synchronisation des réservations des 85 lofts Airbnb.

---

## 📊 Contexte

### Situation Actuelle

- ✅ **Script Python v2.0.0** testé avec succès en Docker + CloakBrowser
- ✅ **Architecture 3 couches** fonctionnelle (iCal Watcher, Targeted Scraper, Full Scraper)
- ✅ **Délai de synchronisation** < 10 minutes
- ✅ **2 réservations de test** validées avec structure de données complète
- ✅ **85 lofts Airbnb** existants dans la table `lofts`
- ✅ **Application Next.js** déployée sur Vercel avec Supabase

### Problème à Résoudre

Le script Python récupère les données Airbnb mais n'est pas encore connecté à l'application :
- ❌ Pas de mapping entre `listing_id` Airbnb (numérique) et `loft_id` (UUID)
- ❌ Schéma DB actuel ne stocke pas tous les champs récupérés par le script
- ❌ Pas d'API endpoint pour recevoir les données du script Python
- ❌ Services Docker non déployés en production

---

## 🎯 Besoins Fonctionnels

### FR-1: Synchronisation Automatique des Réservations

**Description:** Le système doit synchroniser automatiquement les réservations Airbnb vers la base de données avec un délai < 10 minutes.

**Critères d'acceptation:**
- [ ] Une nouvelle réservation Airbnb est détectée en < 5 minutes (iCal Watcher)
- [ ] Les détails complets sont récupérés en < 10 minutes (Targeted Scraper)
- [ ] La réservation est créée/mise à jour dans Supabase
- [ ] Les données sont enrichies avec les informations du loft (nom, adresse, etc.)

**Priorité:** P0 (Critique)

---

### FR-2: Mapping Airbnb Listing ID → Loft UUID

**Description:** Le système doit pouvoir associer automatiquement un `listing_id` Airbnb (numérique) à un `loft_id` (UUID) dans la base de données.

**Critères d'acceptation:**
- [ ] Chaque loft peut avoir un `airbnb_listing_id` associé
- [ ] Le mapping est unique (1 listing_id = 1 loft_id)
- [ ] Le mapping peut être configuré via l'interface admin
- [ ] Le script Python utilise ce mapping pour créer les réservations
- [ ] Si un listing_id n'est pas mappé, une alerte est envoyée

**Priorité:** P0 (Critique)

---

### FR-3: Stockage des Données Complètes

**Description:** Le système doit stocker toutes les données récupérées par le script Python, incluant les détails financiers et les informations de contact.

**Données à stocker:**
- ✅ Données existantes: `id`, `loft_id`, `check_in_date`, `check_out_date`, `guest_name`, `guest_count`, `nights`, `total_amount`, `currency_code`, `status`
- ➕ Nouvelles données: `base_price`, `cleaning_fee`, `service_fee`, `taxes`, `guest_email`, `guest_phone`, `guest_nationality`, `special_requests`, `airbnb_confirmation_code`, `source` (toujours 'airbnb_scraper')

**Critères d'acceptation:**
- [ ] Schéma DB étendu avec les nouveaux champs
- [ ] Migration SQL créée et testée
- [ ] Données historiques préservées
- [ ] Validation des types de données (montants > 0, emails valides, etc.)

**Priorité:** P0 (Critique)

---

### FR-4: API Endpoint pour Recevoir les Données

**Description:** Le système doit exposer un API endpoint sécurisé pour recevoir les données du script Python.

**Spécifications:**
- **Endpoint:** `POST /api/airbnb/sync`
- **Authentification:** API Key (secret partagé entre Python et Next.js)
- **Format:** JSON
- **Rate limiting:** 100 requêtes/minute
- **Timeout:** 30 secondes

**Payload attendu:**
```json
{
  "reservations": [
    {
      "id": "HMABCDEFGH",
      "listing_id": "12345678",
      "statut": "Confirmée",
      "voyageur": "John Doe",
      "nb_voyageurs": 2,
      "date_arrivee": "2026-05-20",
      "date_depart": "2026-05-25",
      "nb_nuits": 5,
      "montant_total": 45000.00,
      "devise": "DZD",
      "base_price": 40000.00,
      "fees": 5000.00,
      "guest_email": "john@example.com",
      "guest_phone": "+213555123456"
    }
  ],
  "sync_metadata": {
    "sync_type": "targeted" | "full" | "ical_watcher",
    "timestamp": "2026-05-17T21:00:00Z",
    "script_version": "2.0.0"
  }
}
```

**Réponse attendue:**
```json
{
  "success": true,
  "processed": 1,
  "created": 1,
  "updated": 0,
  "errors": [],
  "warnings": [
    {
      "listing_id": "12345678",
      "message": "Listing ID not mapped to any loft"
    }
  ]
}
```

**Critères d'acceptation:**
- [ ] Endpoint créé et sécurisé (API Key)
- [ ] Validation du payload (schéma JSON)
- [ ] Mapping listing_id → loft_id automatique
- [ ] Création/mise à jour des réservations
- [ ] Gestion des erreurs (listing_id inconnu, données invalides, etc.)
- [ ] Logs détaillés dans Supabase
- [ ] Rate limiting configuré

**Priorité:** P0 (Critique)

---

### FR-5: Gestion des Erreurs et Retry

**Description:** Le système doit gérer les erreurs de synchronisation et réessayer automatiquement en cas d'échec.

**Scénarios d'erreur:**
1. **Listing ID inconnu:** Alerte admin + log
2. **Données invalides:** Validation échoue + log détaillé
3. **Timeout API:** Retry automatique (3 tentatives)
4. **Conflit de réservation:** Détection + alerte
5. **Erreur Supabase:** Retry avec backoff exponentiel

**Critères d'acceptation:**
- [ ] Retry automatique (max 3 tentatives)
- [ ] Backoff exponentiel (1s, 2s, 4s)
- [ ] Logs détaillés pour chaque erreur
- [ ] Alertes email pour erreurs critiques
- [ ] Dashboard de monitoring des erreurs

**Priorité:** P1 (Important)

---

### FR-6: Configuration du Mapping via Interface Admin

**Description:** Les administrateurs doivent pouvoir configurer le mapping `listing_id` → `loft_id` via une interface graphique.

**Fonctionnalités:**
- Afficher la liste des 85 lofts
- Pour chaque loft, afficher/éditer l'`airbnb_listing_id`
- Validation: listing_id unique
- Recherche par nom de loft ou listing_id
- Import en masse via CSV (optionnel)

**Critères d'acceptation:**
- [ ] Page admin `/admin/airbnb/mapping` créée
- [ ] Liste des lofts avec champ `airbnb_listing_id` éditable
- [ ] Validation en temps réel (unicité)
- [ ] Sauvegarde automatique
- [ ] Indicateur visuel (mappé / non mappé)
- [ ] Export CSV du mapping actuel

**Priorité:** P1 (Important)

---

### FR-7: Monitoring et Alertes

**Description:** Le système doit fournir un dashboard de monitoring et envoyer des alertes en cas de problème.

**Métriques à surveiller:**
- Nombre de syncs réussis/échoués (dernières 24h)
- Délai moyen de synchronisation
- Nombre de listing_ids non mappés
- Nombre de conflits détectés
- Taux d'erreur par type

**Alertes à envoyer:**
- ⚠️ Listing ID non mappé (email immédiat)
- 🚨 3 échecs consécutifs de sync (email + SMS)
- 🚨 Conflit de réservation détecté (email immédiat)
- ℹ️ Rapport quotidien (email à 8h)

**Critères d'acceptation:**
- [ ] Dashboard `/admin/airbnb/monitoring` créé
- [ ] Graphiques des métriques (dernières 7 jours)
- [ ] Liste des derniers syncs avec statut
- [ ] Alertes email configurées
- [ ] Logs consultables et filtrables

**Priorité:** P1 (Important)

---

### FR-8: Déploiement des Services Docker

**Description:** Les 3 services Docker (iCal Watcher, Targeted Scraper, Full Scraper) doivent être déployés en production sur un VPS.

**Architecture de déploiement:**
```
┌─────────────────────────────────────────────────────────────┐
│                    VPS (Hetzner/OVH)                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Docker Compose                                      │   │
│  │                                                     │   │
│  │  ┌──────────────────┐  ┌──────────────────┐       │   │
│  │  │ iCal Watcher     │  │ Targeted Scraper │       │   │
│  │  │ (toutes les 5min)│  │ (on-demand)      │       │   │
│  │  └──────────────────┘  └──────────────────┘       │   │
│  │                                                     │   │
│  │  ┌──────────────────┐                              │   │
│  │  │ Full Scraper     │                              │   │
│  │  │ (2h du matin)    │                              │   │
│  │  └──────────────────┘                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│                   API Next.js (Vercel)                      │
└─────────────────────────────────────────────────────────────┘
```

**Critères d'acceptation:**
- [ ] VPS provisionné (Hetzner CX11 ou équivalent)
- [ ] Docker et Docker Compose installés
- [ ] Services configurés avec variables d'environnement
- [ ] Logs centralisés (stdout → fichier)
- [ ] Monitoring de l'uptime (healthcheck)
- [ ] Redémarrage automatique en cas de crash
- [ ] Backup des configurations

**Priorité:** P0 (Critique)

---

### FR-9: Traduction des Statuts FR → EN

**Description:** Le script Python récupère les statuts en français ("Confirmée", "En attente", "Annulée"). Le système doit les traduire en anglais pour la DB.

**Mapping:**
- "Confirmée" → "confirmed"
- "En attente" → "pending"
- "Annulée" → "cancelled"
- "Terminée" → "completed"

**Critères d'acceptation:**
- [ ] Fonction de traduction dans l'API endpoint
- [ ] Gestion des statuts inconnus (log + valeur par défaut "pending")
- [ ] Tests unitaires pour tous les statuts

**Priorité:** P1 (Important)

---

### FR-10: Détection des Conflits de Réservation

**Description:** Le système doit détecter automatiquement les conflits de réservation (2 réservations qui se chevauchent sur le même loft).

**Logique de détection:**
```sql
SELECT * FROM reservations
WHERE loft_id = :loft_id
AND status IN ('confirmed', 'pending')
AND (
  (check_in_date < :new_checkout AND check_out_date > :new_checkin)
)
```

**Critères d'acceptation:**
- [ ] Détection automatique lors de la création/mise à jour
- [ ] Alerte email immédiate pour conflits critiques
- [ ] Affichage des conflits dans le calendrier (rouge)
- [ ] Logs des conflits dans une table dédiée

**Priorité:** P1 (Important)

---

## 🚫 Non-Fonctionnels

### NFR-1: Performance

- L'API endpoint doit répondre en < 2 secondes pour 100 réservations
- Le mapping listing_id → loft_id doit être en cache (Redis ou mémoire)
- Les requêtes Supabase doivent utiliser des indexes

### NFR-2: Sécurité

- API Key stockée dans variables d'environnement (jamais dans le code)
- Validation stricte du payload (schéma JSON)
- Rate limiting pour éviter les abus
- Logs ne doivent pas contenir de données sensibles (emails, téléphones)

### NFR-3: Fiabilité

- Uptime des services Docker > 99%
- Retry automatique en cas d'échec
- Monitoring et alertes en temps réel
- Backup quotidien des configurations

### NFR-4: Maintenabilité

- Code documenté (README, commentaires)
- Tests unitaires pour les fonctions critiques
- Logs structurés (JSON) pour faciliter le debugging
- Variables d'environnement pour toute configuration

---

## 📋 Cas d'Usage

### UC-1: Nouvelle Réservation Airbnb

**Acteur:** Système automatique

**Scénario nominal:**
1. Un client réserve un loft sur Airbnb
2. iCal Watcher détecte le changement en < 5 minutes
3. Targeted Scraper récupère les détails complets
4. Script Python envoie les données à l'API Next.js
5. API mappe le listing_id → loft_id
6. Réservation créée dans Supabase
7. Notification envoyée à l'admin

**Scénario alternatif (listing_id non mappé):**
1-4. Identique
5. API ne trouve pas de mapping pour le listing_id
6. Alerte email envoyée à l'admin
7. Réservation mise en attente (statut "pending_mapping")
8. Admin configure le mapping via l'interface
9. Réservation automatiquement associée au bon loft

---

### UC-2: Modification de Réservation

**Acteur:** Système automatique

**Scénario nominal:**
1. Un client modifie sa réservation (dates, nb voyageurs)
2. iCal Watcher détecte le changement
3. Targeted Scraper récupère les nouvelles données
4. API identifie la réservation existante (par `id`)
5. Réservation mise à jour dans Supabase
6. Vérification des conflits
7. Si conflit détecté → alerte email

---

### UC-3: Annulation de Réservation

**Acteur:** Système automatique

**Scénario nominal:**
1. Un client annule sa réservation
2. iCal Watcher détecte la disparition de l'événement
3. Targeted Scraper confirme l'annulation
4. API met à jour le statut → "cancelled"
5. Notification envoyée à l'admin

---

### UC-4: Configuration du Mapping (Admin)

**Acteur:** Administrateur

**Scénario nominal:**
1. Admin accède à `/admin/airbnb/mapping`
2. Recherche le loft "Alger Centre"
3. Saisit l'`airbnb_listing_id`: "12345678"
4. Système valide l'unicité
5. Mapping sauvegardé
6. Réservations en attente automatiquement associées

---

### UC-5: Monitoring des Syncs (Admin)

**Acteur:** Administrateur

**Scénario nominal:**
1. Admin accède à `/admin/airbnb/monitoring`
2. Consulte les métriques des dernières 24h
3. Identifie 3 listing_ids non mappés
4. Clique sur "Configurer le mapping"
5. Redirigé vers `/admin/airbnb/mapping` avec filtres

---

## 🎯 Critères de Succès

### Critères Quantitatifs

- ✅ **Délai de sync:** < 10 minutes (95% des cas)
- ✅ **Taux de succès:** > 98% des syncs réussis
- ✅ **Uptime:** > 99% des services Docker
- ✅ **Temps de réponse API:** < 2 secondes
- ✅ **Détection des conflits:** 100% des conflits détectés

### Critères Qualitatifs

- ✅ Les administrateurs peuvent configurer le mapping facilement
- ✅ Les erreurs sont détectées et signalées rapidement
- ✅ Le système fonctionne de manière autonome (pas d'intervention manuelle)
- ✅ Les données sont complètes et cohérentes
- ✅ Le code est maintenable et documenté

---

## 🚀 Priorités

### Phase 1: MVP (P0 - Critique)
- FR-1: Synchronisation automatique
- FR-2: Mapping listing_id → loft_id
- FR-3: Stockage des données complètes
- FR-4: API endpoint
- FR-8: Déploiement Docker

### Phase 2: Stabilisation (P1 - Important)
- FR-5: Gestion des erreurs et retry
- FR-6: Interface admin de mapping
- FR-7: Monitoring et alertes
- FR-9: Traduction des statuts
- FR-10: Détection des conflits

### Phase 3: Optimisation (P2 - Nice to have)
- Import CSV en masse du mapping
- Export des données pour analyse
- Statistiques avancées
- Intégration avec d'autres plateformes (Booking.com)

---

## 📝 Questions Ouvertes

### Q1: Hébergement VPS
**Question:** Quel fournisseur VPS préférez-vous ? (Hetzner, OVH, DigitalOcean, autre)  
**Impact:** Coût mensuel, localisation, performance  
**Décision requise:** Avant Phase 1

### Q2: Gestion des Listing IDs Multiples
**Question:** Un loft peut-il avoir plusieurs listing_ids Airbnb ? (ex: annonces différentes pour le même loft)  
**Impact:** Schéma DB (colonne unique vs table de mapping)  
**Décision requise:** Avant Phase 1

### Q3: Données Historiques
**Question:** Faut-il importer les réservations historiques depuis Airbnb ?  
**Impact:** Temps de migration, volume de données  
**Décision requise:** Avant Phase 1

### Q4: Priorité vs Bugs en Cours
**Question:** Ce projet est-il prioritaire par rapport aux bugs en cours (pagination, audit, OAuth) ?  
**Impact:** Planning, allocation des ressources  
**Décision requise:** Immédiatement

---

## 📚 Références

- **Script Python:** `d:\Airbnb_transfer_v2\airbnb_scraper.py` (v2.0.0)
- **Spec existant:** `.kiro/specs/booking-sync-system/DEPLOY_NOW.md`
- **Documentation:** `docs/BOOKING_SYNC_README.md`
- **Types DB:** `lib/types.ts`
- **Schéma actuel:** `supabase/migrations/`

---

**Prochaine étape:** Design (Architecture technique détaillée)
