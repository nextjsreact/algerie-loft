# Loft Algérie — Estimation de Valeur & Offre d'Investissement

---

## 1. Effort de Développement

### Décomposition par module

| Module | Complexité | Jours/Homme estimés |
|--------|-----------|-------------------|
| Architecture & Infrastructure (Next.js 15, Supabase, Vercel, CI/CD) | Très élevée | 15 j |
| Authentification multi-rôle (client / partenaire / employé) | Élevée | 10 j |
| Site public (catalogue, recherche, disponibilité, réservation) | Élevée | 20 j |
| Back-office admin (lofts, réservations, paiements, utilisateurs) | Très élevée | 35 j |
| Gestion financière (transactions, multi-devises, rapports) | Élevée | 20 j |
| Portail partenaire (dashboard, propriétés, revenus, rapport dû) | Élevée | 18 j |
| Planning opérationnel (génération, Telegram, réassignation) | Élevée | 12 j |
| Calendrier de disponibilité (blocages, turnover, conflits) | Moyenne | 8 j |
| Gestion des photos (upload, HEIC, CDN, galerie) | Moyenne | 7 j |
| Internationalisation FR/EN/AR (RTL inclus) | Moyenne | 8 j |
| Notifications (Telegram, in-app, alertes contrats) | Moyenne | 6 j |
| Sécurité (RLS, middleware, rôles, audit) | Élevée | 10 j |
| Performance & optimisation (SSR, cache, virtualisation) | Élevée | 8 j |
| Tests, corrections, débogage, mise en production | — | 25 j |
| **TOTAL** | | **~202 jours/homme** |

---

## 2. Équipe & Coût de Développement

### Profils mobilisés

| Profil | Taux journalier marché (DZD) | Taux journalier marché (EUR) | Jours |
|--------|------------------------------|------------------------------|-------|
| Architecte / Lead Dev Full-Stack Senior | 80 000 DA | 500 € | 60 j |
| Développeur Full-Stack (Next.js / Supabase) | 50 000 DA | 320 € | 90 j |
| Développeur Frontend (UI/UX) | 40 000 DA | 250 € | 35 j |
| DevOps / Infrastructure | 60 000 DA | 380 € | 17 j |

### Coût total de développement

| Devise | Montant |
|--------|---------|
| **Dinars Algériens (DZD)** | **~12 500 000 DA** |
| **Euros (EUR)** | **~75 000 €** |

> Ces tarifs correspondent aux taux du marché pour des développeurs expérimentés (5+ ans) spécialisés en technologies modernes (Next.js, TypeScript, PostgreSQL).

---

## 3. Coûts d'Infrastructure (Annuels)

| Service | Plan | Coût mensuel | Coût annuel |
|---------|------|-------------|-------------|
| **Vercel** (hébergement + CI/CD) | Pro | ~20 $ | ~240 $ |
| **Supabase** (BDD + Auth + Storage) | Pro | ~25 $ | ~300 $ |
| **Domaine** (loftalgerie.com) | — | ~1 $ | ~12 $ |
| **Telegram Bot** | Gratuit | 0 | 0 |
| **Total infrastructure** | | **~46 $/mois** | **~552 $/an** |

> Infrastructure extrêmement légère grâce à l'architecture serverless. Pas de serveur dédié à gérer.

---

## 4. Valorisation de la Plateforme

### Méthode 1 — Coût de reconstruction (Asset Value)

Reconstruire cette plateforme from scratch avec une équipe externe :

| Poste | Estimation |
|-------|-----------|
| Développement (202 j/h au tarif marché) | 12 500 000 DA |
| Design UX/UI professionnel | 1 500 000 DA |
| Tests & QA | 800 000 DA |
| Documentation technique | 400 000 DA |
| Mise en production & formation | 600 000 DA |
| **Valeur de reconstruction totale** | **~15 800 000 DA (~100 000 €)** |

### Méthode 2 — Valeur marché (SaaS Comparable)

Des plateformes similaires sur le marché international (Guesty, Lodgify, Hostaway) sont valorisées entre **5x et 15x leurs revenus annuels récurrents (ARR)**.

Pour une plateforme en phase de lancement avec 20+ lofts gérés :

