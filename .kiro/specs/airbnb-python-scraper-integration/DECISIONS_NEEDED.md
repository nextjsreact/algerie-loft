# Décisions Requises Avant de Commencer

**Spec:** airbnb-python-scraper-integration  
**Date:** 2026-05-17  
**Status:** ✅ Décisions Finalisées

---

## 🚨 Décisions Critiques (Bloquantes pour Phase 1)

### D1: Priorité du Projet

**Question:** Ce projet est-il prioritaire par rapport aux autres tâches en cours ?

**Contexte:**
- Bugs en cours: pagination ✅, audit ✅, OAuth Google (optionnel)
- Ce projet: Intégration Airbnb (7 jours estimés)

**Options:**

#### Option A: Priorité Immédiate ⭐ (Recommandé)
- **Action:** Commencer immédiatement l'intégration Airbnb
- **Avantages:**
  - Économie de €3,060-5,100/an (vs Beds24)
  - Système déjà testé et fonctionnel
  - Délai de sync < 10 minutes
  - ROI immédiat
- **Inconvénients:**
  - OAuth Google reste optionnel (pas critique)

#### Option B: Après OAuth Google
- **Action:** Finir OAuth Google d'abord, puis Airbnb
- **Avantages:**
  - Tous les bugs résolus avant nouvelle feature
- **Inconvénients:**
  - Retard de 1-2 jours
  - OAuth Google n'est pas critique (cosmétique)

#### Option C: Reporter à Plus Tard
- **Action:** Reporter l'intégration Airbnb
- **Avantages:**
  - Focus sur d'autres priorités
- **Inconvénients:**
  - Continue à payer Beds24 (€255-425/mois)
  - Perte d'opportunité (script déjà prêt)

**Recommandation:** **Option A** (priorité immédiate)

**Décision:** [✅] Option A - Commencer immédiatement

---

### D2: Hébergement VPS

**Question:** Quel fournisseur VPS choisir pour héberger les services Docker ?

**Contexte:**
- Besoin: 1 vCPU, 2GB RAM, 20GB SSD
- Services: 3 conteneurs Docker (iCal Watcher, Targeted Scraper, Full Scraper)
- Uptime requis: > 99%

**Options:**

