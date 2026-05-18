# Spec: Intégration du Système de Scraping Airbnb Python v2.0.0

**Status:** Draft  
**Priority:** High  
**Created:** 2026-05-17  
**Estimated Effort:** 7 jours

---

## 🎯 Objectif

Intégrer le système de scraping Airbnb Python v2.0.0 (déjà testé et fonctionnel avec Docker + CloakBrowser) avec l'application Next.js pour automatiser la synchronisation des réservations des 85 lofts Airbnb avec un délai < 10 minutes.

---

## 📊 Contexte

### ✅ Ce qui existe déjà

- Script Python v2.0.0 testé avec succès
- Architecture 3 couches fonctionnelle (iCal Watcher, Targeted Scraper, Full Scraper)
- Délai de synchronisation < 10 minutes
- 2 réservations de test validées
- 85 lofts Airbnb dans la DB
- Application Next.js déployée sur Vercel

### ❌ Ce qui manque

- Mapping entre `listing_id` Airbnb (numérique) et `loft_id` (UUID)
- Schéma DB ne stocke pas tous les champs récupérés
- Pas d'API endpoint pour recevoir les données Python
- Services Docker non déployés en production

---

## 🏗️ Architecture Proposée

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
│                          ↓ HTTP POST                        │
│                   POST /api/airbnb/sync                     │
│                          ↓                                  │
│                   Next.js API (Vercel)                      │
│                          ↓                                  │
│                   Supabase PostgreSQL                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Phases de Développement

### Phase 1: MVP (P0 - 3 jours)

**Objectif:** Système fonctionnel end-to-end

1. ✅ Étendre le schéma DB (nouveaux champs)
2. ✅ Ajouter le mapping `airbnb_listing_id` dans `lofts`
3. ✅ Créer l'API endpoint `POST /api/airbnb/sync`
4. ✅ Implémenter la traduction des statuts FR → EN
5. ✅ Configurer les variables d'environnement
6. ✅ Modifier le script Python pour appeler l'API
7. ✅ Créer le Docker Compose
8. ✅ Déployer sur VPS
9. ✅ Tests end-to-end

### Phase 2: Stabilisation (P1 - 3 jours)

**Objectif:** Système robuste et monitoré

10. ✅ Gestion des erreurs et retry
11. ✅ Interface admin de mapping
12. ✅ Dashboard de monitoring
13. ✅ Détection des conflits
14. ✅ Alertes email
15. ✅ Documentation complète

### Phase 3: Optimisation (P2 - 1 jour)

**Objectif:** Fonctionnalités avancées

16. ✅ Import CSV en masse du mapping
17. ✅ Export des données pour analyse
18. ✅ Statistiques avancées

---

## 🎯 Critères de Succès

### Quantitatifs

- ✅ **Délai de sync:** < 10 minutes (95% des cas)
- ✅ **Taux de succès:** > 98% des syncs réussis
- ✅ **Uptime:** > 99% des services Docker
- ✅ **Temps de réponse API:** < 2 secondes
- ✅ **Détection des conflits:** 100% des conflits détectés

### Qualitatifs

- ✅ Configuration du mapping facile (interface admin)
- ✅ Erreurs détectées et signalées rapidement
- ✅ Système autonome (pas d'intervention manuelle)
- ✅ Données complètes et cohérentes
- ✅ Code maintenable et documenté

---

## 🚀 Avantages vs Approche README

| Critère | Script Python v2.0.0 | Approche README |
|---------|----------------------|-----------------|
| **État actuel** | ✅ Testé et fonctionnel | ⚠️ Théorique |
| **Délai de sync** | ✅ < 10 minutes | ⚠️ 30 min + 24h |
| **Détection** | ✅ iCal Watcher intelligent | ❌ Polling aveugle |
| **Anti-détection** | ✅ CloakBrowser | ❌ Playwright basique |
| **Architecture** | ✅ 3 couches optimisées | ⚠️ 2 couches séparées |
| **Données** | ✅ Scraping direct | ⚠️ Dépend du CSV |
| **CAPTCHA** | ✅ Résiste | ❌ Se fait bloquer |

---

## 📝 Questions Ouvertes

### Q1: Hébergement VPS
**Question:** Quel fournisseur VPS ? (Hetzner, OVH, DigitalOcean)  
**Recommandation:** Hetzner CX11 (~€5/mois)

### Q2: Gestion des Listing IDs Multiples
**Question:** Un loft peut-il avoir plusieurs listing_ids ?  
**Recommandation:** Non pour le MVP (colonne unique)

### Q3: Données Historiques
**Question:** Importer les réservations historiques ?  
**Recommandation:** Non pour le MVP (focus sur les nouvelles)

### Q4: Priorité vs Bugs en Cours
**Question:** Prioritaire par rapport aux bugs (pagination, audit, OAuth) ?  
**Décision requise:** Immédiatement

---

## 📚 Fichiers du Spec

- **`requirements.md`** - Besoins fonctionnels détaillés (10 FR + 4 NFR)
- **`tasks.md`** - 18 tâches organisées en 3 phases
- **`design.md`** - Architecture technique (à créer)
- **`README.md`** - Ce fichier (vue d'ensemble)

---

## 🔗 Références

- **Script Python:** `d:\Airbnb_transfer_v2\airbnb_scraper.py` (v2.0.0)
- **Spec existant:** `.kiro/specs/booking-sync-system/DEPLOY_NOW.md`
- **Documentation:** `docs/BOOKING_SYNC_README.md`
- **Types DB:** `lib/types.ts`

---

## 🎉 Prochaines Étapes

1. **Décision utilisateur:** Confirmer la priorité de ce projet
2. **Répondre aux questions ouvertes** (Q1-Q4)
3. **Créer le design détaillé** (architecture technique)
4. **Commencer Phase 1** (Task 1-9)

---

**Créé par:** Kiro AI  
**Date:** 2026-05-17  
**Version:** 1.0.0
