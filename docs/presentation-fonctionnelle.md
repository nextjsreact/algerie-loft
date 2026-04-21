# Loft Algérie — Présentation Fonctionnelle
## Plateforme de Gestion de Locations Courte Durée

---

## 1. Vision & Positionnement

**Loft Algérie** est une plateforme digitale complète dédiée à la gestion de locations meublées courte durée en Algérie. Elle s'adresse simultanément à trois types d'utilisateurs :

| Profil | Rôle | Accès |
|--------|------|-------|
| **Client** | Réserver un loft | Site public + espace client |
| **Partenaire** | Suivre ses propriétés et revenus | Portail partenaire dédié |
| **Équipe interne** | Gérer les opérations | Back-office complet |

> Un même utilisateur peut avoir les trois rôles simultanément — le contexte de connexion détermine l'interface affichée.

---

## 2. Modules Fonctionnels

### 2.1 Site Public (Clients)

**Découverte des lofts**
- Catalogue complet avec photos haute qualité
- Recherche par zone, prix, capacité, équipements
- Carrousel de photos interactif par loft
- Disponibilité en temps réel

**Réservation en ligne**
- Sélection des dates avec calendrier de disponibilité
- Vérification automatique des conflits (même jour = turnover géré)
- Formulaire de réservation avec informations client
- Confirmation instantanée

**Espace client**
- Historique des réservations
- Statut des paiements
- Avis et évaluations

---

### 2.2 Back-Office Administratif

#### Gestion des Lofts
- Création et modification complète des propriétés
- Galerie photos avec photo de couverture sélectionnable
- Upload multi-format dont **HEIC/HEIF** (photos iPhone) avec conversion automatique
- Gestion des équipements, règles de la maison, politique d'annulation
- Informations utilitaires (eau, électricité, gaz, internet, WiFi)
- Contrats propriétaires avec dates et durées
- Alertes automatiques d'échéance de contrat

#### Gestion des Réservations
- Vue calendrier et liste
- Statuts : en attente → confirmée → terminée / annulée
- Gestion des paiements multi-devises (DZD, EUR, USD, etc.)
- Suivi des montants dus vs encaissés
- Historique complet des paiements par réservation