| Scénario | Lofts gérés | Commission mensuelle/loft | ARR estimé | Valorisation (x10) |
|----------|-------------|--------------------------|------------|-------------------|
| **Actuel** | 20 | 5 000 DA | 1 200 000 DA | 12 000 000 DA |
| **Court terme** (6 mois) | 50 | 5 000 DA | 3 000 000 DA | 30 000 000 DA |
| **Moyen terme** (18 mois) | 150 | 5 000 DA | 9 000 000 DA | 90 000 000 DA |

### Méthode 3 — Valeur stratégique

La plateforme représente un avantage concurrentiel significatif sur le marché algérien :
- **Première plateforme** de gestion de locations courte durée adaptée au marché local
- **Barrière à l'entrée élevée** : 202 j/h de développement = 6-8 mois pour un concurrent
- **Données propriétaires** : historique des réservations, comportements clients, pricing
- **Réseau d'effets** : plus de lofts = plus de clients = plus de valeur

---

## 5. Modèle Économique

### Sources de revenus

| Source | Modèle | Montant estimé |
|--------|--------|---------------|
| **Commission sur réservations** | % du montant (5-10%) | Variable |
| **Abonnement partenaire** | Mensuel par loft | 3 000 - 8 000 DA/loft/mois |
| **Services premium** | Gestion complète | Sur devis |
| **Publicité / mise en avant** | Lofts sponsorisés | 5 000 - 15 000 DA/mois |

### Projection de rentabilité

| Période | Lofts | Revenu mensuel | Charges | Résultat |
|---------|-------|---------------|---------|---------|
| Aujourd'hui | 20 | 100 000 DA | 50 000 DA | 50 000 DA |
| 6 mois | 50 | 250 000 DA | 80 000 DA | 170 000 DA |
| 12 mois | 100 | 500 000 DA | 120 000 DA | 380 000 DA |
| 24 mois | 250 | 1 250 000 DA | 200 000 DA | 1 050 000 DA |

---

## 6. Offre aux Investisseurs

### Ce que nous proposons

| Option | Description | Montant recherché |
|--------|-------------|------------------|
| **Seed** | Financement développement phase 2 + marketing | 5 000 000 DA |
| **Série A** | Expansion nationale (10 wilayas) | 20 000 000 DA |
| **Partenariat stratégique** | Apport réseau + financement | À négocier |

### Utilisation des fonds

| Poste | % | Montant (Seed 5M DA) |
|-------|---|---------------------|
| Développement (app mobile, paiement en ligne) | 40% | 2 000 000 DA |
| Marketing & acquisition clients/partenaires | 30% | 1 500 000 DA |
| Équipe opérationnelle | 20% | 1 000 000 DA |
| Infrastructure & légal | 10% | 500 000 DA |

### Retour sur investissement estimé

| Horizon | ROI estimé |
|---------|-----------|
| 12 mois | 1.5x |
| 24 mois | 3x |
| 36 mois | 6x |

---

## 7. Avantages Compétitifs

| Avantage | Description |
|----------|-------------|
| ✅ **Produit fini** | Plateforme opérationnelle, pas un prototype |
| ✅ **Marché non saturé** | Aucun concurrent direct en Algérie |
| ✅ **Stack moderne** | Technologies de pointe, scalable à l'infini |
| ✅ **Coût d'exploitation minimal** | ~550 $/an d'infrastructure |
| ✅ **Multi-devises** | Adapté aux clients étrangers (diaspora, tourisme) |
| ✅ **Équipe terrain intégrée** | Planning + Telegram = opérations sans friction |
| ✅ **Propriétaires fidélisés** | Portail partenaire = transparence = confiance |

---

## 8. Risques & Mitigations

| Risque | Probabilité | Mitigation |
|--------|-------------|-----------|
| Concurrence internationale (Airbnb) | Faible | Adaptation locale, prix, support DZD |
| Réglementation locations courte durée | Moyenne | Veille juridique, conformité proactive |
| Adoption digitale lente | Moyenne | Formation, support, interface simple |
| Dépendance Supabase/Vercel | Faible | Architecture portable, migration possible |

---

*Document confidentiel — Loft Algérie — Avril 2026*
*Pour toute information : contact@loftalgerie.com*