#### Option A: Hetzner CX11 ⭐ (Recommandé)
- **Specs:** 1 vCPU, 2GB RAM, 20GB SSD
- **Coût:** €4.51/mois (~€54/an)
- **Localisation:** Allemagne (proche de l'Algérie)
- **Avantages:**
  - Excellent rapport qualité/prix
  - Fiabilité élevée (99.9% uptime)
  - Support réactif
  - Facile à upgrader
- **Inconvénients:**
  - Nécessite une carte bancaire européenne

#### Option B: OVH VPS Starter
- **Specs:** 1 vCPU, 2GB RAM, 20GB SSD
- **Coût:** €3.50/mois (~€42/an)
- **Localisation:** France
- **Avantages:**
  - Moins cher que Hetzner
  - Support en français
  - Accepte les cartes algériennes
- **Inconvénients:**
  - Fiabilité légèrement inférieure
  - Interface moins intuitive

#### Option C: DigitalOcean Droplet
- **Specs:** 1 vCPU, 2GB RAM, 50GB SSD
- **Coût:** $12/mois (~€11/mois, ~€132/an)
- **Localisation:** Amsterdam
- **Avantages:**
  - Interface très intuitive
  - Documentation excellente
  - Plus d'espace disque
- **Inconvénients:**
  - Plus cher (2-3x)
  - Nécessite une carte bancaire internationale

#### Option D: Serveur Local (Gratuit)
- **Specs:** Dépend du matériel disponible
- **Coût:** €0/mois
- **Localisation:** Algérie
- **Avantages:**
  - Gratuit
  - Contrôle total
- **Inconvénients:**
  - Uptime dépend de l'électricité/internet local
  - Pas de support professionnel
  - Maintenance manuelle
  - Risque de panne

**Recommandation:** **Option A (Hetzner)** ou **Option B (OVH)** selon la disponibilité de carte bancaire

**Décision:** [✅] Local (dev) → Oracle Cloud Free Tier (prod) - €0 à vie

---

### D3: Schéma de Base de Données

**Question:** Faut-il étendre la table `reservations` existante ou créer une nouvelle table `airbnb_reservations` ?

**Contexte:**
- Table `reservations` existe déjà (système de réservation client)
- Script Airbnb récupère des champs supplémentaires (base_price, fees, etc.)

**Options:**

#### Option A: Étendre `reservations` ⭐ (Recommandé)
- **Action:** Ajouter les colonnes manquantes dans `reservations`
- **Avantages:**
  - Une seule table pour toutes les réservations
  - Requêtes plus simples
  - Pas de duplication de données
  - Calendrier unifié
- **Inconvénients:**
  - Modifie le schéma existant
  - Colonnes NULL pour réservations non-Airbnb

**Migration SQL:**
```sql
ALTER TABLE reservations ADD COLUMN airbnb_confirmation_code VARCHAR(50);
ALTER TABLE reservations ADD COLUMN base_price DECIMAL(10,2);
ALTER TABLE reservations ADD COLUMN cleaning_fee DECIMAL(10,2);
ALTER TABLE reservations ADD COLUMN service_fee DECIMAL(10,2);
ALTER TABLE reservations ADD COLUMN taxes DECIMAL(10,2);
ALTER TABLE reservations ADD COLUMN guest_email VARCHAR(255);
ALTER TABLE reservations ADD COLUMN guest_nationality VARCHAR(10);
ALTER TABLE reservations ADD COLUMN special_requests TEXT;
ALTER TABLE reservations ADD COLUMN source VARCHAR(50) DEFAULT 'manual';
```

#### Option B: Créer `airbnb_reservations`
- **Action:** Créer une table séparée pour les réservations Airbnb
- **Avantages:**
  - N'affecte pas le schéma existant
  - Séparation claire des sources
  - Pas de colonnes NULL
- **Inconvénients:**
  - Duplication de données (loft_id, dates, etc.)
  - Requêtes plus complexes (JOIN)
  - Calendrier nécessite 2 requêtes
  - Détection de conflits plus complexe

**Migration SQL:**
```sql
CREATE TABLE airbnb_reservations (
  id VARCHAR(50) PRIMARY KEY,
  loft_id UUID REFERENCES lofts(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  nights INTEGER NOT NULL,
  guest_name VARCHAR(255),
  guest_count INTEGER,
  guest_email VARCHAR(255),
  guest_phone VARCHAR(50),
  guest_nationality VARCHAR(10),
  base_price DECIMAL(10,2),
  cleaning_fee DECIMAL(10,2),
  service_fee DECIMAL(10,2),
  taxes DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  currency_code VARCHAR(10),
  status VARCHAR(50),
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Recommandation:** **Option A** (étendre `reservations`)

**Décision:** [✅] Architecture Hybride - Étendre `reservations` + table `staging` pour contrôle qualité

---

### D4: Mapping Listing ID

**Question:** Un loft peut-il avoir plusieurs `listing_id` Airbnb ?

**Contexte:**
- Certains propriétaires créent plusieurs annonces pour le même loft
- Exemple: "Loft Alger - Court séjour" et "Loft Alger - Long séjour"

**Options:**

#### Option A: Un seul listing_id par loft ⭐ (Recommandé pour MVP)
- **Action:** Colonne `airbnb_listing_id VARCHAR(50) UNIQUE` dans `lofts`
- **Avantages:**
  - Simple à implémenter
  - Pas de table de mapping supplémentaire
  - Requêtes rapides (index unique)
- **Inconvénients:**
  - Ne supporte pas les cas multiples
  - Nécessite de choisir un listing_id principal

**Migration SQL:**
```sql
ALTER TABLE lofts ADD COLUMN airbnb_listing_id VARCHAR(50) UNIQUE;
CREATE INDEX idx_lofts_airbnb_listing_id ON lofts(airbnb_listing_id);
```

#### Option B: Plusieurs listing_ids par loft
- **Action:** Table de mapping `airbnb_loft_mapping`
- **Avantages:**
  - Supporte les cas multiples
  - Flexible pour l'avenir
  - Peut stocker des métadonnées (type d'annonce, etc.)
- **Inconvénients:**
  - Plus complexe à implémenter
  - Requêtes plus lentes (JOIN)
  - Nécessite de gérer les priorités

**Migration SQL:**
```sql
CREATE TABLE airbnb_loft_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airbnb_listing_id VARCHAR(50) UNIQUE NOT NULL,
  loft_id UUID REFERENCES lofts(id) NOT NULL,
  listing_type VARCHAR(50), -- 'primary', 'short_term', 'long_term'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_mapping_listing_id ON airbnb_loft_mapping(airbnb_listing_id);
CREATE INDEX idx_mapping_loft_id ON airbnb_loft_mapping(loft_id);
```

**Recommandation:** **Option A** pour le MVP, migrer vers Option B si nécessaire

**Décision:** [✅] Colonne simple `airbnb_listing_id` dans `lofts` (MVP) - Migration vers table si besoin

---

## ⚠️ Décisions Importantes (Non-bloquantes)

### D5: Données Historiques

**Question:** Faut-il importer les réservations historiques depuis Airbnb ?

**Contexte:**
- Airbnb conserve l'historique des réservations
- Peut être utile pour les statistiques et l'analyse

**Options:**

#### Option A: Importer l'historique ⭐ (Recommandé)
- **Action:** Scraper toutes les réservations passées (1 an)
- **Avantages:**
  - Historique complet
  - Statistiques précises
  - Analyse de tendances
- **Inconvénients:**
  - Temps d'import initial (1-2h)
  - Volume de données plus important

#### Option B: Seulement les nouvelles réservations
- **Action:** Commencer à partir d'aujourd'hui
- **Avantages:**
  - Démarrage rapide
  - Moins de données
- **Inconvénients:**
  - Pas d'historique
  - Statistiques incomplètes

**Recommandation:** **Option A** (importer l'historique)

**Décision:** [✅] Importer l'historique (1 an de réservations)

---

### D6: Fréquence du Full Scraper

**Question:** À quelle heure exécuter le Full Scraper nocturne ?

**Contexte:**
- Full Scraper scrape tous les lofts (85)
- Durée: ~1 heure
- Objectif: Backup complet + détection d'anomalies

**Options:**

#### Option A: 2h du matin (Algérie) ⭐ (Recommandé)
- **Avantages:**
  - Trafic Airbnb faible
  - Moins de risque de détection
  - Terminé avant le réveil de l'équipe
- **Inconvénients:**
  - Aucun

#### Option B: 4h du matin (Algérie)
- **Avantages:**
  - Trafic encore plus faible
- **Inconvénients:**
  - Peut ne pas être terminé avant 8h

#### Option C: Désactiver le Full Scraper
- **Avantages:**
  - Moins de charge serveur
- **Inconvénients:**
  - Pas de backup complet
  - Risque de manquer des changements

**Recommandation:** **Option A** (2h du matin)

**Décision:** [✅] 4h du matin GMT+1 (heure locale Algérie)

---

### D7: Alertes Email

**Question:** Qui doit recevoir les alertes email ?

**Contexte:**
- Alertes: listing_id non mappé, échecs de sync, conflits de réservation

**Options:**

#### Option A: Admin principal uniquement
- **Email:** admin@votredomaine.com
- **Avantages:**
  - Centralisé
  - Pas de spam pour l'équipe
- **Inconvénients:**
  - Point de défaillance unique

#### Option B: Équipe technique
- **Emails:** admin@..., tech@..., dev@...
- **Avantages:**
  - Redondance
  - Réactivité accrue
- **Inconvénients:**
  - Peut être perçu comme du spam

#### Option C: Configurable par type d'alerte
- **Exemple:**
  - Conflits → admin@...
  - Erreurs techniques → tech@...
  - Rapports quotidiens → admin@... + manager@...
- **Avantages:**
  - Flexible
  - Chacun reçoit ce qui le concerne
- **Inconvénients:**
  - Plus complexe à configurer

**Recommandation:** **Option C** (configurable)

**Décision:** [✅] Notifications in-app (module existant) + Emails paramétrables via interface admin

**Configuration:**
- Interface admin: `/admin/settings/airbnb-alerts`
- Notifications in-app: Toujours actives
- Emails: Configurables par type d'alerte
- À paramétrer ultérieurement via l'interface

---

## 📋 Résumé des Décisions

### Critiques (Bloquantes) - ✅ FINALISÉES
- [✅] **D1:** Priorité du projet → Commencer immédiatement
- [✅] **D2:** Hébergement VPS → Local (dev) → Oracle Cloud Free (prod)
- [✅] **D3:** Schéma de base de données → Architecture Hybride (reservations + staging)
- [✅] **D4:** Mapping listing_id → Colonne simple (MVP)

### Importantes (Non-bloquantes) - ✅ FINALISÉES
- [✅] **D5:** Données historiques → Importer 1 an
- [✅] **D6:** Fréquence Full Scraper → 4h GMT+1
- [✅] **D7:** Alertes email → Notifications in-app + emails paramétrables

---

## 🚀 Prochaines Étapes

✅ **Décisions prises !**

1. **✅ Design détaillé créé** (`design.md`)
2. **➡️ Commencer Phase 1** (Task 1-9, 3 jours)
3. **➡️ Déployer le MVP**

**Fichiers créés:**
- `design.md` - Architecture technique complète (86 KB)
- `DECISIONS_NEEDED.md` - Décisions finalisées (ce fichier)

**Prêt à commencer l'implémentation !** 🚀

---

**Créé par:** Kiro AI  
**Date:** 2026-05-17  
**Version:** 1.0.0