#### Gestion Financière
- **Transactions** : revenus, dépenses, remboursements
- **Rapport par devise** : ventilation des encaissements par monnaie
- **Rapport de recouvrement** : état soldé/partiel/non payé par réservation
- **Rapport mensuel** : revenus avec calcul prorata (à partir d'avril 2026)
- Export et visualisation par période

#### Gestion des Utilisateurs
- Rôles hiérarchiques : superuser → admin → manager → executive → member → client
- Gestion du staff opérationnel (is_staff, équipe, zone préférée)
- Activation/désactivation des accès

---

### 2.3 Portail Partenaire (Propriétaires)

Interface dédiée en lecture seule pour les propriétaires de lofts :

**Tableau de bord**
- Vue synthétique : nombre de propriétés, réservations, revenus du mois, taux d'occupation
- Carte des propriétés avec photos et statut en temps réel

**Mes Propriétés**
- Liste de ses lofts avec photos (même qualité que le site public)
- Statut : Disponible / Occupé / Maintenance
- Performances : réservations, revenus/mois, taux d'occupation
- Détail par loft avec galerie photos navigable

**Revenus & Rapport Dû**
- Revenus totaux sur période personnalisable
- **Montant dû au partenaire** = Revenus × % partenaire − Dépenses
- Détail par loft et par réservation
- Paiements reçus par mode et devise
- Évolution sur 6 mois (graphique)

---

### 2.4 Planning Opérationnel

Génération automatique du planning journalier à partir des réservations :

**Logique de génération**
- **Tâches nettoyage** → déclenchées par les check-outs du jour
- **Tâches accueil** → déclenchées par les check-ins du jour
- Distribution intelligente par équipe (nettoyage / accueil)
- Affectation par zone géographique préférée de l'agent

**Gestion des équipes**
- Rotation automatique de l'astreinte (1 agent/jour)
- Agent de repos = celui qui a fait l'astreinte la veille
- Marquage d'absence avec redistribution automatique des tâches
- Réassignation manuelle par glisser-déposer

**Envoi Telegram**
- Notification individuelle à chaque agent via Telegram Bot
- Message formaté avec loft, adresse, zone, nom du client
- Envoi du planning modifié possible avant envoi final

---

### 2.5 Disponibilité & Calendrier

- Vue calendrier mensuelle par loft
- Blocage manuel de dates (maintenance, indisponibilité)
- Vérification stricte des chevauchements (même jour = turnover autorisé)
- Filtre par loft depuis l'URL (`?loftId=...&tab=calendar`)
- Bannière "Voir tous les appartements" quand filtré

---

### 2.6 Rapports & Analytics

| Rapport | Description |
|---------|-------------|
| **Par devise** | Revenus et dépenses ventilés par monnaie |
| **Recouvrement** | État de paiement par réservation |
| **Mensuel** | Revenus avec prorata sur la période |
| **Partenaire** | Dû propriétaire avec détail par loft |
| **Évolution 6 mois** | Tendance des revenus et montants dus |

---

## 3. Flux Utilisateur Principal

```
CLIENT                    ADMIN                    ÉQUIPE
  │                         │                        │
  ▼                         │                        │
Recherche loft              │                        │
  │                         │                        │
  ▼                         │                        │
Sélection dates             │                        │
  │                         │                        │
  ▼                         │                        │
Réservation créée ──────────▶ Notification admin     │
                             │                        │
                             ▼                        │
                        Confirmation                  │
                             │                        │
                             ▼                        │
                        Paiement enregistré           │
                             │                        │
                             ▼                        │
                        Génération planning ──────────▶ Telegram agent
                                                       │
                                                       ▼
                                                  Nettoyage / Accueil
                                                       │
                                                       ▼
                                                  Tâche complétée
```

---

## 4. Gestion Multi-Devises

La plateforme gère nativement les paiements en plusieurs devises :

- **DZD** (Dinar Algérien) — devise principale
- **EUR** (Euro)
- **USD** (Dollar américain)
- Autres devises configurables

Chaque paiement conserve le montant original dans sa devise + l'équivalent DZD. Les rapports affichent les deux.

---

## 5. Notifications & Communication

| Canal | Usage |
|-------|-------|
| **Telegram (Planning)** | Planning journalier aux agents terrain |
| **Telegram (Réservations)** | Nouvelles réservations au groupe admin |
| **Notifications in-app** | Alertes système, tâches, échéances |
| **Alertes contrats** | Rappels automatiques d'échéance |

---

## 6. Points Différenciants

### vs. Solutions génériques (Airbnb, Booking)
- **Adapté au marché algérien** : DZD, formats locaux, adresses algériennes
- **Gestion opérationnelle intégrée** : planning équipe, tâches, zones
- **Multi-propriétaires** : chaque partenaire voit uniquement ses lofts
- **Rapport dû propriétaire** : calcul automatique de la part partenaire

### vs. Logiciels de gestion immobilière classiques
- **Interface moderne** : dark mode, responsive, mobile-first
- **Temps réel** : disponibilités et statuts mis à jour instantanément
- **Photos iPhone** : support HEIC natif avec conversion automatique
- **Telegram intégré** : communication directe avec les équipes terrain

### Scalabilité
- Architecture serverless → pas de serveur à gérer
- Base de données PostgreSQL → supporte des millions de réservations
- CDN mondial → performances identiques depuis n'importe où en Algérie
- Multi-tenant → peut gérer des centaines de partenaires simultanément

---

## 7. Roadmap (Prochaines Fonctionnalités)

| Priorité | Fonctionnalité |
|----------|---------------|
| 🔴 Haute | Application mobile (iOS / Android) |
| 🔴 Haute | Paiement en ligne (CIB, Dahabia) |
| 🟡 Moyenne | Intégration Airbnb (synchronisation calendrier) |
| 🟡 Moyenne | Signature électronique des contrats |
| 🟢 Basse | Intelligence artificielle (pricing dynamique) |
| 🟢 Basse | Portail client avec suivi réservation en temps réel |

---

## 8. Chiffres Clés de la Plateforme

| Indicateur | Valeur actuelle |
|------------|----------------|
| Lofts gérés | 20+ propriétés |
| Zones couvertes | Alger Centre, Alger Ouest |
| Équipes terrain | 5 agents actifs |
| Langues | Français, Anglais, Arabe |
| Disponibilité | 99.9% (Vercel SLA) |
| Support photos | JPEG, PNG, WebP, HEIC |

---

*Document généré le 21 avril 2026 — Loft Algérie Platform v2.0*
